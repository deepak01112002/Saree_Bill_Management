# Saree Retail Outlet Management System

A modern, comprehensive web-based management system for saree retail outlets with QR-based billing, inventory management, and analytics.

## 🚀 Features

- **Product & Stock Management** - Complete inventory control with auto SKU generation
- **QR Code & Barcode** - Generate and scan QR codes/barcodes for fast billing
- **Billing System** - Fast, accurate billing with multiple payment modes
- **Sales Management** - Detailed sales reports and analytics
- **Customer Management** - Maintain customer database and purchase history
- **Return Management** - Handle returns with automatic stock updates
- **Wastage Management** - Track damaged/unsellable items
- **Smart Dashboard** - Real-time business insights and analytics
- **Mobile Responsive** - Works seamlessly on mobile and desktop

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **UI**: Tailwind CSS, Custom Components
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **QR/Barcode**: qrcode, jsbarcode, html5-qrcode
- **Charts**: Recharts

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd Bill_Management
   ```

2. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your MongoDB connection string and NextAuth secret:
   ```env
   MONGODB_URI=mongodb://localhost:27017/saree-retail
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret-key-here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 👤 Default Users

After starting the application, you'll need to register a user through the `/register` page. The first user should be registered as an admin (you can modify the registration API to set the first user as admin automatically).

## 📁 Project Structure

```
client/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── [feature]/        # Feature-specific components
├── lib/                  # Utilities and helpers
├── models/               # MongoDB models
├── types/                # TypeScript types
└── store/                # State management
```

## 🎯 Getting Started

1. **Register an account** at `/register`
2. **Login** at `/login`
3. **Add products** in the Products section
4. **Generate QR codes** for products
5. **Start billing** using QR scanning or manual search
6. **View reports** in the Dashboard and Sales sections

## 📱 Mobile Support

The application is fully responsive and works great on mobile devices. You can:
- Scan QR codes using your phone's camera
- Perform billing operations
- View reports and analytics
- Manage inventory

## 🔐 User Roles

- **Admin**: Full access to all features including settings and user management
- **Staff**: Limited access for billing, sales entry, and basic operations

## 📊 Key Features in Detail

### Product Management
- Add/Edit/Delete products
- Auto SKU generation
- Bulk upload via Excel/CSV
- Stock tracking with low stock alerts

### QR/Barcode System
- Automatic QR code generation for each product
- Barcode generation for printing
- Camera-based QR scanning
- Fast product lookup during billing

### Billing System
- QR-based fast billing
- Multiple payment modes (Cash, UPI, Card)
- GST calculation
- Discount support
- Bill printing and PDF download
- WhatsApp bill sharing

### Reports & Analytics
- Daily/Weekly/Monthly sales reports
- Product-wise sales analysis
- Profit margin calculations
- Low stock alerts
- Top selling products

## 🚧 Development Status

This is an active development project. Current implementation includes:
- ✅ Project setup and structure
- ✅ MongoDB models
- ✅ Authentication system
- ✅ Dashboard layout
- ✅ Login/Register pages
- 🚧 Product management (in progress)
- 🚧 Billing system (in progress)
- 🚧 QR/Barcode generation (in progress)

## 📝 License

This project is proprietary software developed for saree retail outlets.

## 🤝 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ for modern retail management**


