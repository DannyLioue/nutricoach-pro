import * as React from 'react'
import { cn } from '@/lib/utils'

function badgeVariant(variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default', className?: string): string {
  const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2'

  const variants = {
    default: 'border-transparent bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
    destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
    outline: 'text-gray-950',
  }

  return cn(base, variants[variant], className)
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <div className={badgeVariant(variant, className)} {...props} />
}

export { Badge }
