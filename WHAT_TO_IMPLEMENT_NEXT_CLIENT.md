# What to Implement Next - La Patola Requirements

## 🎯 IMMEDIATE PRIORITIES (Start Here)

### 1. 🔴 Category Management (CRITICAL - Week 1)
**Why**: Foundation for all other features - Excel upload, LOT management, reports all depend on categories

**What to Build**:
- [ ] **Backend**:
  - [ ] Create Category model (`server/src/models/Category.ts`)
  - [ ] Category CRUD routes (`server/src/routes/categories.ts`)
  - [ ] Category controllers (`server/src/controllers/categories.ts`)
  - [ ] Add `category` field to Product model

- [ ] **Frontend**:
  - [ ] Category list page (`/categories`)
  - [ ] Create category page (`/categories/add`)
  - [ ] Edit category page (`/categories/edit/[id]`)
  - [ ] Category dropdown in product forms
  - [ ] Filter products by category

**Files to Create**:
- `server/src/models/Category.ts`
- `server/src/routes/categories.ts`
- `server/src/controllers/categories.ts`
- `client/app/(dashboard)/categories/page.tsx`
- `client/app/(dashboard)/categories/add/page.tsx`
- `client/app/(dashboard)/categories/edit/[id]/page.tsx`

**Estimated Time**: 3-4 days

---

### 2. 🔴 Excel Upload System (CRITICAL - Week 1-2)
**Why**: Core workflow - staff uploads products via Excel, not manual entry

**What to Build**:
- [ ] **Backend**:
  - [ ] Excel upload endpoint (`POST /api/products/upload`)
  - [ ] Excel parsing using `xlsx` library
  - [ ] Bulk product creation
  - [ ] SKU generation: `LP-{CATEGORY_CODE}-{SEQUENTIAL_NUMBER}`
  - [ ] Error handling for invalid data

- [ ] **Frontend**:
  - [ ] Excel upload page (`/products/upload`)
  - [ ] File upload component
  - [ ] Category selection before upload
  - [ ] Upload progress indicator
  - [ ] Success/error messages
  - [ ] Preview uploaded products

**Files to Create**:
- `server/src/controllers/products.ts` (add upload method)
- `client/app/(dashboard)/products/upload/page.tsx`
- `client/components/products/ExcelUploader.tsx`

**Dependencies to Install**:
```bash
npm install xlsx
npm install @types/xlsx
```

**Estimated Time**: 4-5 days

---

### 3. 🔴 LOT Management (CRITICAL - Week 2)
**Why**: Organize products by upload date, enable LOT-wise barcode download

**What to Build**:
- [ ] **Backend**:
  - [ ] Create LOT model (`server/src/models/Lot.ts`)
  - [ ] Auto-generate LOT on Excel upload
  - [ ] Format: `LOT-YYYY-MM-DD`
  - [ ] Link products to LOT
  - [ ] LOT routes and controllers

- [ ] **Frontend**:
  - [ ] LOT list page (`/lots`)
  - [ ] LOT detail page (view products in LOT)
  - [ ] LOT-wise barcode download button
  - [ ] Filter products by LOT

**Files to Create**:
- `server/src/models/Lot.ts`
- `server/src/routes/lots.ts`
- `server/src/controllers/lots.ts`
- `client/app/(dashboard)/lots/page.tsx`
- `client/app/(dashboard)/lots/[id]/page.tsx`

**Estimated Time**: 3-4 days

---

### 4. 🔴 SKU Format Update (CRITICAL - Week 1)
**Why**: Client requires specific format: `LP-CAT01-000123`

**What to Build**:
- [ ] Update SKU generation logic
- [ ] Format: `LP-{CATEGORY_CODE}-{SEQUENTIAL_NUMBER}`
- [ ] Ensure category code is 2-3 characters
- [ ] Sequential number with leading zeros (6 digits)

**Files to Modify**:
- `server/src/controllers/products.ts` (SKU generation)
- `client/app/(dashboard)/products/add/page.tsx` (if frontend generates)

**Estimated Time**: 1 day

---

## 🟡 HIGH PRIORITY (Week 3)

### 5. Admin User Management
- [ ] Admin can create staff users
- [ ] Set username & password
- [ ] Update/reset credentials
- [ ] Staff list page (admin only)

### 6. Enhanced Customer Fields
- [ ] Add Email ID field
- [ ] Add GST Number field
- [ ] Add Firm Name field
- [ ] Update customer form and model

### 7. Category-wise Billing
- [ ] Group items by category in bill display
- [ ] Category subtotals in bills

---

## 🟢 MEDIUM PRIORITY (Week 4)

### 8. Additional Reports
- [ ] Yearly sales report
- [ ] Highest sales month/day
- [ ] Dead stock report

### 9. System Settings
- [ ] Settings page (admin only)
- [ ] Profile photo upload
- [ ] Branding controls

---

## 📋 QUICK START GUIDE

### To Start Implementing:

1. **Category Management** (Start Here)
   ```bash
   # Create Category model
   # server/src/models/Category.ts
   
   # Add to Product model:
   category: { type: Schema.Types.ObjectId, ref: 'Category', required: true }
   ```

2. **Excel Upload**
   ```bash
   # Install dependencies
   cd server && npm install xlsx
   cd ../client && npm install xlsx
   
   # Create upload endpoint
   # server/src/controllers/products.ts
   ```

3. **LOT Management**
   ```bash
   # Create LOT model
   # server/src/models/Lot.ts
   
   # Auto-generate on Excel upload
   ```

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Week 1:
1. Category Management (3-4 days)
2. SKU Format Update (1 day)

### Week 2:
3. Excel Upload System (4-5 days)
4. LOT Management (3-4 days)

### Week 3:
5. Admin User Management (2-3 days)
6. Enhanced Customer Fields (1 day)
7. Category-wise Billing (1 day)

### Week 4:
8. Additional Reports (2-3 days)
9. System Settings (2 days)

---

**Total Estimated Time**: 3-4 weeks for all critical features

**Next Action**: Start with Category Management


