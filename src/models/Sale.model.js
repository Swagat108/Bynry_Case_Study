import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
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
        quantity_sold: {
            type: Number,
            required: [true, 'Quantity sold is required'],
            min: [1, 'Quantity sold must be at least 1'],
        },
    },
    {
        timestamps: { createdAt: 'sold_at', updatedAt: false },
    }
);

// Index for fast sales queries
saleSchema.index({ product_id: 1, warehouse_id: 1, sold_at: -1 });

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;