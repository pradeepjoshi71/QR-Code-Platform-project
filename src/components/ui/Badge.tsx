import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase',
    md: 'text-xs font-medium px-2.5 py-1 rounded-full',
  };

  const variantStyles = {
    brand: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    outline: 'border border-slate-300 text-slate-600 bg-transparent',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-medium ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
