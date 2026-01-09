# Architecture Overview

## Project Structure

```
Bill_Management/
├── client/                 # Next.js Frontend Application
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/   # Protected dashboard routes
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   ├── lib/                # Utilities and API client
│   ├── models/            # (Legacy - can be removed)
│   └── types/             # TypeScript types
│
└── server/                 # Express.js Backend API
    ├── src/
    │   ├── config/         # Configuration files
    │   ├── controllers/    # Route controllers (business logic)
    │   ├── middleware/     # Custom middleware (auth, etc.)
    │   ├── models/         # MongoDB models (Mongoose)
    │   ├── routes/         # API routes
    │   └── index.ts        # Server entry point
    └── package.json
```

## Communication Flow

```
Frontend (Client)          Backend (Server)          Database (MongoDB)
     │                           │                          │
     │  HTTP Request             │                          │
     ├──────────────────────────>│                          │
     │  (with JWT token)         │                          │
     │                           │  Query                   │
     │                           ├─────────────────────────>│
     │                           │  Data                    │
     │                           │<─────────────────────────┤
     │  JSON Response            │                          │
     │<──────────────────────────┤                          │
```

## API Architecture

### Authentication Flow
1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Server validates credentials
3. Server generates JWT token
4. Frontend stores token in localStorage
5. All subsequent requests include token in Authorization header
6. Server validates token via `authenticate` middleware

### Request Flow
1. Frontend makes API call via `lib/api.ts`
2. API client adds JWT token to Authorization header
3. Request goes to Express server
4. Middleware validates token
5. Controller processes request
6. Controller queries MongoDB via Mongoose models
7. Response sent back to frontend

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React hooks + localStorage for auth
- **HTTP Client**: Fetch API (via `lib/api.ts`)

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **ORM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs for password hashing

## Environment Variables

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Server (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saree-retail
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
```

## Running the Application

### Development

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm run dev  # Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install
npm run dev  # Runs on http://localhost:3000
```

### Production

**Backend:**
```bash
cd server
npm run build
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/qr` - Generate QR code
- `POST /api/products/:id/barcode` - Generate barcode

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Billing
- `POST /api/billing` - Create bill
- `GET /api/billing` - Get all bills
- `GET /api/billing/:id` - Get bill by ID
- `GET /api/billing/number/:billNumber` - Get bill by number

### Sales
- `GET /api/sales/report` - Get sales report
- `GET /api/sales/daily` - Get daily sales
- `GET /api/sales/monthly` - Get monthly sales
- `GET /api/sales/product-wise` - Get product-wise sales

### Returns
- `POST /api/returns` - Create return
- `GET /api/returns` - Get all returns
- `GET /api/returns/:id` - Get return by ID

### Wastage
- `POST /api/wastage` - Create wastage entry
- `GET /api/wastage` - Get all wastage
- `GET /api/wastage/:id` - Get wastage by ID

### Stock
- `GET /api/stock/transactions` - Get stock transactions
- `GET /api/stock/history/:productId` - Get stock history
- `POST /api/stock/update` - Update stock

## Security

1. **JWT Authentication**: All protected routes require valid JWT token
2. **Password Hashing**: bcryptjs with salt rounds of 12
3. **CORS**: Configured to allow only client URL
4. **Input Validation**: Express-validator (to be implemented)
5. **Error Handling**: Centralized error handling middleware

## Database Schema

All models are defined in `server/src/models/`:
- User
- Product
- Customer
- Bill
- Return
- Wastage
- StockTransaction

See individual model files for detailed schemas.

## Future Enhancements

- WebSocket for real-time updates
- Redis for caching
- File upload for product images
- Email notifications
- SMS notifications
- Advanced analytics
- Multi-tenant support


