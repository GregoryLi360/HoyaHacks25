import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

const app: Express = express();
const port = process.env.PORT!;
const uri = process.env.MONGODB_URI!;

const corOptions = {
  origin: "ORIGIN_URL_GOES_HERE",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corOptions));

interface PatientData {
  MRN: string;
  info: { }
}

const dataSchema = new mongoose.Schema<PatientData>({
  MRN: String,
  info: { }
});

const Data = mongoose.model('Data', dataSchema, "patients");

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).send("Hi :)");
});

router.post('/', async (req, res) => {
    console.log(req.body);

    const medicalRecordNumber = req.body.MRN;
    const params: PatientData = {
      MRN: medicalRecordNumber,
      info: {}
    };
    
    const data = new Data(params);

    try {
        await data.save();
        res.status(200).send(":)");
    } catch (err) {
        console.log(err);
        res.status(409).send(":(");
    }
});

// router.get('/:MRN', async (req: Request, res: Response) => {
//   const medicalRecordNumber = req.params.MRN;
// });

router.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use('/api', router);


async function bootstrap() {
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

  await dbConfig();

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

bootstrap();