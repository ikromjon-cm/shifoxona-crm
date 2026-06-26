import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-medical-500 mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Sahifa topilmadi</p>
        <Link to="/dashboard">
          <Button>Bosh sahifaga qaytish</Button>
        </Link>
      </div>
    </div>
  )
}
