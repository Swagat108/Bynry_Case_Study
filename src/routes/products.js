import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import Inventory from '../models/Inventory.model.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/api/products', authenticateJWT, async (req, res) => {
    const { name, sku, price, warehouse_id, company_id, initial_quantity } =
        req.body;

    // Input validation
    const missingFields = [
        'name',
        'sku',
        'price',
        'warehouse_id',
        'company_id',
    ].filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: `Missing required fields: ${missingFields.join(', ')}`,
        });
    }

    // Price validation
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
            error: 'Invalid price. Must be a non-negative number.',
        });
    }

    // SKU uniqueness check
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
        return res.status(409).json({
            error: 'SKU already exists across the platform.',
        });
    }

    // Atomic transaction using MongoDB session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create product
        const product = await Product.create(
            [
                {
                    name,
                    sku,
                    price: parsedPrice,
                    company_id,
                    warehouse_id,
                },
            ],
            { session }
        );

        // Create inventory entry
        await Inventory.create(
            [
                {
                    product_id: product[0]._id,
                    warehouse_id,
                    quantity: initial_quantity ?? 0,
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: 'Product created successfully',
            product_id: product[0]._id,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating product:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;