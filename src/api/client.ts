import axios from 'axios'

const token = () => localStorage.getItem('jwt') ?? ''

function make(prefix: string) {
  const c = axios.create({ baseURL: prefix })
  c.interceptors.request.use(cfg => {
    cfg.headers.Authorization = `Bearer ${token()}`
    return cfg
  })
  return c
}

const inventory = make('/inv')
const reservations = make('/res')
const orders = make('/ord')

export type Stock = { sku: string; onHand: number; reserved: number; available: number }
export type Reservation = { reservationId: string; sku: string; qty: number; status: string; expiresAt: string }
export type Order = { orderId: string; sku: string; qty: number; status: string; failureReason?: string }

export const api = {
  stock: (sku: string) => inventory.get<Stock>(`/api/v1/stock/${sku}`).then(r => r.data),
  reserve: (sku: string, qty: number, idemKey: string) =>
    reservations.post<Reservation>('/api/v1/reservations', { sku, qty },
      { headers: { 'Idempotency-Key': idemKey } }).then(r => r.data),
  getReservation: (id: string) =>
    reservations.get<Reservation>(`/api/v1/reservations/${id}`).then(r => r.data),
  createOrder: (reservationId: string) =>
    orders.post<Order>('/api/v1/orders', { reservationId }).then(r => r.data),
  getOrder: (id: string) => orders.get<Order>(`/api/v1/orders/${id}`).then(r => r.data),
}

export async function devLogin(tenant: string, role: 'USER' | 'ADMIN' = 'USER') {
  const res = await fetch(`/inv/actuator/devtoken?tenant=${tenant}&role=${role}`)
  const jwt = (await res.text()).trim()
  localStorage.setItem('jwt', jwt)
  return jwt
}
