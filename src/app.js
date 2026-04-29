import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { testConnection, } from './config/database.js';
import { syncDatabase } from './models/index.js';
import productRoutes from './routes/products.js';
import alertRoutes from './routes/alerts.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(cors()); // Enable CORS for all routes

// Routes
app.use(productRoutes);
app.use(alertRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'StockFlow API is running' });
});

// Start server only after DB is connected and synced
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await testConnection();  // Test DB connection first
    await syncDatabase();    // Then sync all tables
    app.listen(PORT, () => {
        console.log(`StockFlow API running on port ${PORT}`);
    });
};

startServer();