'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  RotateCcw,
  AlertTriangle,
  BarChart3,
  Settings,
  Menu,
  X,
  UserCog,
  FileText,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { settingsAPI } from '@/lib/api';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  roles: ('admin' | 'staff')[]; // Which roles can see this item
}

const allMenuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { name: 'Billing', href: '/billing', icon: ShoppingCart, roles: ['admin', 'staff'] },
  { name: 'Bill History', href: '/billing/history', icon: FileText, roles: ['admin', 'staff'] },
  { name: 'Categories', href: '/categories', icon: FolderOpen, roles: ['admin', 'staff'] },
  { name: 'Upload Excel', href: '/products/upload', icon: Upload, roles: ['admin', 'staff'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['admin'] },
  { name: 'LOTs', href: '/lots', icon: Package, roles: ['admin'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['admin'] },
  { name: 'Sales', href: '/sales', icon: TrendingUp, roles: ['admin'] },
  { name: 'Returns', href: '/returns', icon: RotateCcw, roles: ['admin'] },
  { name: 'Fittings', href: '/fittings', icon: Package, roles: ['admin'] },
  { name: 'Wastage', href: '/wastage', icon: AlertTriangle, roles: ['admin'] },
  { name: 'Stock', href: '/stock', icon: BarChart3, roles: ['admin'] },
  { name: 'Stock Audit', href: '/stock-audit', icon: Package, roles: ['admin', 'staff'] },
  { name: 'Users', href: '/users', icon: UserCog, roles: ['admin'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null);
  const [companyName, setCompanyName] = useState('Saree Retail');
  const [systemName, setSystemName] = useState('Management System');

  useEffect(() => {
    // Get user role from token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'staff');
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserRole('staff');
      }
    }
    
    // Load company name from settings
    const loadSettings = async () => {
      try {
        const settings = await settingsAPI.get();
        if (settings?.companyName) {
          setCompanyName(settings.companyName);
        }
        // Optionally make "Management System" part of settings too
        // For now, keeping it static as "Management System"
      } catch (error) {
        console.error('Failed to load settings for sidebar:', error);
        // Keep default "Saree Retail" if settings fail to load
      }
    };
    
    loadSettings();
  }, []);

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter((item) => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-blue-600 to-purple-700 text-white transition-transform duration-300 lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{companyName}</h2>
                <p className="text-xs text-white/80">{systemName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/20 p-4">
            <p className="text-xs text-white/60 text-center">
              © 2024 {companyName} {systemName}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

