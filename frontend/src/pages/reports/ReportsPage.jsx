import { useState, useEffect } from 'react'
import { reportsAPI, warehouseAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { FileText, Download, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    report_type: 'income',
    file_format: 'xlsx',
    start_date: '',
    end_date: '',
  })
  const [generating, setGenerating] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [incRes, expRes] = await Promise.all([
        warehouseAPI.income.list({ page_size: 5 }),
        warehouseAPI.expense.list({ page_size: 5 }),
      ])
      const incomes = incRes.data.results || incRes.data
      const expenses = expRes.data.results || expRes.data
      const totalIncome = incomes.reduce((s, r) => s + Number(r.total_amount || 0), 0)
      const totalExpense = expenses.reduce((s, r) => s + Number(r.total_amount || 0), 0)
      setStats({ incomes, expenses, totalIncome, totalExpense, incomeCount: incRes.data.count || incomes.length, expenseCount: expRes.data.count || expenses.length })
    } catch {
      // ignore
    }
  }

  const reportTypes = [
    { value: 'income', label: 'Kirim hisoboti' },
    { value: 'expense', label: 'Chiqim hisoboti' },
    { value: 'inventory', label: 'Inventar hisoboti' },
    { value: 'expiry', label: 'Muddati tugayotgan mahsulotlar' },
  ]

  const formatOptions = [
    { value: 'xlsx', label: 'Excel (.xlsx)' },
    { value: 'csv', label: 'CSV (.csv)' },
  ]

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await reportsAPI.generate(filters)
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hisobot_${filters.report_type}_${new Date().toISOString().slice(0, 10)}.${filters.file_format}`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Hisobot yuklab olindi')
      setHistoryKey(k => k + 1)
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Hisobot yaratishda xatolik'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hisobotlar</h1>
        <p className="text-gray-500 mt-1">Hisobotlarni yaratish va eksport qilish</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Oxirgi 5 ta kirim</p>
                <p className="text-xl font-bold text-emerald-600">{stats.totalIncome.toLocaleString()} so'm</p>
                <p className="text-xs text-gray-400">Jami: {stats.incomeCount} ta tranzaksiya</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-rose-200 dark:border-rose-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Oxirgi 5 ta chiqim</p>
                <p className="text-xl font-bold text-rose-600">{stats.totalExpense.toLocaleString()} so'm</p>
                <p className="text-xs text-gray-400">Jami: {stats.expenseCount} ta tranzaksiya</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Hisobot yaratish
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Select
              label="Hisobot turi"
              options={reportTypes}
              value={filters.report_type}
              onChange={(e) => setFilters(prev => ({ ...prev, report_type: e.target.value }))}
            />
            <Select
              label="Format"
              options={formatOptions}
              value={filters.file_format}
              onChange={(e) => setFilters(prev => ({ ...prev, file_format: e.target.value }))}
            />
            <Input
              label="Boshlang'ich sana"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
            />
            <Input
              label="Tugash sanasi"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
          <Button onClick={handleGenerate} isLoading={generating} size="lg">
            <Download className="h-4 w-4 mr-2" /> Hisobotni yuklab olish
          </Button>
        </CardContent>
      </Card>

      <ReportHistory key={historyKey} />
    </div>
  )
}

function ReportHistory() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportsAPI.list()
      .then(res => setReports(res.data.results || res.data))
      .catch(() => toast.error('Hisobotlar tarixini yuklashda xatolik'))
      .finally(() => setLoading(false))
  }, [])

  const typeLabels = {
    income: 'Kirim',
    expense: 'Chiqim',
    inventory: 'Inventar',
    expiry: 'Muddati tugayotgan',
  }

  const columns = [
    { key: 'title', label: 'Nomi' },
    {
      key: 'report_type', label: 'Tur',
      render: (r) => <Badge variant="info">{typeLabels[r.report_type] || r.report_type}</Badge>
    },
    {
      key: 'file_format', label: 'Format',
      render: (r) => <Badge variant="default">{r.file_format?.toUpperCase()}</Badge>
    },
    { key: 'created_by_name', label: 'Kim yaratgan' },
    { key: 'created_at', label: 'Sana', render: (r) => new Date(r.created_at).toLocaleString('uz-UZ') },
    {
      key: 'is_ready', label: 'Holat',
      render: (r) => <Badge variant={r.is_ready ? 'success' : 'warning'}>{r.is_ready ? 'Tayyor' : 'Yaratilmoqda'}</Badge>
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Yaratilgan hisobotlar tarixi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={reports}
          loading={loading}
          emptyMessage="Hali hech qanday hisobot yaratilmagan"
        />
      </CardContent>
    </Card>
  )
}
