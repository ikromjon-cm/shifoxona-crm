import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const Button = forwardRef(({ className, variant = 'default', size = 'md', isLoading, children, disabled, ...props }, ref) => {
  const variants = {
    default: 'bg-gradient-to-r from-medical-500 to-brand-500 text-white hover:from-medical-600 hover:to-brand-600 shadow-md shadow-medical-500/20 hover:shadow-lg hover:shadow-medical-500/30',
    destructive: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-md shadow-red-500/20',
    outline: 'border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400',
    link: 'text-medical-500 underline-offset-4 hover:underline',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/20',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-10 px-4 text-sm rounded-xl',
    lg: 'h-12 px-6 text-base rounded-xl',
    icon: 'h-10 w-10 rounded-xl',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      ref={ref}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
