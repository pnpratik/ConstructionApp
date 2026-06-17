import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle, Clock, Upload, Camera, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

const API_BASE = '';

const SnapshotBadge = ({ snap }) => {
  const [preview, setPreview] = useState(false);
  if (!snap) return <span className="text-xs text-gray-300">—</span>;
  if (!snap.success) return (
    <span className="flex items-center gap-1 text-xs text-gray-400" title={snap.error || 'No camera'}>
      <Camera size={10} className="text-gray-300" /> No snapshot
    </span>
  );
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setPreview(true)}
        onMouseLeave={() => setPreview(false)}
        className="flex items-center gap-1 text-xs text-green-600 font-medium hover:underline"
      >
        <Camera size={10} /> {snap.storeName || 'Store'} 📷
      </button>
      {preview && snap.url && (
        <div className="absolute bottom-6 left-0 z-50 shadow-xl rounded-lg overflow-hidden border border-gray-200 bg-white w-48">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 truncate">{snap.storeName}</div>
          <img src={`${API_BASE}${snap.url}`} alt="Store snapshot" className="w-full h-32 object-cover" />
        </div>
      )}
    </div>
  );
};

export default function DeliveryList() {
  const [deliveries,    setDeliveries]    = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/deliveries'),
      api.get('/orders?status=dispatched'),
    ]).then(([d, o]) => {
      setDeliveries(d.data.deliveries || []);
      setPendingOrders(o.data.orders  || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Deliveries</h1>
        <p className="text-sm text-gray-500">Track all deliveries · CCTV snapshots auto-captured on challan upload</p>
      </div>

      {/* Awaiting confirmation */}
      {pendingOrders.length > 0 && (
        <div className="card border-orange-200 bg-orange-50">
          <h3 className="font-semibold text-orange-800 mb-4 flex items-center gap-2 text-sm md:text-base">
            <Clock size={16} /> Awaiting Delivery Confirmation ({pendingOrders.length})
          </h3>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <div key={order._id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-lg p-3 md:p-4 border border-orange-100 gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 truncate">{order.project?.name} | {order.vendor?.name || 'No vendor'}</p>
                  {order.dispatchDetails && (
                    <p className="text-xs text-gray-400 mt-1">🚛 {order.dispatchDetails.driverName} · {order.dispatchDetails.vehicleNumber}</p>
                  )}
                </div>
                <Link to={`/deliveries/${order._id}/upload`} className="btn-primary text-sm flex-shrink-0 self-start sm:self-auto">
                  <Upload size={14} /> Upload Challan
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Records */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm md:text-base">
          Delivery Records
          <span className="text-xs font-normal text-gray-400 flex items-center gap-1 ml-1">
            <Camera size={12} /> CCTV auto-snapshot attached
          </span>
        </h3>

        {deliveries.length === 0 ? (
          <div className="text-center py-12">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No delivery records yet</p>
          </div>
        ) : (
          <>
            {/* ── Mobile card list (hidden md+) ── */}
            <div className="space-y-3 md:hidden">
              {deliveries.map(d => (
                <div key={d._id} className="border border-gray-100 rounded-xl p-3 bg-white hover:shadow-sm transition-shadow">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <Link to={`/orders/${d.order?._id}`} className="font-bold text-blue-600 text-sm hover:underline">
                        {d.order?.orderNumber}
                      </Link>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{d.order?.project?.name || '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{d.order?.vendor?.name || '—'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {d.isConfirmed
                        ? <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10}/>Confirmed</span>
                        : <span className="badge bg-yellow-100 text-yellow-700">Pending Sign</span>}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                    {d.challanNumber && (
                      <span><span className="text-gray-400">Challan:</span> {d.challanNumber}</span>
                    )}
                    <span>
                      {new Date(d.deliveredAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* CCTV snapshot */}
                  <div className="mb-2">
                    <SnapshotBadge snap={d.storeSnapshot} />
                  </div>

                  {/* Proof links */}
                  <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-50">
                    {d.challanFile && <a href={`${API_BASE}${d.challanFile}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">📄 Challan</a>}
                    {(d.photos||[]).length > 0 && <a href={`${API_BASE}${d.photos[0]}`} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline">🖼️ Photo</a>}
                    {d.storeSnapshot?.success && d.storeSnapshot?.url && <a href={`${API_BASE}${d.storeSnapshot.url}`} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline">📷 CCTV</a>}
                    {!d.isConfirmed && <Link to={`/deliveries/${d.order?._id}/upload`} className="text-xs text-orange-600 hover:underline">✍️ Sign</Link>}
                    <Link to={`/deliveries/${d._id}/qr-label`} target="_blank" className="text-xs text-purple-600 hover:underline">🔲 QR Tag</Link>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop table (hidden below md) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header">Order #</th>
                    <th className="table-header">Project / Vendor</th>
                    <th className="table-header">Challan #</th>
                    <th className="table-header">Delivered</th>
                    <th className="table-header">📷 CCTV Snapshot</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Proofs</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map(d => (
                    <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="table-cell">
                        <Link to={`/orders/${d.order?._id}`} className="text-blue-600 hover:underline font-medium">{d.order?.orderNumber}</Link>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm text-gray-700">{d.order?.project?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{d.order?.vendor?.name || '—'}</p>
                      </td>
                      <td className="table-cell text-gray-600">{d.challanNumber || '—'}</td>
                      <td className="table-cell text-gray-400 text-xs">
                        {new Date(d.deliveredAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td className="table-cell"><SnapshotBadge snap={d.storeSnapshot} /></td>
                      <td className="table-cell">
                        {d.isConfirmed
                          ? <span className="badge bg-green-100 text-green-700 flex items-center gap-1 w-fit"><CheckCircle size={10}/>Confirmed</span>
                          : <span className="badge bg-yellow-100 text-yellow-700 w-fit">Pending Sign</span>}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 flex-wrap">
                          {d.challanFile && <a href={`${API_BASE}${d.challanFile}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">📄 Challan</a>}
                          {(d.photos||[]).length>0 && <a href={`${API_BASE}${d.photos[0]}`} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline">🖼️ Photo</a>}
                          {d.storeSnapshot?.success && d.storeSnapshot?.url && <a href={`${API_BASE}${d.storeSnapshot.url}`} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline">📷 CCTV</a>}
                          {!d.isConfirmed && <Link to={`/deliveries/${d.order?._id}/upload`} className="text-xs text-orange-600 hover:underline">✍️ Sign</Link>}
                          <Link to={`/deliveries/${d._id}/qr-label`} target="_blank" className="text-xs text-purple-600 hover:underline">🔲 QR Tag</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
