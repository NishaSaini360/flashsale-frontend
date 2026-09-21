import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, devLogin } from './api/client'

const qc = new QueryClient()
const SKU = 'FLASH-1'
const PRICE = 2499

const money = (n: number) => '₹' + n.toLocaleString('en-IN')

function Stars() {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`h-3.5 w-3.5 ${i <= 4 ? 'fill-amber-400' : 'fill-gray-300'}`} viewBox="0 0 20 20">
          <path d="M10 1l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.4 4.7 17.1l1-5.8L1.5 7.2l5.9-.9z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-500">4.2 · 1,284 ratings</span>
    </div>
  )
}

function ProductImage() {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 via-sky-50 to-rose-100">
      <div className="absolute inset-0 grid place-items-center">
        <svg viewBox="0 0 200 200" className="w-2/3 drop-shadow-xl">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <rect x="45" y="30" width="110" height="150" rx="18" fill="url(#g)" />
          <rect x="57" y="44" width="86" height="112" rx="8" fill="#fff" opacity=".92" />
          <circle cx="100" cy="168" r="6" fill="#fff" opacity=".75" />
          <rect x="72" y="62" width="56" height="6" rx="3" fill="#c7d2fe" />
          <rect x="72" y="78" width="40" height="6" rx="3" fill="#e0e7ff" />
          <rect x="72" y="94" width="48" height="6" rx="3" fill="#e0e7ff" />
        </svg>
      </div>
      <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        Flash sale
      </span>
    </div>
  )
}

function CartTimer({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    const t = new Date(expiresAt).getTime()
    const tick = () => setLeft(Math.max(0, Math.round((t - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [expiresAt])
  const urgent = left < 60
  return (
    <span className={`font-semibold tabular-nums ${urgent ? 'text-rose-600' : 'text-gray-900'}`}>
      {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
    </span>
  )
}

function Shop() {
  const client = useQueryClient()
  const [tenant, setTenant] = useState('tenant-a')
  const [ready, setReady] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    setReady(false)
    devLogin(tenant).then(() => { setReady(true); client.invalidateQueries() })
  }, [tenant, client])

  const stock = useQuery({ queryKey: ['stock', tenant], queryFn: () => api.stock(SKU), refetchInterval: 1000, enabled: ready })
  const reservation = useQuery({ queryKey: ['res', reservationId], queryFn: () => api.getReservation(reservationId!), refetchInterval: 1000, enabled: !!reservationId })
  const order = useQuery({ queryKey: ['ord', orderId], queryFn: () => api.getOrder(orderId!), refetchInterval: 1000, enabled: !!orderId })

  const addToCart = useMutation({
    mutationFn: () => api.reserve(SKU, qty, crypto.randomUUID()),
    onSuccess: r => { setReservationId(r.reservationId); setOrderId(null) },
  })

  const placeOrder = useMutation({
    mutationFn: () => api.createOrder(reservationId!),
    onSuccess: o => setOrderId(o.orderId),
  })

  const available = stock.data?.available ?? 0
  const soldOut = ready && available === 0
  const low = available > 0 && available <= 20
  const inCart = reservation.data?.status === 'ACTIVE'
  const res = reservation.data

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
          <span className="text-lg font-bold tracking-tight">kart<span className="text-indigo-600">ly</span></span>
          <div className="hidden flex-1 md:block">
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
              </svg>
              <span className="text-sm text-gray-400">Search for products</span>
            </div>
          </div>
          <select
            value={tenant}
            onChange={e => { setTenant(e.target.value); setReservationId(null); setOrderId(null) }}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600"
          >
            <option value="tenant-a">Store: North</option>
            <option value="tenant-b">Store: South</option>
          </select>
          <div className="relative">
            <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M3 3h2l2.4 12h10.2L20 7H6" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
            </svg>
            {inCart && (
              <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {res!.qty}
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-5 text-xs text-gray-400">Home / Electronics / Limited Edition Widget</p>

        <div className="grid gap-10 lg:grid-cols-2">
          <ProductImage />

          <div>
            <h1 className="text-2xl font-semibold leading-snug">
              Limited Edition Widget — Titanium Series
            </h1>
            <div className="mt-2"><Stars /></div>

            <div className="mt-5 flex items-end gap-3">
              <span className="text-3xl font-bold">{money(PRICE)}</span>
              <span className="text-base text-gray-400 line-through">{money(3999)}</span>
              <span className="mb-1 text-sm font-semibold text-emerald-600">38% off</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Inclusive of all taxes</p>

            <div className="mt-5">
              {!ready && <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />}
              {soldOut && <p className="text-sm font-semibold text-rose-600">Out of stock</p>}
              {low && <p className="text-sm font-semibold text-rose-600">Hurry — only {available} left!</p>}
              {ready && available > 20 && <p className="text-sm font-medium text-emerald-600">In stock</p>}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-gray-300">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-50">−</button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(10, q + 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-50">+</button>
              </div>
              <button
                onClick={() => addToCart.mutate()}
                disabled={!ready || soldOut || addToCart.isPending || inCart}
                className="flex-1 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400"
              >
                {addToCart.isPending ? 'Adding…' : inCart ? 'In cart' : soldOut ? 'Out of stock' : 'Add to cart'}
              </button>
            </div>
            {addToCart.isError && (
              <p className="mt-2 text-sm text-rose-600">Couldn't reserve — stock ran out. Try a smaller quantity.</p>
            )}

            <div className="mt-8 space-y-3 border-t border-gray-200 pt-6 text-sm text-gray-600">
              {[
                ['Free delivery by tomorrow', 'M3 7h11v8H3zM14 10h4l3 3v2h-7'],
                ['7-day replacement policy', 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5'],
                ['1 year warranty', 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
              ].map(([label, d]) => (
                <div key={label} className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d={d} /></svg>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {res && res.status === 'ACTIVE' && !order.data && (
          <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">
                  {res.qty} item{res.qty > 1 ? 's' : ''} reserved in your cart
                </p>
                <p className="mt-0.5 text-sm text-gray-600">
                  We're holding this for you — expires in <CartTimer expiresAt={res.expiresAt} />
                </p>
              </div>
              <button
                onClick={() => placeOrder.mutate()}
                disabled={placeOrder.isPending}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {placeOrder.isPending ? 'Processing…' : `Place order · ${money(PRICE * res.qty)}`}
              </button>
            </div>
          </div>
        )}

        {res?.status === 'EXPIRED' && !order.data && (
          <div className="mt-10 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
            Your cart hold expired and the item went back on sale. Add it again if it's still available.
          </div>
        )}

        {order.data && (
          <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
            {order.data.status === 'PENDING_PAYMENT' && (
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
                <div>
                  <p className="text-sm font-semibold">Confirming your payment</p>
                  <p className="text-sm text-gray-500">This usually takes a few seconds. Don't refresh.</p>
                </div>
              </div>
            )}
            {order.data.status === 'CONFIRMED' && (
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 12l6 6L20 6" /></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold">Order confirmed</p>
                  <p className="mt-0.5 text-sm text-gray-600">Arriving by tomorrow. We'll email your invoice.</p>
                  <p className="mt-2 font-mono text-xs text-gray-400">#{order.data.orderId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            )}
            {order.data.status.startsWith('CANCELLED') && (
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-100">
                  <svg className="h-4 w-4 text-rose-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold">Order couldn't be completed</p>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {order.data.status === 'CANCELLED_REFUNDED'
                      ? 'Payment arrived after the hold expired and the item sold out. Your money has been refunded.'
                      : 'Payment was declined. Nothing has been charged.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white py-8">
        <p className="text-center text-xs text-gray-400">
          Demo storefront · three Spring Boot services · holds expire server-side
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return <QueryClientProvider client={qc}><Shop /></QueryClientProvider>
}
