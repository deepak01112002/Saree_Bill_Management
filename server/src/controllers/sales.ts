import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Bill from '../models/Bill';
import User from '../models/User';

export const getSalesReport = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const bills = await Bill.find().sort({ createdAt: -1 });
    
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const totalBills = bills.length;
    const averageBill = totalBills > 0 ? totalRevenue / totalBills : 0;

    // Get top selling products
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      totalRevenue,
      totalBills,
      averageBill,
      topProducts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDailySales = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { date } = req.query;
    
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const bills = await Bill.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ createdAt: -1 });

    const totalRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const billCount = bills.length;

    res.json({
      date: targetDate.toISOString().split('T')[0],
      bills,
      totalRevenue,
      billCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMonthlySales = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    // Create start date (first day of month at 00:00:00)
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    // Create end date (last day of month at 23:59:59)
    // month is 1-indexed, so month gives us the first day of next month, then subtract 1 day
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const bills = await Bill.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ createdAt: -1 });

    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
    const billCount = bills.length;

    res.json({
      month,
      year,
      bills,
      totalRevenue,
      billCount,
    });
  } catch (error: any) {
    console.error('Monthly sales error:', error);
    res.status(500).json({ error: error.message || 'Failed to load monthly sales' });
  }
};

export const getProductWiseSales = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const bills = await Bill.find().sort({ createdAt: -1 });

    const productSales: { [key: string]: { 
      productId: string;
      productName: string; 
      quantity: number; 
      revenue: number;
      billCount: number;
    } } = {};

    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
            billCount: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
        productSales[item.productId].billCount += 1;
      });
    });

    const products = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue);

    res.json({
      products,
      total: products.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get yearly sales report
export const getYearlySales = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    // Create start date (first day of year at 00:00:00)
    const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    // Create end date (last day of year at 23:59:59)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const bills = await Bill.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ createdAt: -1 });

    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
    const billCount = bills.length;
    const averageBill = billCount > 0 ? totalRevenue / billCount : 0;

    // Monthly breakdown
    const monthlyData: { [key: number]: { revenue: number; billCount: number } } = {};
    bills.forEach((bill) => {
      const month = new Date(bill.createdAt).getMonth(); // 0-11
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, billCount: 0 };
      }
      monthlyData[month].revenue += bill.grandTotal || 0;
      monthlyData[month].billCount += 1;
    });

    // Convert to array format for frontend
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
      revenue: monthlyData[i]?.revenue || 0,
      billCount: monthlyData[i]?.billCount || 0,
    }));

    res.json({
      year,
      bills,
      totalRevenue,
      billCount,
      averageBill,
      monthlyBreakdown,
    });
  } catch (error: any) {
    console.error('Yearly sales error:', error);
    res.status(500).json({ error: error.message || 'Failed to load yearly sales' });
  }
};

// Get highest sales reports (month and day)
export const getHighestSalesReports = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // Get all bills
    const bills = await Bill.find().sort({ createdAt: -1 });

    // Aggregate by month
    const monthlySales: { [key: string]: { revenue: number; billCount: number; month: string } } = {};
    bills.forEach((bill) => {
      const date = new Date(bill.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = {
          revenue: 0,
          billCount: 0,
          month: monthKey,
        };
      }
      monthlySales[monthKey].revenue += bill.grandTotal || 0;
      monthlySales[monthKey].billCount += 1;
    });

    // Find highest sales month
    const highestMonth = Object.values(monthlySales).reduce((max, current) => {
      return current.revenue > max.revenue ? current : max;
    }, { revenue: 0, billCount: 0, month: '' });

    // Aggregate by day
    const dailySales: { [key: string]: { revenue: number; billCount: number; date: string } } = {};
    bills.forEach((bill) => {
      const date = new Date(bill.createdAt);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!dailySales[dayKey]) {
        dailySales[dayKey] = {
          revenue: 0,
          billCount: 0,
          date: dayKey,
        };
      }
      dailySales[dayKey].revenue += bill.grandTotal || 0;
      dailySales[dayKey].billCount += 1;
    });

    // Find highest sales day
    const highestDay = Object.values(dailySales).reduce((max, current) => {
      return current.revenue > max.revenue ? current : max;
    }, { revenue: 0, billCount: 0, date: '' });

    // Get top selling product
    const productSales: { [key: string]: { name: string; revenue: number; quantity: number } } = {};
    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            revenue: 0,
            quantity: 0,
          };
        }
        productSales[item.productId].revenue += item.total || 0;
        productSales[item.productId].quantity += item.quantity;
      });
    });

    const topProduct = Object.values(productSales).reduce((max, current) => {
      return current.revenue > max.revenue ? current : max;
    }, { name: '', revenue: 0, quantity: 0 });

    res.json({
      highestMonth: {
        month: highestMonth.month,
        revenue: highestMonth.revenue,
        billCount: highestMonth.billCount,
      },
      highestDay: {
        date: highestDay.date,
        revenue: highestDay.revenue,
        billCount: highestDay.billCount,
      },
      topProduct: {
        name: topProduct.name,
        revenue: topProduct.revenue,
        quantity: topProduct.quantity,
      },
      monthlySales: Object.values(monthlySales).sort((a, b) => b.revenue - a.revenue).slice(0, 12),
      dailySales: Object.values(dailySales).sort((a, b) => b.revenue - a.revenue).slice(0, 30),
    });
  } catch (error: any) {
    console.error('Highest sales reports error:', error);
    res.status(500).json({ error: error.message || 'Failed to load highest sales reports' });
  }
};

export const getStaffWiseSales = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Get date range from query params (optional)
    const { startDate, endDate, month, year } = req.query;
    
    let dateFilter: any = {};
    
    if (month && year) {
      // Filter by specific month
      const start = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0, 0);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      dateFilter = {
        $gte: start,
        $lte: end,
      };
    } else if (startDate && endDate) {
      // Filter by date range
      dateFilter = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }
    // If no date filter, get all bills

    const bills = await Bill.find(
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
    ).sort({ createdAt: -1 });

    // Get all staff users
    const staffUsers = await User.find({ role: 'staff' }).select('_id name email');
    const staffMap = new Map(staffUsers.map(user => [user._id.toString(), user]));

    // Aggregate sales by staff
    const staffSales: { [key: string]: {
      staffId: string;
      staffName: string;
      staffEmail: string;
      totalRevenue: number;
      billCount: number;
      averageBill: number;
      bills: any[];
    } } = {};

    bills.forEach((bill) => {
      const staffId = bill.createdBy.toString();
      
      if (!staffSales[staffId]) {
        const staff = staffMap.get(staffId);
        staffSales[staffId] = {
          staffId,
          staffName: staff?.name || 'Unknown Staff',
          staffEmail: staff?.email || '',
          totalRevenue: 0,
          billCount: 0,
          averageBill: 0,
          bills: [],
        };
      }

      staffSales[staffId].totalRevenue += bill.grandTotal || 0;
      staffSales[staffId].billCount += 1;
      staffSales[staffId].bills.push(bill);
    });

    // Calculate average bill for each staff
    Object.values(staffSales).forEach((staff) => {
      staff.averageBill = staff.billCount > 0 ? staff.totalRevenue / staff.billCount : 0;
    });

    // Sort by total revenue (descending)
    const staffPerformance = Object.values(staffSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate totals
    const totalRevenue = staffPerformance.reduce((sum, staff) => sum + staff.totalRevenue, 0);
    const totalBills = staffPerformance.reduce((sum, staff) => sum + staff.billCount, 0);
    const overallAverage = totalBills > 0 ? totalRevenue / totalBills : 0;

    res.json({
      staffPerformance,
      summary: {
        totalRevenue,
        totalBills,
        overallAverage,
        staffCount: staffPerformance.length,
      },
      dateRange: {
        startDate: dateFilter.$gte || null,
        endDate: dateFilter.$lte || null,
        month: month || null,
        year: year || null,
      },
    });
  } catch (error: any) {
    console.error('Staff-wise sales error:', error);
    res.status(500).json({ error: error.message || 'Failed to load staff-wise sales' });
  }
};

