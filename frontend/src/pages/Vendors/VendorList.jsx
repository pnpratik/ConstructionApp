import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Phone, Mail, Truck, Search } from 'lucide-react';
import api from '../../api/axios';

const CATEGORY_LABELS = {
  steel: '🔩 Steel', brick_block: '🧱 Brick & Block', concrete_rmc: '🏗️ Concrete/RMC',
  cement: '🪨 Cement', plumbing_pipes_fittings: '🔧 Plumbing', bath_fittings_ceramic: '🚿 Bath Fittings & Ceramic',
  electrical_cables: '⚡ Electrical Cables', electrical_accessories: '🔌 Elec. Accessories',
  tiles_ceramic: '🟦 Tiles & Ceramic', acp_panels: '🏢 ACP Panels',
  aluminium_glass: '🪟 Aluminium & Glass', doors_locks: '🚪 Doors & Locks',
  paint_chemicals: '🎨 Paint & Chemicals', other: '📦 Other'
};

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/vendors').then(r => setVendors(r.data.vendors || [])).finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase()) ||
    v.phone?.includes(search)
  );

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Vendors</h1><p className="text-gray-500">{vendors.length} vendors registered</p></div>
        <Link to="/vendors/new" className="btn-primary"><Plus size={16} /> Add Vendor</Link>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9 max-w-sm" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16"><Truck size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No vendors found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(vendor => (
            <div key={vendor._id} className="card hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 font-bold">
                  {vendor.name?.[0]?.toUpperCase()}
                </div>
                <span className={`badge ${vendor.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{vendor.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <h3 className="font-semibold text-gray-800">{vendor.name}</h3>
              {vendor.contactPerson && <p className="text-xs text-gray-400 mt-1">Contact: {vendor.contactPerson}</p>}
              <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Phone size={12} className="text-gray-400" />{vendor.phone}</div>
                <div className="flex items-center gap-2"><Mail size={12} className="text-gray-400 flex-shrink-0" /><span className="truncate">{vendor.email}</span></div>
                {vendor.gst && <div className="text-xs text-gray-400">GST: {vendor.gst}</div>}
              </div>
              {vendor.materialCategories?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400 mb-2">Supplies:</p>
                  <div className="flex flex-wrap gap-1">
                    {vendor.materialCategories.slice(0, 3).map(cat => (
                      <span key={cat} className="badge bg-blue-50 text-blue-600 text-xs">{CATEGORY_LABELS[cat] || cat}</span>
                    ))}
                    {vendor.materialCategories.length > 3 && <span className="badge bg-gray-100 text-gray-500 text-xs">+{vendor.materialCategories.length - 3} more</span>}
                  </div>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <Link to={`/vendors/${vendor._id}/edit`} className="btn-secondary text-xs flex-1 justify-center">Edit</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
