import { CheckCircle } from "lucide-react"
import DetailRow from "./DetailRow"
import PriceRow from "./price-row"
import type { CartItem } from "@/lib/hooks/useCart"

interface OrderSnapshot {
  orderNo: string
  placedAt: string
  deliveryAt: string
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryAddress: string
  branchName: string
  orderType: string
  payment: string
  items: CartItem[]
  subtotal: number
  discount: number
  fee: number
  tax: number
  grandTotal: number
}

export default function OrderReceipt({
  order,
  onPlaceAnother,
}: {
  order: OrderSnapshot
  onPlaceAnother: () => void
}) {
  return (
    <div className="min-h-screen bg-neutral-50 py-16 px-4">
      <div className="mx-auto max-w-[560px] space-y-4">
        {/* Success header */}
        <div className="rounded-2xl bg-green-600 px-6 py-8 text-center text-white shadow">
          <CheckCircle size={48} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Order Placed!</h1>
          <p className="mt-1 text-green-100 text-sm">
            Order #{order.orderNo}
          </p>
        </div>

        {/* Details card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3 text-sm">
          <DetailRow label="Customer" value={order.customerName} />
          <DetailRow label="Phone" value={order.customerPhone} />
          {order.customerEmail !== '—' && (
            <DetailRow label="Email" value={order.customerEmail} />
          )}
          <DetailRow label="Order Type" value={order.orderType} />
          <DetailRow label="Branch" value={order.branchName} />
          {order.deliveryAddress !== '—' && (
            <DetailRow label="Delivery Address" value={order.deliveryAddress} />
          )}
          <DetailRow label="Payment" value={order.payment.toUpperCase()} />
          <DetailRow label="Placed At" value={order.placedAt} />
          {order.deliveryAt !== '—' && (
            <DetailRow label="Estimated Delivery" value={order.deliveryAt} />
          )}
        </div>

        {/* Items */}
        <div className="rounded-2xl bg-white p-6 shadow-sm divide-y divide-neutral-100">
          <h2 className="pb-3 font-bold text-neutral-800">Items</h2>
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <span className="text-neutral-700">
                {item.quantity} × {item.name}
                {item.selectedOption ? ` (${item.selectedOption})` : ''}
              </span>
              <span className="font-semibold">
                Rs. {(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-2 text-sm">
          <PriceRow label="Subtotal" value={`Rs. ${order.subtotal.toLocaleString()}`} />
          <PriceRow label="Tax" value={`Rs. ${order.tax.toLocaleString()}`} />
          {order.fee > 0 && (
            <PriceRow label="Delivery Fee" value={`Rs. ${order.fee.toLocaleString()}`} />
          )}
          {order.discount > 0 && (
            <PriceRow
              label="Discount"
              value={`− Rs. ${order.discount.toLocaleString()}`}
              valueClass="font-semibold text-green-600"
            />
          )}
          <div className="border-t border-neutral-200 pt-3 flex items-center justify-between font-bold text-neutral-900">
            <span>Grand Total</span>
            <span>Rs. {order.grandTotal.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={onPlaceAnother}
          className="w-full rounded-xl bg-[var(--color-primary)] py-4 text-sm font-bold text-[var(--color-secondary)] hover:brightness-90 transition-colors"
        >
          Place Another Order
        </button>
      </div>
    </div>
  )
}