import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { reportsAPI } from '@/services/api'
import StatCard from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import {
  Pill, Package, TrendingUp, TrendingDown,
  AlertTriangle, Building2, Clock, ShoppingCart,
  Store, MapPin, CheckCircle, Activity,
  ChevronRight, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { cn } from '@/lib/utils'

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload) return null
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

const pharmacyIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;border-radius:12px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 4px 12px rgba(79,70,229,0.4)">🏪</div>',
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

export default function DashboardPage() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await reportsAPI.dashboard()
      setData(res.data)
    } catch (err) { /* empty */ } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [])

  const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const income = data?.monthly_income?.find(m => new Date(m.month).getMonth() + 1 === month)
    const expense = data?.monthly_expense?.find(m => new Date(m.month).getMonth() + 1 === month)
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

  const statCards = [
    { title: t('dashboard.totalMedicines'), value: data?.total_medicines || 0, icon: Package, color: 'medical', key: 'medicines' },
    { title: t('dashboard.totalStock'), value: data?.total_quantity || 0, icon: Pill, color: 'emerald', key: 'quantity' },
    { title: t('dashboard.todayIncome'), value: (data?.today_income || 0).toLocaleString() + " so'm", icon: TrendingUp, color: 'amber', key: 'income' },
    { title: t('dashboard.todayExpense'), value: (data?.today_expense || 0).toLocaleString() + " so'm", icon: TrendingDown, color: 'rose', key: 'expense' },
    { title: t('dashboard.lowStock'), value: data?.low_stock || 0, icon: AlertTriangle, color: 'rose', key: 'lowstock' },
    { title: t('dashboard.expiringSoon'), value: data?.expiring_soon || 0, icon: Clock, color: 'amber', key: 'expiring' },
    { title: t('dashboard.pharmacies'), value: data?.total_pharmacies || 0, icon: Building2, color: 'violet', key: 'pharmacies' },
    { title: t('dashboard.activePharmacies'), value: data?.total_pharmacies_active || 0, icon: Store, color: 'emerald', key: 'active' },
    { title: t('dashboard.todayOrders'), value: data?.today_orders || 0, icon: ShoppingCart, color: 'amber', key: 'todayorders' },
    { title: t('dashboard.pending'), value: data?.pending_orders || 0, icon: Clock, color: 'rose', key: 'pending' },
    { title: t('dashboard.delivered'), value: data?.delivered_orders || 0, icon: Package, color: 'medical', key: 'delivered' },
    { title: t('dashboard.received'), value: data?.received_orders || 0, icon: CheckCircle, color: 'emerald', key: 'received' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-medical-200 dark:border-medical-900" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-medical-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 animate-pulse">{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {t('dashboard.refresh')}
        </button>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.key} {...card} index={i} />
        ))}
      </div>

      {/* Map */}
      {data?.pharmacy_locations?.length > 0 && (
        <div
          className="animate-fade-in"
          style={{ animationDelay: '0.7s', animationFillMode: 'both' }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-medical-500" />
                  {t('dashboard.map')}
                </CardTitle>
                <span className="text-xs text-gray-400">{data.pharmacy_locations.length} {t('dashboard.countPharmacies')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                <MapContainer center={[41.3, 69.2]} zoom={6} className="h-full w-full" scrollWheelZoom={true}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {data.pharmacy_locations.map((ph) => (
                    <Marker key={ph.id} position={[ph.latitude, ph.longitude]} icon={pharmacyIcon}>
                      <Popup>
                        <div className="text-sm min-w-[150px]">
                          <p className="font-semibold text-gray-900">{ph.name}</p>
                          {ph.address && <p className="text-xs text-gray-500 mt-0.5">{ph.address}</p>}
                          {ph.phone && <p className="text-xs text-gray-500 mt-0.5">📞 {ph.phone}</p>}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${ph.latitude},${ph.longitude}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-medical-500 hover:text-medical-600"
                          >
                            {t('dashboard.navigation')} <ChevronRight className="h-3 w-3" />
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts row */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        style={{ animation: 'fadeIn 0.5s ease-out 0.8s both' }}
      >
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-medical-500" />
              {t('dashboard.monthlyChart')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="name" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={(v) => Number(v).toLocaleString() + " so'm"} />} />
                <Bar dataKey="kirim" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="chiqim" fill="url(#expenseGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pie className="h-4 w-4 text-brand-500" />
              {t('dashboard.topProducts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  {COLORS.map((c, i) => (
                    <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={topMedicinesData.slice(0, 5)}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  cornerRadius={8}
                  dataKey="value"
                >
                  {topMedicinesData.slice(0, 5).map((_, i) => (
                    <Cell key={i} fill={`url(#pieGrad${i})`} stroke={COLORS[i]} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              {t('dashboard.monthlyTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="trendIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trendExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="name" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={(v) => Number(v).toLocaleString() + " so'm"} />} />
                <Area type="monotone" dataKey="kirim" stroke="#4F46E5" strokeWidth={2.5} fill="url(#trendIncome)" dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }} />
                <Area type="monotone" dataKey="chiqim" stroke="#10B981" strokeWidth={2.5} fill="url(#trendExpense)" dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-medical-500" />
              {t('dashboard.topProducts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'medicine__name', label: t('dashboard.productName') },
                { key: 'total_qty', label: t('dashboard.quantity') },
                { key: 'total_amount', label: t('dashboard.amount'), render: (row) => Number(row.total_amount).toLocaleString() + " so'm" },
              ]}
              data={data?.top_medicines || []}
              emptyMessage={t('common.noData')}
            />
          </CardContent>
        </Card>

        {data?.top_pharmacies?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-4 w-4 text-brand-500" />
                {t('dashboard.topPharmacies')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: 'pharmacy__name', label: t('dashboard.pharmacy') },
                  { key: 'total_orders', label: t('dashboard.orders') },
                  { key: 'total_amount', label: t('dashboard.amount'), render: (row) => Number(row.total_amount).toLocaleString() + " so'm" },
                ]}
                data={data?.top_pharmacies || []}
                emptyMessage={t('common.noData')}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
