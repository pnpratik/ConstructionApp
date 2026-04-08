import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';

const API_BASE = 'http://localhost:5001';

export default function QRLabel() {
  const { id } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get(`/deliveries/${id}`)
      .then(r => setDelivery(r.data.delivery))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && delivery) {
      // Auto-trigger print after content loads
      setTimeout(() => window.print(), 600);
    }
  }, [loading, delivery]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!delivery) return <div className="text-center p-10 text-gray-500">Delivery not found</div>;

  const order   = delivery.order || {};
  const items   = order.items   || [];

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .label-card { page-break-inside: avoid; }
        }
        body { font-family: Arial, sans-serif; background: #f1f5f9; }
      `}</style>

      {/* Screen top bar */}
      <div className="no-print bg-gray-800 text-white p-4 flex justify-between items-center">
        <span className="font-medium">📦 QR Label — {order.orderNumber}</span>
        <button onClick={() => window.print()} className="bg-white text-gray-800 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100">
          🖨️ Print Label
        </button>
      </div>

      {/* Label — prints as A5 / label size */}
      <div className="flex justify-center p-8">
        <div className="label-card bg-white border-2 border-gray-800 rounded-xl p-6 w-80 shadow-lg">
          {/* Header */}
          <div className="bg-blue-700 text-white rounded-lg px-4 py-2 mb-4 text-center">
            <p className="text-lg font-bold tracking-wide">NIRMAAN</p>
            <p className="text-xs opacity-80">Material Delivery Tag</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <img
              src={`${API_BASE}/api/deliveries/${id}/qr`}
              alt="QR Code"
              className="w-40 h-40 border border-gray-200 rounded-lg p-1"
            />
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm border-t border-gray-200 pt-3">
            <Row label="Order #"   value={order.orderNumber || '—'} bold />
            <Row label="Project"   value={order.project?.name || '—'} />
            <Row label="Vendor"    value={order.vendor?.name  || '—'} />
            <Row label="Challan #" value={delivery.challanNumber || '—'} />
            <Row label="Delivered" value={new Date(delivery.deliveredAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })} />
            <Row label="Received by" value={delivery.uploadedBy?.name || '—'} />
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Materials</p>
              {items.slice(0, 5).map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-700 py-0.5">
                  <span className="truncate pr-2">{item.materialName}</span>
                  <span className="font-medium shrink-0">{item.quantity} {item.unit}</span>
                </div>
              ))}
              {items.length > 5 && <p className="text-xs text-gray-400 mt-1">+{items.length - 5} more items</p>}
            </div>
          )}

          {/* CCTV Snapshot */}
          {delivery.storeSnapshot?.success && delivery.storeSnapshot?.url && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">📷 Store Snapshot ({delivery.storeSnapshot.storeName})</p>
              <img src={`${API_BASE}${delivery.storeSnapshot.url}`} alt="Store" className="w-full h-24 object-cover rounded-lg" />
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 text-center text-xs text-gray-400">
            Scan QR for full delivery details
          </div>
        </div>
      </div>
    </>
  );
}

const Row = ({ label, value, bold }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className={`text-right max-w-[60%] truncate ${bold ? 'font-bold text-gray-800' : 'text-gray-700'}`}>{value}</span>
  </div>
);
