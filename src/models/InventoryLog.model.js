import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
    {
        inventory_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: [true, 'Inventory ID is required'],
        },
        change_quantity: {
            type: Number,
            required: [true, 'Change quantity is required'],
        },
        reason: {
            type: String,
            enum: ['sale', 'restock', 'adjustment'],
            default: 'adjustment',
        },
    },
    {
        timestamps: { createdAt: 'changed_at', updatedAt: false },
    }
);

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);

export default InventoryLog;