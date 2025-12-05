import React, { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare, Calendar, Tag, Building2, User, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/dataManager';

const PaymentOutApproval = ({ payment, onApprove, onReject, getDepartmentName }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onReject(payment.id, rejectionReason);
    setShowRejectModal(false);
    setRejectionReason('');
  };

  const getCategoryBadge = (category) => {
    const colors = {
      material: 'bg-blue-100 text-blue-700',
      labor: 'bg-green-100 text-green-700',
      equipment: 'bg-purple-100 text-purple-700',
      transport: 'bg-orange-100 text-orange-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.other;
  };

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-yellow-50/50 transition-colors">
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{formatDate(payment.date)}</span>
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{getDepartmentName(payment.departmentId)}</span>
          </div>
        </td>
        <td className="py-4 px-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryBadge(payment.category)}`}>
            {payment.category || 'Other'}
          </span>
        </td>
        <td className="py-4 px-4 text-gray-600 text-sm max-w-xs truncate">
          {payment.description || '-'}
        </td>
        <td className="py-4 px-4 text-gray-600 text-sm">
          {payment.vendor || '-'}
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{payment.createdBy || 'Unknown'}</span>
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove(payment.id)}
              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              title="Approve"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              title="Reject"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Reject Modal */}
      {showRejectModal && (
        <tr>
          <td colSpan="8" className="p-0">
            <div className="bg-red-50 border-t border-b border-red-200 p-4">
              <div className="max-w-2xl">
                <div className="flex items-start gap-3 mb-3">
                  <MessageSquare className="w-5 h-5 text-red-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejecting this expense entry..."
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      rows="3"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default PaymentOutApproval;

