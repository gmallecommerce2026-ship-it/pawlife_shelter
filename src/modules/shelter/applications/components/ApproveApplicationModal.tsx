'use client';

import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, Download, ChevronUp, ChevronDown, Send, ArrowRight, Mars, Venus, Calendar, MoreHorizontal } from 'lucide-react';
import { AdoptionApplication, ApplicationNote } from '@/types/application';
import { applicationService } from '@/services/applicationService'; // Import Service gọi API BE

interface ApproveApplicationModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onRefresh?: () => void;
}

export const ApproveApplicationModal: React.FC<ApproveApplicationModalProps> = ({
  application,
  onClose,
  onSubmit,
  onRefresh,
}) => {
  // Trạng thái đóng/mở của các Accordion (giống trong ảnh thiết kế)
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isInterviewOpen, setIsInterviewOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);

  const [format, setFormat] = useState<'Online' | 'Offline'>('Online');

  // LOGIC NGHIỆP VỤ: State quản lý các ô nhập liệu phỏng vấn
  const [interviewTitle, setInterviewTitle] = useState(`Hẹn phỏng vấn nhận nuôi ${application.pet?.name || 'Luna'}`);
  const [interviewLink, setInterviewLink] = useState('https://shelter.pawlife.vn/shelter/pets');
  const [interviewSlot, setInterviewSlot] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberNote, setMemberNote] = useState('');

  // LOGIC NGHIỆP VỤ: Quản lý danh sách Ghi chú động (khởi tạo từ dữ liệu thật, không dùng mock mặc định)
  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const isMale = application.pet?.gender !== 'FEMALE';

  // Đồng bộ lại notes mỗi khi mở modal cho 1 application khác
  useEffect(() => {
    setNotes(application.notes || []);
  }, [application.id]);

  // Thêm ghi chú mới - Gọi API thực sự tới BE (trước đây chỉ lưu local -> mất khi reload)
  const handleAddNote = async () => {
    if (!noteInput.trim() || isSubmittingNote) return;
    setIsSubmittingNote(true);
    try {
      const response = await applicationService.addNote(application.id, noteInput.trim());
      const addedNote = response?.data || response;

      const newNoteObj: ApplicationNote = {
        id: addedNote?.id || Date.now().toString(),
        authorId: addedNote?.authorId || 'current-user',
        authorName: addedNote?.author?.name || addedNote?.author?.fullName || 'Staff Member',
        authorAvatar:
          addedNote?.author?.avatarUrl ||
          'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100',
        content: addedNote?.content || noteInput.trim(),
        createdAt: 'Vừa xong',
      };

      setNotes((prev) => [newNoteObj, ...prev]);
      setNoteInput('');

      // Cho board cha cập nhật lại dữ liệu từ backend ngay lập tức
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi khi thêm ghi chú:', error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // LOGIC NGHIỆP VỤ: Thu thập dữ liệu phê duyệt thực tế khi submit
  const handleSubmit = () => {
    const reviewNote = noteInput
      ? noteInput
      : `Đã hoàn thành phỏng vấn (${format}): ${interviewTitle}. Link/Địa điểm: ${interviewLink}. Thời gian: ${interviewSlot || 'Đã xác nhận'}`;

    onSubmit({
      reviewNote,
      format,
      interviewTitle,
      interviewLink,
      interviewSlot,
      memberName,
      memberNote,
      notes,
    });
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
              src={application.user?.avatarUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100"}
              className="w-[100px] h-[100px] rounded-full object-cover border border-gray-100 shrink-0"
              alt={application.fullName || application.user?.name || "Maria Garcia"}
            />
            <div className="flex flex-col justify-center">
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight mb-2.5">{application.fullName || application.user?.name || "Maria Garcia"}</h2>
              <div className="flex items-center gap-2.5 text-gray-500 mb-1.5">
                <Phone size={14} />
                <span className="text-[13px]">{application.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-500 mb-2.5">
                <Mail size={14} />
                <span className="text-[13px]">{application.zalo || application.user?.email || 'adopter@pawlife.vn'}</span>
              </div>
              <button className="flex items-center gap-2 text-gray-600 hover:text-[#E89B5A] transition-colors text-[13px]">
                <Download size={14} />
                <u>Download <span className="font-semibold">{(application.fullName || application.user?.name || "Maria Garcia" || 'Applicant').split(' ')[0]} - Application.pdf</span></u>
              </button>

              {/* Mini Pet Card */}
              <div className="mt-4 border border-gray-200 rounded-[12px] p-2 flex items-center gap-3 w-full bg-white shadow-sm">
                <img src={application.pet?.avatarUrl || application.pet?.images?.[0]?.url || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100"} className="w-11 h-11 rounded-lg object-cover" alt={application.pet?.name || 'Luna'} />
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

          {/* Accordions */}
          <div className="flex flex-col gap-6">

            {/* Application Details */}
            <div>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsAppDetailsOpen(!isAppDetailsOpen)}>
                <h3 className="font-bold text-[14px] text-gray-900">Application Details</h3>
                {isAppDetailsOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </div>

            {/* Bổ sung tài liệu */}
            <div>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsDocsOpen(!isDocsOpen)}>
                <h3 className="font-bold text-[14px] text-gray-900">Bổ sung tài liệu</h3>
                {isDocsOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </div>

            {/* Đặt lịch hẹn phỏng vấn */}
            <div>
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsInterviewOpen(!isInterviewOpen)}>
                <h3 className="font-bold text-[14px] text-gray-900">Đặt lịch hẹn phỏng vấn</h3>
                {isInterviewOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>

              {isInterviewOpen && (
                <div className="flex flex-col gap-4">
                  <span className="text-[12px] font-bold text-gray-900">Thông tin buổi phỏng vấn</span>
                  <div className="border border-gray-200 rounded-[16px] p-5 shadow-sm bg-white">
                    {/* Profile Link */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3 flex-1">
                        <img src={application.user?.avatarUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100"} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="Applicant" />
                        <div className="flex flex-col">
                          <span className="font-bold text-[13px] text-gray-900">{application.fullName || application.user?.name || "Maria Garcia"}</span>
                          <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">📞 {application.phone}</span>
                        </div>
                      </div>
                      <div className="px-2 text-gray-300"><ArrowRight size={16} strokeWidth={1.5} /></div>
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <div className="flex flex-col items-end text-right">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-bold text-[13px] text-gray-900">{application.pet?.name || 'Luna'}</span>
                            {isMale ? <Mars size={12} strokeWidth={2.5} className="text-[#3DB2FF]" /> : <Venus size={12} strokeWidth={2.5} className="text-[#FF6B93]" />}
                          </div>
                          <span className="text-[10px] text-gray-500">2 years - Golden British</span>
                        </div>
                        <img src={application.pet?.avatarUrl || application.pet?.images?.[0]?.url || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100"} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="Pet" />
                      </div>
                    </div>

                    <div className="w-full border-t border-dashed border-gray-200 mb-4" />

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Tiêu đề</label>
                        <input
                          type="text"
                          value={interviewTitle}
                          onChange={(e) => setInterviewTitle(e.target.value)}
                          className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[12px] text-gray-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Hình thức</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setFormat('Online')} className={`px-3 py-2 rounded-[8px] text-[12px] font-medium transition-colors ${format === 'Online' ? 'bg-[#5982E6] text-white' : 'bg-[#F2F2F2] text-gray-500'}`}>Online</button>
                          <button onClick={() => setFormat('Offline')} className={`px-3 py-2 rounded-[8px] text-[12px] font-medium transition-colors ${format === 'Offline' ? 'bg-[#5982E6] text-white' : 'bg-[#F2F2F2] text-gray-500'}`}>Offline</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Đường link phỏng vấn (URL)</label>
                        <input
                          type="text"
                          value={interviewLink}
                          onChange={(e) => setInterviewLink(e.target.value)}
                          className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[12px] text-gray-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Ngày & giờ hẹn</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Pick a slot"
                            value={interviewSlot}
                            onChange={(e) => setInterviewSlot(e.target.value)}
                            className="w-full border border-gray-200 rounded-[8px] pl-3 pr-8 py-2 text-[12px] text-gray-900 outline-none"
                          />
                          <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <span className="text-[12px] font-bold text-gray-900 mt-2">Phân công thành viên</span>
                  <span className="text-[11px] text-gray-500 -mt-3 mb-1">Chọn một thành viên phù hợp để phụ trách hoặc tham gia buổi phỏng vấn</span>
                  <div className="border border-gray-200 rounded-[16px] p-5 shadow-sm bg-white">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Tên thành viên</label>
                        <input
                          type="text"
                          placeholder="Tên"
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[12px] text-gray-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Nội dung cần lưu ý</label>
                        <input
                          type="text"
                          placeholder="Optional"
                          value={memberNote}
                          onChange={(e) => setMemberNote(e.target.value)}
                          className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[12px] text-gray-900 outline-none"
                        />
                      </div>
                    </div>
                    <button className="text-[#E89B5A] text-[12px] font-medium">+ Thêm thành viên</button>
                  </div>

                  {/* Interview Actions */}
                  <div className="flex gap-3 mt-2">
                    <button className="px-5 py-2.5 rounded-[10px] border border-gray-200 text-gray-600 text-[13px] font-medium hover:bg-gray-50">Đổi lịch</button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 bg-[#E89B5A] hover:bg-[#D68B4E] text-white rounded-[10px] text-[13px] font-bold transition-colors"
                    >
                      Đã hoàn thành phỏng vấn
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Internal Notes (Động) */}
            <div>
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsNotesOpen(!isNotesOpen)}>
                <h3 className="font-bold text-[14px] text-gray-900">Internal Notes</h3>
                {isNotesOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
              {isNotesOpen && (
                <div className="flex flex-col gap-4">
                  {/* Danh sách ghi chú */}
                  {notes.map((note) => (
                    <div key={note.id} className="flex gap-3">
                      <img
                        src={note.authorAvatar || (note as any).author?.avatarUrl || "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100"}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                        alt="Staff"
                      />
                      <div className="flex flex-col w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[13px] text-gray-900">{note.authorName || (note as any).author?.name || 'Staff Member'}</span>
                          <span className="text-[11px] text-gray-400">{typeof note.createdAt === 'string' ? note.createdAt : 'Vừa xong'}</span>
                        </div>
                        <p className="text-[13px] text-gray-500">{note.content}</p>
                      </div>
                      <MoreHorizontal size={16} className="text-[#C4C4C4] shrink-0 cursor-pointer" />
                    </div>
                  ))}

                  {/* Input Add Note */}
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      placeholder="Add note... (type @ to mention a member)"
                      className="w-full bg-[#F6F6F6] rounded-[14px] pl-4 pr-10 py-3.5 text-[13px] outline-none placeholder-gray-400 border border-transparent focus:border-[#E89B5A] transition-colors"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={isSubmittingNote}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#E89B5A] hover:text-[#D68B4E] transition-colors disabled:opacity-50"
                    >
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
            Bước tiếp theo
          </button>
        </div>

      </div>
    </div>
  );
};