import React from 'react';

const statusConfig = {
  // Order statuses
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  pending_approval: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  sent_to_vendor: { label: 'Sent to Vendor', className: 'bg-blue-100 text-blue-700' },
  accepted_by_vendor: { label: 'Vendor Accepted', className: 'bg-teal-100 text-teal-700' },
  rejected_by_vendor: { label: 'Vendor Rejected', className: 'bg-red-100 text-red-700' },
  dispatched: { label: 'Dispatched', className: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
  // Project statuses
  planning: { label: 'Planning', className: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600' },
  on_hold: { label: 'On Hold', className: 'bg-orange-100 text-orange-700' },
  // Drawing statuses
  uploaded: { label: 'Uploaded', className: 'bg-gray-100 text-gray-600' },
  analyzed: { label: 'Analyzed', className: 'bg-blue-100 text-blue-700' },
  // Priority
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`badge ${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      {config.label}
    </span>
  );
}
