import { Router } from 'express';
import { Op, fn, col } from 'sequelize';
import {
    Company,
    Warehouse,
    Product,
    Inventory,
    Supplier,
    Sale,
} from '../models/index.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.get(
    '/api/companies/:company_id/alerts/low-stock',
    authenticateJWT,
    async (req, res) => {
        const { company_id } = req.params;

        try {
            // Verify company exists
            const company = await Company.findByPk(company_id);
            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Step 1: Get all warehouses for this company
            const warehouses = await Warehouse.findAll({
                where: { company_id },
                attributes: ['id', 'name'],
            });

            if (!warehouses.length) {
                return res.status(200).json({ alerts: [], total_alerts: 0 });
            }

            const warehouseIds = warehouses.map((w) => w.id);
            const warehouseMap = Object.fromEntries(
                warehouses.map((w) => [w.id, w.name])
            );

            // Step 2: Find products with recent sales activity (last 30 days)
            const recentSales = await Sale.findAll({
                where: {
                    warehouse_id: { [Op.in]: warehouseIds },
                    sold_at: { [Op.gte]: thirtyDaysAgo },
                },
                attributes: ['product_id'],
                group: ['product_id'],
                raw: true,
            });

            const activeProductIds = recentSales.map((s) => s.product_id);

            if (!activeProductIds.length) {
                return res.status(200).json({ alerts: [], total_alerts: 0 });
            }

            // Step 3: Get inventory for active products in company warehouses
            const lowStockItems = await Inventory.findAll({
                where: { warehouse_id: { [Op.in]: warehouseIds } },
                include: [
                    {
                        model: Product,
                        where: {
                            company_id,
                            id: { [Op.in]: activeProductIds },
                        },
                        include: [
                            {
                                model: Supplier,
                                attributes: ['id', 'name', 'contact_email'],
                                required: false, // LEFT JOIN — supplier may not exist
                            },
                        ],
                    },
                ],
            });

            // Step 4: Filter below threshold & calculate days until stockout
            const alerts = [];

            for (const item of lowStockItems) {
                const product = item.Product;
                const currentStock = item.quantity;
                const threshold = product.low_stock_threshold;

                // Skip if stock is sufficient
                if (currentStock >= threshold) continue;

                // Get total sales in last 30 days for avg daily sales calculation
                const salesData = await Sale.findOne({
                    where: {
                        product_id: product.id,
                        warehouse_id: item.warehouse_id,
                        sold_at: { [Op.gte]: thirtyDaysAgo },
                    },
                    attributes: [[fn('SUM', col('quantity_sold')), 'total_sold']],
                    raw: true,
                });

                const totalSold = parseFloat(salesData?.total_sold) || 0;
                const avgDailySales = totalSold / 30;
                const daysUntilStockout =
                    avgDailySales > 0
                        ? Math.floor(currentStock / avgDailySales)
                        : null; // Cannot predict without sales data

                alerts.push({
                    product_id: product.id,
                    product_name: product.name,
                    sku: product.sku,
                    warehouse_id: item.warehouse_id,
                    warehouse_name: warehouseMap[item.warehouse_id],
                    current_stock: currentStock,
                    threshold: threshold,
                    days_until_stockout: daysUntilStockout,
                    supplier: product.Supplier
                        ? {
                            id: product.Supplier.id,
                            name: product.Supplier.name,
                            contact_email: product.Supplier.contact_email,
                        }
                        : null,
                });
            }

            // Step 5: Sort by urgency — lowest days first, nulls last
            alerts.sort((a, b) => {
                if (a.days_until_stockout === null) return 1;
                if (b.days_until_stockout === null) return -1;
                return a.days_until_stockout - b.days_until_stockout;
            });

            return res.status(200).json({
                alerts,
                total_alerts: alerts.length,
            });
        } catch (error) {
            console.error('Error fetching low stock alerts:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;