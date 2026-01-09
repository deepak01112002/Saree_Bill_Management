/**
 * Utility functions for authentication and authorization
 */

export type UserRole = 'admin' | 'staff';

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Get current user data from JWT token
 */
export function getCurrentUser(): UserData | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role || 'staff',
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Get current user role
 */
export function getUserRole(): UserRole | null {
  const user = getCurrentUser();
  return user?.role || null;
}

/**
 * Check if current user is admin
 */
export function isAdmin(): boolean {
  return getUserRole() === 'admin';
}

/**
 * Check if current user is staff
 */
export function isStaff(): boolean {
  return getUserRole() === 'staff';
}

/**
 * Check if user has required role
 */
export function hasRole(requiredRole: UserRole): boolean {
  const userRole = getUserRole();
  return userRole === requiredRole;
}


