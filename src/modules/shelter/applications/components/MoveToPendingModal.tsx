'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Download,
  ChevronDown,
  Send,
  Check,
  Mars,
  Venus,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { AdoptionApplication, ApplicationTag, ApplicationNote } from '@/types/application';
import { applicationService } from '@/services/applicationService';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { SelectTagsModal } from './SelectTagsModal';
import { downloadApplicationPdf } from '@/utils/exportApplicationPdf';
import { formatPetAge } from '@/utils/petAge';

// Hàm chuẩn hóa cấu trúc Tag từ Prisma / Backend về dạng { id, name, color }
const normalizeTags = (rawTags: any[]): ApplicationTag[] => {
  if (!Array.isArray(rawTags)) return [];
  return rawTags
    .map((item: any) => {
      if (!item) return null;
      if (typeof item === 'string') return { id: item, name: item };
      if (item.tag && typeof item.tag === 'object') {
        return {
          id: item.tag.id || item.tagId || item.id || String(Date.now()),
          name: item.tag.name || item.name || '',
          color: item.tag.color || item.color,
        };
      }
      return {
        id: item.id || item.tagId || String(Date.now()),
        name: item.name || '',
        color: item.color,
      };
    })
    .filter((t): t is ApplicationTag => Boolean(t && t.name && t.name.trim() !== ''));
};

// Sub-components cho Application Details
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-3 bg-white border border-gray-200 rounded-[10px] overflow-hidden">
    <div className="px-3.5 py-2 border-b border-gray-100 bg-[#FAFAFA]">
      <h4 className="font-bold text-[11.5px] text-gray-800 uppercase tracking-wider">{title}</h4>
    </div>
    <div className="px-3.5 py-2.5">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col">
    <span className="text-[11px] text-gray-400 mb-0.5">{label}</span>
    <span className="text-[12.5px] text-gray-800 font-medium leading-snug">{value || '-'}</span>
  </div>
);

const CommitmentCheck = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2">
    <Check size={13} className="text-[#34C759] shrink-0" strokeWidth={3} />
    <span className="text-[11.5px] text-gray-800 font-medium">{label}</span>
  </div>
);

interface MoveToPendingModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onRefresh?: () => void;
}

export const MoveToPendingModal: React.FC<MoveToPendingModalProps> = ({
  application,
  onClose,
  onSubmit,
  onRefresh,
}) => {
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const [tags, setTags] = useState<ApplicationTag[]>(() => normalizeTags(application.tags || []));
  const addTagBtnRef = useRef<HTMLButtonElement>(null);
  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const isMale = application.pet?.gender !== 'FEMALE';
  const petName = application.pet?.name || 'Cún';
  const applicantFullName = application.fullName || application.user?.name || 'Người đăng ký';
  const applicantFirstName = applicantFullName.split(' ')[0] || 'Người đăng ký';
  const petBreedFormatted = formatBreed(application.pet?.breed as MaybeBilingual) || 'Chưa rõ giống';
  const petAgeFormatted = formatPetAge(application.pet?.dob); // đổi 'birthDate' theo đúng field trong type Pet
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const handleAddTagWithColor = async (tagData: { name: string; color: string }) => {
    const tagName = tagData.name.trim();
    if (!tagName) return;

    const tempTag: ApplicationTag = {
      id: `temp-${Date.now()}`,
      name: tagName,
      color: tagData.color,
    };

    setTags((prev) => {
      const isExist = prev.some((t) => t.name.toLowerCase() === tagName.toLowerCase());
      if (isExist) return prev;
      return [...prev, tempTag];
    });

    try {
      const response = await applicationService.addTag(application.id, { name: tagName, color: tagData.color });
      const resData = response?.data?.data || response?.data || response;
      const tagObj = resData?.tag || resData;
      const realTagId = tagObj?.id || resData?.tagId;
      if (realTagId) {
        setTags((prev) =>
          prev.map((t) => (t.id === tempTag.id ? { ...t, id: String(realTagId), color: tagObj?.color || tagData.color } : t))
        );
      }
      onRefresh?.();
    } catch (error) {
      setTags((prev) => prev.filter((t) => t.id !== tempTag.id));
    }
  };

  const handleRemoveTagByName = async (tagName: string) => {
    const target = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    if (target) handleRemoveTag(target.id);
  };

  useEffect(() => {
    setNotes(application.notes || []);
    setTags(normalizeTags(application.tags || []));
  }, [application.id]);

  const handleRemoveTag = async (tagId: string) => {
    const prevTags = [...tags];
    setTags((prev) => prev.filter((t) => t.id !== tagId));

    try {
      await applicationService.removeTag(application.id, tagId);
      onRefresh?.();
    } catch (error) {
      console.error('Lỗi khi xóa thẻ:', error);
      setTags(prevTags);
    }
  };

  const handleAddNote = async () => {
    const content = noteInput.trim();
    if (!content || isSubmittingNote) return;

    const tempNote: ApplicationNote = {
      id: `temp-${Date.now()}`,
      authorId: 'current-user',
      authorName: 'Nhân viên trạm',
      authorAvatar:
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100',
      content,
      createdAt: 'Vừa xong',
    };

    setNotes((prev) => [tempNote, ...prev]);
    setNoteInput('');
    setIsSubmittingNote(true);

    try {
      const response = await applicationService.addNote(application.id, content);
      const addedNote = response?.data || response;
      if (addedNote?.id) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === tempNote.id
              ? {
                ...n,
                id: addedNote.id,
                authorName: addedNote.author?.name || n.authorName,
                authorAvatar: addedNote.author?.avatarUrl || n.authorAvatar,
              }
              : n
          )
        );
      }
      onRefresh?.();
    } catch (error) {
      console.error('Lỗi khi thêm ghi chú:', error);
      setNotes((prev) => prev.filter((n) => n.id !== tempNote.id));
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      reviewNote: noteInput || 'Đã chuyển sang Đang xem xét',
      tags,
      notes,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[420px] max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1 bg-transparent hover:bg-gray-50 rounded-full z-10"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Nội dung cuộn */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* 1. Header: Avatar + Thông tin Người nhận nuôi & Pet */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative w-[94px] h-[94px] rounded-full border-[2.5px] border-[#F3A571] p-[2px] shrink-0">
              <img
                src={
                  application.user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'
                }
                className="w-full h-full rounded-full object-cover"
                alt={applicantFullName}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-start">
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight mb-2 truncate">
                {applicantFullName}
              </h2>

              <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                <Phone size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
                <span className="text-[13px] text-gray-500 font-normal truncate">
                  {application.phone || 'Chưa có SĐT'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                <Mail size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
                <span className="text-[13px] text-gray-500 font-normal truncate">
                  {application.user?.email || application.zalo || 'adopter@pawlife.vn'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FileText size={13} className="text-gray-400 shrink-0" strokeWidth={1.8} />
                <span className="text-[13px] text-gray-500 font-normal">Đang xin nhận nuôi</span>
              </div>

              <div className="flex items-center gap-2.5 mt-0.5">
                <img
                  src={
                    application.pet?.avatarUrl ||
                    application.pet?.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=100'
                  }
                  className="w-10 h-10 rounded-[10px] object-cover shrink-0 border border-gray-100"
                  alt={petName}
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[14px] text-gray-900 leading-none">
                      {petName}
                    </span>
                    {isMale ? (
                      <Mars size={13} strokeWidth={2.5} className="text-[#3DB2FF]" />
                    ) : (
                      <Venus size={13} strokeWidth={2.5} className="text-[#FF6B93]" />
                    )}
                  </div>
                  <span className="text-[11.5px] text-gray-400 mt-0.5 truncate leading-none">
                    {petAgeFormatted} • {petBreedFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Khung tải file Đơn nhận nuôi */}
          <div className="border border-gray-200 rounded-[16px] p-3.5 px-4 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors mb-6 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-[#FFF8F3] border border-[#FFE8D6] flex items-center justify-center shrink-0">
                <FileText size={18} className="text-[#F3A571]" strokeWidth={1.8} />
              </div>
              <span className="text-[13.5px] font-semibold text-gray-900 truncate">
                {applicantFirstName} - Đơn nhận nuôi.pdf
              </span>
            </div>
            <button
              type="button"
              onClick={() => downloadApplicationPdf(application)}
              title="Tải về đơn nhận nuôi (PDF)"
              className="text-gray-400 hover:text-gray-700 transition-colors p-1 cursor-pointer"
            >
              <Download size={17} strokeWidth={2} />
            </button>
          </div>

          {/* 3. Thẻ phân loại (Tags) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-[15px] text-gray-900">Gắn thẻ</h3>
              <div className="relative">
                <button
                  ref={addTagBtnRef}
                  type="button"
                  onClick={() => setIsTagModalOpen((v) => !v)}
                  className="text-[13px] font-semibold text-[#E89B5A] hover:text-[#D68B4E] transition-colors cursor-pointer"
                >
                  + Thêm
                </button>

                {isTagModalOpen && (
                  <SelectTagsModal
                    triggerRef={addTagBtnRef}
                    existingTags={tags}
                    onClose={() => setIsTagModalOpen(false)}
                    onAddTag={handleAddTagWithColor}
                    onRemoveTag={handleRemoveTagByName}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-[12px] text-gray-400 italic">Chưa có thẻ nào</span>
              ) : (
                tags.map((tag) => {
                  const tagColor = tag.color || '#5982E6';
                  return (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-[11.5px] font-semibold rounded-full flex items-center gap-1.5 border transition-all"
                      style={{
                        backgroundColor: `${tagColor}15`,
                        borderColor: `${tagColor}40`,
                        color: tagColor,
                      }}
                    >
                      {tag.name}
                      <X
                        size={12}
                        onClick={() => handleRemoveTag(tag.id)}
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                      />
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* 4. Chi tiết đơn nhận nuôi (Accordion) */}
          <div className="mb-5">
            <div
              className="flex items-center justify-between cursor-pointer select-none py-1"
              onClick={() => setIsAppOpen(!isAppOpen)}
            >
              <h3 className="font-bold text-[15px] text-gray-900">Chi tiết đơn nhận nuôi</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${isAppOpen ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </div>

            {isAppOpen && (
              <div className="flex flex-col mt-3 animate-in fade-in duration-200">
                <SectionCard title="A - Điều kiện sinh sống">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-3">
                    <Field label="Khu vực / Địa chỉ" value={application.location || 'Hà Nội'} />
                    <Field label="Loại nhà ở" value={application.housing || 'Chung cư'} />
                    <Field label="Trẻ em trong nhà" value={application.children || 'Không'} />
                    <Field label="Kế hoạch chuồng / lồng" value={application.cage || 'Không nhốt'} />
                  </div>
                </SectionCard>

                <SectionCard title="B - Kinh nghiệm nuôi dưỡng">
                  <div className="flex flex-col gap-2.5">
                    <Field label="Thú cưng từng nuôi" value={application.petExperience || 'Đã có kinh nghiệm'} />
                    <Field label="Lịch sử nuôi trước đây" value={application.prevPetHistory || '5 năm kinh nghiệm'} />
                  </div>
                </SectionCard>

                <SectionCard title="C - Cam kết nhận nuôi">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                    <CommitmentCheck label="Tiêm phòng hàng năm" />
                    <CommitmentCheck label="Cập nhật tình trạng định kỳ" />
                    <CommitmentCheck label="Khám chữa bệnh khi cần" />
                    <CommitmentCheck label="Sẵn sàng cho thăm nhà" />
                  </div>
                </SectionCard>
              </div>
            )}
          </div>

          {/* 5. Ghi chú nội bộ (Accordion) */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between cursor-pointer select-none py-1"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
            >
              <h3 className="font-bold text-[15px] text-gray-900">Ghi chú nội bộ</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${isNotesOpen ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </div>

            {isNotesOpen && (
              <div className="flex flex-col gap-3 mt-3 animate-in fade-in duration-200">
                {notes.map((note) => (
                  <div key={note.id} className="flex gap-2.5 items-start">
                    <img
                      src={
                        note.authorAvatar ||
                        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100'
                      }
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                      alt="Nhân sự"
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[12px] text-gray-900">
                          {note.authorName || 'Nhân viên trạm'}
                        </span>
                        <span className="text-[10px] text-gray-400">{note.createdAt}</span>
                      </div>
                      <p className="text-[12px] text-gray-600 mt-0.5">{note.content}</p>
                    </div>
                  </div>
                ))}

                <div className="relative w-full mt-1">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Thêm ghi chú nội bộ... (gõ @ để nhắc tên)"
                    className="w-full bg-[#F6F6F6] rounded-[12px] pl-3.5 pr-9 py-2.5 text-[12.5px] outline-none placeholder-gray-400 border border-transparent focus:border-[#F3A571]"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={isSubmittingNote}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F3A571] hover:text-[#E89B5A] disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. Nút chuyển sang Đang xem xét */}
          <div className="mt-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-[#F3A571] hover:bg-[#E89B5A] active:scale-[0.99] transition-all text-white font-semibold text-[14.5px] py-3.5 px-6 rounded-[16px] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Chuyển sang Đang xem xét</span>
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveToPendingModal;