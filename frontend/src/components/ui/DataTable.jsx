import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Inbox } from 'lucide-react'
import Button from './Button'
import Input from './Input'

function SkeletonRow({ columns }) {
  return (
    <tr className="animate-pulse">
      {columns.map((col, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
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
        {searchable && <div className="h-10 w-72 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-medical-500 text-white">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left font-medium whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Qidirish..."
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-medical-500 text-white">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-medium whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <Inbox className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
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
            <span className="px-2 text-sm font-medium">{page}</span>
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
