import { Card, CardContent } from './Card'
import { cn } from '@/lib/utils'

export default function StatCard({ title, value, icon: Icon, color = 'medical', subtitle, trend }) {
  const colors = {
    medical: 'bg-medical-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
  }

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', colors[color])}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            <span className={trend >= 0 ? 'text-emerald-500' : 'text-red-500'}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-gray-500">o'tgan oyga nisbatan</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
