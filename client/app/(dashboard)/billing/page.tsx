'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { productsAPI, billingAPI, customersAPI, settingsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, QrCode, FileText, ScanLine } from 'lucide-react';
import { QRScanner } from '@/components/billing/QRScanner';
import { BarcodeScanner } from '@/components/billing/BarcodeScanner';
import { showToast } from '@/lib/toast';
import { generateQuotationPDF } from '@/lib/pdf';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  gstPercentage?: number; // GST percentage from product
  total: number; // Price × quantity (without GST)
  gstAmount: number; // Calculated GST amount
  totalWithGst: number; // Total including GST
}

export default function BillingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerPanCard, setCustomerPanCard] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGstNumber, setCustomerGstNumber] = useState('');
  const [customerFirmName, setCustomerFirmName] = useState('');
  const [showPanCard, setShowPanCard] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card'>('cash');
  const [additionalCharges, setAdditionalCharges] = useState<Array<{
    serviceName: string;
    quantity: number;
    unit: string;
    rate: number;
  }>>([]);
  const [showStitchingServices, setShowStitchingServices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Auto-fetch customer details when mobile number is entered
  useEffect(() => {
    const fetchCustomerByMobile = async () => {
      // Only fetch if mobile is exactly 10 digits
      // Don't fetch if customer name is already filled (user might be manually entering)
      if (customerMobile.length === 10 && !customerName.trim()) {
        try {
          const result = await customersAPI.getAll({ search: customerMobile, limit: 5 });
          const customers = result.customers || [];
          
          // Find exact mobile number match
          const customer = customers.find((c: any) => c.mobileNumber === customerMobile);
          
          if (customer) {
            // Auto-fill customer details
            setCustomerName(customer.name || '');
            setCustomerEmail(customer.email || '');
            setCustomerPanCard(customer.panCard || '');
            setCustomerGstNumber(customer.gstNumber || '');
            setCustomerFirmName(customer.firmName || '');
            
            // Show PAN card field if PAN exists
            if (customer.panCard) {
              setShowPanCard(true);
            }
            
            // Show additional fields if any exist
            if (customer.email || customer.gstNumber || customer.firmName) {
              setShowAdditionalFields(true);
            }
            
            setTimeout(() => {
              showToast.success(`Customer "${customer.name}" details loaded`);
            }, 0);
          }
        } catch (error: any) {
          // Silently fail - customer might not exist, which is fine
          console.log('Customer not found for mobile:', customerMobile);
        }
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchCustomerByMobile();
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerMobile]); // Only depend on customerMobile to avoid infinite loops

  // Handle external barcode scanner input
  useEffect(() => {
    // Auto-focus barcode input when page loads (for external scanners)
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Process barcode scanner input
  useEffect(() => {
    if (!barcodeInput) return;

    // Clear previous timeout
    if (barcodeTimeoutRef.current) {
      clearTimeout(barcodeTimeoutRef.current);
    }

    // Barcode scanners typically send data very quickly and end with Enter
    // We'll detect when input stops (scanner finished) and process it
    barcodeTimeoutRef.current = setTimeout(async () => {
      if (barcodeInput.length > 0) {
        await handleBarcodeScan(barcodeInput.trim());
        setBarcodeInput('');
      }
    }, 150); // Wait 150ms after last character to detect scanner input

    return () => {
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [barcodeInput]);

  const handleBarcodeScan = async (scannedValue: string) => {
    try {
      if (!scannedValue || scannedValue.trim() === '') {
        return;
      }
      
      const trimmedValue = scannedValue.trim();
      
      // Use dedicated SKU API endpoint for faster and more accurate lookup
      try {
        const product = await productsAPI.getBySku(trimmedValue);
        
        if (product && product._id) {
          // Product found by SKU - add to cart
          addToCart(product);
          showToast.success(`Product "${product.name}" added to cart`);
        } else {
          showToast.error(`Product with SKU/Barcode "${trimmedValue}" not found`);
        }
      } catch (skuError: any) {
        // If SKU lookup fails, try search as fallback
        console.log('SKU lookup failed, trying search fallback:', skuError.message);
        
        try {
          const result = await productsAPI.getAll({ search: trimmedValue, limit: 10 });
          const products = result.products || [];
          
          // Find exact SKU match
          let product = products.find((p: any) => 
            p.sku && (p.sku === trimmedValue || p.sku.toLowerCase() === trimmedValue.toLowerCase())
          );
          
          // Try barcode field
          if (!product) {
            product = products.find((p: any) => 
              p.barcode && (p.barcode === trimmedValue || p.barcode.toLowerCase() === trimmedValue.toLowerCase())
            );
          }
          
          if (product) {
            addToCart(product);
            showToast.success(`Product "${product.name}" added to cart`);
          } else {
            showToast.error(`Product with SKU/Barcode "${trimmedValue}" not found`);
          }
        } catch (searchError: any) {
          console.error('Search fallback also failed:', searchError);
          showToast.error(`Product with SKU/Barcode "${trimmedValue}" not found`);
        }
      }
    } catch (error: any) {
      console.error('Barcode scan error:', error);
      showToast.error('Failed to process barcode scan: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);
  };

  const handleBarcodeInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter is pressed, process immediately (barcode scanners often send Enter)
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      await handleBarcodeScan(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  const searchProducts = async () => {
    try {
      setSearching(true);
      const result = await productsAPI.getAll({ search: searchQuery, limit: 10 });
      setSearchResults(result.products || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const calculateItemGst = (price: number, quantity: number, gstPercentage: number = 0) => {
    const subtotal = price * quantity;
    const gstAmount = (subtotal * gstPercentage) / 100;
    return { subtotal, gstAmount, totalWithGst: subtotal + gstAmount };
  };

  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product._id);
      const gstPercentage = product.gstPercentage || 0;
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        const { subtotal, gstAmount, totalWithGst } = calculateItemGst(existingItem.price, newQuantity, gstPercentage);
        
        const updatedCart = prevCart.map((item) =>
          item.productId === product._id
            ? { 
                ...item, 
                quantity: newQuantity, 
                total: subtotal,
                gstAmount,
                totalWithGst
              }
            : item
        );
        // Defer toast to avoid render-time state updates
        setTimeout(() => {
          showToast.success(`Quantity increased to ${newQuantity}`);
        }, 0);
        return updatedCart;
      } else {
        const { subtotal, gstAmount, totalWithGst } = calculateItemGst(product.sellingPrice, 1, gstPercentage);
        
        const newCart = [
          ...prevCart,
          {
            productId: product._id,
            productName: product.name,
            quantity: 1,
            price: product.sellingPrice,
            gstPercentage: gstPercentage,
            total: subtotal,
            gstAmount: gstAmount,
            totalWithGst: totalWithGst,
          },
        ];
        // Defer toast to avoid render-time state updates
        setTimeout(() => {
          showToast.success('Product added to cart');
        }, 0);
        return newCart;
      }
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleQRScanSuccess = async (productData: { productId: string; sku: string; name: string; price: number }) => {
    try {
      if (!productData || !productData.productId) {
        showToast.error('Invalid product data. Please scan again.');
        return;
      }
      
      // Fetch full product details to ensure it exists and get latest price
      const product = await productsAPI.getById(productData.productId);
      
      if (product) {
        // addToCart will show appropriate toast message (added or quantity increased)
        addToCart(product);
      } else {
        showToast.error('Product not found. Please try again.');
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      // If product fetch fails, try to add with scanned data (without GST info)
      try {
        setCart((prevCart) => {
          const existingItem = prevCart.find((item) => item.productId === productData.productId);
          const gstPercentage = 0; // Default to 0 if product fetch fails
          
          if (existingItem) {
            const newQuantity = existingItem.quantity + 1;
            const { subtotal, gstAmount, totalWithGst } = calculateItemGst(existingItem.price, newQuantity, gstPercentage);
            
            return prevCart.map((item) =>
              item.productId === productData.productId
                ? { 
                    ...item, 
                    quantity: newQuantity, 
                    total: subtotal,
                    gstAmount,
                    totalWithGst
                  }
                : item
            );
          } else {
            const { subtotal, gstAmount, totalWithGst } = calculateItemGst(productData.price, 1, gstPercentage);
            
            return [
              ...prevCart,
              {
                productId: productData.productId,
                productName: productData.name,
                quantity: 1,
                price: productData.price,
                gstPercentage: gstPercentage,
                total: subtotal,
                gstAmount: gstAmount,
                totalWithGst: totalWithGst,
              },
            ];
          }
        });
        // Defer toast to avoid render-time state updates
        setTimeout(() => {
          showToast.success(`Product "${productData.name}" added to cart`);
        }, 0);
      } catch (cartError: any) {
        console.error('Error adding to cart:', cartError);
        showToast.error('Failed to add product to cart. Please try again.');
      }
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = Math.max(1, item.quantity + change);
            const gstPercentage = item.gstPercentage || 0;
            const { subtotal, gstAmount, totalWithGst } = calculateItemGst(item.price, newQuantity, gstPercentage);
            
            return {
              ...item,
              quantity: newQuantity,
              total: subtotal,
              gstAmount,
              totalWithGst,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const calculateTotals = () => {
    // Subtotal is sum of item prices (without GST)
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    // Total GST from all items
    const totalGstAmount = cart.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
    // Calculate additional charges total
    const totalAdditionalCharges = additionalCharges.reduce(
      (sum, charge) => sum + (charge.quantity * charge.rate),
      0
    );
    // Calculate discount amount from percentage (on subtotal)
    const discountAmount = (subtotal * discount) / 100;
    // Grand total = Subtotal + Additional Charges + Total GST - Discount
    const grandTotal = subtotal + totalAdditionalCharges + totalGstAmount - discountAmount;
    return { subtotal, totalGstAmount, totalAdditionalCharges, discountAmount, grandTotal };
  };

  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      setTimeout(() => {
        showToast.error('Please add at least one item to the cart');
      }, 0);
      return;
    }

    // GST is now calculated per product from Excel upload, no validation needed

    // Validate discount percentage
    if (discount < 0 || discount > 100) {
      setTimeout(() => {
        showToast.error('Discount percentage must be between 0 and 100');
      }, 0);
      return;
    }

    try {
      setLoading(true);
      const { subtotal, totalGstAmount, discountAmount, grandTotal } = calculateTotals();

      const billData = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        customerName: customerName || undefined,
        customerMobile: customerMobile || undefined,
        customerPanCard: customerPanCard || undefined,
        customerEmail: customerEmail || undefined,
        customerGstNumber: customerGstNumber || undefined,
        customerFirmName: customerFirmName || undefined,
        discount, // Send discount percentage to backend
        paymentMode,
        additionalCharges: additionalCharges.filter(charge => charge.serviceName.trim() && charge.rate > 0), // Only send valid charges
      };

      const result = await billingAPI.create(billData);

      if (result.bill) {
        // Reset form first
        setCart([]);
        setCustomerName('');
        setCustomerMobile('');
        setCustomerPanCard('');
        setCustomerEmail('');
        setCustomerGstNumber('');
        setCustomerFirmName('');
        setShowPanCard(false);
        setShowAdditionalFields(false);
        setDiscount(0);
        setPaymentMode('cash');
        setAdditionalCharges([]);
        setShowStitchingServices(false);
        
        // Show success toast after state updates
        setTimeout(() => {
          showToast.success('Bill generated successfully!');
        }, 0);
        
        // Redirect to bill view page
        setTimeout(() => {
          router.push(`/billing/view/${result.bill._id}`);
        }, 100);
      }
    } catch (error: any) {
      // Extract error message from response
      const errorMessage = error.message || error.error || 'Unknown error';
      setTimeout(() => {
        showToast.error('Failed to create bill: ' + errorMessage);
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQuotation = async () => {
    if (cart.length === 0) {
      setTimeout(() => {
        showToast.error('Please add at least one item to the cart');
      }, 0);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch settings for company details
      const settings = await settingsAPI.get();
      
      // Fetch full product details for each cart item to get SKU and HSN codes
      const itemsWithDetails = await Promise.all(
        cart.map(async (item) => {
          try {
            const product = await productsAPI.getById(item.productId);
            return {
              productName: item.productName,
              productSku: product.sku || '',
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              gstPercentage: item.gstPercentage || 0,
              gstAmount: item.gstAmount || 0,
              hsnCode: product.hsnCode || '',
            };
          } catch (error) {
            // If product fetch fails, use cart item data without SKU/HSN
            return {
              productName: item.productName,
              productSku: '',
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              gstPercentage: item.gstPercentage || 0,
              gstAmount: item.gstAmount || 0,
              hsnCode: '',
            };
          }
        })
      );

      // Prepare additional charges
      const additionalChargesData = additionalCharges
        .filter(charge => charge.serviceName.trim() && charge.rate > 0)
        .map(charge => ({
          serviceName: charge.serviceName,
          quantity: charge.quantity,
          unit: charge.unit,
          rate: charge.rate,
          amount: charge.quantity * charge.rate,
        }));

      const { subtotal, totalGstAmount, totalAdditionalCharges, discountAmount, grandTotal } = calculateTotals();

      // Generate quotation number (QUOT-YYYYMMDD-HHMMSS)
      const now = new Date();
      const quotationNumber = `QUOT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

      // Prepare quotation data
      const quotationData = {
        quotationNumber,
        createdAt: now.toISOString(),
        companyName: settings.companyName,
        website: settings.website,
        gstin: settings.gstin,
        pan: settings.pan,
        cin: settings.cin,
        registeredOfficeAddress: settings.registeredOfficeAddress,
        placeOfSupply: settings.placeOfSupply,
        paymentTerms: settings.paymentTerms,
        customerName: customerName || undefined,
        customerMobile: customerMobile || undefined,
        customerPanCard: customerPanCard || undefined,
        customerEmail: customerEmail || undefined,
        customerAddress: undefined, // Not available in billing form
        customerGstNumber: customerGstNumber || undefined,
        customerFirmName: customerFirmName || undefined,
        items: itemsWithDetails,
        additionalCharges: additionalChargesData.length > 0 ? additionalChargesData : undefined,
        subtotal,
        gst: totalGstAmount,
        discount: discountAmount,
        discountPercentage: discount > 0 ? discount : undefined,
        grandTotal,
        quotationTermsAndConditions: settings.termsAndConditions,
        quotationFooterNote: settings.invoiceFooterNote,
      };

      // Generate and download quotation PDF
      await generateQuotationPDF(quotationData, quotationNumber);
      
      setTimeout(() => {
        showToast.success('Quotation downloaded successfully!');
      }, 0);
    } catch (error: any) {
      console.error('Error generating quotation:', error);
      const errorMessage = error.message || error.error || 'Unknown error';
      setTimeout(() => {
        showToast.error('Failed to generate quotation: ' + errorMessage);
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for additional charges
  const addStitchingService = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { serviceName: '', quantity: 1, unit: 'item', rate: 0 },
    ]);
  };

  const updateStitchingService = (index: number, field: string, value: any) => {
    setAdditionalCharges(
      additionalCharges.map((charge, i) =>
        i === index ? { ...charge, [field]: value } : charge
      )
    );
  };

  const removeStitchingService = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const { subtotal, totalGstAmount, totalAdditionalCharges, discountAmount, grandTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing Counter</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new bill</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Product Search & Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Search */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Search Products</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBarcodeScannerOpen(true)}
                    className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300"
                    title="Open camera barcode scanner"
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Scan Barcode
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQrScannerOpen(true)}
                    className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Scan QR
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Barcode Scanner Input - For External Handheld Scanners */}
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <Label className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2 block">
                  Barcode Scanner (Test Mode)
                </Label>
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={handleBarcodeInputChange}
                  onKeyDown={handleBarcodeInputKeyDown}
                  placeholder="Scan or type SKU/Barcode here to test..."
                  autoFocus
                  className="bg-white dark:bg-gray-800 border-green-300 dark:border-green-600 focus:ring-green-500"
                />
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Use this field to test barcode scanning. External scanners will auto-fill here.
                </p>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, SKU, or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 border rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product._id}
                      className="p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between"
                      onClick={async () => {
                        // Fetch full product details to ensure we have GST percentage
                        try {
                          const fullProduct = await productsAPI.getById(product._id);
                          if (fullProduct) {
                            addToCart(fullProduct);
                          } else {
                            addToCart(product); // Fallback to search result
                          }
                        } catch (error) {
                          // If fetch fails, use search result
                          addToCart(product);
                        }
                      }}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.sku} • Stock: {product.stockQuantity} • {formatCurrency(product.sellingPrice)}
                          {product.gstPercentage !== undefined && product.gstPercentage !== null && (
                            <span className="text-blue-600 font-medium ml-2">• GST: {product.gstPercentage}%</span>
                          )}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                  <p>Cart is empty. Search and add products.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.price)} each</p>
                        {item.gstPercentage !== undefined && item.gstPercentage > 0 && (
                          <p className="text-xs text-blue-600 font-medium">
                            GST ({item.gstPercentage}%): {formatCurrency(item.gstAmount || 0)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right w-32">
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
                            {formatCurrency(item.total)}
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.totalWithGst || item.total)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer & Bill Summary */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerMobile">Mobile</Label>
                <Input
                  id="customerMobile"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showPanCard">PAN Card (Optional)</Label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPanCard}
                      onChange={(e) => {
                        setShowPanCard(e.target.checked);
                        if (!e.target.checked) {
                          setCustomerPanCard('');
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-gray-600 dark:text-gray-400">Add PAN Card</span>
                  </label>
                </div>
                {showPanCard && (
                  <Input
                    id="customerPanCard"
                    value={customerPanCard}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                      setCustomerPanCard(value);
                    }}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="font-mono"
                  />
                )}
                {showPanCard && customerPanCard.length > 0 && customerPanCard.length !== 10 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">PAN card must be 10 characters (e.g., ABCDE1234F)</p>
                )}
              </div>

              {/* Additional Customer Fields */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Additional Information</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                  >
                    {showAdditionalFields ? 'Hide' : 'Show'} Additional Fields
                  </Button>
                </div>
                {showAdditionalFields && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email ID</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="customer@example.com (optional)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerGstNumber">GST Number</Label>
                      <Input
                        id="customerGstNumber"
                        value={customerGstNumber}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                          setCustomerGstNumber(value);
                        }}
                        placeholder="29ABCDE1234F1Z5 (optional)"
                        maxLength={15}
                        className="font-mono"
                      />
                      {customerGstNumber.length > 0 && customerGstNumber.length !== 15 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">GST number must be 15 characters</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerFirmName">Firm/Business Name</Label>
                      <Input
                        id="customerFirmName"
                        value={customerFirmName}
                        onChange={(e) => setCustomerFirmName(e.target.value)}
                        placeholder="Business/Firm name (optional)"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                {totalAdditionalCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Additional Services:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(totalAdditionalCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total GST:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(totalGstAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount (%):</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setDiscount(value >= 0 && value <= 100 ? value : discount);
                      }}
                      className="w-20 h-8 text-sm"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
                    {discount > 0 && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        ({formatCurrency((cart.reduce((sum, item) => sum + item.total, 0) * discount) / 100)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-t dark:border-gray-700 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Grand Total:</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Stitching Services Section */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Additional Services (Stitching)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowStitchingServices(!showStitchingServices);
                      if (!showStitchingServices && additionalCharges.length === 0) {
                        addStitchingService();
                      }
                    }}
                  >
                    {showStitchingServices ? 'Hide' : 'Add Services'}
                  </Button>
                </div>
                {showStitchingServices && (
                  <div className="space-y-3 pt-2">
                    {additionalCharges.map((charge, index) => (
                      <div key={index} className="p-3 border dark:border-gray-700 rounded-lg space-y-2 bg-gray-50 dark:bg-gray-800">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Service Name</Label>
                            <Input
                              value={charge.serviceName}
                              onChange={(e) => updateStitchingService(index, 'serviceName', e.target.value)}
                              placeholder="e.g., Saree Stitching"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rate (₹)</Label>
                            <Input
                              type="number"
                              value={charge.rate}
                              onChange={(e) => updateStitchingService(index, 'rate', Number(e.target.value))}
                              placeholder="0"
                              min="0"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              value={charge.quantity}
                              onChange={(e) => updateStitchingService(index, 'quantity', Number(e.target.value))}
                              min="1"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={charge.unit}
                              onChange={(e) => updateStitchingService(index, 'unit', e.target.value)}
                              placeholder="item"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStitchingService(index)}
                              className="text-red-600 h-8"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        {charge.serviceName && charge.rate > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
                            Total: {formatCurrency(charge.quantity * charge.rate)}
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStitchingService}
                      className="w-full"
                    >
                      + Add Another Service
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Payment Mode</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'upi', 'card'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`
                        flex-1 capitalize px-4 py-3 rounded-md font-medium text-sm transition-all duration-200
                        border-2 flex items-center justify-center
                        ${
                          paymentMode === mode
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-300 ring-offset-2'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <span className="font-semibold">{mode.toUpperCase()}</span>
                      {paymentMode === mode && (
                        <span className="ml-2 text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleDownloadQuotation}
                  disabled={loading || cart.length === 0}
                  variant="outline"
                  className="w-full border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900"
                  size="lg"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {loading ? 'Generating...' : 'Download Quotation'}
                </Button>
                <Button
                  onClick={handleGenerateBill}
                  disabled={loading || cart.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  {loading ? 'Generating Bill...' : 'Generate Bill'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Scanner */}
      <QRScanner
        open={qrScannerOpen}
        onOpenChange={setQrScannerOpen}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* QR Scanner */}
      <QRScanner
        open={qrScannerOpen}
        onOpenChange={setQrScannerOpen}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={barcodeScannerOpen}
        onOpenChange={setBarcodeScannerOpen}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}

