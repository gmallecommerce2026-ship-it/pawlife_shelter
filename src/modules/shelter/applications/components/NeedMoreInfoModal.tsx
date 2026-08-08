'use client';

import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, Download, ChevronUp, ChevronDown, Send, Mars, Venus, CheckCircle2, Plus } from 'lucide-react';
import { AdoptionApplication, ApplicationTag, ApplicationNote } from '@/types/application';
import { applicationService } from '@/services/applicationService'; // Gọi API thật, tránh mất dữ liệu khi reload

interface NeedMoreInfoModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onRefresh?: () => void; // Cho phép board cha refetch lại danh sách sau khi add note
}

export const NeedMoreInfoModal: React.FC<NeedMoreInfoModalProps> = ({
  application,
  onClose,
  onSubmit,
  onRefresh,
}) => {
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);

  // LOGIC NGHIỆP VỤ: Quản lý danh sách Tag động (khởi tạo từ dữ liệu thật, không dùng mock mặc định)
  const [tags, setTags] = useState<ApplicationTag[]>(
    application.tags ? application.tags.map((t: any) => t.tag || t) : []
  );
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // LOGIC NGHIỆP VỤ: Quản lý danh sách Ghi chú động (khởi tạo từ dữ liệu thật)
  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const [selectedDoc, setSelectedDoc] = useState('Chấp thuận từ chủ nhà');
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const isMale = application.pet?.gender !== 'FEMALE';

  // Đồng bộ lại notes/tags mỗi khi mở modal cho 1 application khác
  // (phòng trường hợp component không bị unmount giữa 2 lần mở)
  useEffect(() => {
    setNotes(application.notes || []);
    setTags(application.tags ? application.tags.map((t: any) => t.tag || t) : []);
  }, [application.id]);

  // Thêm Tag mới - Gọi API thực sự tới BE (find-or-create theo tên)
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const added = await applicationService.addTag(application.id, { name: newTagName.trim() });
      const newTag: ApplicationTag | undefined = added?.tag ?? added;

      // Guard: không push nếu API trả về dữ liệu không hợp lệ (thiếu id/name)
      if (!newTag || !newTag.id || !newTag.name) {
        console.error('addTag trả về dữ liệu không hợp lệ:', added);
        return;
      }

      setTags((prev) => [...prev, newTag]);
      setNewTagName('');
      setIsAddingTag(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi khi thêm tag:', error);
    }
  };

  // Xóa Tag - Gọi API thực sự tới BE
  const handleRemoveTag = async (tagId: string) => {
    try {
      await applicationService.removeTag(application.id, tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (error) {
      console.error('Lỗi khi xóa tag:', error);
      // Vẫn xóa khỏi UI để tránh kẹt trạng thái, tag không tồn tại ở server sẽ tự hết khi refetch
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    }
  };

  // Thêm Ghi chú nội bộ - Gọi API thực sự tới BE (trước đây chỉ lưu local -> mất khi reload)
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

  const handleSubmit = () => {
    const reviewNote = selectedDoc
      ? `Cần bổ sung tài liệu: ${selectedDoc}${noteInput ? '. ' + noteInput : ''}`
      : (noteInput || 'Yêu cầu bổ sung tài liệu');

    onSubmit({ reviewNote, tags, notes, selectedDoc });
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
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight mb-2.5">
                {application.fullName || application.user?.name || 'Julia Nguyen'}
              </h2>
              <div className="flex items-center gap-2.5 text-gray-500 mb-1.5">
                <Phone size={14} />
                <span className="text-[13px]">{application.phone || '09876543210'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-500 mb-2.5">
                <Mail size={14} />
                <span className="text-[13px]">{application.zalo || application.user?.email || 'adopter@pawlife.vn'}</span>
              </div>
              <button className="flex items-center gap-2 text-gray-600 hover:text-[#E89B5A] transition-colors text-[13px]">
                <Download size={14} />
                <u>Download <span className="font-semibold">{(application.fullName || application.user?.name || 'Julia').split(' ')[0]} - Application.pdf</span></u>
              </button>

              {/* Mini Pet Card */}
              <div className="mt-4 border border-gray-200 rounded-[12px] p-2 flex items-center gap-3 w-full bg-white shadow-sm">
                <img
                  src={application.pet?.avatarUrl || application.pet?.images?.[0]?.url || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100"}
                  className="w-11 h-11 rounded-lg object-cover"
                  alt={application.pet?.name || 'Luna'}
                />
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

          {/* 2. Tags Section (Động) */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[14px] text-gray-900">Gắn thẻ</h3>
              <button onClick={() => setIsAddingTag(!isAddingTag)} className="text-gray-400 hover:text-gray-600 text-[12px] flex items-center gap-1">
                + thẻ
              </button>
            </div>

            {isAddingTag && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Tên thẻ mới..."
                  className="bg-[#F6F6F6] text-[12px] px-3 py-1.5 rounded-full outline-none border border-gray-200 focus:border-[#E89B5A]"
                  autoFocus
                />
                <button onClick={handleAddTag} className="p-1 bg-[#E89B5A] text-white rounded-full">
                  <Plus size={12} />
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {tags.filter((tag) => tag && tag.id && tag.name).map((tag) => (
                <span
                  key={tag.id}
                  className="px-3.5 py-1.5 bg-[#EEF3FF] text-[#5982E6] text-[12px] font-medium rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-[#E3ECFF] transition-colors"
                >
                  {tag.name}
                  <X size={12} onClick={() => handleRemoveTag(tag.id)} className="hover:text-red-500 transition-colors" />
                </span>
              ))}
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
                    <select
                      value={selectedDoc}
                      onChange={(e) => setSelectedDoc(e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-[10px] px-4 py-2.5 text-[13px] text-gray-800 outline-none focus:border-[#E89B5A] cursor-pointer"
                    >
                      <option value="Chấp thuận từ chủ nhà">Chọn tài liệu cần bổ sung</option>
                      <option value="Chấp thuận từ chủ nhà">Chấp thuận từ chủ nhà</option>
                      <option value="Xác nhận thu nhập">Xác nhận thu nhập</option>
                      <option value="Ảnh không gian sống">Ảnh không gian sống</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* State 1: Missing */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-[13px] text-gray-900">{selectedDoc}</span>
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">Missing</span>
                        </div>
                        <p className="text-[12px] text-gray-500 leading-relaxed pr-2">
                          Nếu bạn đang thuê nhà, chúng mình cần sự đồng ý từ chủ nhà để đảm bảo rằng thú cưng được phép sống an toàn tại nơi ở của bạn.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 w-[100px]">
                        <button onClick={handleSubmit} className="w-full bg-[#F3A571] hover:bg-[#E89B5A] transition-colors text-white font-bold text-[12px] py-2 rounded-lg shadow-sm">Yêu cầu</button>
                        <button onClick={onClose} className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2 rounded-lg">Hủy</button>
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
                        <button onClick={onClose} className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2 rounded-lg">Hủy</button>
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
                        <button onClick={handleSubmit} className="w-full bg-[#5982E6] hover:bg-[#4a72d4] transition-colors text-white font-bold text-[12px] py-2.5 rounded-lg shadow-sm">Xem tài liệu</button>
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
                        <button onClick={handleSubmit} className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2.5 rounded-lg">Xem</button>
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

            {/* Ghi chú nội bộ (Động) */}
            <div>
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsNotesOpen(!isNotesOpen)}>
                <h3 className="font-bold text-[14px] text-gray-900">Ghi chú nội bộ</h3>
                {isNotesOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
              {isNotesOpen && (
                <div className="flex flex-col gap-4">
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