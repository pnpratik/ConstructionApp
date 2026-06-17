import React from 'react';

const statusConfig = {
  // Order statuses
  draft:               { label: 'Draft',           className: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  pending_approval:    { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  approved:            { label: 'Approved',         className: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  rejected:            { label: 'Rejected',         className: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
  sent_to_vendor:      { label: 'Sent to Vendor',   className: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  accepted_by_vendor:  { label: 'Vendor Accepted',  className: 'bg-teal-100 text-teal-700',    dot: 'bg-teal-500' },
  rejected_by_vendor:  { label: 'Vendor Rejected',  className: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
  dispatched:          { label: 'Dispatched',       className: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  delivered:           { label: 'Delivered',        className: 'bg-green-100 text-green-800',  dot: 'bg-green-600' },
  // Project statuses
  planning:            { label: 'Planning',         className: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400' },
  active:              { label: 'Active',           className: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  completed:           { label: 'Completed',        className: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  on_hold:             { label: 'On Hold',          className: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  // Drawing statuses
  uploaded:            { label: 'Uploaded',         className: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  analyzed:            { label: 'Analyzed',         className: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400' },
  // Priority
  low:                 { label: 'Low',              className: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  medium:              { label: 'Medium',           className: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400' },
  high:                { label: 'High',             className: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  urgent:              { label: 'Urgent',           className: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 badge ${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
}
