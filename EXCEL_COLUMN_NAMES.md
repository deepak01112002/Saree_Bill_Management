# Excel Column Names for Product Upload

## Required Columns

1. **Product Name** - Name of the product
2. **Category** - Product category (e.g., "Patola Saree", "Dupattas")
3. **Cost Price (Hidden)** - Cost price of the product
4. **Selling Price** - Selling price of the product
5. **Current Stock** - Stock quantity available

## Optional Columns

1. **Product Code** - Product code (e.g., LP-PT-001). If provided, will be used to generate SKU
2. **Stock Unit** - Unit of stock (e.g., PCS, KG). Default: PCS
3. **MRP (₹)** - Maximum Retail Price
4. **GST Percentage** - GST percentage for the product (e.g., 12, 18, 28)

## GST Percentage Column

**Column Name Options (any of these will work):**
- `GST Percentage` ✅ **Recommended**
- `GST%`
- `GST`
- `GST PERCENTAGE`
- `Gst Percentage`
- `Tax Percentage`
- `Tax%`

**Format:**
- Enter numeric values only (no % sign)
- Examples: `12` (for 12%), `18` (for 18%), `28` (for 28%)
- If not provided, GST will be set to 0% (N/A)

## Example Excel Format

| Product Code | Product Name | Category | Stock Unit | Cost Price (Hidden) | Selling Price | MRP (₹) | **GST Percentage** | Current Stock |
|--------------|--------------|----------|------------|---------------------|---------------|---------|-------------------|---------------|
| LP-PT-001 | Royal Patola Saree - Red | Patola Saree | PCS | 62000 | 85000 | 90000 | **12** | 3 |
| LP-PT-002 | Navratna Patola Saree - Maroon | Patola Saree | PCS | 78000 | 110000 | 120000 | **18** | 2 |
| LP-PT-003 | Elephant Patola Saree - Green | Patola Saree | PCS | 68000 | 95000 | 100000 | **5** | 1 |

## Important Notes

1. **GST Percentage** is optional but recommended for accurate billing
2. If GST Percentage is not provided, the product will show "N/A" in the product table
3. During billing, products without GST will have 0% GST applied
4. Column names are case-insensitive and space-tolerant (e.g., "GST Percentage", "gst percentage", "GSTPERCENTAGE" all work)


