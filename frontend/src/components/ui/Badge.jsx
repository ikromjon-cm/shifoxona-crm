import { cn } from '@/lib/utils'

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-medical-50 text-medical-700 dark:bg-medical-900/30 dark:text-medical-300 ring-1 ring-medical-500/20 dark:ring-medical-500/10',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-500/20',
    warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 ring-1 ring-yellow-500/20',
    danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 ring-1 ring-red-500/20',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-500/20',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
