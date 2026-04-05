import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle, Clock, Upload } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';

export default function DeliveryList() {
  const [deliveries, setDeliveries] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]); // dispatched but not delivered
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/deliveries'),
      api.get('/orders?status=dispatched')
    ]).then(([d, o]) => {
      setDeliveries(d.data.deliveries || []);
      setPendingOrders(o.data.orders || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Deliveries</h1><p className="text-gray-500">Track all deliveries, upload challans and confirm receipt</p></div>

      {/* Pending deliveries – orders dispatched but challan not yet uploaded */}
      {pendingOrders.length > 0 && (
        <div className="card border-orange-200 bg-orange-50">
          <h3 className="font-semibold text-orange-800 mb-4 flex items-center gap-2"><Clock size={16} /> Awaiting Delivery Confirmation ({pendingOrders.length})</h3>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <div key={order._id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-orange-100">
                <div>
                  <p className="font-semibold text-gray-800">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{order.project?.name} | Vendor: {order.vendor?.name || '-'}</p>
                  {order.dispatchDetails && (
                    <p className="text-xs text-gray-400 mt-1">🚛 {order.dispatchDetails.driverName} | {order.dispatchDetails.vehicleNumber}</p>
                  )}
                </div>
                <Link to={`/deliveries/${order._id}/upload`} className="btn-primary text-sm"><Upload size={14} /> Upload Challan</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed deliveries */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Delivery Records</h3>
        {deliveries.length === 0 ? (
          <div className="text-center py-12"><Package size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-400">No delivery records yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Order #</th>
                <th className="table-header">Project</th>
                <th className="table-header">Vendor</th>
                <th className="table-header">Challan #</th>
                <th className="table-header">Delivered At</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr></thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell"><Link to={`/orders/${d.order?._id}`} className="text-blue-600 hover:underline font-medium">{d.order?.orderNumber}</Link></td>
                    <td className="table-cell text-gray-600">{d.order?.project?.name || '-'}</td>
                    <td className="table-cell text-gray-600">{d.order?.vendor?.name || '-'}</td>
                    <td className="table-cell">{d.challanNumber || '-'}</td>
                    <td className="table-cell text-gray-400 text-xs">{new Date(d.deliveredAt).toLocaleString()}</td>
                    <td className="table-cell">
                      {d.isConfirmed
                        ? <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10} />Confirmed</span>
                        : <span className="badge bg-yellow-100 text-yellow-700">Pending Sign</span>}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        {d.challanFile && <a href={d.challanFile} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">📄 Challan</a>}
                        {!d.isConfirmed && <Link to={`/deliveries/${d.order?._id}/upload`} className="text-xs text-green-600 hover:underline">✍️ Sign</Link>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
