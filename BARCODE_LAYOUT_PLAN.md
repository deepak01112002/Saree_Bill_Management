# Barcode Layout Plan for Thermal Printers

## 📋 REQUIREMENTS

1. **Small size labels** - All barcodes on one page
2. **Thermal printer support** - Optimized for 58mm/80mm thermal printers
3. **Bulk download per LOT** - One-click download of all barcodes
4. **Compact layout** - Maximum labels per page

---

## 🖨️ THERMAL PRINTER SPECIFICATIONS

### Common Thermal Printer Sizes:
- **58mm width** (most common for retail)
- **80mm width** (wider format)
- **Continuous paper** (no page breaks needed)

### Label Sizes:
- **Small**: 25mm x 15mm (compact, many per page)
- **Medium**: 38mm x 25mm (standard)
- **Large**: 50mm x 30mm (detailed)

---

## 📐 LAYOUT DESIGN

### Option 1: Grid Layout (Recommended for Thermal)
**For 58mm width paper:**
- **2 columns** of labels
- **Label size**: 25mm x 15mm each
- **Labels per page**: 8-12 labels (depending on paper length)
- **Layout**: 2 columns × 4-6 rows

**For 80mm width paper:**
- **3 columns** of labels
- **Label size**: 25mm x 15mm each
- **Labels per page**: 12-18 labels
- **Layout**: 3 columns × 4-6 rows

### Label Content (Compact):
```
┌─────────────────┐
│ Product Name    │ (8px, bold, truncated if long)
│ SKU: LP-XXX-XXX │ (7px, gray)
│ [Barcode Image] │ (8mm height)
│ ₹Price  MRP:₹XX │ (7px, price bold)
└─────────────────┘
```

### Option 2: Single Column (For Very Small Labels)
**For 58mm width:**
- **1 column** of labels
- **Label size**: 50mm x 15mm (full width)
- **Labels per page**: 6-8 labels
- **More space for product name**

---

## 🎯 IMPLEMENTATION PLAN

### Step 1: Create Thermal-Optimized Print Template
- Use CSS Grid or Flexbox for layout
- 2-3 columns depending on paper width
- Small font sizes (7-8px)
- Compact spacing
- No colors (thermal printers are B&W)

### Step 2: Backend Endpoint for LOT Barcode Download
- Get all products in LOT
- Generate barcodes for each
- Create HTML/PDF with grid layout
- Return as downloadable file

### Step 3: Frontend Download Button
- "Download All Barcodes" button on LOT detail page
- Option to choose: HTML (for printing) or PDF
- Show download progress

---

## 📄 PRINT TEMPLATE STRUCTURE

### HTML Template (For Direct Printing):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    @page {
      size: 58mm auto; /* or 80mm for wider */
      margin: 0;
    }
    body {
      margin: 0;
      padding: 2mm;
      font-family: Arial, sans-serif;
    }
    .label-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr); /* 2 columns for 58mm */
      gap: 1mm;
    }
    .label {
      width: 25mm;
      height: 15mm;
      padding: 1mm;
      border: 0.5px solid #000;
      box-sizing: border-box;
      font-size: 7px;
    }
    .product-name {
      font-size: 8px;
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 0.5mm;
    }
    .sku {
      font-size: 6px;
      color: #333;
      margin-bottom: 0.5mm;
    }
    .barcode {
      width: 100%;
      height: 6mm;
      object-fit: contain;
    }
    .price {
      font-size: 7px;
      text-align: center;
      margin-top: 0.5mm;
    }
  </style>
</head>
<body>
  <div class="label-grid">
    <!-- Repeat for each product -->
    <div class="label">
      <div class="product-name">Product Name</div>
      <div class="sku">SKU: LP-XXX-XXX</div>
      <img src="barcode.png" class="barcode" />
      <div class="price">₹Price</div>
    </div>
  </div>
</body>
</html>
```

### For 80mm Width (3 columns):
```css
.label-grid {
  grid-template-columns: repeat(3, 1fr); /* 3 columns */
}
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### Backend (Node.js/Express):
1. Get all products in LOT
2. Generate barcode images (base64 data URLs)
3. Create HTML template with grid layout
4. Optionally convert to PDF
5. Return as downloadable file

### Frontend (Next.js):
1. Download button on LOT detail page
2. Call backend API
3. Trigger browser download
4. User can print directly from browser

### Libraries Needed:
- `jsbarcode` (already installed) - for barcode generation
- `jszip` (optional) - if we want ZIP with individual images
- `jspdf` (optional) - if we want PDF format

---

## ✅ FINAL DECISION

**Recommended Approach:**
1. **HTML Template** (primary) - Direct browser printing
   - Grid layout: 2 columns for 58mm, 3 columns for 80mm
   - Small labels: 25mm x 15mm
   - Optimized for thermal printers
   - User prints directly from browser

2. **ZIP Download** (optional) - Individual barcode images
   - For users who want individual files
   - Can be used with label printing software

3. **PDF Download** (optional) - Professional format
   - For archival or sharing
   - Better for standard printers

---

## 📝 LABEL CONTENT PRIORITY

**Must Include:**
1. Product Name (truncated if too long)
2. SKU
3. Barcode image
4. Selling Price

**Optional:**
- MRP (if different from selling price)
- Category (if space allows)

---

## 🎨 THERMAL PRINTER OPTIMIZATION

1. **No Colors** - Use black & white only
2. **High Contrast** - Bold text, clear barcodes
3. **Small Fonts** - 6-8px for compact labels
4. **Minimal Spacing** - Maximize labels per page
5. **Simple Borders** - Thin lines (0.5px)
6. **No Backgrounds** - White background only

---

**Ready to implement!** 🚀


