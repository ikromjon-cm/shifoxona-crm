import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
            refresh: refreshToken,
          })
          const { access } = response.data
          localStorage.setItem('accessToken', access)
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  register: (data) => api.post('/accounts/register/', data),
  login: (data) => api.post('/accounts/login/', data),
  refreshToken: (data) => api.post('/accounts/token/refresh/', data),
  getProfile: () => api.get('/accounts/profile/'),
  updateProfile: (data) => api.patch('/accounts/profile/', data),
  changePassword: (data) => api.post('/accounts/change-password/', data),
}

export const usersAPI = {
  list: (params) => api.get('/accounts/users/', { params }),
  create: (data) => api.post('/accounts/users/create/', data),
  get: (id) => api.get(`/accounts/users/${id}/`),
  update: (id, data) => api.patch(`/accounts/users/${id}/`, data),
  delete: (id) => api.delete(`/accounts/users/${id}/`),
  block: (id) => api.post(`/accounts/users/${id}/block/`),
  unblock: (id) => api.post(`/accounts/users/${id}/unblock/`),
}

export const medicinesAPI = {
  list: (params) => api.get('/medicines/medicines/', { params }),
  create: (data) => api.post('/medicines/medicines/', data),
  get: (id) => api.get(`/medicines/medicines/${id}/`),
  update: (id, data) => api.patch(`/medicines/medicines/${id}/`, data),
  delete: (id) => api.delete(`/medicines/medicines/${id}/`),
}

export const batchesAPI = {
  list: (params) => api.get('/medicines/batches/', { params }),
  create: (data) => api.post('/medicines/batches/', data),
}

export const categoriesAPI = {
  list: (params) => api.get('/medicines/categories/', { params }),
  create: (data) => api.post('/medicines/categories/', data),
  update: (id, data) => api.patch(`/medicines/categories/${id}/`, data),
  delete: (id) => api.delete(`/medicines/categories/${id}/`),
}

export const suppliersAPI = {
  list: (params) => api.get('/medicines/suppliers/', { params }),
  create: (data) => api.post('/medicines/suppliers/', data),
  update: (id, data) => api.patch(`/medicines/suppliers/${id}/`, data),
  delete: (id) => api.delete(`/medicines/suppliers/${id}/`),
}

export const warehouseAPI = {
  income: {
    list: (params) => api.get('/warehouse/income/', { params }),
    create: (data) => api.post('/warehouse/income/', data),
    get: (id) => api.get(`/warehouse/income/${id}/`),
    delete: (id) => api.delete(`/warehouse/income/${id}/`),
  },
  expense: {
    list: (params) => api.get('/warehouse/expense/', { params }),
    create: (data) => api.post('/warehouse/expense/', data),
    get: (id) => api.get(`/warehouse/expense/${id}/`),
    delete: (id) => api.delete(`/warehouse/expense/${id}/`),
  },
  movements: {
    list: (params) => api.get('/warehouse/movements/', { params }),
  },
}

export const pharmaciesAPI = {
  list: (params) => api.get('/pharmacies/pharmacies/', { params }),
  create: (data) => api.post('/pharmacies/pharmacies/', data),
  get: (id) => api.get(`/pharmacies/pharmacies/${id}/`),
  update: (id, data) => api.patch(`/pharmacies/pharmacies/${id}/`, data),
  delete: (id) => api.delete(`/pharmacies/pharmacies/${id}/`),
  register: (data) => api.post('/pharmacies/register/', data),
  login: (data) => api.post('/pharmacies/login/', data),
  approve: (id, data) => api.post(`/pharmacies/approve/${id}/`, data),
}

export const ordersAPI = {
  list: (params) => api.get('/orders/orders/', { params }),
  create: (data) => api.post('/orders/orders/', data),
  get: (id) => api.get(`/orders/orders/${id}/`),
  updateStatus: (id, data) => api.post(`/orders/orders/${id}/update_status/`, data),
  receive: (id, data) => api.post(`/orders/orders/${id}/receive/`, data),
  myOrders: () => api.get('/orders/orders/my_orders/'),
}

export const deliveryAPI = {
  list: (params) => api.get('/delivery/deliveries/', { params }),
  create: (data) => api.post('/delivery/deliveries/', data),
  get: (id) => api.get(`/delivery/deliveries/${id}/`),
  assignCourier: (id, data) => api.post(`/delivery/deliveries/${id}/assign_courier/`, data),
  updateStatus: (id, data) => api.post(`/delivery/deliveries/${id}/update_status/`, data),
  updateLocation: (id, data) => api.post(`/delivery/deliveries/${id}/update_location/`, data),
}

export const inventoryAPI = {
  list: (params) => api.get('/inventory/inventory/', { params }),
  lowStock: () => api.get('/inventory/inventory/low_stock/'),
  expiringSoon: () => api.get('/inventory/inventory/expiring_soon/'),
}

export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard/'),
  list: (params) => api.get('/reports/reports/', { params }),
  generate: (data) => api.post('/reports/reports/generate/', data, { responseType: 'blob' }),
}

export const notificationsAPI = {
  list: (params) => api.get('/notifications/notifications/', { params }),
  unreadCount: () => api.get('/notifications/notifications/unread-count/'),
  markRead: (id) => api.post(`/notifications/notifications/${id}/mark-read/`),
  markAllRead: () => api.post('/notifications/notifications/mark-all-read/'),
  settings: {
    get: () => api.get('/notifications/settings/'),
    update: (data) => api.patch('/notifications/settings/', data),
  },
}

export const auditLogsAPI = {
  list: (params) => api.get('/audit-logs/logs/', { params }),
  get: (id) => api.get(`/audit-logs/logs/${id}/`),
}
