import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        company_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: [true, 'Company ID is required'],
        },
        supplier_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            default: null,
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        product_type: {
            type: String,
            enum: ['standard', 'bundle'],
            default: 'standard',
        },
        low_stock_threshold: {
            type: Number,
            default: 10,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model('Product', productSchema);

export default Product;