import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product ID is required'],
        },
        warehouse_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Warehouse ID is required'],
        },
        quantity: {
            type: Number,
            default: 0,
            min: [0, 'Quantity cannot be negative'],
        },
    },
    {
        timestamps: true,
    }
);

// Unique combination of product and warehouse
inventorySchema.index({ product_id: 1, warehouse_id: 1 }, { unique: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;