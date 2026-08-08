'use client';

import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Mars, Venus, Calendar } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';

interface InterviewScheduleModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const InterviewScheduleModal: React.FC<InterviewScheduleModalProps> = ({
  application,
  onClose,
  onSubmit,
}) => {
  // LOGIC NGHIỆP VỤ: Quản lý state cho các ô nhập liệu sẵn có
  const [title, setTitle] = useState(`Hẹn phỏng vấn nhận nuôi ${application.pet?.name || 'Luna'}`);
  const [format, setFormat] = useState<'Online' | 'Offline'>('Offline');
  const [location, setLocation] = useState('Sân nhà nhiều chó\n123 street, city, state');
  const [dateSlot, setDateSlot] = useState('');
  const [members, setMembers] = useState([{ name: '', note: '' }]);

  const isMale = application.pet?.gender !== 'FEMALE';

  const handleAddMember = () => {
    setMembers([...members, { name: '', note: '' }]);
  };

  const handleMemberChange = (index: number, field: 'name' | 'note', value: string) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  // LOGIC NGHIỆP VỤ: Truyền dữ liệu lịch hẹn thực tế khi submit
  const handleSubmit = () => {
    const reviewNote = `Lịch phỏng vấn (${format}): ${title}. Ngày giờ: ${dateSlot || 'Chưa xếp'}. Địa điểm/Link: ${location}. Thành viên: ${members.map(m => m.name).filter(Boolean).join(', ')}`;
    onSubmit({
      title,
      format,
      location,
      dateSlot,
      members,
      reviewNote,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[560px] max-h-[90vh] rounded-[20px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-6 pb-4 border-b border-gray-100 relative shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={20} strokeWidth={2} />
          </button>
          <h2 className="text-[22px] font-bold text-gray-900 leading-tight mb-2">Lịch hẹn phỏng vấn</h2>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-gray-500">Muốn người nhận nuôi tự đặt lịch với trạm?</span>
            <button className="bg-[#5982E6] hover:bg-[#4a72d4] transition-colors text-white text-[12px] font-medium px-4 py-1.5 rounded-md">
              Giao quyền đặt lịch
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-7 py-6">
                     
          {/* Section 1: Thông tin buổi phỏng vấn */}
          <div className="mb-8">
            <h3 className="font-bold text-[14px] text-gray-900 mb-3">Thông tin buổi phỏng vấn</h3>
            
            <div className="border border-gray-200 rounded-[16px] p-5 shadow-sm bg-white">
              {/* Profile Card */}
              <div className="flex items-center justify-between mb-5">
                {/* Applicant */}
                <div className="flex items-center gap-3 flex-1">
                  <img 
                    src={application.user?.avatarUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100"} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-100" 
                    alt={application.fullName || application.user?.name || "Maria Garcia"} 
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-gray-900">{application.fullName || application.user?.name || "Maria Garcia"}</span>
                    <span className="text-[12px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <span className="text-gray-400"> </span> {application.phone}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="px-4 text-gray-300">
                  <ArrowRight size={20} strokeWidth={1} />
                </div>

                {/* Pet */}
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="flex flex-col items-end text-right">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-[15px] text-gray-900">{application.pet?.name || 'Luna'}</span>
                      {isMale ? (
                        <Mars size={14} strokeWidth={2.5} className="text-[#3DB2FF]" />
                      ) : (
                        <Venus size={14} strokeWidth={2.5} className="text-[#FF6B93]" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500">2 years - Golden British</span>
                  </div>
                  <img 
                    src={application.pet?.avatarUrl || application.pet?.images?.[0]?.url || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100"} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-100" 
                    alt={application.pet?.name || 'Luna'} 
                  />
                </div>
              </div>

              <div className="w-full h-px border-t border-dashed border-gray-200 mb-5" />

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                {/* Tiêu đề */}
                <div className="col-span-1">
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Tiêu đề</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[13px] text-gray-900 outline-none focus:border-[#E89B5A] transition-colors"
                  />
                </div>

                {/* Hình thức */}
                <div className="col-span-1">
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Hình thức</label>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormat('Online')}
                      className={`px-4 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors ${format === 'Online' ? 'bg-[#5982E6] text-white' : 'bg-[#F2F2F2] text-gray-500 hover:bg-gray-200'}`}
                    >
                      Online
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormat('Offline')}
                      className={`px-4 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors ${format === 'Offline' ? 'bg-[#5982E6] text-white' : 'bg-[#F2F2F2] text-gray-500 hover:bg-gray-200'}`}
                    >
                      Offline
                    </button>
                  </div>
                </div>

                {/* Địa điểm */}
                <div className="col-span-1">
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Địa điểm</label>
                  <textarea 
                    rows={2}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[13px] text-gray-900 outline-none focus:border-[#E89B5A] transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Ngày & giờ hẹn */}
                <div className="col-span-1">
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Ngày & giờ hẹn</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Pick a slot"
                      value={dateSlot}
                      onChange={(e) => setDateSlot(e.target.value)}
                      className="w-full border border-gray-200 rounded-[10px] pl-3.5 pr-10 py-2.5 text-[13px] text-gray-900 outline-none focus:border-[#E89B5A] transition-colors"
                    />
                    <Calendar size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Phương thành viên */}
          <div>
            <h3 className="font-bold text-[14px] text-gray-900 mb-1">Thành viên tham gia</h3>
            <p className="text-[12px] text-gray-500 mb-3">Chọn thành viên phụ trách hoặc tham gia buổi phỏng vấn</p>
            
            <div className="border border-gray-200 rounded-[16px] p-5 shadow-sm bg-white">
              {members.map((member, index) => (
                <div key={index} className="grid grid-cols-2 gap-x-5 mb-4">
                  <div className="col-span-1">
                    <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Tên thành viên</label>
                    <input 
                      type="text" 
                      placeholder="Tên"
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[13px] text-gray-900 outline-none focus:border-[#E89B5A] transition-colors"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Nội dung ghi chú</label>
                    <input 
                      type="text" 
                      placeholder="Optional"
                      value={member.note}
                      onChange={(e) => handleMemberChange(index, 'note', e.target.value)}
                      className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[13px] text-gray-900 outline-none focus:border-[#E89B5A] transition-colors"
                    />
                  </div>
                </div>
              ))}
              
              <button onClick={handleAddMember} className="text-[#E89B5A] hover:text-[#D68B4E] transition-colors text-[13px] font-medium">
                + Thêm thành viên
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-gray-100 bg-[#FAFAFA] flex items-center gap-4 shrink-0">
          <button 
            onClick={onClose} 
            className="w-[120px] bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 font-medium text-[14px] py-3 rounded-[12px] shadow-sm"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit} 
            className="flex-1 bg-[#E89B5A] hover:bg-[#D68B4E] transition-colors text-white font-bold text-[14px] py-3 rounded-[12px] shadow-sm shadow-orange-100"
          >
            Lên lịch phỏng vấn
          </button>
        </div>
      </div>
    </div>
  );
};