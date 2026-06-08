import { useState, useEffect } from 'react'
import { reportsAPI } from '@/services/api'
import StatCard from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import {
  Pill, Package, TrendingUp, TrendingDown,
  AlertTriangle, Building2, Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#1A73E8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await reportsAPI.dashboard()
      setData(res.data)
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500"></div>
      </div>
    )
  }

  const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const income = data?.monthly_income?.find(m => m.month == month)
    const expense = data?.monthly_expense?.find(m => m.month == month)
    return {
      name: `${month}-oy`,
      kirim: income?.total ? Number(income.total) : 0,
      chiqim: expense?.total ? Number(expense.total) : 0,
    }
  })

  const topMedicinesData = data?.top_medicines?.map(m => ({
    name: m.medicine__name,
    value: m.total_qty,
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Asosiy statistika va ma'lumotlar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Jami mahsulotlar"
          value={data?.total_medicines || 0}
          icon={Package}
          color="medical"
        />
        <StatCard
          title="Ombordagi soni"
          value={data?.total_quantity || 0}
          icon={Pill}
          color="emerald"
        />
        <StatCard
          title="Bugungi kirim"
          value={data?.today_income || 0}
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Bugungi chiqim"
          value={data?.today_expense || 0}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Kam qoldiq"
          value={data?.low_stock || 0}
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Muddati yaqin"
          value={data?.expiring_soon || 0}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Dorixonalar"
          value={data?.total_pharmacies || 0}
          icon={Building2}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Oylik kirim/chiqim</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="kirim" fill="#1A73E8" radius={[4, 4, 0, 0]} name="Kirim" />
                <Bar dataKey="chiqim" fill="#10b981" radius={[4, 4, 0, 0]} name="Chiqim" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eng ko'p tarqatilgan mahsulotlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topMedicinesData.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {topMedicinesData.slice(0, 5).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Oylik trend (kirim)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="kirim" stroke="#1A73E8" strokeWidth={2} dot={{ fill: '#1A73E8' }} name="Kirim" />
                <Line type="monotone" dataKey="chiqim" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Chiqim" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eng ko'p tarqatilgan mahsulotlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'medicine__name', label: 'Mahsulot nomi' },
              { key: 'total_qty', label: 'Jami miqdor' },
              {
                key: 'total_amount', label: 'Jami summa',
                render: (row) => Number(row.total_amount).toLocaleString() + ' so\'m'
              },
            ]}
            data={data?.top_medicines || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
