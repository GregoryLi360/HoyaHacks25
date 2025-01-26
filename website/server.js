const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the src directory
app.use(express.static(path.join(__dirname, 'src'), {
    extensions: ['html', 'css', 'js'],
    index: false // Prevent serving index.html automatically
}));

// Specific route for components
app.get('/src/components/:component', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'components', req.params.component));
});

// Handle SPA routes by sending the index.html file
app.get(['/', '/dashboard', '/auth'], (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Handle .html routes explicitly
app.get('/*.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', req.path));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 