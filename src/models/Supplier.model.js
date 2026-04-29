import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
    {
        company_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: [true, 'Company ID is required'],
        },
        name: {
            type: String,
            required: [true, 'Supplier name is required'],
            trim: true,
        },
        contact_email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/.+@.+\..+/, 'Please enter a valid email'],
        },
        contact_phone: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;