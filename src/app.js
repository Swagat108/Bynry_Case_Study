import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import productRoutes from './routes/products.js';
import alertRoutes from './routes/alerts.js';

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use(productRoutes);
app.use(alertRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'StockFlow API is running' });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`StockFlow API running on port ${PORT}`);
    });
};

startServer();