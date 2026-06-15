import { cn } from '@/lib/utils'

const gradientMap = {
  medical: 'from-medical-500 to-brand-500',
  emerald: 'from-emerald-600 to-emerald-400',
  amber: 'from-amber-600 to-amber-400',
  rose: 'from-rose-600 to-rose-400',
  violet: 'from-violet-600 to-violet-400',
  accent: 'from-accent-500 to-accent-300',
}

const bgLightMap = {
  medical: 'bg-medical-50 dark:bg-medical-900/20',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
  amber: 'bg-amber-50 dark:bg-amber-900/20',
  rose: 'bg-rose-50 dark:bg-rose-900/20',
  violet: 'bg-violet-50 dark:bg-violet-900/20',
  accent: 'bg-accent-50 dark:bg-accent-900/20',
}

const ringMap = {
  medical: 'ring-medical-500/30',
  emerald: 'ring-emerald-500/30',
  amber: 'ring-amber-500/30',
  rose: 'ring-rose-500/30',
  violet: 'ring-violet-500/30',
  accent: 'ring-accent-500/30',
}

export default function StatCard({ title, value, icon: Icon, color = 'medical', subtitle, trend, index = 0 }) {
  const delay = (index || 0) * 0.1

  return (
    <div
      className={cn(
        'relative group rounded-2xl p-0.5 transition-all duration-500 hover:scale-[1.02]',
        `bg-gradient-to-br ${gradientMap[color] || gradientMap.medical} opacity-20 group-hover:opacity-100`,
      )}
      style={{
        opacity: 0,
        animation: `fadeIn 0.5s ease-out ${delay}s forwards, slideUp 0.5s ease-out ${delay}s forwards`,
      }}
    >
      <div className="relative rounded-2xl bg-white dark:bg-gray-900 p-5 h-full">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              {subtitle && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
              )}
            </div>
            {trend !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full',
                  trend >= 0
                    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30'
                    : 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30'
                )}>
                  {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
                <span className="text-xs text-gray-400">o'tgan oy</span>
              </div>
            )}
          </div>
          <div className={cn(
            'relative p-3 rounded-xl ring-2',
            bgLightMap[color] || bgLightMap.medical,
            ringMap[color] || ringMap.medical
          )}>
            <Icon className={cn(
              'h-5 w-5',
              color === 'medical' && 'text-medical-600 dark:text-medical-400',
              color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
              color === 'amber' && 'text-amber-600 dark:text-amber-400',
              color === 'rose' && 'text-rose-600 dark:text-rose-400',
              color === 'violet' && 'text-violet-600 dark:text-violet-400',
              color === 'accent' && 'text-accent-600 dark:text-accent-400',
            )} />
          </div>
        </div>
      </div>
    </div>
  )
}
