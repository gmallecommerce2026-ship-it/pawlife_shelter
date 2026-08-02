'use client';

import React from 'react';
import { X, Phone, Mail, ChevronDown, Check, Shield, Stethoscope, Flag } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';

interface ApplicantProfileModalProps {
  application: AdoptionApplication;
  onClose: () => void;
}

export const ApplicantProfileModal: React.FC<ApplicantProfileModalProps> = ({ application, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#F8F9FA] w-full max-w-[900px] max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200 relative shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} strokeWidth={1.5} />
          </button>
          
          <div className="flex gap-5 items-start">
            <img 
              src={application.pet?.avatarUrl || "/images/placeholder-avatar.png"} 
              alt={application.fullName}
              className="w-[84px] h-[84px] rounded-[20px] object-cover bg-gray-100 border border-gray-200"
            />
            <div className="flex flex-col">
              <h2 className="font-['Urbanist',_sans-serif] text-[24px] font-bold text-gray-900 leading-tight mb-2">
                {application.fullName}
              </h2>
              <div className="flex items-center gap-6 mb-5">
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone size={14} />
                  <span className="text-[13px] font-medium">{application.phone || '0912345678'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail size={14} />
                  <span className="text-[13px] font-medium">{application.zalo || 'mariagarcia@email.com'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-10">
                <div className="flex flex-col border-r border-gray-200 pr-10">
                  <span className="text-[22px] font-bold text-gray-900 leading-none mb-1">1</span>
                  <span className="text-[13px] text-gray-500">Active Applications</span>
                </div>
                <div className="flex flex-col border-r border-gray-200 pr-10">
                  <span className="text-[22px] font-bold text-gray-900 leading-none mb-1">3</span>
                  <span className="text-[13px] text-gray-500">Successful Adoptions</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[22px] font-bold text-gray-900 leading-none mb-1">4</span>
                  <span className="text-[13px] text-gray-500">Total Applications</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 flex gap-6">
          
          {/* Left Column */}
          <div className="w-1/2 flex flex-col gap-4">
            
            {/* Active Applications */}
            <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[16px] text-gray-900">Active Applications</h3>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-3">
                <img src="/images/dog-placeholder.png" alt="Ruby" className="w-[52px] h-[52px] rounded-[12px] object-cover" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-[15px] text-gray-900">Ruby</span>
                  <span className="text-[13px] text-gray-500">Loving Paws</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">Applied on 06/02/2026</span>
                </div>
                <div className="bg-[#F4E8FF] px-3 py-1 rounded-full border border-[#E9D5FF]">
                  <span className="text-[11px] font-bold text-[#8A38D4]">Interview</span>
                </div>
              </div>
            </div>

            {/* Adoption History */}
            <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[16px] text-gray-900">Adoption History</h3>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
              {[1, 2, 3].map((item, idx) => (
                <div key={idx} className={`flex items-center gap-3 py-4 ${idx !== 0 ? 'border-t border-gray-100' : 'pt-0'}`}>
                  <img src="/images/dog-placeholder.png" alt="Ruby" className="w-[52px] h-[52px] rounded-[12px] object-cover" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[15px] text-gray-900">Ruby</span>
                    <span className="text-[13px] text-gray-500">Loving Paws</span>
                    <span className="text-[11px] text-gray-400 mt-0.5">Applied on 08/02/2026</span>
                  </div>
                  <div className="bg-[#F2FCF5] px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#D1F2D9]">
                    <Check size={12} className="text-[#1B8A44]" />
                    <span className="text-[11px] font-bold text-[#1B8A44]">Adopted</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Pet */}
            <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[16px] text-gray-900">Current Pet (3)</h3>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
              {[1, 2, 3].map((item, idx) => (
                <div key={idx} className={`flex items-center gap-3 py-4 ${idx !== 0 ? 'border-t border-gray-100' : 'pt-0'}`}>
                  <img src="/images/dog-placeholder.png" alt="Ruby" className="w-[52px] h-[52px] rounded-[12px] object-cover" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[15px] text-gray-900">Ruby</span>
                    <span className="text-[13px] text-gray-500">Loving Paws</span>
                    <button className="text-[11px] text-[#E89B5A] font-bold mt-1 flex items-center gap-1 hover:underline text-left">
                      View PawHistory <span className="text-[9px]">▲</span>
                    </button>
                  </div>
                  <div className="bg-[#FFF8F0] px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#FFE1C2]">
                    <span className="text-[11px] font-bold text-[#E89B5A]">QR Registered</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column */}
          <div className="w-1/2 flex flex-col h-full">
            <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm flex-1 flex flex-col">
              <h3 className="font-bold text-[16px] text-gray-900 mb-6">Shelter Notes (2)</h3>
              
              <div className="flex flex-col gap-6">
                {/* Note 1 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#3B6BE3] flex items-center justify-center shrink-0">
                    <Stethoscope size={20} className="text-[#3B6BE3]" />
                  </div>
                  <div className="flex flex-col border-b border-gray-100 pb-5">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-[14px] text-gray-900">Happy Paws Shelter</h4>
                      <Flag size={14} className="text-gray-400" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2">
                      <span className="text-[#3B6BE3] font-bold">Vet Records</span> · 08/05/2020 at 10:00 AM
                    </p>
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      Applicant provided all requested veterinary records for current pet. Documentation shows consistent preventive care.
                    </p>
                  </div>
                </div>

                {/* Note 2 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#8A38D4] flex items-center justify-center shrink-0">
                    <Shield size={20} className="text-[#8A38D4]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-[14px] text-gray-900">Loving Paws</h4>
                      <Flag size={14} className="text-gray-400" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2">
                      <span className="text-[#8A38D4] font-bold">Background Check</span> · 09/02/2026 at 1:45 PM
                    </p>
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      Outstanding applicant with proven multi-pet household management. All three previous adoptions remain in excellent condition.
                    </p>
                  </div>
                </div>
              </div>

              {/* Add New Note Box */}
              <div className="mt-auto border border-dashed border-gray-300 rounded-[16px] p-5 bg-[#FAFAFA]">
                <h4 className="font-bold text-[14px] text-gray-900 mb-4">Add New Note</h4>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Note Type</label>
                    <div className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 flex justify-between items-center cursor-pointer">
                      <span className="text-[13px] text-gray-400">Select note type...</span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Detail</label>
                    <textarea 
                      rows={3} 
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none"
                      placeholder="Enter note detail..."
                    ></textarea>
                  </div>
                </div>

                <div className="flex flex-col items-center mt-4 gap-3">
                  <span className="text-[11px] text-gray-500 text-center">
                    Share observable facts · Visible only to verified shelters
                  </span>
                  <button className="bg-[#E89B5A] hover:bg-[#D68B4E] transition-colors text-white font-bold text-[13px] py-2.5 px-8 rounded-full shadow-sm">
                    Add Shelter Note
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};