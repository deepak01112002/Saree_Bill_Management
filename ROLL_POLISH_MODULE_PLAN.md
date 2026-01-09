# Roll Polish Module - Implementation Plan

## 📋 Business Context
In saree retail, fabric rolls are often sent to external polishing/processing services. This module helps track:
- Which rolls are sent for polishing
- Where they are sent (vendor/partner name)
- Status tracking (Sent, In Process, Completed, Returned)
- Dates (sent date, expected return date, actual return date)
- Quantity and details of rolls

## 🎯 Module Features

### 1. Roll Polish Management
- **Create Roll Polish Entry**: Record when rolls are sent for polishing
- **Track Status**: Update status as rolls move through the process
- **View All Entries**: List all roll polish records with filters
- **Update Entry**: Modify details or status
- **Delete Entry**: Remove entries (with proper authorization)

### 2. Data Fields
- **Roll Details**:
  - Roll Number/ID (unique identifier)
  - Fabric Type/Description
  - Quantity (meters/pieces)
  - Color/Design details
- **Vendor/Partner Information**:
  - Vendor Name (required)
  - Vendor Contact Number
  - Vendor Address
- **Status Tracking**:
  - Status: `sent`, `in_process`, `completed`, `returned`, `cancelled`
  - Sent Date (required)
  - Expected Return Date
  - Actual Return Date
  - Notes/Comments
- **System Fields**:
  - Created By (user)
  - Created At
  - Updated At

## 🏗️ Technical Implementation

### Backend Structure

#### 1. Model (`server/src/models/RollPolish.ts`)
```typescript
- rollNumber: string (unique)
- fabricType: string
- quantity: number
- unit: string (meters/pieces)
- colorDesign?: string
- vendorName: string (required)
- vendorContact?: string
- vendorAddress?: string
- status: enum ['sent', 'in_process', 'completed', 'returned', 'cancelled']
- sentDate: Date (required)
- expectedReturnDate?: Date
- actualReturnDate?: Date
- notes?: string
- createdBy: ObjectId (ref: User)
- createdAt, updatedAt
```

#### 2. Controller (`server/src/controllers/rollPolish.ts`)
- `createRollPolish` - Create new entry
- `getRollPolishes` - List all with filters (status, vendor, date range)
- `getRollPolish` - Get single entry by ID
- `updateRollPolish` - Update entry (status, dates, notes)
- `deleteRollPolish` - Delete entry (admin only)

#### 3. Routes (`server/src/routes/rollPolish.ts`)
- `POST /api/roll-polish` - Create
- `GET /api/roll-polish` - List all (with query filters)
- `GET /api/roll-polish/:id` - Get single
- `PUT /api/roll-polish/:id` - Update
- `DELETE /api/roll-polish/:id` - Delete

### Frontend Structure

#### 1. List Page (`client/app/(dashboard)/roll-polish/page.tsx`)
- Table view of all roll polish entries
- Filters: Status, Vendor, Date Range
- Search by roll number
- Status badges with colors
- Action buttons: View, Edit, Delete
- Quick status update dropdown

#### 2. Create Page (`client/app/(dashboard)/roll-polish/add/page.tsx`)
- Form with all fields
- Date pickers for dates
- Status dropdown (default: 'sent')
- Validation
- Auto-generate roll number option

#### 3. Edit Page (`client/app/(dashboard)/roll-polish/edit/[id]/page.tsx`)
- Pre-filled form
- Update functionality
- Status change tracking
- Notes field

#### 4. View/Detail Page (`client/app/(dashboard)/roll-polish/view/[id]/page.tsx`)
- Detailed view of entry
- Status timeline
- All dates and details
- Edit button
- Print option

## 📊 Status Workflow
```
sent → in_process → completed → returned
  ↓
cancelled (can be set at any time)
```

## 🎨 UI/UX Features
- Status color coding:
  - `sent`: Blue
  - `in_process`: Yellow/Orange
  - `completed`: Green
  - `returned`: Purple
  - `cancelled`: Red
- Dashboard widget showing:
  - Total rolls sent
  - Rolls in process
  - Overdue rolls (past expected return date)
- Date reminders for expected returns
- Export to Excel option

## 🔐 Authorization
- All users can view roll polish entries
- All users can create entries
- All users can update status
- Only Admin can delete entries

## 📝 Implementation Steps
1. Create RollPolish model
2. Create rollPolish controller
3. Create rollPolish routes
4. Register routes in server
5. Add API methods in client
6. Create frontend pages (List, Add, Edit, View)
7. Add to sidebar navigation
8. Test all CRUD operations
