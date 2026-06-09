import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicinesAPI, categoriesAPI } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ShoppingCart, Search, Plus, Minus, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PharmacyCatalogPage() {
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('pharmacyCart') || '[]'))
  const [quantities, setQuantities] = useState({})

  useEffect(() => {
    fetchMedicines()
    fetchCategories()
  }, [search, category])

  useEffect(() => {
    localStorage.setItem('pharmacyCart', JSON.stringify(cart))
  }, [cart])

  const fetchMedicines = async () => {
    try {
      const params = { search, category, page_size: 50 }
      const res = await medicinesAPI.list(params)
      setMedicines(res.data.results || res.data)
    } catch (err) {
      toast.error('Mahsulotlarni yuklashda xatolik')
    } finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.list()
      setCategories(res.data.results || res.data)
    } catch (err) { /* ignore */ }
  }

  const addToCart = (medicine) => {
    const qty = quantities[medicine.id] || 1
    setCart(prev => {
      const existing = prev.find(item => item.medicine === medicine.id)
      if (existing) {
        return prev.map(item =>
          item.medicine === medicine.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      }
      return [...prev, {
        medicine: medicine.id,
        medicine_name: medicine.name,
        barcode: medicine.barcode,
        quantity: qty,
        price: medicine.selling_price,
      }]
    })
    toast.success(`${medicine.name} savatchaga qo'shildi`)
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacy/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Mahsulotlar katalogi</h1>
            <p className="text-gray-500 mt-1">Mahsulotlarni qidiring va buyurtma bering</p>
          </div>
        </div>
        <Button onClick={() => navigate('/pharmacy/cart')} className="relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Savatcha
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-medical-500 text-white text-xs flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Mahsulot qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} />
        </div>
        <select
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          value={category} onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Barcha kategoriyalar</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500" />
          </div>
        ) : medicines.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">Mahsulot topilmadi</div>
        ) : medicines.map(m => (
          <Card key={m.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{m.name}</h3>
                  <p className="text-xs text-gray-500">Barcode: {m.barcode}</p>
                </div>
                <Badge variant={m.quantity > 0 ? 'success' : 'danger'}>
                  {m.quantity > 0 ? `${m.quantity} dona` : 'Tugagan'}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-sm text-gray-500 line-through">{Number(m.purchase_price).toLocaleString()} so'm</p>
                  <p className="text-lg font-bold text-medical-600">{Number(m.selling_price).toLocaleString()} so'm</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.quantity > 0 ? (
                    <>
                      <div className="flex items-center border rounded-lg">
                        <button
                          type="button"
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setQuantities(prev => ({
                            ...prev,
                            [m.id]: Math.max(1, (prev[m.id] || 1) - 1)
                          }))}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-sm">{quantities[m.id] || 1}</span>
                        <button
                          type="button"
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setQuantities(prev => ({
                            ...prev,
                            [m.id]: Math.min(m.quantity, (prev[m.id] || 1) + 1)
                          }))}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <Button size="sm" onClick={() => addToCart(m)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" disabled>Tugagan</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
