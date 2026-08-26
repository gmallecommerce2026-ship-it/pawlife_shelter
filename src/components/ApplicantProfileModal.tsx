'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Phone, Mail, ChevronDown, Check, MessageSquare, Flag, Loader2 } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import { applicationService } from '@/services/applicationService';
import type { ApplicantProfileResponse, ApplicationNoteType } from '@/types/application';

interface ApplicantProfileModalProps {
  application: AdoptionApplication;
  onClose: () => void;
}
const NOTE_TYPE_OPTIONS: { value: ApplicationNoteType; label: string }[] = [
  { value: 'HOME_VISIT', label: 'Home Visit' },
  { value: 'VET_RECORDS', label: 'Vet Records' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'CONCERN', label: 'Concern' },
  { value: 'REJECTION', label: 'Rejection' },
  { value: 'REFERENCE_CHECK', label: 'Reference Check' },
  { value: 'BACKGROUND_CHECK', label: 'Background Check' },
];

const NOTE_TYPE_STYLE: Record<ApplicationNoteType, { label: string; color: string }> = {
  HOME_VISIT: { label: 'Home Visit', color: '#1B8A44' },
  VET_RECORDS: { label: 'Vet Records', color: '#3B6BE3' },
  FOLLOW_UP: { label: 'Follow-up', color: '#0EA5A5' },
  CONCERN: { label: 'Concern', color: '#D97706' },
  REJECTION: { label: 'Rejection', color: '#DC2626' },
  REFERENCE_CHECK: { label: 'Reference Check', color: '#7C3AED' },
  BACKGROUND_CHECK: { label: 'Background Check', color: '#8A38D4' },
};
const STATUS_BADGE: Record<string, { label: string; bg: string; border: string; text: string }> = {
  SUBMITTED: { label: 'Submitted', bg: '#F3F4F6', border: '#E5E7EB', text: '#374151' },
  PENDING: { label: 'Pending', bg: '#FFF8F0', border: '#FFE1C2', text: '#E89B5A' },
  NEED_MORE_INFO: { label: 'Need Info', bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' },
  INTERVIEW_SCHEDULED: { label: 'Interview', bg: '#F4E8FF', border: '#E9D5FF', text: '#8A38D4' },
  APPROVED: { label: 'Approved', bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB' },
  ADOPTION_COMPLETED: { label: 'Adopted', bg: '#F2FCF5', border: '#D1F2D9', text: '#1B8A44' },
  CLOSED: { label: 'Closed', bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const ApplicantProfileModal: React.FC<ApplicantProfileModalProps> = ({ application, onClose }) => {
  const [profile, setProfile] = useState<ApplicantProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<ApplicationNoteType | ''>('');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setIsTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNote = async () => {
    if (!noteContent.trim() || !noteType) return;
    try {
      setIsSubmittingNote(true);
      await applicationService.addNote(application.id, noteContent.trim(), noteType);
      setNoteContent('');
      setNoteType('');
      await loadProfile();
    } catch (err) {
      console.error('Lỗi khi thêm note:', err);
      alert('Không thể thêm ghi chú. Vui lòng thử lại.');
    } finally {
      setIsSubmittingNote(false);
    }
  };
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await applicationService.getApplicantProfile(application.id);
      if (!data) {
        throw new Error('Empty applicant profile response');
      }
      setProfile(data);
    } catch (err) {
      console.error('Không tải được hồ sơ applicant:', err);
      setError('Không thể tải hồ sơ người nhận nuôi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application.id]);



  const fullName = profile?.applicant.fullName || application.fullName || application.user?.name || '';
  const phone = profile?.applicant.phone || application.phone || '';
  const email = profile?.applicant.email || application.zalo || '';
  const avatar = profile?.applicant.avatarUrl || application.pet?.avatarUrl || application.pet?.images?.[0]?.url || '/images/placeholder-avatar.png';

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
              src={avatar}
              alt={fullName}
              className="w-[84px] h-[84px] rounded-[20px] object-cover bg-gray-100 border border-gray-200"
            />
            <div className="flex flex-col">
              <h2 className="font-['Be_Vietnam_Pro',_sans-serif] text-[24px] font-bold text-gray-900 leading-tight mb-2">
                {fullName || '—'}
              </h2>
              <div className="flex items-center gap-6 mb-5">
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone size={14} />
                  <span className="text-[13px] font-medium">{phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail size={14} />
                  <span className="text-[13px] font-medium">{email || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="flex flex-col border-r border-gray-200 pr-10">
                  <span className="text-[22px] font-bold text-gray-900 leading-none mb-1">
                    {profile ? profile.stats.activeApplications : '–'}
                  </span>
                  <span className="text-[13px] text-gray-500">Active Applications</span>
                </div>
                <div className="flex flex-col border-r border-gray-200 pr-10">
                  <span className="text-[22px] font-bold text-gray-900 leading-none mb-1">
                    {profile ? profile.stats.successfulAdoptions : '–'}
                  </span>
                  <span className="text-[13px] text-gray-500">Successful Adoptions</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[22px] font-bold text-gray-900 leading-none mb-1">
                    {profile ? profile.stats.totalApplications : '–'}
                  </span>
                  <span className="text-[13px] text-gray-500">Total Applications</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[13px] text-red-500">{error}</p>
            <button onClick={loadProfile} className="text-[13px] font-bold text-[#E89B5A] hover:underline">
              Thử lại
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 flex gap-6">
            {/* Left Column */}
            <div className="w-1/2 flex flex-col gap-4">

              {/* Active Applications */}
              <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[16px] text-gray-900">
                    Active Applications ({profile!.activeApplications.length})
                  </h3>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
                {profile!.activeApplications.length === 0 ? (
                  <p className="text-[13px] text-gray-400 py-2">Không có đơn nào đang hoạt động.</p>
                ) : (
                  profile!.activeApplications.map((app, idx) => {
                    const badge = STATUS_BADGE[app.status] ?? STATUS_BADGE.SUBMITTED;
                    return (
                      <div
                        key={app.id}
                        className={`flex items-center gap-3 ${idx !== 0 ? 'border-t border-gray-100 pt-4 mt-4' : ''}`}
                      >
                        <img
                          src={app.pet.avatarUrl || '/images/dog-placeholder.png'}
                          alt={app.pet.name}
                          className="w-[52px] h-[52px] rounded-[12px] object-cover"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-[15px] text-gray-900">{app.pet.name}</span>
                          <span className="text-[13px] text-gray-500">{app.shelterName || '—'}</span>
                          <span className="text-[11px] text-gray-400 mt-0.5">Applied on {formatDate(app.createdAt)}</span>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full border"
                          style={{ background: badge.bg, borderColor: badge.border }}
                        >
                          <span className="text-[11px] font-bold" style={{ color: badge.text }}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Adoption History */}
              <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[16px] text-gray-900">
                    Adoption History ({profile!.adoptionHistory.length})
                  </h3>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
                {profile!.adoptionHistory.length === 0 ? (
                  <p className="text-[13px] text-gray-400 py-2">Chưa có lịch sử nhận nuôi thành công.</p>
                ) : (
                  profile!.adoptionHistory.map((app, idx) => (
                    <div
                      key={app.id}
                      className={`flex items-center gap-3 py-4 ${idx !== 0 ? 'border-t border-gray-100' : 'pt-0'}`}
                    >
                      <img
                        src={app.pet.avatarUrl || '/images/dog-placeholder.png'}
                        alt={app.pet.name}
                        className="w-[52px] h-[52px] rounded-[12px] object-cover"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-[15px] text-gray-900">{app.pet.name}</span>
                        <span className="text-[13px] text-gray-500">{app.shelterName || '—'}</span>
                        <span className="text-[11px] text-gray-400 mt-0.5">Applied on {formatDate(app.createdAt)}</span>
                      </div>
                      <div className="bg-[#F2FCF5] px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#D1F2D9]">
                        <Check size={12} className="text-[#1B8A44]" />
                        <span className="text-[11px] font-bold text-[#1B8A44]">Adopted</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Current Pets */}
              <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[16px] text-gray-900">
                    Current Pet ({profile!.currentPets.length})
                  </h3>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
                {profile!.currentPets.length === 0 ? (
                  <p className="text-[13px] text-gray-400 py-2">Chưa ghi nhận thú cưng nào.</p>
                ) : (
                  profile!.currentPets.map((pet, idx) => (
                    <div
                      key={pet.id}
                      className={`flex items-center gap-3 py-4 ${idx !== 0 ? 'border-t border-gray-100' : 'pt-0'}`}
                    >
                      <img
                        src={pet.avatarUrl || '/images/dog-placeholder.png'}
                        alt={pet.name}
                        className="w-[52px] h-[52px] rounded-[12px] object-cover"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-[15px] text-gray-900">{pet.name}</span>
                        <span className="text-[13px] text-gray-500">{pet.status}</span>
                      </div>
                      {pet.qrVerificationStatus === 'VERIFIED' && (
                        <div className="bg-[#FFF8F0] px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#FFE1C2]">
                          <span className="text-[11px] font-bold text-[#E89B5A]">QR Registered</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column — Notes */}
            <div className="w-1/2 flex flex-col h-full">
              <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm flex-1 flex flex-col">
                <h3 className="font-bold text-[16px] text-gray-900 mb-6">
                  Shelter Notes ({profile!.notes.length})
                </h3>

                <div className="flex flex-col gap-6">
                  {profile!.notes.length === 0 ? (
                    <p className="text-[13px] text-gray-400">Chưa có ghi chú nào.</p>
                  ) : (
                    profile!.notes.map((note, idx) => {
                      const style = NOTE_TYPE_STYLE[note.type];
                      return (
                        <div key={note.id} className="flex gap-4">
                          <div
                            className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
                            style={{ borderColor: style.color }}
                          >
                            <MessageSquare size={18} style={{ color: style.color }} />
                          </div>
                          <div
                            className={`flex flex-col flex-1 ${idx !== profile!.notes.length - 1 ? 'border-b border-gray-100 pb-5' : ''
                              }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-[14px] text-gray-900">
                                {note.author.name || 'Nhân viên trạm'}
                              </h4>
                              <Flag size={14} className="text-gray-400" />
                            </div>
                            <p className="text-[11px] text-gray-500 mb-2">
                              <span className="font-bold" style={{ color: style.color }}>{style.label}</span>
                              {' · '}{formatDate(note.createdAt)}
                            </p>
                            <p className="text-[13px] text-gray-600 leading-relaxed">{note.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add New Note */}
                <div className="mt-6 border border-dashed border-gray-300 rounded-[16px] p-5 bg-[#FAFAFA]">
                  <h4 className="font-bold text-[14px] text-gray-900 mb-4">Add New Note</h4>

                  <div className="flex flex-col gap-4">
                    <div className="relative" ref={typeDropdownRef}>
                      <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Note Type</label>
                      <button
                        type="button"
                        onClick={() => setIsTypeOpen((v) => !v)}
                        className={`w-full bg-white border rounded-lg px-3 py-2.5 flex justify-between items-center text-left transition-colors ${isTypeOpen ? 'border-[#E89B5A] ring-2 ring-[#E89B5A]/20' : 'border-gray-200'
                          }`}
                      >
                        <span className={`text-[13px] ${noteType ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {noteType ? NOTE_TYPE_OPTIONS.find((o) => o.value === noteType)?.label : 'Select type...'}
                        </span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isTypeOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => { setNoteType(''); setIsTypeOpen(false); }}
                            className="w-full text-left px-3 py-2.5 text-[13px] text-gray-400 hover:bg-gray-50"
                          >
                            Select type...
                          </button>
                          {NOTE_TYPE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => { setNoteType(opt.value); setIsTypeOpen(false); }}
                              className={`w-full text-left px-3 py-2.5 text-[13px] transition-colors ${noteType === opt.value
                                ? 'bg-[#2563EB] text-white font-bold'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Detail</label>
                      <textarea
                        rows={3}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none"
                        placeholder="Enter note detail..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center mt-4 gap-3">
                    <span className="text-[11px] text-gray-500 text-center">
                      Share observable facts · Visible only to verified shelters
                    </span>
                    <button
                      onClick={handleAddNote}
                      disabled={isSubmittingNote || !noteContent.trim() || !noteType}
                      className="bg-[#F49494] hover:bg-[#FF7070] transition-colors text-white font-bold text-[13px] py-[12px] px-[29px] rounded-full shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmittingNote ? 'Đang lưu...' : 'Add Shelter Note'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};