import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query'
import { api, devLogin } from './api/client'

const qc = new QueryClient()
const SKU = 'FLASH-1'

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    const target = new Date(expiresAt).getTime()
    const tick = () => setLeft(Math.max(0, Math.round((target - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [expiresAt])
  return <p className="text-sm text-gray-600">expires in {left}s</p>
}

function Shop() {
  const [tenant, setTenant] = useState('tenant-a')
  const [ready, setReady] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    setReady(false)
    devLogin(tenant).then(() => setReady(true))
  }, [tenant])

  const stock = useQuery({
    queryKey: ['stock', SKU, tenant],
    queryFn: () => api.stock(SKU),
    refetchInterval: 1000,
    enabled: ready,
  })

  const reservation = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: () => api.getReservation(reservationId!),
    refetchInterval: 1000,
    enabled: !!reservationId,
  })

  const order = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.getOrder(orderId!),
    refetchInterval: 1000,
    enabled: !!orderId,
  })

  const reserve = useMutation({
    mutationFn: () => api.reserve(SKU, 1, crypto.randomUUID()),
    onSuccess: r => setReservationId(r.reservationId),
  })

  const checkout = useMutation({
    mutationFn: () => api.createOrder(reservationId!),
    onSuccess: o => setOrderId(o.orderId),
  })

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <div className="flex gap-2">
        {['tenant-a', 'tenant-b'].map(t => (
          <button
            key={t}
            onClick={() => { setTenant(t); setReservationId(null); setOrderId(null) }}
            className={`px-3 py-1 rounded border ${tenant === t ? 'bg-black text-white' : 'bg-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="border rounded p-6">
        <h1 className="text-2xl font-semibold">{SKU}</h1>
        {stock.isLoading && <p>loading…</p>}
        {stock.data && (
          <>
            <p className="text-4xl font-bold mt-2">{stock.data.available} left</p>
            <p className="text-sm text-gray-500">{stock.data.reserved} held in other carts</p>
          </>
        )}
        <button
          onClick={() => reserve.mutate()}
          disabled={!ready || reserve.isPending}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Reserve 1
        </button>
        {reserve.isError && <p className="text-red-600 text-sm mt-2">Sold out or failed</p>}
      </div>

      {reservation.data && (
        <div className="border rounded p-6">
          <p>Reservation <b>{reservation.data.status}</b></p>
          <Countdown expiresAt={reservation.data.expiresAt} />
          <button
            onClick={() => checkout.mutate()}
            disabled={reservation.data.status !== 'ACTIVE'}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Pay
          </button>
        </div>
      )}

      {order.data && (
        <div className="border rounded p-6">
          <p>Order <b>{order.data.status}</b></p>
          {order.data.status === 'PENDING_PAYMENT' && <p className="text-sm">waiting for gateway…</p>}
          {order.data.failureReason && <p className="text-sm text-red-600">{order.data.failureReason}</p>}
        </div>
      )}
    </div>
  )
}

export default function App() {
  return <QueryClientProvider client={qc}><Shop /></QueryClientProvider>
}
