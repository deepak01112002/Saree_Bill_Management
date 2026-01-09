import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Product from '../models/Product';
import * as XLSX from 'xlsx';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { search, page = 1, limit = 20, category } = req.query;
    
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .populate('category', 'name code')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const product = await Product.findById(req.params.id).populate('category', 'name code');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Generate SKU in LP-CAT01-000123 format if category is provided
    let sku = req.body.sku;
    if (!sku && req.body.category) {
      const Category = (await import('../models/Category')).default;
      const category = await Category.findById(req.body.category);
      
      if (category) {
        // Get the next sequential number for this category
        const lastProduct = await Product.findOne({ category: req.body.category })
          .sort({ createdAt: -1 });
        
        let sequenceNumber = 1;
        if (lastProduct && lastProduct.sku) {
          // Extract sequence from existing SKU (LP-CAT01-000123)
          const match = lastProduct.sku.match(/-(\d{6})$/);
          if (match) {
            sequenceNumber = parseInt(match[1], 10) + 1;
          }
        }
        
        // Format: LP-{CATEGORY_CODE}-{6_DIGIT_SEQUENCE}
        const categoryCode = category.code.toUpperCase();
        const sequence = sequenceNumber.toString().padStart(6, '0');
        sku = `LP-${categoryCode}-${sequence}`;
      }
    }
    
    const product = await Product.create({
      ...req.body,
      sku: sku || req.body.sku,
    });
    
    // Populate category before returning
    await product.populate('category', 'name code');
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Get existing product to check price lock
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if price is locked and user is trying to change price
    const isPriceChange = 
      (req.body.sellingPrice !== undefined && req.body.sellingPrice !== existingProduct.sellingPrice) ||
      (req.body.costPrice !== undefined && req.body.costPrice !== existingProduct.costPrice) ||
      (req.body.mrp !== undefined && req.body.mrp !== existingProduct.mrp);

    if (existingProduct.priceLocked && isPriceChange) {
      // Only admin can change locked prices
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Price is locked. Only admins can modify prices after billing. Contact admin for price changes.',
          priceLocked: true,
        });
      }
    }

    // If admin is changing locked price, unlock it (or keep it locked based on business logic)
    // For now, we'll allow admin to change and keep it locked
    const updateData = { ...req.body };
    
    // If admin explicitly wants to unlock, allow it
    if (req.body.unlockPrice === true && req.user?.role === 'admin') {
      updateData.priceLocked = false;
      updateData.priceLockedBy = undefined;
      updateData.priceLockedAt = undefined;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name code');
    
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Excel Upload - Bulk Product Creation
export const uploadProductsFromExcel = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { excelData, categoryId, updateStock = false } = req.body; // excelData is base64 string, updateStock: if true, update existing products' stock

    if (!excelData) {
      return res.status(400).json({ error: 'Excel file data is required' });
    }

    // Category is now optional - can be provided or read from Excel
    const Category = (await import('../models/Category')).default;
    let defaultCategory = null;
    if (categoryId) {
      defaultCategory = await Category.findById(categoryId);
      if (!defaultCategory) {
        return res.status(400).json({ error: 'Selected category not found' });
      }
    }

    // Convert base64 to buffer
    const base64Data = excelData.replace(/^data:.*,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      defval: '', // Default value for empty cells
      raw: false, // Convert numbers to strings for consistent parsing
    });

    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty or has no data' });
    }

    // Normalize column names: get all possible column name variations from first row
    const firstRow = data[0] || {};
    const columnNames = Object.keys(firstRow);
    
    // Helper function to find column value with flexible matching
    const getColumnValue = (row: any, possibleNames: string[]): string => {
      // Normalize function to clean up column names
      const normalize = (str: string): string => {
        return str.replace(/\s+/g, ' ').trim().toLowerCase();
      };
      
      for (const name of possibleNames) {
        const normalizedName = normalize(name);
        
        // Exact match (case-sensitive)
        if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') {
          return String(row[name]).trim();
        }
        
        // Case-insensitive and space-normalized match
        for (const colName of columnNames) {
          const normalizedColName = normalize(colName);
          if (normalizedColName === normalizedName) {
            const value = row[colName];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              return String(value).trim();
            }
          }
        }
      }
      return '';
    };
    
    // Debug: Log available column names and check for GST column (only for first row to avoid spam)
    if (data.length > 0) {
      console.log('Available Excel columns:', columnNames);
      const gstColumn = columnNames.find(col => {
        const normalized = col.replace(/\s+/g, ' ').trim().toLowerCase();
        return normalized.includes('gst') || normalized.includes('tax');
      });
      if (gstColumn) {
        console.log('✅ GST column found:', gstColumn);
      } else {
        console.log('❌ GST column NOT found in Excel. Looking for: GST, GST%, GST Percentage, etc.');
      }
    }

    // Get the last product sequence for this category
    const lastProduct = await Product.findOne({ category: categoryId })
      .sort({ createdAt: -1 });

    let sequenceNumber = 1;
    if (lastProduct && lastProduct.sku) {
      const match = lastProduct.sku.match(/-(\d{6})$/);
      if (match) {
        sequenceNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Process each row
    const products = [];
    const updatedProducts: any[] = [];
    const errors: string[] = [];
    // Track sequence numbers per category for auto-generated SKUs
    const categorySequences: { [categoryId: string]: number } = {};

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Client Excel Format:
        // Product Code, Product Name, Category, Stock Unit, Cost Price (Hidden), Selling Price, MRP (₹), Current Stock
        
        // Use flexible column matching
        const productCode = getColumnValue(row, [
          'Product Code', 'ProductCode', 'product_code', 'Product ID', 'ProductID', 
          'PRODUCT CODE', 'PRODUCTCODE', 'Product_Code'
        ]);
        
        const name = getColumnValue(row, [
          'Product Name', 'ProductName', 'name', 'Name', 'Product', 
          'PRODUCT NAME', 'PRODUCTNAME', 'Product_Name', 'Product name'
        ]);
        
        const categoryName = getColumnValue(row, [
          'Category', 'category', 'Saree Type', 'Type', 'CATEGORY',
          'Category Name', 'category_name', 'SareeType'
        ]);
        
        const stockUnit = getColumnValue(row, [
          'Stock Unit', 'StockUnit', 'stock_unit', 'Unit', 'STOCK UNIT',
          'Stock_Unit', 'stockUnit', 'UOM'
        ]) || 'PCS';
        
        const costPriceStr = getColumnValue(row, [
          'Cost Price (Hidden)', 'Cost Price', 'costPrice', 'Cost', 'COST PRICE',
          'Cost_Price', 'CostPrice', 'Cost Price (Hidden)', 'Cost Price(Hidden)'
        ]);
        const costPrice = parseFloat(costPriceStr) || 0;
        
        const sellingPriceStr = getColumnValue(row, [
          'Selling Price', 'sellingPrice', 'Price', 'SELLING PRICE',
          'Selling_Price', 'SellingPrice', 'Sale Price', 'SalePrice'
        ]);
        const sellingPrice = parseFloat(sellingPriceStr) || 0;
        
        const mrpStr = getColumnValue(row, [
          'MRP (₹)', 'MRP', 'mrp', 'Maximum Retail Price', 'MRP(₹)',
          'MRP (Rs)', 'MRP(Rs)', 'Max Retail Price', 'MAX RETAIL PRICE'
        ]);
        const mrp = parseFloat(mrpStr) || 0;
        
        const stockQuantityStr = getColumnValue(row, [
          'Current Stock', 'Stock Quantity', 'stockQuantity', 'Stock', 'Quantity',
          'CURRENT STOCK', 'Current_Stock', 'CurrentStock', 'Qty', 'QTY'
        ]);
        const stockQuantity = parseInt(stockQuantityStr, 10) || 0;
        
        // Parse GST Percentage column
        const gstPercentageStr = getColumnValue(row, [
          'GST Percentage', 'GST%', 'GST', 'gstPercentage', 'gst_percentage',
          'GST PERCENTAGE', 'Gst Percentage', 'Tax Percentage', 'Tax%', 'TAX PERCENTAGE'
        ]);
        // Parse GST percentage - handle empty strings and 0 values
        let gstPercentage: number | undefined = undefined;
        if (gstPercentageStr && gstPercentageStr.trim() !== '') {
          const parsed = parseFloat(gstPercentageStr.trim());
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            gstPercentage = parsed;
          } else {
            // Log invalid GST value for debugging
            if (i < 3) { // Only log first 3 rows to avoid spam
              console.log(`Row ${rowNumber}: Invalid GST value "${gstPercentageStr}" -> parsed as ${parsed}`);
            }
          }
        } else if (i < 3) {
          // Log missing GST for first 3 rows
          console.log(`Row ${rowNumber}: GST column not found. Available columns: ${Object.keys(row).join(', ')}`);
        }
        
        // Extract brand and color from product name if not in separate columns
        // Format: "Royal Double Ikat Patola Saree – Red"
        let brand = getColumnValue(row, ['Brand', 'brand', 'Supplier', 'supplier', 'BRAND', 'Brand Name']);
        let color = getColumnValue(row, ['Color', 'color', 'COLOUR', 'Colour', 'colour', 'Color Name']);
        let pattern = getColumnValue(row, ['Pattern', 'pattern', 'PATTERN', 'Design', 'design', 'Pattern Name']);
        
        // Try to extract color from product name (last part after – or -)
        if (!color && name) {
          const colorMatch = name.match(/[–-]\s*([A-Za-z\s]+)$/);
          if (colorMatch) {
            color = colorMatch[1].trim();
          }
        }
        
        // If no brand specified, use a default or extract from name
        if (!brand) {
          brand = 'Patola Heritage'; // Default brand for Patola sarees
        }
        
        // Use category name to find or create category
        let finalCategoryId = categoryId || '';
        let finalCategoryCode = '';
        
        if (categoryName && categoryName.trim()) {
          let foundCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') } 
          });
          
          if (!foundCategory) {
            // Create category if it doesn't exist
            const categoryCode = categoryName.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CAT01';
            foundCategory = await Category.create({
              name: categoryName.trim(),
              code: categoryCode,
              description: `Auto-created from Excel upload`,
            });
          }
          finalCategoryId = foundCategory._id.toString();
          finalCategoryCode = foundCategory.code.toUpperCase();
        } else if (defaultCategory) {
          // Use default category if provided
          finalCategoryId = defaultCategory._id.toString();
          finalCategoryCode = defaultCategory.code.toUpperCase();
        }
        
        const purchaseDateStr = getColumnValue(row, ['Purchase Date', 'purchaseDate', 'Date', 'Purchase_Date', 'PURCHASE DATE']);
        const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : new Date();

        // Validate required fields
        if (!name || name.trim() === '') {
          // Debug: Log the row data to help identify the issue
          const availableCols = Object.keys(row).join(', ');
          errors.push(`Row ${rowNumber}: Product Name is required. Available columns: ${availableCols}`);
          continue;
        }
        
        if (!finalCategoryId) {
          errors.push(`Row ${rowNumber}: Category is required`);
          continue;
        }

        if (isNaN(costPrice) || costPrice < 0) {
          errors.push(`Row ${rowNumber}: Invalid cost price`);
          continue;
        }

        if (isNaN(sellingPrice) || sellingPrice < 0) {
          errors.push(`Row ${rowNumber}: Invalid selling price`);
          continue;
        }

        if (isNaN(stockQuantity) || stockQuantity < 0) {
          errors.push(`Row ${rowNumber}: Invalid stock quantity`);
          continue;
        }

        // If updateStock is true and product exists (by Product Code), update it FIRST
        if (updateStock && productCode && productCode.trim()) {
          const baseCode = productCode.trim().toUpperCase();
          
          // Find existing product by Product Code and Category
          let existingProduct = await Product.findOne({
            productCode: baseCode,
            category: finalCategoryId,
          });
          
          // If not found by Product Code + Category, try just Product Code
          if (!existingProduct) {
            existingProduct = await Product.findOne({
              productCode: baseCode,
            });
          }
          
          if (existingProduct) {
            // Update existing product stock
            const previousStock = existingProduct.stockQuantity;
            const stockDifference = stockQuantity - previousStock;
            
            existingProduct.stockQuantity = stockQuantity;
            
            // Update other fields if provided
            if (name && name.trim()) existingProduct.name = name.trim();
            if (costPrice > 0) existingProduct.costPrice = costPrice;
            if (sellingPrice > 0) existingProduct.sellingPrice = sellingPrice;
            if (mrp > 0) existingProduct.mrp = mrp;
            // Update GST percentage (including 0)
            if (gstPercentage !== undefined && gstPercentage !== null && !isNaN(gstPercentage)) {
              existingProduct.gstPercentage = gstPercentage;
            }
            
            await existingProduct.save();
            
            // Create stock transaction for the update
            if (stockDifference !== 0) {
              const StockTransaction = (await import('../models/StockTransaction')).default;
              await StockTransaction.create({
                productId: existingProduct._id.toString(),
                type: stockDifference > 0 ? 'in' : 'out',
                quantity: Math.abs(stockDifference),
                previousStock,
                newStock: stockQuantity,
                referenceId: 'excel-stock-update',
                createdBy: req.user!.id,
              });
            }
            
            updatedProducts.push({
              _id: existingProduct._id,
              name: existingProduct.name,
              sku: existingProduct.sku,
              previousStock,
              newStock: stockQuantity,
            });
            
            continue; // Skip adding to products array - product already updated
          }
        }

        // Generate SKU: Use Product Code as basis to create unique SKU
        let sku = '';
        if (productCode && productCode.trim()) {
          // Use Product Code as basis but create unique SKU
          // Format: {PRODUCT_CODE}-{CATEGORY_CODE}-{SEQUENCE}
          // Example: LP-PT-001 -> LP-PT-001-PT-000001
          const baseCode = productCode.trim().toUpperCase();
          
          // Get sequence number for this product code + category combination
          const lastProductWithCode = await Product.findOne({
            $or: [
              { productCode: baseCode, category: finalCategoryId },
              { sku: { $regex: `^${baseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-` } }
            ]
          }).sort({ createdAt: -1 });
          
          let sequenceNumber = 1;
          if (lastProductWithCode && lastProductWithCode.sku) {
            // Extract sequence from existing SKU (format: LP-PT-001-PT-000001)
            const match = lastProductWithCode.sku.match(/-(\d{6})$/);
            if (match) {
              sequenceNumber = parseInt(match[1], 10) + 1;
            }
          }
          
          // Create unique SKU: {PRODUCT_CODE}-{CATEGORY_CODE}-{6_DIGIT_SEQUENCE}
          const sequence = sequenceNumber.toString().padStart(6, '0');
          sku = `${baseCode}-${finalCategoryCode}-${sequence}`;
          
          // Double-check uniqueness
          const existingProduct = await Product.findOne({ sku });
          if (existingProduct) {
            // If somehow exists, increment sequence
            sequenceNumber++;
            const newSequence = sequenceNumber.toString().padStart(6, '0');
            sku = `${baseCode}-${finalCategoryCode}-${newSequence}`;
          }
        } else {
          // Generate SKU: LP-{CATEGORY_CODE}-{6_DIGIT_SEQUENCE}
          if (!finalCategoryCode) {
            errors.push(`Row ${rowNumber}: Cannot generate SKU without category code`);
            continue;
          }
          
          // Get or initialize sequence number for this category
          if (!categorySequences[finalCategoryId]) {
            const lastProduct = await Product.findOne({ category: finalCategoryId })
              .sort({ createdAt: -1 });
            
            let sequenceNumber = 1;
            if (lastProduct && lastProduct.sku) {
              const match = lastProduct.sku.match(/-(\d{6})$/);
              if (match) {
                sequenceNumber = parseInt(match[1], 10) + 1;
              }
            }
            categorySequences[finalCategoryId] = sequenceNumber;
          }
          
          const sequenceNumber = categorySequences[finalCategoryId];
          const sequence = sequenceNumber.toString().padStart(6, '0');
          sku = `LP-${finalCategoryCode}-${sequence}`;
          // Increment for next product in same category
          categorySequences[finalCategoryId] = sequenceNumber + 1;
        }

        // Parse purchase date
        let parsedDate = new Date();
        if (purchaseDate) {
          if (typeof purchaseDate === 'string') {
            parsedDate = new Date(purchaseDate);
          } else if (purchaseDate instanceof Date) {
            parsedDate = purchaseDate;
          }
          if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date();
          }
        }

        products.push({
          name: name.trim(),
          sareeType: categoryName.trim() || 'Patola Saree', // Use category as sareeType
          brand: brand.trim(),
          color: color.trim() || 'N/A',
          pattern: pattern ? pattern.trim() : '',
          costPrice,
          sellingPrice,
          mrp: mrp > 0 ? mrp : undefined,
          gstPercentage: (gstPercentage !== undefined && gstPercentage !== null && !isNaN(gstPercentage)) ? gstPercentage : undefined,
          sku,
          productCode: productCode ? productCode.trim().toUpperCase() : undefined,
          stockQuantity,
          stockUnit: stockUnit.trim() || 'PCS',
          purchaseDate: parsedDate,
          category: finalCategoryId,
        });
      } catch (error: any) {
        errors.push(`Row ${rowNumber}: ${error.message || 'Invalid data'}`);
      }
    }

    if (products.length === 0 && updatedProducts.length === 0) {
      return res.status(400).json({
        error: 'No valid products found in Excel file',
        errors,
      });
    }

    // Create new products in bulk
    let createdProducts: any[] = [];
    if (products.length > 0) {
      createdProducts = await Product.insertMany(products, { ordered: false });
    }

    // Create stock transactions for each product
    const StockTransaction = (await import('../models/StockTransaction')).default;
    const stockTransactions = createdProducts.map((product) => ({
      productId: product._id.toString(),
      type: 'in' as const,
      quantity: product.stockQuantity,
      previousStock: 0,
      newStock: product.stockQuantity,
      referenceId: 'excel-upload',
      createdBy: req.user!.id,
    }));

    await StockTransaction.insertMany(stockTransactions);

    // Create LOT for this upload (only for new products, not updates)
    const Lot = (await import('../models/Lot')).default;
    let lot = null;
    
    if (createdProducts.length > 0) {
      const uploadDate = new Date();
      
      // Generate LOT number
      const generateLotNumber = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `LOT-${year}-${month}-${day}`;
      };

      let lotNumber = generateLotNumber(uploadDate);
      let existingLot = await Lot.findOne({ lotNumber });
      let counter = 1;
      while (existingLot) {
        lotNumber = `${generateLotNumber(uploadDate)}-${String(counter).padStart(3, '0')}`;
        existingLot = await Lot.findOne({ lotNumber });
        counter++;
      }

      // Calculate total stock value
      const totalStockValue = createdProducts.reduce((sum, product) => {
        return sum + (product.costPrice * product.stockQuantity);
      }, 0);

      // Get the category ID (use first product's category or provided category)
      const lotCategoryId = createdProducts[0]?.category || categoryId || null;

      // Create LOT
      lot = await Lot.create({
        lotNumber,
        uploadDate,
        category: lotCategoryId,
        uploadedBy: req.user!.id,
        productCount: createdProducts.length,
        totalStockValue,
        status: 'active',
        products: createdProducts.map((p) => p._id),
      });

      // Update products with LOT information
      await Product.updateMany(
        { _id: { $in: createdProducts.map((p) => p._id) } },
        { 
          $set: { 
            lot: lot._id,
            lotNumber: lot.lotNumber,
          } 
        }
      );
    }

    res.status(201).json({
      message: `Successfully processed ${createdProducts.length + updatedProducts.length} product(s)`,
      created: createdProducts.length,
      updated: updatedProducts.length,
      total: data.length,
      errors: errors.length > 0 ? errors : undefined,
      lot: lot ? {
        _id: lot._id,
        lotNumber: lot.lotNumber,
        uploadDate: lot.uploadDate,
        productCount: lot.productCount,
        totalStockValue: lot.totalStockValue,
      } : undefined,
      products: createdProducts.map((p) => ({
        _id: p._id,
        name: p.name,
        sku: p.sku,
      })),
      updatedProducts: updatedProducts.length > 0 ? updatedProducts : undefined,
    });
  } catch (error: any) {
    console.error('Excel upload error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process Excel file',
    });
  }
};

export const generateQRCode = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // QR code generation logic will be implemented
    res.json({ message: 'QR code generation - to be implemented' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const generateBarcode = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Barcode generation logic will be implemented
    res.json({ message: 'Barcode generation - to be implemented' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

