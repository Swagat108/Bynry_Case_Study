import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Company = mongoose.model('Company', companySchema);

export default Company;