'use client';

import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, Download, ChevronUp, ChevronDown, Send, Mars, Venus, Plus, Eye } from 'lucide-react';
import { AdoptionApplication, ApplicationTag, ApplicationNote } from '@/types/application';
import { applicationService } from '@/services/applicationService'; // Gọi API thật, tránh mất dữ liệu khi reload
import { DOCUMENT_TYPE_OPTIONS, RequiredDocument } from '@/constants/adoptionDocuments';
import { DocumentReviewModal, DocumentReviewData } from './DocumentReviewModal';
import { RequestedDocument } from './RequestDocumentsModal';
// Item tài liệu hiển thị trong modal: `requested = true` là đã chính thức yêu
// cầu (từ RequestDocumentsModal hoặc đã bấm "Yêu cầu"); `requested = false`
// là mới thêm qua "+ Thêm tài liệu bổ sung", đang chờ xác nhận gửi.
type RequiredDocRow = RequiredDocument & {
  id?: string; // chỉ có khi đã tồn tại thật trong DB (đã "Yêu cầu" thành công)
  requested: boolean;
  submitted: boolean;
  reviewStatus?: 'accepted' | 'rejected';
  rejectionReason?: string;
};

// Map 1 ApplicationDocument từ BE -> row hiển thị ở FE
const mapBackendDoc = (doc: RequestedDocument): RequiredDocRow => ({
  key: doc.key,
  label: doc.label,
  description: doc.description,
  id: doc.id,
  requested: true,
  submitted: doc.status !== 'PENDING_SUBMISSION',
  reviewStatus: doc.status === 'ACCEPTED' ? 'accepted' : doc.status === 'REJECTED' ? 'rejected' : undefined,
  rejectionReason: doc.rejectionReason || undefined,
});

interface NeedMoreInfoModalProps {
  application: AdoptionApplication;
  /** Danh sách tài liệu ĐÃ tạo thật ở BE (có id), truyền từ RequestDocumentsModal */
  initialDocuments?: RequestedDocument[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  onRefresh?: () => void;
}

export const NeedMoreInfoModal: React.FC<NeedMoreInfoModalProps> = ({
  application,
  initialDocuments,
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
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // LOGIC NGHIỆP VỤ: Danh sách tài liệu yêu cầu — khởi tạo từ initialDocuments
  // (chọn ở RequestDocumentsModal). Nếu không có gì truyền vào (ví dụ mở
  // trực tiếp modal này) thì fallback về "Chấp thuận từ chủ nhà" để không rỗng.
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocRow[]>(
    () => (initialDocuments ?? []).map(mapBackendDoc)
  );
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isAddDocPickerOpen, setIsAddDocPickerOpen] = useState(false);
  const [reviewingDocKey, setReviewingDocKey] = useState<string | null>(null);
  const isMale = application.pet?.gender !== 'FEMALE';
  // Chấp nhận tài liệu sau khi xem trong DocumentReviewModal
  const handleAcceptDocument = async (key: string) => {
    const doc = requiredDocs.find((d) => d.key === key);
    if (!doc?.id) return;
    try {
      const updated: RequestedDocument = await applicationService.reviewDocument(
        application.id,
        doc.id,
        { status: 'ACCEPTED' },
      );
      setRequiredDocs((prev) => prev.map((d) => (d.key === key ? mapBackendDoc(updated) : d)));
    } catch (error) {
      console.error('Lỗi khi chấp nhận tài liệu:', error);
    } finally {
      setReviewingDocKey(null);
    }
  };

  const handleRejectDocument = async (key: string, reason: string) => {
    const doc = requiredDocs.find((d) => d.key === key);
    if (!doc?.id) return;

    try {
      const updated: RequestedDocument = await applicationService.reviewDocument(
        application.id,
        doc.id,
        { status: 'REJECTED', reason: reason || undefined },
      );
      setRequiredDocs((prev) => prev.map((d) => (d.key === key ? mapBackendDoc(updated) : d)));
    } catch (error) {
      console.error('Lỗi khi từ chối tài liệu:', error);
    } finally {
      setReviewingDocKey(null);
    }

    // Ghi lại lý do từ chối vào Internal Notes (giữ nguyên logic cũ)
    if (reason.trim()) {
      try {
        const response = await applicationService.addNote(
          application.id,
          `Từ chối tài liệu "${doc.label}": ${reason.trim()}`
        );
        const addedNote = response?.data || response;
        setNotes((prev) => [
          {
            id: addedNote?.id || Date.now().toString(),
            authorId: addedNote?.authorId || 'current-user',
            authorName: addedNote?.author?.name || 'Staff Member',
            authorAvatar:
              addedNote?.author?.avatarUrl ||
              'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100',
            content: addedNote?.content || `Từ chối tài liệu "${doc.label}": ${reason.trim()}`,
            createdAt: 'Vừa xong',
          },
          ...prev,
        ]);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Lỗi khi ghi lại lý do từ chối:', error);
      }
    }
  };

  const reviewingDoc = requiredDocs.find((d) => d.key === reviewingDocKey) ?? null;
  // Đồng bộ lại notes/tags/requiredDocs mỗi khi mở modal cho 1 application khác
  // (phòng trường hợp component không bị unmount giữa 2 lần mở)
  useEffect(() => {
    setNotes(application.notes || []);
    setTags(application.tags ? application.tags.map((t: any) => t.tag || t) : []);

    if (initialDocuments && initialDocuments.length > 0) {
      setRequiredDocs(initialDocuments.map(mapBackendDoc));
      return;
    }

    // Mở modal trực tiếp (không qua RequestDocumentsModal) -> lấy dữ liệu thật từ BE
    let cancelled = false;
    setIsLoadingDocs(true);
    applicationService
      .getApplicationDocuments(application.id)
      .then((docs: RequestedDocument[]) => {
        if (!cancelled) setRequiredDocs(docs.map(mapBackendDoc));
      })
      .catch((error) => {
        console.error('Lỗi khi tải danh sách tài liệu:', error);
        if (!cancelled) setRequiredDocs([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDocs(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application.id]);

  // Danh sách tài liệu còn có thể thêm (loại trừ những cái đã có trong requiredDocs)
  const availableDocOptions = DOCUMENT_TYPE_OPTIONS.filter(
    (opt) => !requiredDocs.some((d) => d.key === opt.key)
  );

  // Thêm 1 tài liệu bổ sung vào cuối danh sách, ở trạng thái "chưa yêu cầu"
  const handleAddDocument = (doc: RequiredDocument) => {
    setRequiredDocs((prev) => [...prev, { ...doc, requested: false, submitted: false }]);
    setIsAddDocPickerOpen(false);
  };

  // Chính thức "Yêu cầu" 1 tài liệu bổ sung mới thêm
  const handleRequestDocument = async (key: string) => {
    const doc = requiredDocs.find((d) => d.key === key);
    if (!doc || doc.requested) return;
    try {
      const created: RequestedDocument[] = await applicationService.requestDocuments(
        application.id,
        [{ key: doc.key, label: doc.label, description: doc.description }],
      );
      setRequiredDocs((prev) => prev.map((d) => (d.key === key ? mapBackendDoc(created[0]) : d)));
    } catch (error) {
      console.error('Lỗi khi gửi yêu cầu tài liệu:', error);
    }
  };
  const handleSimulateSubmit = async (key: string) => {
    const doc = requiredDocs.find((d) => d.key === key);
    if (!doc?.id) return;
    try {
      const updated: RequestedDocument = await applicationService.simulateSubmitDocument(
        application.id,
        doc.id,
      );
      setRequiredDocs((prev) => prev.map((d) => (d.key === key ? mapBackendDoc(updated) : d)));
    } catch (error) {
      console.error('Lỗi khi mô phỏng nộp tài liệu:', error);
    }
  };
  // Gỡ 1 tài liệu khỏi danh sách yêu cầu
  const handleRemoveDocument = async (key: string) => {
    const doc = requiredDocs.find((d) => d.key === key);
    if (!doc) return;

    if (doc.id) {
      try {
        await applicationService.removeDocument(application.id, doc.id);
      } catch (error) {
        console.error('Lỗi khi gỡ tài liệu:', error);
        return; // không xoá khỏi UI nếu API lỗi, tránh lệch state với BE
      }
    }

    setRequiredDocs((prev) => prev.filter((d) => d.key !== key));
  };

  // Thêm Tag mới - Gọi API thực sự tới BE (find-or-create theo tên)
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const added = await applicationService.addTag(application.id, { name: newTagName.trim() });
      const newTag: ApplicationTag | undefined = added?.tag ?? added;

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

  // Gộp danh sách tài liệu ĐÃ yêu cầu thành reviewNote khi chuyển trạng thái
  const handleSubmit = () => {
    const requestedLabels = requiredDocs.filter((d) => d.requested).map((d) => d.label);
    const reviewNote =
      requestedLabels.length > 0
        ? `Cần bổ sung tài liệu: ${requestedLabels.join(', ')}${noteInput ? '. ' + noteInput : ''}`
        : noteInput || 'Yêu cầu bổ sung tài liệu';

    onSubmit({ reviewNote, tags, notes, requiredDocuments: requiredDocs });
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

            {/* Bổ sung tài liệu (Động — dữ liệu thật từ RequestDocumentsModal) */}
            <div>
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsDocsOpen(!isDocsOpen)}>
                <h3 className="font-bold text-[14px] text-gray-900">Bổ sung tài liệu</h3>
                {isDocsOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>

              {isDocsOpen && (
                <div className="flex flex-col gap-4">
                  {requiredDocs.length === 0 ? (
                    <p className="text-[12px] text-gray-400 italic">Chưa có tài liệu nào được yêu cầu.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {requiredDocs.map((doc) => (
                        <div key={doc.key} className="flex gap-4 items-start border border-gray-100 rounded-[12px] p-3.5">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-bold text-[13px] text-gray-900">{doc.label}</span>
                              {!doc.requested && (
                                <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                  Chưa gửi yêu cầu
                                </span>
                              )}
                              {doc.requested && !doc.submitted && (
                                <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                  Chờ nộp tài liệu
                                </span>
                              )}
                              {doc.requested && doc.submitted && doc.reviewStatus === 'accepted' && (
                                <span className="bg-[#E7F8ED] text-[#16A34A] text-[10px] font-medium px-2 py-0.5 rounded-full">
                                  Đã chấp nhận
                                </span>
                              )}
                              {doc.requested && doc.submitted && doc.reviewStatus === 'rejected' && (
                                <span className="bg-red-50 text-red-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                  Đã từ chối
                                </span>
                              )}
                              {doc.requested && doc.submitted && !doc.reviewStatus && (
                                <span className="bg-[#FFF8E6] text-[#E89B5A] text-[10px] font-medium px-2 py-0.5 rounded-full">
                                  Chờ duyệt
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-gray-500 leading-relaxed pr-2">{doc.description}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0 w-[100px]">
                            {doc.requested ? (
                              !doc.submitted ? (
                                // Bước 2: đã yêu cầu nhưng người nộp đơn chưa "gửi" tài liệu
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSimulateSubmit(doc.key)}
                                    className="w-full bg-[#EEF3FF] hover:bg-[#E3ECFF] transition-colors text-[#5982E6] font-bold text-[12px] py-2 rounded-lg"
                                  >
                                    Simulate submit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDocument(doc.key)}
                                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2 rounded-lg"
                                  >
                                    Đóng
                                  </button>
                                </>
                              ) : !doc.reviewStatus ? (
                                // Bước 3: đã nộp, đang chờ staff Duyệt (Accept/Reject)
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setReviewingDocKey(doc.key)}
                                    className="w-full flex items-center justify-center gap-1 bg-[#FFF8E6] hover:bg-[#FDEFC9] transition-colors text-[#E89B5A] font-bold text-[12px] py-2 rounded-lg"
                                  >
                                    <Eye size={13} /> Duyệt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDocument(doc.key)}
                                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2 rounded-lg"
                                  >
                                    Đóng
                                  </button>
                                </>
                              ) : (
                                // Bước 4: đã duyệt xong (accepted/rejected) -> chỉ Xem lại, read-only
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setReviewingDocKey(doc.key)}
                                    className="w-full flex items-center justify-center gap-1 bg-[#EEF3FF] hover:bg-[#E3ECFF] transition-colors text-[#5982E6] font-bold text-[12px] py-2 rounded-lg"
                                  >
                                    <Eye size={13} /> Xem
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDocument(doc.key)}
                                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2 rounded-lg"
                                  >
                                    Đóng
                                  </button>
                                </>
                              )
                            ) : (
                              // Bước 1: chưa yêu cầu
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRequestDocument(doc.key)}
                                  className="w-full bg-[#F3A571] hover:bg-[#E89B5A] transition-colors text-white font-bold text-[12px] py-2 rounded-lg shadow-sm"
                                >
                                  Yêu cầu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDocument(doc.key)}
                                  className="w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 font-medium text-[12px] py-2 rounded-lg"
                                >
                                  Hủy
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Thêm tài liệu bổ sung — chọn từ cùng danh mục với RequestDocumentsModal */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAddDocPickerOpen((v) => !v)}
                      disabled={availableDocOptions.length === 0}
                      className="flex items-center gap-1.5 text-[#E89B5A] hover:text-[#D68B4E] transition-colors text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} /> Thêm tài liệu bổ sung
                    </button>

                    {isAddDocPickerOpen && (
                      <div className="mt-2 border border-gray-200 rounded-[12px] overflow-hidden divide-y divide-gray-100 bg-white shadow-sm max-h-[220px] overflow-y-auto">
                        {availableDocOptions.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleAddDocument(opt)}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
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

        {reviewingDoc && (
          <DocumentReviewModal
            document={{ ...reviewingDoc, submittedAt: application.updatedAt || application.createdAt }}
            onClose={() => setReviewingDocKey(null)}
            onAccept={() => handleAcceptDocument(reviewingDoc.key)}
            onReject={(reason) => handleRejectDocument(reviewingDoc.key, reason)}
            readOnly={!!reviewingDoc.reviewStatus} // đã duyệt rồi -> chỉ xem, không cho đổi quyết định
          />
        )}
      </div>
    </div>
  );
};