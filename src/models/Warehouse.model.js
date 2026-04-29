import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
    {
        company_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: [true, 'Company ID is required'],
        },
        name: {
            type: String,
            required: [true, 'Warehouse name is required'],
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

export default Warehouse;