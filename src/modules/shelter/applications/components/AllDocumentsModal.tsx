'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, FileText, Download, Eye, CheckCircle2, 
  Building2, Stethoscope, User, Users 
} from 'lucide-react';
import { AdoptionApplication } from '@/types/application';

interface AllDocumentsModalProps {
  application: AdoptionApplication;
  onClose: () => void;
}

// --- MOCK DATA DỰA TRÊN ẢNH THIẾT KẾ ---
const MOCK_CATEGORIES = [
  {
    id: 'shelter',
    title: 'SHELTER DOCUMENTS',
    count: 3,
    color: 'text-[#E85C2F]',
    icon: <Building2 size={16} strokeWidth={2.5} />,
    docs: [
      { id: 1, title: 'Pet Intake Form', meta: 'PDF • 245 KB • Jan 15', status: 'Received' },
      { id: 2, title: 'Behavioral Assessment', meta: 'PDF • 182 KB • Jan 20', status: 'Received' },
      { id: 3, title: 'Transfer Documents', meta: 'PDF • 320 KB • Jan 10', status: 'Received' },
    ]
  },
  {
    id: 'veterinary',
    title: 'VETERINARY DOCUMENTS',
    count: 4,
    color: 'text-[#3B6BE3]',
    icon: <Stethoscope size={16} strokeWidth={2.5} />,
    docs: [
      { id: 4, title: 'Medical History', meta: 'PDF • 425 KB • Jan 18', status: 'Received' },
      { id: 5, title: 'Vaccination Records', meta: 'PDF • 156 KB • Jan 22', status: 'Received' },
      { id: 6, title: 'Spay/Neuter Certificate', meta: 'PDF • 98 KB • Jan 12', status: 'Received' },
      { id: 7, title: 'Recent Health Checkup', meta: 'PDF • 210 KB • Feb 1', status: 'Received' },
    ]
  },
  {
    id: 'applicant',
    title: 'APPLICANT DOCUMENTS',
    count: 5,
    color: 'text-[#1B8A44]',
    icon: <User size={16} strokeWidth={2.5} />,
    docs: [
      { id: 8, title: "Photo ID / Driver's License", meta: 'JPG • 1.2 MB • Feb 5', status: 'Received' },
      { id: 9, title: 'Proof of Residence', meta: 'PDF • 340 KB • Feb 5', status: 'Received' },
      { id: 10, title: 'Landlord Approval Letter', meta: 'PDF • 125 KB • Feb 6', status: 'Received' },
      { id: 11, title: 'Employment Verification', meta: 'PDF • 215 KB • Feb 7', status: 'Received' },
    ]
  },
  {
    id: 'staff',
    title: 'STAFF / INTERNAL DOCUMENTS',
    count: 4,
    color: 'text-[#8A38D4]',
    icon: <Users size={16} strokeWidth={2.5} />,
    docs: [
      { id: 12, title: 'Home Visit Report', meta: 'PDF • 380 KB • Feb 10', status: 'Received' },
      { id: 13, title: 'Reference Check Notes', meta: 'PDF • 145 KB • Feb 9', status: 'Received' },
      { id: 14, title: 'Background Check Results', meta: 'PDF • 95 KB • Feb 11', status: 'Received' },
      { id: 15, title: 'Interview Notes', meta: 'PDF • 110 KB • Feb 12', status: 'Received' },
    ]
  }
];

export const AllDocumentsModal: React.FC<AllDocumentsModalProps> = ({ application, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Khóa cuộn background khi mở Modal
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-[#00000040] flex justify-center items-center backdrop-blur-[2px] transition-opacity">
      {/* Modal Box */}
      <div 
        className="bg-white rounded-[16px] w-[540px] max-w-[95vw] h-[85vh] max-h-[750px] shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút Đóng */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors z-10"
        >
          <X size={20} strokeWidth={2} />
        </button>

        {/* Header */}
        <div className="px-7 pt-7 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-['Be Vietnam Pro',_sans-serif] text-[24px] font-bold text-gray-900 leading-tight">
            All Documents
          </h2>
          <p className="font-['Be Vietnam Pro',_sans-serif] text-[15px] text-gray-500 mt-1">
            Application for <span className="text-gray-900 font-bold">{application.pet?.name || 'Whiskers'}</span> by <span className="text-gray-900 font-bold">{application.fullName || application.user?.name || "Maria Garcia"}</span>
          </p>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-7 py-6 flex flex-col gap-8 bg-[#FAFAFA] rounded-b-[16px]">
          {MOCK_CATEGORIES.map((category) => (
            <div key={category.id} className="flex flex-col w-full">
              {/* Category Header */}
              <div className={`flex items-center gap-2 mb-3 ${category.color}`}>
                {category.icon}
                <span className="font-['Be Vietnam Pro',_sans-serif] text-[12px] font-bold tracking-widest uppercase">
                  {category.title} <span className="text-gray-400 font-medium">({category.count})</span>
                </span>
              </div>

              {/* Document List */}
              <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm flex flex-col overflow-hidden">
                {category.docs.map((doc, index) => (
                  <div 
                    key={doc.id}
                    className={`flex items-center justify-between p-4 hover:bg-[#FDFDFD] transition-colors ${
                      index !== category.docs.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <FileText size={20} className="text-gray-400" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-['Be Vietnam Pro',_sans-serif] text-[15px] font-semibold text-gray-900 truncate">
                          {doc.title}
                        </span>
                        <span className="font-['Be Vietnam Pro',_sans-serif] text-[13px] text-gray-500">
                          {doc.meta}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4 shrink-0 pl-4">
                      {doc.status === 'Received' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                          <CheckCircle2 size={14} className="text-green-600" strokeWidth={2.5} />
                          <span className="font-['Be Vietnam Pro',_sans-serif] text-[12px] font-bold text-green-700">
                            Received
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 ml-2">
                        <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors" title="View">
                          <Eye size={18} strokeWidth={2} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-[#3B6BE3] hover:bg-blue-50 rounded-md transition-colors" title="Download">
                          <Download size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};