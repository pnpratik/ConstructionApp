import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Camera, FileText, ArrowLeft, PenTool, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function DeliveryUpload() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [challan, setChallan] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [challanNumber, setChallanNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Sign
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(r => setOrder(r.data.order));
  }, [orderId]);

  // Canvas signature
  const startDraw = (e) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  const endDraw = () => {
    setDrawing(false);
    setSignature(canvasRef.current.toDataURL());
  };
  const clearSignature = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!challan) return toast.error('Challan file is required');
    if (photos.length === 0) return toast.error('At least one delivery photo is required');

    setLoading(true);
    const formData = new FormData();
    formData.append('challan', challan);
    photos.forEach(p => formData.append('photos', p));
    formData.append('challanNumber', challanNumber);
    formData.append('remarks', remarks);

    try {
      await api.post(`/deliveries/${orderId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Delivery recorded! Please sign to confirm.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signature) return toast.error('Please provide your signature');
    setLoading(true);
    try {
      // Find delivery by order and sign it
      const deliveries = await api.get('/deliveries');
      const delivery = deliveries.data.deliveries?.find(d => d.order?._id === orderId || d.order === orderId);
      if (delivery) {
        await api.put(`/deliveries/${delivery._id}/sign`, { signature });
      }
      toast.success('Delivery confirmed and signed!');
      navigate('/deliveries');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error signing');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Delivery Confirmation</h1>
          <p className="text-gray-500">Order: {order.orderNumber} | {order.project?.name}</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-4">
        {[{ n: 1, label: 'Upload Challan & Photos' }, { n: 2, label: 'Engineer Signature' }].map(s => (
          <div key={s.n} className={`flex items-center gap-2 ${step === s.n ? 'text-blue-600' : step > s.n ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${step === s.n ? 'bg-blue-600 text-white' : step > s.n ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className="text-sm font-medium">{s.label}</span>
            {s.n < 2 && <div className="w-8 h-0.5 bg-gray-200 ml-2" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={handleUpload} className="card space-y-5">
          <div className="p-4 bg-blue-50 rounded-xl">
            <h3 className="font-semibold text-blue-800 mb-2">Dispatch Details</h3>
            {order.dispatchDetails && (
              <div className="text-sm text-blue-700 space-y-1">
                <p>🚛 Driver: {order.dispatchDetails.driverName} | {order.dispatchDetails.driverPhone}</p>
                <p>🚗 Vehicle: {order.dispatchDetails.vehicleNumber}</p>
              </div>
            )}
          </div>

          <div>
            <label className="label">Challan Number</label>
            <input className="input" value={challanNumber} onChange={e => setChallanNumber(e.target.value)} placeholder="e.g. CHN-2025-001" />
          </div>

          <div>
            <label className="label flex items-center gap-2"><FileText size={14} />Delivery Challan * (PDF/Image)</label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${challan ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}
              onClick={() => document.getElementById('challanFile').click()}>
              {challan ? (
                <div className="flex items-center justify-center gap-2 text-green-700"><CheckCircle size={20} /><span className="font-medium">{challan.name}</span></div>
              ) : (
                <><Upload size={24} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">Click to upload challan (PDF, JPG, PNG)</p></>
              )}
            </div>
            <input id="challanFile" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setChallan(e.target.files[0])} />
          </div>

          <div>
            <label className="label flex items-center gap-2"><Camera size={14} />Delivery Photos * (min 1, max 5)</label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${photos.length > 0 ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}
              onClick={() => document.getElementById('photoFiles').click()}>
              {photos.length > 0 ? (
                <div className="text-green-700"><CheckCircle size={20} className="mx-auto mb-1" /><p className="font-medium">{photos.length} photo{photos.length > 1 ? 's' : ''} selected</p></div>
              ) : (
                <><Camera size={24} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">Click to upload delivery photos</p></>
              )}
            </div>
            <input id="photoFiles" type="file" className="hidden" accept=".jpg,.jpeg,.png" multiple onChange={e => setPhotos(Array.from(e.target.files).slice(0, 5))} />
          </div>

          <div>
            <label className="label">Remarks</label>
            <textarea className="input" rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes about this delivery..." />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={16} />}
              {loading ? 'Uploading...' : 'Upload & Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="card space-y-5">
          <div className="p-4 bg-green-50 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-green-700 font-medium">Challan & photos uploaded successfully!</p>
          </div>

          <div>
            <label className="label flex items-center gap-2"><PenTool size={14} />Digital Signature (Site Engineer)</label>
            <p className="text-xs text-gray-400 mb-3">Draw your signature below to confirm receipt of materials</p>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <canvas ref={canvasRef} width={500} height={150} className="w-full cursor-crosshair bg-white"
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} />
            </div>
            <div className="flex justify-between mt-2">
              <button type="button" onClick={clearSignature} className="text-xs text-gray-400 hover:text-gray-600">Clear signature</button>
              {signature && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10} />Signature captured</span>}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/deliveries')} className="btn-secondary">Skip (Sign later)</button>
            <button onClick={handleSign} disabled={loading || !signature} className="btn-success">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
              Confirm & Sign Delivery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
