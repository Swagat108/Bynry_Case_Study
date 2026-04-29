import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// ─── Company ──────────────────────────────────────────────
const Company = sequelize.define(
    'Company',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        tableName: 'companies',
    }
);

// ─── Warehouse ────────────────────────────────────────────
const Warehouse = sequelize.define(
    'Warehouse',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        location: {
            type: DataTypes.TEXT,
        },
    },
    {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        tableName: 'warehouses',
    }
);

// ─── Supplier ─────────────────────────────────────────────
const Supplier = sequelize.define(
    'Supplier',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        contact_email: {
            type: DataTypes.STRING(255),
            validate: {
                isEmail: true,
            },
        },
        contact_phone: {
            type: DataTypes.STRING(50),
        },
    },
    {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        tableName: 'suppliers',
    }
);

// ─── Product ──────────────────────────────────────────────
const Product = sequelize.define(
    'Product',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        sku: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 },
        },
        product_type: {
            type: DataTypes.ENUM('standard', 'bundle'),
            defaultValue: 'standard',
        },
        low_stock_threshold: {
            type: DataTypes.INTEGER,
            defaultValue: 10,
        },
    },
    {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        tableName: 'products',
    }
);

// ─── Inventory ────────────────────────────────────────────
const Inventory = sequelize.define(
    'Inventory',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: 0 },
        },
    },
    {
        timestamps: true,
        createdAt: false,
        updatedAt: 'updated_at',
        tableName: 'inventory',
        indexes: [
            {
                unique: true,
                fields: ['product_id', 'warehouse_id'],
            },
        ],
    }
);

// ─── Sale ─────────────────────────────────────────────────
const Sale = sequelize.define(
    'Sale',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity_sold: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 },
        },
    },
    {
        timestamps: true,
        createdAt: 'sold_at',
        updatedAt: false,
        tableName: 'sales',
    }
);

// ─── InventoryLog ─────────────────────────────────────────
const InventoryLog = sequelize.define(
    'InventoryLog',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        inventory_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        change_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reason: {
            type: DataTypes.ENUM('sale', 'restock', 'adjustment'),
            allowNull: true,
        },
    },
    {
        timestamps: true,
        createdAt: 'changed_at',
        updatedAt: false,
        tableName: 'inventory_logs',
    }
);

// ─── Associations ─────────────────────────────────────────
Company.hasMany(Warehouse, { foreignKey: 'company_id' });
Warehouse.belongsTo(Company, { foreignKey: 'company_id' });

Company.hasMany(Supplier, { foreignKey: 'company_id' });
Supplier.belongsTo(Company, { foreignKey: 'company_id' });

Company.hasMany(Product, { foreignKey: 'company_id' });
Product.belongsTo(Company, { foreignKey: 'company_id' });

Supplier.hasMany(Product, { foreignKey: 'supplier_id' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id' });

Product.hasMany(Inventory, { foreignKey: 'product_id' });
Inventory.belongsTo(Product, { foreignKey: 'product_id' });

Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });

Product.hasMany(Sale, { foreignKey: 'product_id' });
Sale.belongsTo(Product, { foreignKey: 'product_id' });

Inventory.hasMany(InventoryLog, { foreignKey: 'inventory_id' });
InventoryLog.belongsTo(Inventory, { foreignKey: 'inventory_id' });

// ─── Sync ─────────────────────────────────────────────────
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('All tables synced successfully');
    } catch (error) {
        console.error('Table sync failed:', error.message);
        process.exit(1);
    }
};

export {
    sequelize,
    syncDatabase,
    Company,
    Warehouse,
    Supplier,
    Product,
    Inventory,
    Sale,
    InventoryLog,
};