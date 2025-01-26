import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import crypto from 'crypto';

import dotenv from "dotenv";
dotenv.config();

const app: Express = express();
const port = process.env.PORT!;
const uri = process.env.MONGODB_URI!;

const corOptions = {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corOptions));

type EmotionalState = 'anxious' | 'depressed' | 'neutral' | 'positive' | 'calm' | 
    'frustrated' | 'hopeful' | 'confident' | 'tired' | 'excited' | 'worried' | 'grateful';

interface PatientData {
    MRN: string;
    firstName: string;
    lastName: string;
    diagnosis: string;
    notes: string;
    medications: string;
    startTime: Date;
    interactionTime: number;
    emotionalState: EmotionalState;
    createdAt: Date;
}

interface DoctorToken {
    token: string;
    createdAt: Date;
}

const dataSchema = new mongoose.Schema<PatientData>({
    MRN: { type: String, required: true, index: { unique: false } },
    firstName: String,
    lastName: String,
    diagnosis: String,
    notes: String,
    medications: String,
    startTime: Date,
    interactionTime: Number,
    emotionalState: String,
    createdAt: { type: Date, default: Date.now }
});

const tokenSchema = new mongoose.Schema<DoctorToken>({
    token: { type: String, required: true, index: { unique: true } },
    createdAt: { type: Date, default: Date.now }
});

const Data = mongoose.model('Data', dataSchema, "patients");
const Token = mongoose.model('Token', tokenSchema, "tokens");

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).send('Username and password required');
        return;
    }

    try {
        const hash = crypto.createHash('sha256');
        const token = hash.update(username + password).digest('hex');

        const existingToken: DoctorToken | null = await Token.findOne({ token });
        if (existingToken) {
            res.status(200).json({ token });
            return;
        }

        await Token.create({ token });
        res.status(200).json({ token });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error during login');
    }
});

router.get('/', (req, res) => {
    res.status(200).send("Healthy :)");
});

const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

    if (!token) {
        res.status(401).send('Access token required');
        return;
    }

    try {
        const foundToken = await Token.findOne({ token });
        if (!foundToken) {
            res.status(403).send('Invalid token');
            return;
        }
        next();
    } catch (err) {
        console.log(err);
        res.status(500).send('Error authenticating token');
    }
};

router.use(authenticateToken);

router.post('/patients', async (req, res) => {
    console.log(req.body);

    try {
        const patientData: PatientData = req.body;

        const data = new Data(patientData);
        await data.save();
        res.status(200).send(":)");
    } catch (err) {
        console.log(err);
        res.status(409).send(":(");
    }
});

router.get('/patients', async (req: Request, res: Response) => {
    try {
        const data: PatientData[] = await Data.find().sort({ createdAt: -1 });
        const groupedByMRN = data.reduce((acc: { [key: string]: PatientData[] }, doc) => {
            if (!acc[doc.MRN]) { acc[doc.MRN] = []; }
            acc[doc.MRN].push(doc);
            return acc;
        }, {});

        const patients = Object.entries(groupedByMRN).map(([MRN, logs]) => ({
            MRN,
            logs
        }));
        res.status(200).json(patients);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error retrieving patients");
    }
});

router.get('/patients/:MRN', async (req: Request, res: Response) => {
    const medicalRecordNumber = req.params.MRN;

    try {
        const patients = await Data.find({ MRN: medicalRecordNumber }).sort({ createdAt: -1 });
        if (!patients) {
            res.status(404).send("Patient not found");
            return;
        }

        console.log(patients);
        res.status(200).json(patients);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error retrieving patient");
    }
});

router.delete('/patients/:MRN', async (req: Request, res: Response) => {
    const medicalRecordNumber = req.params.MRN;
    try {
        await Data.deleteMany({ MRN: medicalRecordNumber });
        console.log(`Deleted ${medicalRecordNumber}`);
        res.status(200).send("Deleted");
    } catch (err) {
        res.status(500).send("Error deleting patient");
    }
});

router.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use('/api', router);

const dbConfig = async () => {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(uri, { dbName: "Main" });
        console.log(`MongoDB Connected: ${uri}`);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

async function bootstrap() {
    await dbConfig();

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

bootstrap();