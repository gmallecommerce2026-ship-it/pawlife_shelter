'use client';

import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, Download, ChevronUp, ChevronDown, Send, Check, MoreHorizontal, Mars, Venus, Plus } from 'lucide-react';
import { AdoptionApplication, ApplicationTag, ApplicationNote } from '@/types/application';
import { applicationService } from '@/services/applicationService'; // Import Service gọi API BE

// --- Sub-components (GIỮ NGUYÊN 100% UI) ---
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-3 bg-white border border-gray-200 rounded-[8px] overflow-hidden">
    <div className="px-4 py-2.5 border-b border-gray-100 bg-[#FAFAFA]">
      <h3 className="font-bold text-[12px] text-gray-900">{title}</h3>
    </div>
    <div className="px-4 py-3">
      {children}
    </div>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col">
    <span className="font-sans text-[11px] text-gray-400 mb-0.5 leading-none">
      {label}
    </span>
    <span className="font-sans text-[12px] text-gray-900 font-medium leading-snug">
      {value || '-'}
    </span>
  </div>
);

const CommitmentCheck = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2">
    <Check size={14} className="text-[#34C759] shrink-0" strokeWidth={3} />
    <span className="font-sans text-[12px] text-gray-900 font-medium">
      {label}
    </span>
  </div>
);

interface ApplicationQuickViewModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ApplicationQuickViewModal: React.FC<ApplicationQuickViewModalProps> = ({
  application,
  onClose,
  onRefresh,
}) => {
  const [isAppOpen, setIsAppOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);

  // LOGIC NGHIỆP VỤ: Quản lý danh sách Tag động (khởi tạo từ dữ liệu thật, không dùng mock mặc định)
  const [tags, setTags] = useState<ApplicationTag[]>(
    application.tags ? application.tags.map((t: any) => t.tag || t) : []
  );
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // LOGIC NGHIỆP VỤ: Quản lý danh sách Ghi chú động (khởi tạo từ dữ liệu thật)
  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const isMale = application.pet?.gender !== 'FEMALE';

  // Đồng bộ lại notes/tags mỗi khi mở modal cho 1 application khác
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
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    }
  };

  // Thêm Ghi chú nội bộ - Gọi API thực sự tới BE
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

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi khi thêm ghi chú:', error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[460px] max-h-[90vh] rounded-[20px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1.5 bg-white hover:bg-gray-100 rounded-full z-10">
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* 1. Header & Applicant Profile */}
          <div className="flex gap-5 mb-8 mt-2">
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
                <span className="text-[13px]">{application.zalo || 'adopter@pawlife.vn'}</span>
              </div>
              <button className="flex items-center gap-2 text-gray-600 hover:text-[#E89B5A] transition-colors text-[13px]">
                <Download size={14} />
                <u>Tải đơn <span className="font-semibold">{application.fullName || application.user?.name || "Maria Garcia".split(' ')[0]} - Application.pdf</span></u>
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

          {/* 2. Tags Section (Động) */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[14px] text-gray-900">Gắn thẻ</h3>
              <button onClick={() => setIsAddingTag(!isAddingTag)} className="text-gray-400 hover:text-gray-600 text-[12px] flex items-center gap-1">+ thẻ</button>
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
                <button onClick={handleAddTag} className="p-1 bg-[#E89B5A] text-white rounded-full"><Plus size={12} /></button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {tags.filter((tag) => tag && tag.id && tag.name).map((tag) => (
                <span
                  key={tag.id}
                  className="px-3.5 py-1.5 bg-[#EEF3FF] text-[#5982E6] text-[12px] font-medium rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-[#E3ECFF] transition-colors"
                >
                  {tag.name} <X size={12} onClick={() => handleRemoveTag(tag.id)} className="hover:text-red-500 transition-colors" />
                </span>
              ))}
            </div>
          </div>

          {/* 3. Đơn nhận nuôi (Accordion) */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsAppOpen(!isAppOpen)}>
              <h3 className="font-bold text-[14px] text-gray-900">Đơn nhận nuôi</h3>
              {isAppOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </div>
            {isAppOpen && (
              <div className="flex flex-col">
                <SectionCard title="B - Living Conditions">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                    <Field label="Location" value={application.location || 'Cầu Giấy, Hà Nội'} />
                    <Field label="Housing Type" value={application.housing || 'Apartment (allows pet ownership)'} />
                    <Field label="Children" value={application.children || 'Yes, 3 children'} />
                    <Field label="Cage Plan For" value={application.cage || 'No'} />
                  </div>
                </SectionCard>
                <SectionCard title="C - Pet Experience">
                  <div className="flex flex-col gap-4">
                    <Field label="Previous Pet" value={application.petExperience || 'Yes, 3 cats & 2 dogs'} />
                    <Field label="Housing Type" value={application.prevPetHistory || 'My previous dogs passed away due to old age after 12 years together.'} />
                  </div>
                </SectionCard>
                <SectionCard title="D - Employment & Personal">
                  <Field label="Employment" value={application.employmentStatus || 'Currently employed'} />
                </SectionCard>
                <SectionCard title="E - Adoption Commitment">
                  <div className="mb-4">
                    <Field label="Reason for Adoption" value={application.adoptionReason || 'Because I want to give them a forever home'} />
                  </div>
                  <div className="w-full h-px bg-gray-100 mb-4" />
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <CommitmentCheck label="Yearly vaccinations" />
                    <CommitmentCheck label="Provide status updates" />
                    <CommitmentCheck label="Hospital treatment when needed" />
                    <CommitmentCheck label="Allow home visits" />
                    <CommitmentCheck label="Cover pre-adoption expenses" />
                    <CommitmentCheck label="Willing to provide needed personal info" />
                  </div>
                </SectionCard>
              </div>
            )}
          </div>

          {/* 4. Ghi chú nội bộ (Accordion Động) */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsNotesOpen(!isNotesOpen)}>
              <h3 className="font-bold text-[14px] text-gray-900">Ghi chú nội bộ</h3>
              {isNotesOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </div>
            {isNotesOpen && (
              <div className="flex flex-col gap-5">
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

        {/* Bottom Fixed Action Button */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
          <button onClick={onClose} className="w-full bg-[#E89B5A] hover:bg-[#D68B4E] transition-colors text-white font-bold text-[14px] py-3.5 rounded-[12px] shadow-sm shadow-orange-100">
            Bước tiếp theo
          </button>
        </div>
      </div>
    </div>
  );
};