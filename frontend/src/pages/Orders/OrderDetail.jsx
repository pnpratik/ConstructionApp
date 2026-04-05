import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Truck, Package, Send, Clock } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const WORKFLOW_STEPS = [
  { key: 'pending_approval', label: 'Submitted', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'sent_to_vendor', label: 'Sent to Vendor', icon: Send },
  { key: 'accepted_by_vendor', label: 'Vendor Accepted', icon: Package },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];
const STATUS_ORDER = ['draft', 'pending_approval', 'approved', 'sent_to_vendor', 'accepted_by_vendor', 'dispatched', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canApprove, isVendor, isDeliveryOp, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = () => {
    Promise.all([api.get(`/orders/${id}`), api.get('/vendors')]).then(([o, v]) => {
      setOrder(o.data.order);
      setVendors(v.data.vendors || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const currentStep = STATUS_ORDER.indexOf(order?.status);

  const action = async (endpoint, data, successMsg) => {
    try {
      await api.put(`/orders/${id}/${endpoint}`, data);
      toast.success(successMsg);
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return <div className="card text-center py-16"><p className="text-gray-500">Order not found</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-gray-500 mt-1">Project: {order.project?.name} | Requested by: {order.requestedBy?.name}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {canApprove() && order.status === 'pending_approval' && (
            <>
              <button onClick={() => setModal('approve')} className="btn-success"><CheckCircle size={16} /> Approve</button>
              <button onClick={() => setModal('reject')} className="btn-danger"><XCircle size={16} /> Reject</button>
            </>
          )}
          {canApprove() && order.status === 'approved' && (
            <button onClick={() => setModal('sendVendor')} className="btn-primary"><Send size={16} /> Send to Vendor</button>
          )}
          {(isVendor() || canApprove()) && order.status === 'sent_to_vendor' && (
            <>
              <button onClick={() => action('vendor-accept', {}, 'Order accepted!')} className="btn-success">✅ Accept Order</button>
              <button onClick={() => setModal('vendorReject')} className="btn-danger">❌ Reject Order</button>
            </>
          )}
          {(isVendor() || canApprove()) && order.status === 'accepted_by_vendor' && (
            <button onClick={() => setModal('dispatch')} className="btn-primary"><Truck size={16} /> Add Dispatch Details</button>
          )}
          {order.status === 'dispatched' && (
            <Link to={`/deliveries/${id}/upload`} className="btn-success"><Package size={16} /> Upload Delivery Challan</Link>
          )}
        </div>
      </div>

      {/* Workflow progress */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-6">Order Progress</h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 -z-0" />
          {WORKFLOW_STEPS.map((step, i) => {
            const stepIdx = STATUS_ORDER.indexOf(step.key);
            const done = currentStep >= stepIdx;
            const active = currentStep === stepIdx;
            const isRejected = order.status === 'rejected' || order.status === 'rejected_by_vendor';
            return (
              <div key={step.key} className="flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                  ${done ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-300'}
                  ${active ? 'ring-4 ring-blue-100' : ''}`}>
                  <step.icon size={14} />
                </div>
                <p className={`text-xs mt-2 font-medium ${done ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</p>
              </div>
            );
          })}
        </div>
        {(order.status === 'rejected' || order.status === 'rejected_by_vendor') && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-red-700 text-sm font-medium">
              {order.status === 'rejected' ? `Rejected by approver: ${order.rejectionDetails?.reason || 'No reason'}` : `Rejected by vendor: ${order.vendorRemarks || 'No reason'}`}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
          <table className="w-full">
            <thead><tr className="border-b border-gray-100"><th className="table-header">Material</th><th className="table-header">Category</th><th className="table-header text-right">Qty</th><th className="table-header">Unit</th><th className="table-header text-right">Est. Cost</th></tr></thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="table-cell font-medium">{item.materialName}</td>
                  <td className="table-cell text-gray-500 capitalize">{item.category?.replace(/_/g, ' ') || '-'}</td>
                  <td className="table-cell text-right">{item.quantity?.toLocaleString()}</td>
                  <td className="table-cell text-gray-500">{item.unit}</td>
                  <td className="table-cell text-right">{item.estimatedCost ? `₹${item.estimatedCost?.toLocaleString('en-IN')}` : '-'}</td>
                </tr>
              ))}
            </tbody>
            {order.totalEstimatedCost > 0 && (
              <tfoot><tr><td colSpan={4} className="table-cell text-right font-semibold text-gray-700">Total</td><td className="table-cell text-right font-bold text-gray-900">₹{order.totalEstimatedCost?.toLocaleString('en-IN')}</td></tr></tfoot>
            )}
          </table>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-800">Order Info</h3>
            {[
              { label: 'Priority', value: <span className={`badge ${order.priority === 'urgent' ? 'bg-red-100 text-red-700' : order.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{order.priority}</span> },
              { label: 'Vendor', value: order.vendor?.name || 'Not assigned' },
              { label: 'Required By', value: order.requiredByDate ? new Date(order.requiredByDate).toLocaleDateString() : '-' },
              { label: 'Created', value: new Date(order.createdAt).toLocaleDateString() },
              { label: 'Remarks', value: order.remarks || '-' },
            ].map(i => (
              <div key={i.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{i.label}</span>
                <span className="font-medium text-gray-800 text-right max-w-40">{i.value}</span>
              </div>
            ))}
          </div>

          {order.approvalDetails?.approvedBy && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Approval Details</h3>
              <p className="text-sm text-gray-600">Approved by: <strong>{order.approvalDetails.approvedBy?.name}</strong></p>
              <p className="text-sm text-gray-400">{new Date(order.approvalDetails.approvedAt).toLocaleString()}</p>
              {order.approvalDetails.remarks && <p className="text-sm text-gray-500 mt-1">{order.approvalDetails.remarks}</p>}
            </div>
          )}

          {order.dispatchDetails?.driverName && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Dispatch Details</h3>
              {[
                { l: 'Driver', v: order.dispatchDetails.driverName },
                { l: 'Phone', v: order.dispatchDetails.driverPhone },
                { l: 'Vehicle', v: order.dispatchDetails.vehicleNumber },
                { l: 'Dispatch Date', v: new Date(order.dispatchDetails.dispatchDate).toLocaleDateString() },
              ].map(i => (
                <div key={i.l} className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">{i.l}</span><span className="font-medium">{i.v}</span>
                </div>
              ))}
            </div>
          )}

          {order.deliveryDetails?.challanFile && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Delivery Details</h3>
              <a href={order.deliveryDetails.challanFile} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">📄 View Challan</a>
              {order.deliveryDetails.photos?.map((p, i) => (
                <a key={i} href={p} target="_blank" rel="noreferrer" className="block text-blue-600 text-sm hover:underline mt-1">🖼️ Photo {i + 1}</a>
              ))}
              {order.deliveryDetails.isConfirmed ? (
                <div className="mt-2 flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={14} />Confirmed by engineer</div>
              ) : (
                <Link to={`/deliveries/${id}/upload`} className="btn-primary text-xs mt-2 w-full justify-center">Sign & Confirm Delivery</Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={modal === 'approve'} onClose={() => setModal(null)} title="Approve Order">
        <div className="space-y-4">
          <p className="text-gray-600">Approve order <strong>{order.orderNumber}</strong>?</p>
          <div><label className="label">Remarks (optional)</label><textarea className="input" rows={3} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => action('approve', { remarks: form.remarks }, 'Order approved!')} className="btn-success">Approve Order</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === 'reject'} onClose={() => setModal(null)} title="Reject Order">
        <div className="space-y-4">
          <div><label className="label">Rejection Reason *</label><textarea className="input" rows={3} placeholder="Reason for rejection..." onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => action('reject', { reason: form.reason }, 'Order rejected')} className="btn-danger">Reject Order</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === 'sendVendor'} onClose={() => setModal(null)} title="Send to Vendor">
        <div className="space-y-4">
          <div><label className="label">Select Vendor *</label>
            <select className="input" value={form.vendorId || ''} onChange={e => setForm({ ...form, vendorId: e.target.value })}>
              <option value="">Select vendor...</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name} — {v.phone}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => action('send-to-vendor', { vendorId: form.vendorId }, 'Order sent to vendor!')} className="btn-primary"><Send size={14} />Send</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === 'dispatch'} onClose={() => setModal(null)} title="Add Dispatch Details" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Driver Name *</label><input className="input" onChange={e => setForm({ ...form, driverName: e.target.value })} /></div>
            <div><label className="label">Driver Phone *</label><input className="input" onChange={e => setForm({ ...form, driverPhone: e.target.value })} /></div>
            <div><label className="label">Vehicle Number *</label><input className="input" placeholder="e.g. GJ01 AB 1234" onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} /></div>
            <div><label className="label">Dispatch Date</label><input type="date" className="input" onChange={e => setForm({ ...form, dispatchDate: e.target.value })} /></div>
            <div className="col-span-2"><label className="label">Estimated Arrival Date</label><input type="date" className="input" onChange={e => setForm({ ...form, estimatedArrival: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => action('dispatch', form, 'Order dispatched!')} className="btn-primary"><Truck size={14} />Confirm Dispatch</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === 'vendorReject'} onClose={() => setModal(null)} title="Reject Order">
        <div className="space-y-4">
          <div><label className="label">Reason *</label><textarea className="input" rows={3} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => action('vendor-reject', { remarks: form.remarks }, 'Order rejected')} className="btn-danger">Reject</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
