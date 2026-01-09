import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/database';

// Load environment variables from .env file in server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import customerRoutes from './routes/customers';
import billingRoutes from './routes/billing';
import salesRoutes from './routes/sales';
import returnRoutes from './routes/returns';
import wastageRoutes from './routes/wastage';
import stockRoutes from './routes/stock';
import dashboardRoutes from './routes/dashboard';
import lotRoutes from './routes/lots';
import stockAuditRoutes from './routes/stockAudit';
import reportsRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import fittingsRoutes from './routes/fittings';
import rollPolishRoutes from './routes/rollPolish';

const app = express();
const PORT = process.env.PORT || 5001; // Changed to 5001 to avoid AirPlay conflict

// CORS Configuration - Simple and permissive for development
// IMPORTANT: This allows all origins - ONLY for development!
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
};

// Apply CORS middleware FIRST, before any other middleware
app.use(cors(corsOptions));

// Additional manual CORS headers as backup
app.use((req, res, next) => {
  // Set CORS headers for all responses
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB()
  .then(async () => {
    // Initialize default admin user
    const { initDefaultAdmin } = await import('./config/initAdmin');
    await initDefaultAdmin();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/wastage', wastageRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/stock-audit', stockAuditRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/fittings', fittingsRoutes);
app.use('/api/roll-polish', rollPolishRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

