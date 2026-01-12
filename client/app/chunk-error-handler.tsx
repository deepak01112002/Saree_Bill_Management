'use client';

import { useEffect } from 'react';

// Global error handler for chunk loading errors
export function ChunkErrorHandler() {
  useEffect(() => {
    // Listen for chunk loading errors
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error || event.message || '';
      const isChunkError = 
        error?.toString().includes('ChunkLoadError') ||
        error?.toString().includes('Failed to load chunk') ||
        error?.toString().includes('Loading chunk') ||
        event.message?.includes('Failed to fetch dynamically imported module');

      if (isChunkError) {
        console.warn('Chunk loading error detected. Reloading page...');
        // Clear cache and reload
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }
        // Reload after clearing cache
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    // Listen for unhandled promise rejections (chunk errors often appear here)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason?.message || event.reason?.toString() || '';
      const isChunkError = 
        error.includes('ChunkLoadError') ||
        error.includes('Failed to load chunk') ||
        error.includes('Loading chunk') ||
        error.includes('Failed to fetch dynamically imported module');

      if (isChunkError) {
        console.warn('Chunk loading error in promise rejection. Reloading page...');
        event.preventDefault(); // Prevent default error handling
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}
