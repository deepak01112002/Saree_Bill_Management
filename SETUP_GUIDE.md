# Setup Guide - Saree Retail Management System

## Quick Start

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Setup Environment Variables

Create a `.env.local` file in the `client` directory:

```env
# MongoDB Connection String
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/saree-retail

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saree-retail?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here-min-32-characters

# Optional: WhatsApp API (Twilio)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Important**: Generate a secure random string for `NEXTAUTH_SECRET`. You can use:
```bash
openssl rand -base64 32
```

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally, then start it
mongod
```

**Option B: MongoDB Atlas (Cloud - Free tier available)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster
4. Get your connection string
5. Add it to `.env.local`

### 4. Run the Application

```bash
cd client
npm run dev
```

The application will be available at: http://localhost:3000

### 5. Create Your First User

1. Navigate to http://localhost:3000/register
2. Fill in the registration form
3. After registration, you'll be redirected to login
4. Login with your credentials

**Note**: To create an admin user, you can either:
- Modify the registration API to set the first user as admin
- Manually update the user role in MongoDB

## Project Structure

```
client/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── products/        # Product management
│   │   ├── billing/         # Billing system
│   │   ├── sales/           # Sales reports
│   │   ├── customers/       # Customer management
│   │   ├── returns/         # Return management
│   │   ├── wastage/         # Wastage management
│   │   ├── stock/            # Stock management
│   │   ├── reports/         # All reports
│   │   └── settings/        # Settings (Admin only)
│   └── api/                 # API routes
│       ├── auth/            # Authentication endpoints
│       ├── products/        # Product CRUD
│       ├── billing/         # Billing endpoints
│       └── ...
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   ├── layout/             # Layout components (Sidebar, Header)
│   └── [feature]/          # Feature-specific components
├── lib/                    # Utilities and helpers
│   ├── db.ts              # MongoDB connection
│   ├── auth.ts            # NextAuth configuration
│   ├── utils.ts           # Utility functions
│   ├── qr.ts              # QR code utilities
│   └── barcode.ts         # Barcode utilities
├── models/                 # MongoDB models (Mongoose)
│   ├── User.ts
│   ├── Product.ts
│   ├── Customer.ts
│   ├── Bill.ts
│   ├── Return.ts
│   ├── Wastage.ts
│   └── StockTransaction.ts
├── types/                  # TypeScript types
└── store/                  # State management (Zustand)
```

## Current Implementation Status

✅ **Completed:**
- Project structure and folder organization
- MongoDB models (User, Product, Customer, Bill, Return, Wastage, StockTransaction)
- Authentication system (NextAuth.js with MongoDB)
- Beautiful login and register pages
- Dashboard layout with sidebar and header
- Responsive design (mobile + desktop)
- UI components (Button, Input, Card, Label)
- MongoDB connection setup
- QR and Barcode utility functions

🚧 **In Progress:**
- Product management pages
- Billing system
- QR/Barcode generation and scanning
- Sales reports
- Customer management
- Return management
- Wastage management

## Next Steps

1. **Product Management**
   - Create product list page
   - Add product form
   - Edit product functionality
   - QR/Barcode generation for products
   - Bulk upload (Excel/CSV)

2. **Billing System**
   - Billing counter interface
   - QR code scanning
   - Bill generation
   - Payment processing
   - Bill printing/PDF

3. **Reports & Analytics**
   - Sales dashboard
   - Product-wise reports
   - Daily/Monthly summaries
   - Charts and graphs

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running (if using local)
- Check your connection string in `.env.local`
- Verify network access (if using Atlas)

### Authentication Issues
- Check `NEXTAUTH_SECRET` is set and is at least 32 characters
- Verify `NEXTAUTH_URL` matches your application URL
- Clear browser cookies and try again

### Build Errors
- Delete `node_modules` and `.next` folder
- Run `npm install` again
- Check TypeScript errors: `npm run build`

## Development Tips

1. **Hot Reload**: Next.js automatically reloads on file changes
2. **Type Safety**: All components are typed with TypeScript
3. **Mobile Testing**: Use browser dev tools or test on actual devices
4. **Database**: Use MongoDB Compass to view/edit data directly

## Support

For issues or questions, refer to the main README.md file.


