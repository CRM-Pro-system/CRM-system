import React from 'react';

const QuickActionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <p className="text-gray-600 mb-4">Quick action modal placeholder</p>
        <button onClick={onClose} className="px-4 py-2 bg-orange-500 text-white rounded-lg">
          Close
        </button>
      </div>
    </div>
  );
};

export default QuickActionModal;