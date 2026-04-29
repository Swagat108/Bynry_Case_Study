import { Router } from 'express';
import Company from '../models/Company.model.js';
import Warehouse from '../models/Warehouse.model.js';
import Inventory from '../models/Inventory.model.js';
import Sale from '../models/Sale.model.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.get(
    '/api/companies/:company_id/alerts/low-stock',
    authenticateJWT,
    async (req, res) => {
        const { company_id } = req.params;

        try {
            // Verify company exists
            const company = await Company.findById(company_id);
            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Step 1: Get all warehouses for this company
            const warehouses = await Warehouse.find(
                { company_id },
                { _id: 1, name: 1 }
            );

            if (!warehouses.length) {
                return res.status(200).json({ alerts: [], total_alerts: 0 });
            }

            const warehouseIds = warehouses.map((w) => w._id);
            const warehouseMap = Object.fromEntries(
                warehouses.map((w) => [w._id.toString(), w.name])
            );

            // Step 2: Find products with recent sales activity (last 30 days)
            const recentSales = await Sale.distinct('product_id', {
                warehouse_id: { $in: warehouseIds },
                sold_at: { $gte: thirtyDaysAgo },
            });

            if (!recentSales.length) {
                return res.status(200).json({ alerts: [], total_alerts: 0 });
            }

            // Step 3: Get inventory with product and supplier info
            const inventoryItems = await Inventory.find({
                warehouse_id: { $in: warehouseIds },
                product_id: { $in: recentSales },
            })
                .populate({
                    path: 'product_id',
                    match: { company_id },
                    populate: {
                        path: 'supplier_id',
                        select: 'name contact_email',
                    },
                })
                .populate('warehouse_id', 'name');

            // Step 4: Filter below threshold & calculate days until stockout
            const alerts = [];

            for (const item of inventoryItems) {
                // Skip if product didn't match company_id in populate
                if (!item.product_id) continue;

                const product = item.product_id;
                const currentStock = item.quantity;
                const threshold = product.low_stock_threshold;

                // Only alert if below threshold
                if (currentStock >= threshold) continue;

                // Calculate average daily sales for last 30 days
                const salesAgg = await Sale.aggregate([
                    {
                        $match: {
                            product_id: product._id,
                            warehouse_id: item.warehouse_id._id,
                            sold_at: { $gte: thirtyDaysAgo },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total_sold: { $sum: '$quantity_sold' },
                        },
                    },
                ]);

                const totalSold = salesAgg[0]?.total_sold || 0;
                const avgDailySales = totalSold / 30;
                const daysUntilStockout =
                    avgDailySales > 0
                        ? Math.floor(currentStock / avgDailySales)
                        : null;

                alerts.push({
                    product_id: product._id,
                    product_name: product.name,
                    sku: product.sku,
                    warehouse_id: item.warehouse_id._id,
                    warehouse_name: warehouseMap[item.warehouse_id._id.toString()],
                    current_stock: currentStock,
                    threshold,
                    days_until_stockout: daysUntilStockout,
                    supplier: product.supplier_id
                        ? {
                            id: product.supplier_id._id,
                            name: product.supplier_id.name,
                            contact_email: product.supplier_id.contact_email,
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
            console.error('Error fetching low stock alerts:', error.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;