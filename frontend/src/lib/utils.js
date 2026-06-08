import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const exportToExcel = (data, columns, filename = 'export') => {
  const dataColumns = columns.filter(c => c.key !== 'actions' && c.label)
  const rows = data.map(row => {
    const obj = {}
    dataColumns.forEach(col => {
      let val
      if (col.render) {
        const rendered = col.render(row)
        val = typeof rendered === 'object' && rendered !== null
          ? (row[col.key] ?? '')
          : String(rendered ?? '')
      } else {
        val = row[col.key] ?? ''
      }
      obj[col.label] = val
    })
    return obj
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Malumotlar')
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
