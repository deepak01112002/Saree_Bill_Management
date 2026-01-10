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
  Sparkles,
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
  { name: 'Roll Polish', href: '/roll-polish', icon: Sparkles, roles: ['admin'] },
  { name: 'Wastage', href: '/wastage', icon: AlertTriangle, roles: ['admin'] },
  { name: 'Stock', href: '/stock', icon: BarChart3, roles: ['admin'] },
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
          'fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white transition-transform duration-300 shadow-2xl lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col relative">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}></div>
          </div>

          {/* Logo */}
          <div className="relative flex h-20 items-center justify-between px-6 border-b border-white/20 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg ring-2 ring-white/30">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-white drop-shadow-md">{companyName}</h2>
                <p className="text-xs text-white/90 font-medium">{systemName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-white hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sidebar-scroll">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'group flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden',
                      isActive
                        ? 'bg-white/25 text-white shadow-lg backdrop-blur-md ring-2 ring-white/30 scale-[1.02]'
                        : 'text-white/90 hover:bg-white/15 hover:text-white hover:shadow-md hover:scale-[1.01]'
                    )}
                  >
                    {/* Active indicator line */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                    )}
                    {/* Hover effect background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <Icon className={cn(
                      'relative h-5 w-5 transition-transform duration-200',
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    )} />
                    <span className="relative font-semibold">{item.name}</span>
                    {/* Active arrow indicator */}
                    {isActive && (
                      <div className="relative ml-auto">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="relative border-t border-white/20 p-4 backdrop-blur-sm">
            <p className="text-xs text-white/70 text-center font-medium">
              © 2024 <span className="font-semibold">{companyName}</span>
            </p>
            <p className="text-xs text-white/60 text-center mt-1">{systemName}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

