import { useState, useEffect } from 'react'
import { reportsAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/ui/DataTable'

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    report_type: 'income',
    file_format: 'xlsx',
    start_date: '',
    end_date: '',
  })
  const [generating, setGenerating] = useState(false)

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
              onChange={(e) => setFilters({ ...filters, report_type: e.target.value })}
            />
            <Select
              label="Format"
              options={formatOptions}
              value={filters.file_format}
              onChange={(e) => setFilters({ ...filters, file_format: e.target.value })}
            />
            <Input
              label="Boshlang'ich sana"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
            <Input
              label="Tugash sanasi"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <Button onClick={handleGenerate} isLoading={generating} size="lg">
            <Download className="h-4 w-4 mr-2" /> Hisobotni yuklab olish
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Yaratilgan hisobotlar</CardTitle></CardHeader>
        <CardContent>
          <ReportHistory />
        </CardContent>
      </Card>
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

  const columns = [
    { key: 'title', label: 'Nomi' },
    { key: 'report_type', label: 'Tur' },
    { key: 'file_format', label: 'Format' },
    { key: 'created_by_name', label: 'Kim yaratgan' },
    { key: 'created_at', label: 'Sana', render: (r) => new Date(r.created_at).toLocaleDateString() },
    { key: 'is_ready', label: 'Holat', render: (r) => r.is_ready ? 'Tayyor' : 'Yaratilmoqda' },
  ]

  return <DataTable columns={columns} data={reports} loading={loading} />
}
