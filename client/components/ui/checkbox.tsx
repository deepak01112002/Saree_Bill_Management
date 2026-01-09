'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onCheckedChange?.(!checked);
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors cursor-pointer',
            checked
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-gray-300 bg-white hover:border-gray-400',
            className
          )}
          onClick={handleClick}
        >
          {checked && <Check className="h-3 w-3" />}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };

