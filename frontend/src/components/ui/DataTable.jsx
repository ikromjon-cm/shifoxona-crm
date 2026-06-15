import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Inbox } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import { cn } from '@/lib/utils'

function SkeletonRow({ columns }) {
  return (
    <tr className="animate-pulse">
      {columns.map((col, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

export function DataTable({
  columns,
  data = [],
  loading = false,
  searchable = false,
  onSearch,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
  emptyMessage = "Ma'lumot topilmadi",
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {searchable && <div className="h-10 w-72 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />}
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-medical-500 to-brand-500 text-white">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3.5 text-left font-medium whitespace-nowrap text-[13px]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30 bg-white dark:bg-gray-800/50">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonRow key={i} columns={columns} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 rounded-xl"
            placeholder="Qidirish..."
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-medical-500 to-brand-500 text-white">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3.5 text-left font-medium whitespace-nowrap text-[13px]">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30 bg-white dark:bg-gray-800/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
                    <Inbox className="h-7 w-7 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-400">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-all duration-150',
                    onRowClick ? 'cursor-pointer' : '',
                    i % 2 === 0
                      ? 'bg-white dark:bg-gray-800/30'
                      : 'bg-gray-50/50 dark:bg-gray-800/10',
                    'hover:bg-medical-50/50 dark:hover:bg-medical-900/10'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Sahifa {page} / {totalPages}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(1)} disabled={page === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(page - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg">{page}</span>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(page + 1)} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(totalPages)} disabled={page === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
