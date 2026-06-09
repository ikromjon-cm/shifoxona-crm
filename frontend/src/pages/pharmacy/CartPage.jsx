import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ShoppingCart, Trash2, ArrowLeft, Minus, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CartPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('pharmacyCart') || '[]'))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem('pharmacyCart', JSON.stringify(cart))
  }, [cart])

  const updateQty = (medicineId, delta) => {
    setCart(prev => prev.map(item =>
      item.medicine === medicineId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0))
  }

  const removeItem = (medicineId) => {
    setCart(prev => prev.filter(item => item.medicine !== medicineId))
    toast.success("Mahsulot savatchadan olib tashlandi")
  }

  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const placeOrder = async () => {
    if (!user?.pharmacy?.id) {
      toast.error('Dorixona profili topilmadi')
      return
    }
    if (cart.length === 0) {
      toast.error('Savatcha bo\'sh')
      return
    }
    setLoading(true)
    try {
      await ordersAPI.create({
        pharmacy: user.pharmacy.id,
        note,
        items: cart.map(item => ({
          medicine: item.medicine,
          quantity: item.quantity,
          price: item.price,
        })),
      })
      localStorage.removeItem('pharmacyCart')
      toast.success('Buyurtma muvaffaqiyatli yaratildi!')
      navigate('/pharmacy/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msg = Object.values(data).flat().join('; ')
        toast.error(msg || 'Xatolik yuz berdi')
      } else {
        toast.error('Xatolik yuz berdi')
      }
    } finally { setLoading(false) }
  }

  if (cart.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacy/catalog')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Savatcha</h1>
        </div>
        <Card><CardContent className="p-12 text-center text-gray-500">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-4">Savatcha bo'sh</p>
          <Button onClick={() => navigate('/pharmacy/catalog')}>Katalogga o'tish</Button>
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacy/catalog')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Savatcha ({cart.length})</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item) => (
            <Card key={item.medicine}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.medicine_name}</h3>
                  <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>
                  <p className="text-sm font-medium text-medical-600 mt-1">
                    {Number(item.price).toLocaleString()} so'm
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => updateQty(item.medicine, -1)}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => updateQty(item.medicine, 1)}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm font-bold w-24 text-right">
                    {(item.quantity * item.price).toLocaleString()}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.medicine)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:sticky lg:top-4 self-start">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Buyurtma yakuni</h3>
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.medicine} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.medicine_name} x{item.quantity}</span>
                    <span>{(item.quantity * item.price).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Jami:</span>
                  <span>{total.toLocaleString()} so'm</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Izoh</label>
                <textarea
                  className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Buyurtmaga izoh qoldiring..."
                />
              </div>
              <Button className="w-full" onClick={placeOrder} isLoading={loading}>
                Buyurtma berish ({total.toLocaleString()} so'm)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
