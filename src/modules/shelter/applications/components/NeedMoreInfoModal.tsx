'use client';

import React, { useState } from 'react';
import { X, Phone, Mail, Download, ChevronUp, ChevronDown, Send, Mars, Venus, CheckCircle2 } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';

interface NeedMoreInfoModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const NeedMoreInfoModal: React.FC<NeedMoreInfoModalProps> = ({
  application,
  onClose,
  onSubmit,
}) => {
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);

  const isMale = application.pet?.gender !== 'FEMALE';

  const handleSubmit = () => {
    onSubmit({});
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[500px] max-h-[90vh] rounded-[20px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1.5 bg-white hover:bg-gray-100 rounded-full z-10">
          <X size={18} strokeWidth={2} />
        </button>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* 1. Header & Applicant Profile */}
          <div className="flex gap-5 mb-6 mt-2">
            <img 
              src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100" 
              className="w-[100px] h-[100px] rounded-full object-cover border border-gray-100 shrink-0" 
              alt={application.fullName} 
            />
            <div className="flex flex-col justify-center">
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight mb-2.5">{application.fullName || 'Julia Nguyen'}</h2>
              <div className="flex items-center gap-2.5 text-gray-500 mb-1.5">
                <Phone size={14} />
                <span className="text-[13px]">{application.phone || '09876543210'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-500 mb-2.5">
                <Mail size={14} />
                <span className="text-[13px]">{application.zalo || 'adopter@pawlife.vn'}</span>
              </div>
              <button className="flex items-center gap-2 text-gray-600 hover:text-[#E89B5A] transition-colors text-[13px]">
                <Download size={14} />
                <u>Download <span className="font-semibold">{application.fullName?.split(' ')[0] || 'Julia'} - Application.pdf</span></u>
              </button>

              {/* Mini Pet Card */}
              <div className="mt-4 border border-gray-200 rounded-[12px] p-2 flex items-center gap-3 w-full bg-white shadow-sm">
                <img src={application.pet?.avatarUrl || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100"} className="w-11 h-11 rounded-lg object-cover" alt={application.pet?.name || 'Luna'} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-[14px] text-gray-900">{application.pet?.name || 'Luna'}</span>
                    {isMale ? (
                      <Mars size={14} strokeWidth={2.5} className="text-[#3DB2FF]" />
                    ) : (
                      <Venus size={14} strokeWidth={2.5} className="text-[#FF6B93]" />
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500">2 years • Golden British</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Tags Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[14px] text-gray-900">Gắn thẻ</h3>
              <button className="text-gray-400 hover:text-gray-600 text-[12px] flex items-center gap-1">+ tag</button>
            </div>
            <div className="flex gap-2">
              <span className="px-3.5 py-1.5 bg-[#EEF3FF] text-[#5982E6] text-[12px] font-medium rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-[#E3ECFF] transition-colors">
                Follow-up <X size={12}/>
              </span>
              <span className="px-3.5 py-1.5 bg-[#F6F6F6] text-[#888888] text-[12px] font-medium rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-[#EDEDED] transition-colors">
                First-time <X size={12}/>
              </span>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 mb-6" />

          {/* Accordions */}
          <div className="flex flex-col gap-6">
            
            {/* Đơn nhận nuôi */}
            <div>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsAppDetailsOpen(!isAppDetailsOpen)}>
                <h3 className="font-bold text-[14px] text-gray-900">Đơn nhận nuôi</h3>
                {isAppDetailsOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </div>

            {/* Bổ sung tài liệu */}
            <div>
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsDocsOpen(!isDocsOpen)}>
                <h3 className="font-bold text-[14px] text-gray-900">Bổ sung tài liệu</h3>
                {isDocsOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
              
              {isDocsOpen && (
                <div className="flex flex-col gap-5">
                  {/* Select Dropdown */}
                  <div className="relative w-full">
                    <select className="w-full appearance-none bg-white border border-gray-200 rounded-[10px] px-4 py-2.5 text-[13px] text-gray-500 outline-none focus:border-[#E89B5A] cursor-pointer">
                      <option>Chọn tài liệu cần bổ sung</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* State 1: Missing */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-[13px] text-gray-900">Chấp thuận từ chủ nhà</span>
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">Missing</span>
                        </div>
                        <p className="text-[12px] text-gray-500 leading-relaxed pr-2">
                          Nếu bạn đang thuê nhà, chúng mình cần sự đồng ý từ chủ nhà để đảm bảo rằng thú cưng được phép sống an toàn tại nơi ở của bạn.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 w-[100px]">
                        <button className="w-full bg-[#F3A571] hover:bg-[#E89B5A] transition-colors text-white font-bold text-[12px] py-2 rounded-lg shadow-sm">Yêu cầu</button>
                        <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2 rounded-lg">Hủy</button>
                      </div>
                    </div>

                    {/* State 2: Đã yêu cầu */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-[13px] text-gray-900">Chấp thuận từ chủ nhà</span>
                          <span className="bg-[#FFF8E6] text-[#E89B5A] text-[10px] font-medium px-2 py-0.5 rounded-full">Đã yêu cầu</span>
                        </div>
                        <p className="text-[12px] text-gray-500 leading-relaxed pr-2">
                          Nếu bạn đang thuê nhà, chúng mình cần sự đồng ý từ chủ nhà để đảm bảo rằng thú cưng được phép sống an toàn tại nơi ở của bạn.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 w-[100px]">
                        <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2 rounded-lg">Hủy</button>
                      </div>
                    </div>

                    {/* State 3: Đã bổ sung */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-[13px] text-gray-900">Chấp thuận từ chủ nhà</span>
                          <span className="bg-[#EBF1FF] text-[#5982E6] text-[10px] font-medium px-2 py-0.5 rounded-full">Đã bổ sung</span>
                        </div>
                        <p className="text-[12px] text-gray-500 leading-relaxed pr-2">
                          Nếu bạn đang thuê nhà, chúng mình cần sự đồng ý từ chủ nhà để đảm bảo rằng thú cưng được phép sống an toàn tại nơi ở của bạn.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 w-[100px]">
                        <button className="w-full bg-[#5982E6] hover:bg-[#4a72d4] transition-colors text-white font-bold text-[12px] py-2.5 rounded-lg shadow-sm">Xem tài liệu</button>
                      </div>
                    </div>

                    {/* State 4: Chấp nhận */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-[13px] text-gray-900">Chấp thuận từ chủ nhà</span>
                          <span className="bg-[#E7F8ED] text-[#16A34A] text-[10px] font-medium px-2 py-0.5 rounded-full">Chấp nhận</span>
                        </div>
                        <p className="text-[12px] text-gray-500 leading-relaxed pr-2">
                          Nếu bạn đang thuê nhà, chúng mình cần sự đồng ý từ chủ nhà để đảm bảo rằng thú cưng được phép sống an toàn tại nơi ở của bạn.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 w-[100px]">
                        <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2.5 rounded-lg">Xem</button>
                      </div>
                    </div>

                    {/* Success Message */}
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle2 size={18} className="text-[#16A34A]" strokeWidth={2.5} />
                      <span className="text-[#16A34A] font-bold text-[13px]">Tất cả tài liệu đã được chấp nhận</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ghi chú nội bộ */}
            <div>
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsNotesOpen(!isNotesOpen)}>
                <h3 className="font-bold text-[14px] text-gray-900">Ghi chú nội bộ</h3>
                {isNotesOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
              {isNotesOpen && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <img src="https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100" className="w-8 h-8 rounded-full object-cover shrink-0" alt="Staff" />
                    <div className="flex flex-col w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[13px] text-gray-900">Staff Member</span>
                        <span className="text-[11px] text-gray-400">2h ago</span>
                      </div>
                      <p className="text-[13px] text-gray-500">Please note that Luna is needed to be...</p>
                    </div>
                  </div>
                  
                  {/* Input Add Note */}
                  <div className="relative w-full">
                    <input 
                      type="text" 
                      placeholder="Add note... (type @ to mention a member)" 
                      className="w-full bg-[#F6F6F6] rounded-[14px] pl-4 pr-10 py-3.5 text-[13px] outline-none placeholder-gray-400 border border-transparent focus:border-[#E89B5A] transition-colors" 
                    />
                    <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#E89B5A] hover:text-[#D68B4E] transition-colors">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Fixed Action Button */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
          <button 
            onClick={handleSubmit} 
            className="w-full bg-[#E89B5A] hover:bg-[#D68B4E] transition-colors text-white font-bold text-[14px] py-3.5 rounded-[12px] shadow-sm shadow-orange-100"
          >
            Move to Pending
          </button>
        </div>

      </div>
    </div>
  );
};