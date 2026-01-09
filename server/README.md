# Backend Server - Saree Retail Management System

Express.js backend API server for the Saree Retail Management System.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env` file in the server root directory:

```env
# Server Configuration
PORT=5000

# MongoDB Connection String
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/saree-retail

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saree-retail?retryWrites=true&w=majority

# JWT Secret (generate a secure random string)
# Use: openssl rand -base64 32
JWT_SECRET=your-secret-key-here-generate-a-random-string-min-32-characters

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Optional: WhatsApp API (Twilio)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Generate JWT Secret
```bash
openssl rand -base64 32
```
Copy the output and paste it as `JWT_SECRET` in your `.env` file.

## Running the Server

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for auto-reload on file changes.

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

The server runs on `http://localhost:5000` by default.

### Health Check
- `GET /health` - Check if server is running

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

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

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

The token is obtained from the login/register endpoints.

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.ts   # MongoDB connection
│   ├── controllers/      # Route controllers (business logic)
│   ├── middleware/       # Custom middleware
│   │   └── auth.ts       # Authentication middleware
│   ├── models/          # MongoDB models (Mongoose)
│   ├── routes/           # API routes
│   └── index.ts         # Server entry point
├── .env                 # Environment variables (create this)
├── .env.example         # Example environment file
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running (if using local)
- Check your `MONGODB_URI` in `.env` file
- Verify network access (if using Atlas)

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 5000

### JWT Secret Error
- Ensure `JWT_SECRET` is set in `.env`
- Use a secure random string (min 32 characters)

## Development Tips

- Use `npm run dev` for development (auto-reload)
- Check console for connection status
- Use Postman or similar tool to test API endpoints
- Check MongoDB connection in database.ts logs


