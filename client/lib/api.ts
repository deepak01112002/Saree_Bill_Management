const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Helper function to set auth token
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    // Also set as cookie for middleware (30 days expiry)
    const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    const isSecure = window.location.protocol === 'https:';
    const cookieString = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    document.cookie = cookieString;
    console.log('Token stored in localStorage and cookie');
  }
};

// Helper function to remove auth token
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    // Remove cookie
    document.cookie = 'auth_token=; path=/; max-age=0';
  }
};

// Base fetch function with auth
const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Unauthorized - clear token and redirect to login
    removeAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return response;
};

// Users API (Admin only)
export const usersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.role) query.append('role', params.role);
    if (params?.search) query.append('search', params.search);

    const response = await apiFetch(`/users?${query.toString()}`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/users/${id}`);
    return response.json();
  },

  create: async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'staff';
    profilePhoto?: string;
    isActive?: boolean;
  }) => {
    const response = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: string, data: {
    name?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'staff';
    profilePhoto?: string;
    isActive?: boolean;
  }) => {
    const response = await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: string) => {
    const response = await apiFetch(`/users/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  resetPassword: async (id: string, password: string) => {
    const response = await apiFetch(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    return response.json();
  },
};

// Auth API
export const authAPI = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { error: result.error || 'Registration failed' };
      }
      
      // Store token if present
      if (result.token) {
        setAuthToken(result.token);
      }
      
      return result;
    } catch (error: any) {
      console.error('Registration API error:', error);
      return { error: error.message || 'Network error' };
    }
  },

  login: async (data: { email: string; password: string }) => {
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { error: result.error || 'Login failed' };
      }
      
      // Store token if present
      if (result.token) {
        setAuthToken(result.token);
        console.log('Token stored:', result.token.substring(0, 20) + '...'); // Debug
      }
      
      return result;
    } catch (error: any) {
      console.error('Login API error:', error);
      return { error: error.message || 'Network error' };
    }
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await apiFetch('/categories');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/categories/${id}`);
    return response.json();
  },

  create: async (data: { name: string; code: string; description?: string }) => {
    const response = await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: string, data: { name?: string; code?: string; description?: string }) => {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: string) => {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Lots API
export const lotsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const response = await apiFetch(`/lots?${query.toString()}`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/lots/${id}`);
    return response.json();
  },

  getProducts: async (id: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const response = await apiFetch(`/lots/${id}/products?${query.toString()}`);
    return response.json();
  },

  getProductsForBarcodes: async (id: string) => {
    const response = await apiFetch(`/lots/${id}/products/barcodes`);
    return response.json();
  },

  create: async (data: {
    uploadDate?: string;
    category?: string;
    productIds?: string[];
  }) => {
    const response = await apiFetch('/lots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: string, data: { status?: string; productIds?: string[] }) => {
    const response = await apiFetch(`/lots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: string) => {
    const response = await apiFetch(`/lots/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Products API
export const productsAPI = {
  getAll: async (params?: { search?: string; page?: number; limit?: number; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.category) query.append('category', params.category);
    
    const response = await apiFetch(`/products?${query.toString()}`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/products/${id}`);
    return response.json();
  },

  create: async (data: any) => {
    const response = await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: string, data: any) => {
    const response = await apiFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: string) => {
    const response = await apiFetch(`/products/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  uploadExcel: async (excelData: string, categoryId: string, updateStock: boolean = false) => {
    const response = await apiFetch('/products/upload', {
      method: 'POST',
      body: JSON.stringify({ excelData, categoryId, updateStock }),
    });
    return response.json();
  },
};

// Customers API
export const customersAPI = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const response = await apiFetch(`/customers?${query.toString()}`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/customers/${id}`);
    return response.json();
  },

  create: async (data: any) => {
    const response = await apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: string, data: any) => {
    const response = await apiFetch(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: string) => {
    const response = await apiFetch(`/customers/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Billing API
export const billingAPI = {
  create: async (data: any) => {
    const response = await apiFetch('/billing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      // Throw error with message from backend
      const error = new Error(result.error || result.message || 'Failed to create bill');
      (error as any).response = result;
      throw error;
    }
    
    return result;
  },

  getAll: async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    
    const response = await apiFetch(`/billing?${query.toString()}`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/billing/${id}`);
    return response.json();
  },

  getByNumber: async (billNumber: string) => {
    const response = await apiFetch(`/billing/number/${billNumber}`);
    return response.json();
  },
};

// Sales API
export const salesAPI = {
  getReport: async () => {
    const response = await apiFetch('/sales/report');
    return response.json();
  },

  getDaily: async (date?: string) => {
    const query = date ? `?date=${date}` : '';
    const response = await apiFetch(`/sales/daily${query}`);
    return response.json();
  },

  getYearly: async (year?: number) => {
    const query = year ? `?year=${year}` : '';
    const response = await apiFetch(`/sales/yearly${query}`);
    return response.json();
  },

  getHighest: async () => {
    const response = await apiFetch('/sales/highest');
    return response.json();
  },

  getMonthly: async (month?: string, year?: string) => {
    const query = new URLSearchParams();
    if (month) query.append('month', month);
    if (year) query.append('year', year);
    const response = await apiFetch(`/sales/monthly?${query.toString()}`);
    return response.json();
  },

  getProductWise: async () => {
    const response = await apiFetch('/sales/product-wise');
    return response.json();
  },

  getStaffWise: async (params?: { month?: string; year?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.month) query.append('month', params.month);
    if (params?.year) query.append('year', params.year);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const response = await apiFetch(`/sales/staff-wise?${query.toString()}`);
    return response.json();
  },
};

// Returns API
export const returnsAPI = {
  create: async (data: any) => {
    const response = await apiFetch('/returns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await apiFetch('/returns');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/returns/${id}`);
    return response.json();
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await apiFetch('/dashboard/stats');
    return response.json();
  },
};

// Wastage API
export const wastageAPI = {
  create: async (data: any) => {
    const response = await apiFetch('/wastage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await apiFetch('/wastage');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/wastage/${id}`);
    return response.json();
  },
};

// Stock Audit API
export const stockAuditAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const response = await apiFetch(`/stock-audit?${query.toString()}`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/stock-audit/${id}`);
    return response.json();
  },

  create: async (data?: { notes?: string }) => {
    const response = await apiFetch('/stock-audit', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    return response.json();
  },

  addItem: async (auditId: string, data: { sku: string; physicalStock: number; notes?: string }) => {
    const response = await apiFetch(`/stock-audit/${auditId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  complete: async (auditId: string, applyAdjustments: boolean = false) => {
    const response = await apiFetch(`/stock-audit/${auditId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ applyAdjustments }),
    });
    return response.json();
  },

  cancel: async (id: string) => {
    const response = await apiFetch(`/stock-audit/${id}/cancel`, {
      method: 'POST',
    });
    return response.json();
  },

  removeItem: async (auditId: string, productId: string) => {
    const response = await apiFetch(`/stock-audit/${auditId}/items/${productId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Stock API
export const stockAPI = {
  getTransactions: async () => {
    const response = await apiFetch('/stock/transactions');
    return response.json();
  },

  getHistory: async (productId: string) => {
    const response = await apiFetch(`/stock/history/${productId}`);
    return response.json();
  },

  update: async (data: any) => {
    const response = await apiFetch('/stock/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Reports API
export const reportsAPI = {
  getDeadStock: async (days?: number) => {
    const query = days ? `?days=${days}` : '';
    const response = await apiFetch(`/reports/dead-stock${query}`);
    return response.json();
  },
};

// Settings API
export const settingsAPI = {
  get: async () => {
    const response = await apiFetch('/settings');
    return response.json();
  },

  update: async (data: {
    companyName?: string;
    companyLogo?: string;
    website?: string;
    gstin?: string;
    pan?: string;
    cin?: string;
    registeredOfficeAddress?: string;
    placeOfSupply?: string;
    paymentTerms?: string;
    defaultDiscountPercentage?: number;
    phone?: string;
    email?: string;
    primaryColor?: string;
    secondaryColor?: string;
    invoiceFooterNote?: string;
    termsAndConditions?: string;
  }) => {
    const response = await apiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Fittings API
export const fittingsAPI = {
  getAll: async (activeOnly?: boolean) => {
    const query = activeOnly ? '?activeOnly=true' : '';
    const response = await apiFetch(`/fittings${query}`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/fittings/${id}`);
    return response.json();
  },

  create: async (data: {
    serviceName: string;
    description?: string;
    unit: string;
    rate: number;
    isActive?: boolean;
  }) => {
    const response = await apiFetch('/fittings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: string, data: {
    serviceName?: string;
    description?: string;
    unit?: string;
    rate?: number;
    isActive?: boolean;
  }) => {
    const response = await apiFetch(`/fittings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: string) => {
    const response = await apiFetch(`/fittings/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

