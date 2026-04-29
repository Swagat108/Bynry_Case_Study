import { Router } from 'express';
import { Product, Inventory, sequelize } from '../models/index.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/api/products', authenticateJWT, async (req, res) => {
    const { name, sku, price, warehouse_id, initial_quantity } = req.body;

    // Input validation
    const missingFields = ['name', 'sku', 'price', 'warehouse_id'].filter(
        (field) => !req.body[field]
    );

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
    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
        return res.status(409).json({
            error: 'SKU already exists across the platform.',
        });
    }

    // Atomic transaction
    const transaction = await sequelize.transaction();

    try {
        const product = await Product.create(
            {
                name,
                sku,
                price: parsedPrice,
                warehouse_id,
            },
            { transaction }
        );

        await Inventory.create(
            {
                product_id: product.id,
                warehouse_id,
                quantity: initial_quantity ?? 0,
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(201).json({
            message: 'Product created successfully',
            product_id: product.id,
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating product:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;