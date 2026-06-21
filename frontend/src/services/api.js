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
  importExcel: (data) => api.post('/medicines/medicines/import_excel/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
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

export const pharmaciesAPI = {
  list: (params) => api.get('/pharmacies/pharmacies/', { params }),
  create: (data) => api.post('/pharmacies/pharmacies/', data),
  get: (id) => api.get(`/pharmacies/pharmacies/${id}/`),
  update: (id, data) => api.patch(`/pharmacies/pharmacies/${id}/`, data),
  delete: (id) => api.delete(`/pharmacies/pharmacies/${id}/`),
  register: (data) => api.post('/pharmacies/register/', data),
  login: (data) => api.post('/pharmacies/login/', data),
  approve: (id, data) => api.post(`/pharmacies/approve/${id}/`, data),
  getProfile: () => api.get('/pharmacies/profile/'),
  updateProfile: (data) => api.patch('/pharmacies/profile/', data),
}

export const ordersAPI = {
  list: (params) => api.get('/orders/orders/', { params }),
  create: (data) => api.post('/orders/orders/', data),
  get: (id) => api.get(`/orders/orders/${id}/`),
  updateStatus: (id, data) => api.post(`/orders/orders/${id}/update_status/`, data),
  receive: (id, data) => api.post(`/orders/orders/${id}/receive/`, data),
  myOrders: () => api.get('/orders/orders/my_orders/'),
  exportExcel: () => api.get('/orders/orders/export_excel/', { responseType: 'blob' }),
}

export const deliveryAPI = {
  list: (params) => api.get('/delivery/deliveries/', { params }),
  create: (data) => api.post('/delivery/deliveries/', data),
  get: (id) => api.get(`/delivery/deliveries/${id}/`),
  assignCourier: (id, data) => api.post(`/delivery/deliveries/${id}/assign_courier/`, data),
  updateStatus: (id, data) => api.post(`/delivery/deliveries/${id}/update_status/`, data),
  updateLocation: (id, data) => api.post(`/delivery/deliveries/${id}/update_location/`, data),
  exportExcel: () => api.get('/delivery/deliveries/export_excel/', { responseType: 'blob' }),
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

export const tasksAPI = {
  list: (params) => api.get('/tasks/tasks/', { params }),
  create: (data) => api.post('/tasks/tasks/', data),
  get: (id) => api.get(`/tasks/tasks/${id}/`),
  update: (id, data) => api.patch(`/tasks/tasks/${id}/`, data),
  delete: (id) => api.delete(`/tasks/tasks/${id}/`),
  myTasks: (params) => api.get('/tasks/tasks/my_tasks/', { params }),
  start: (id) => api.post(`/tasks/tasks/${id}/start/`),
  complete: (id) => api.post(`/tasks/tasks/${id}/complete/`),
  cancel: (id) => api.post(`/tasks/tasks/${id}/cancel/`),
  comment: (id, data) => api.post(`/tasks/tasks/${id}/comment/`, data),
  upload: (id, data) => api.post(`/tasks/tasks/${id}/upload/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  stats: () => api.get('/tasks/tasks/stats/'),
}

export const attendanceAPI = {
  shifts: {
    list: (params) => api.get('/attendance/shifts/', { params }),
    create: (data) => api.post('/attendance/shifts/', data),
    update: (id, data) => api.patch(`/attendance/shifts/${id}/`, data),
    delete: (id) => api.delete(`/attendance/shifts/${id}/`),
  },
  geofences: {
    list: (params) => api.get('/attendance/geofences/', { params }),
    create: (data) => api.post('/attendance/geofences/', data),
    update: (id, data) => api.patch(`/attendance/geofences/${id}/`, data),
    delete: (id) => api.delete(`/attendance/geofences/${id}/`),
  },
  records: {
    list: (params) => api.get('/attendance/records/', { params }),
    create: (data) => api.post('/attendance/records/', data),
    myRecords: (params) => api.get('/attendance/records/my_records/', { params }),
    checkIn: (data) => api.post('/attendance/records/check_in/', data),
    checkOut: (data) => api.post('/attendance/records/check_out/', data),
    qrScan: (data) => api.post('/attendance/records/qr_scan/', data),
  },
  sessions: {
    list: (params) => api.get('/attendance/sessions/', { params }),
    mySessions: (params) => api.get('/attendance/sessions/my_sessions/', { params }),
    today: () => api.get('/attendance/sessions/today/'),
  },
  leaves: {
    list: (params) => api.get('/attendance/leaves/', { params }),
    create: (data) => api.post('/attendance/leaves/', data),
    approve: (id) => api.post(`/attendance/leaves/${id}/approve/`),
    reject: (id) => api.post(`/attendance/leaves/${id}/reject/`),
    myLeaves: (params) => api.get('/attendance/leaves/my_leaves/', { params }),
  },
}

export const chatAPI = {
  rooms: {
    list: (params) => api.get('/chat/rooms/', { params }),
    create: (data) => api.post('/chat/rooms/', data),
    get: (id) => api.get(`/chat/rooms/${id}/`),
    delete: (id) => api.delete(`/chat/rooms/${id}/`),
    addMember: (id, data) => api.post(`/chat/rooms/${id}/add_member/`, data),
    myRooms: () => api.get('/chat/rooms/my_rooms/'),
    unreadTotal: () => api.get('/chat/rooms/unread_total/'),
  },
  messages: {
    list: (roomId, params) => api.get(`/chat/rooms/${roomId}/messages/`, { params }),
    send: (roomId, data) => api.post(`/chat/rooms/${roomId}/send/`, data),
    markRead: (roomId) => api.post(`/chat/rooms/${roomId}/mark_read/`),
  },
}

export const warehouseAPI = {
  income: {
    list: (params) => api.get('/warehouse/income/', { params }),
    create: (data) => api.post('/warehouse/income/', data),
    get: (id) => api.get(`/warehouse/income/${id}/`),
    delete: (id) => api.delete(`/warehouse/income/${id}/`),
    scan: (data) => api.post('/warehouse/income/scan/', data),
    bulk: (data) => api.post('/warehouse/income/bulk/', data),
  },
  expense: {
    list: (params) => api.get('/warehouse/expense/', { params }),
    create: (data) => api.post('/warehouse/expense/', data),
    get: (id) => api.get(`/warehouse/expense/${id}/`),
    delete: (id) => api.delete(`/warehouse/expense/${id}/`),
    scan: (data) => api.post('/warehouse/expense/scan/', data),
    bulk: (data) => api.post('/warehouse/expense/bulk/', data),
  },
  movements: {
    list: (params) => api.get('/warehouse/movements/', { params }),
  },
  bins: {
    list: (params) => api.get('/warehouse/bins/', { params }),
    create: (data) => api.post('/warehouse/bins/', data),
    get: (id) => api.get(`/warehouse/bins/${id}/`),
    update: (id, data) => api.patch(`/warehouse/bins/${id}/`, data),
    delete: (id) => api.delete(`/warehouse/bins/${id}/`),
    label: (id) => api.get(`/warehouse/bins/${id}/label/`, { responseType: 'blob' }),
    printLabels: (data) => api.post('/warehouse/bins/print_labels/', data, { responseType: 'blob' }),
  },
  zones: {
    list: (params) => api.get('/warehouse/zones/', { params }),
    create: (data) => api.post('/warehouse/zones/', data),
    update: (id, data) => api.patch(`/warehouse/zones/${id}/`, data),
    delete: (id) => api.delete(`/warehouse/zones/${id}/`),
  },
  pickWaves: {
    list: (params) => api.get('/warehouse/pick-waves/', { params }),
    create: (data) => api.post('/warehouse/pick-waves/', data),
    get: (id) => api.get(`/warehouse/pick-waves/${id}/`),
    update: (id, data) => api.patch(`/warehouse/pick-waves/${id}/`, data),
  },
  pickOrders: {
    list: (params) => api.get('/warehouse/pick-orders/', { params }),
    get: (id) => api.get(`/warehouse/pick-orders/${id}/`),
    assignPicker: (id, data) => api.post(`/warehouse/pick-orders/${id}/assign_picker/`, data),
    start: (id) => api.post(`/warehouse/pick-orders/${id}/start_picking/`),
    complete: (id) => api.post(`/warehouse/pick-orders/${id}/complete_picking/`),
    printPickList: (id) => api.get(`/warehouse/pick-orders/${id}/print_pick_list/`, { responseType: 'blob' }),
  },
}

export const rbacAPI = {
  roles: {
    list: (params) => api.get('/rbac/roles/', { params }),
    create: (data) => api.post('/rbac/roles/', data),
    get: (id) => api.get(`/rbac/roles/${id}/`),
    update: (id, data) => api.patch(`/rbac/roles/${id}/`, data),
    delete: (id) => api.delete(`/rbac/roles/${id}/`),
  },
  permissions: {
    list: (params) => api.get('/rbac/permissions/', { params }),
  },
}

export const adminDashboardAPI = {
  get: () => api.get('/reports/admin-dashboard/'),
}
