import React from 'react';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'muted' | 'brand' | 'dark';
}

export const Section: React.FC<SectionProps> = ({
  id,
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white text-slate-900',
    muted: 'bg-slate-50 text-slate-900 border-y border-slate-200/60',
    brand: 'bg-slate-900 text-white',
    dark: 'bg-slate-950 text-slate-100',
  };

  return (
    <section
      id={id}
      className={`py-16 sm:py-20 lg:py-24 relative overflow-hidden ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
};
