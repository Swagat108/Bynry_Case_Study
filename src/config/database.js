import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        port: Number(process.env.DB_PORT) || 3306,
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

// Test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL connected successfully');
    } catch (error) {
        console.error('MySQL connection failed:', error.message);
        process.exit(1); // Stop server if DB connection fails
    }
};

export { testConnection };
export default sequelize;