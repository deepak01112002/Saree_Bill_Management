import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Product from '../models/Product';
import Bill from '../models/Bill';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // Check if user is staff - filter by their bills only
    const isStaff = req.user?.role === 'staff';
    const staffFilter = isStaff ? { createdBy: req.user!.id } : {};

    // Get total products (only for admin)
    const totalProducts = isStaff ? 0 : await Product.countDocuments();

    // Get low stock products (stock < 10) - only for admin
    const lowStockProducts = isStaff ? 0 : await Product.countDocuments({
      stockQuantity: { $gt: 0, $lt: 10 },
    });

    // Get out of stock products - only for admin
    const outOfStockProducts = isStaff ? 0 : await Product.countDocuments({
      stockQuantity: 0,
    });

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBills = await Bill.find({
      ...staffFilter,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    const todaySales = todayBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
    const todayBillCount = todayBills.length;

    // Get monthly revenue (current month)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyBills = await Bill.find({
      ...staffFilter,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    const monthlyRevenue = monthlyBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

    // Get last month's revenue for comparison
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    const lastMonthBills = await Bill.find({
      ...staffFilter,
      createdAt: {
        $gte: lastMonthStart,
        $lte: lastMonthEnd,
      },
    });

    const lastMonthRevenue = lastMonthBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
    const monthlyRevenueChange = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : '0';

    // Get top selling products (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBills = await Bill.find({
      ...staffFilter,
      createdAt: {
        $gte: thirtyDaysAgo,
      },
    });

    const productSales: { [key: string]: { name: string; sku: string; quantity: number; revenue: number } } = {};
    
    recentBills.forEach((bill) => {
      bill.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            sku: 'N/A', // Will be fetched from Product if needed
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    // Fetch SKUs for top products
    const topProductIds = Object.keys(productSales)
      .sort((a, b) => productSales[b].revenue - productSales[a].revenue)
      .slice(0, 5);

    const products = await Product.find({ _id: { $in: topProductIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p.sku]));

    const topProducts = topProductIds.map(productId => {
      const sales = productSales[productId];
      return {
        ...sales,
        sku: productMap.get(productId) || 'N/A',
      };
    });

    // Get last 7 days sales data for chart
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const last7DaysBills = await Bill.find({
      ...staffFilter,
      createdAt: {
        $gte: sevenDaysAgo,
        $lt: tomorrow,
      },
    }).sort({ createdAt: 1 });

    // Group bills by date
    const dailySales: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailySales[dateKey] = 0;
    }

    last7DaysBills.forEach((bill) => {
      const billDate = new Date(bill.createdAt);
      billDate.setHours(0, 0, 0, 0);
      const dateKey = billDate.toISOString().split('T')[0];
      if (dailySales[dateKey] !== undefined) {
        dailySales[dateKey] += bill.grandTotal || 0;
      }
    });

    // Format for chart
    const salesChartData = Object.entries(dailySales).map(([date, revenue]) => {
      const d = new Date(date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = d.getDate();
      return {
        date: `${dayName} ${dayNumber}`,
        revenue: Math.round(revenue),
      };
    });

    res.json({
      totalProducts,
      todaySales,
      todayBillCount,
      monthlyRevenue,
      monthlyRevenueChange: monthlyRevenueChange.startsWith('-') ? monthlyRevenueChange : `+${monthlyRevenueChange}`,
      lowStockCount: lowStockProducts,
      outOfStockCount: outOfStockProducts,
      topProducts,
      salesChartData,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

