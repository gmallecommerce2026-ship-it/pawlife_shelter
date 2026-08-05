'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  X,
  Check,
  Lock,
  Cake,
  QrCode,
  Home,
  Syringe,
  Stethoscope,
  Smile,
  User,
  HeartHandshake,
  Camera,
  FileText,
  Clock,
} from 'lucide-react';
import { usePetActions } from '@/stores/usePetStore';
import { PetSpecies, PetGender, PetStatus, PET_STATUS_LABEL } from '@/types/pet';
import axiosClient from '@/lib/api/axiosClient';

// --- TYPES & INTERFACES ---
export interface Bilingual {
  vi: string;
  en: string;
}

export type TagValue = Bilingual & { isCustom?: boolean };

export type MedicalRecordDraft = {
  localId: string;
  type: string;
  recordName: Bilingual;
  recordDate: string;
  hasNextDueDate: boolean;
  nextDueDate?: string;
  images: string[];
};

const SUGGESTED_TAGS = [
  'Hiền lành',
  'Năng động',
  'Nhút nhát',
  'Thông minh',
  'Quấn chủ',
  'Thích chơi đùa',
  'Cảnh giác',
  'Dễ huấn luyện',
];

const HISTORY_TYPE_CONFIG: Record<string, { Icon: React.ElementType; bg: string; color: string }> = {
  BIRTH: { Icon: Cake, bg: '#FFF4EC', color: '#F2A465' },
  CREATED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2' },
  QR_LINKED: { Icon: QrCode, bg: '#EAE7FB', color: '#885BF2' },
  TRANSFER: { Icon: Home, bg: '#EBFFE2', color: '#77C582' },
  VACCINE: { Icon: Syringe, bg: '#E3F0FF', color: '#5A90DA' },
  DENTAL_CARE: { Icon: Smile, bg: '#E8FFD8', color: '#5FA83D' },
  ANNUAL_CHECKUP: { Icon: Stethoscope, bg: '#E8FFD8', color: '#5FA83D' },
  CURRENT_OWNER: { Icon: User, bg: '#FFE9B8', color: '#CF7900' },
  PREVIOUS_OWNER: { Icon: User, bg: '#FFE9B8', color: '#CF7900' },
  UNDER_SHELTER_CARE: { Icon: HeartHandshake, bg: '#FFE4F0', color: '#D6447A' },
};

const DEFAULT_HISTORY_CONFIG = { Icon: Cake, bg: '#F5F5F5', color: '#8E8E93' };

// 3 màu nhãn xoay vòng cho Tags / Yêu cầu (theo ảnh mẫu: vàng cam - xanh dương - xanh lá)
const TAG_COLOR_STYLES = [
  { bg: '#FBF7EB', border: '#E8A53C', color: '#E8A53C' },
  { bg: '#E8F1FF', border: '#5A90DA', color: '#5A90DA' },
  { bg: '#EBFFE2', border: '#77C852', color: '#77C852' },
];

// Same status palette used on the pet/[id] detail page, so the badge on the
// photo behaves and looks identical between the two screens.
const STATUS_BADGE_CONFIG: Record<string, { bg: string; border: string; color: string; label: string }> = {
  AVAILABLE: { bg: '#DEFFDF', border: '#00AC47', color: '#00AC47', label: 'Chờ nhận nuôi' },
  PENDING: { bg: '#FFF8E5', border: '#FFBA00', color: '#FFBA00', label: 'Đang xét duyệt' },
  REJECTED: { bg: '#FFE2E2', border: '#9F0712', color: '#9F0712', label: 'Không đủ điều kiện' },
  HEALTH_ISSUE: { bg: '#FFEDD4', border: '#A13A17', color: '#A13A17', label: 'Vấn đề sức khoẻ' },
  ADOPTED: { bg: '#F0F0F0', border: '#BDBDBD', color: '#757575', label: 'Đã nhận nuôi' },
};

export const PetForm: React.FC<{ mode: 'create' | 'edit'; initialPet?: any }> = ({ mode, initialPet }) => {
  const router = useRouter();
  const { createPet, updatePet, isSubmitting } = usePetActions();

  const [activeTab, setActiveTab] = useState<'info' | 'applications' | 'documents'>('info');
  const [isEditing, setIsEditing] = useState(mode === 'create');

  // Form State
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<PetGender>('FEMALE');
  const [color, setColor] = useState('GOLDEN');
  const [dob, setDob] = useState('2020-07-12');
  const [weight, setWeight] = useState<number | undefined>(12);
  const [pawLifeId, setPawLifeId] = useState('PL-00000');
  const [status, setStatus] = useState<PetStatus>('AVAILABLE');

  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Playful', 'Clingy', 'Friendly']);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>(['Playful', 'Clingy', 'Friendly']);
  const [isVaccinated, setIsVaccinated] = useState(true);
  const [isSpayedNeutered, setIsSpayedNeutered] = useState(true);

  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status badge dropdown (mirrors the photo-badge dropdown on the detail page)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Submit Record State
  const [newRecordType, setNewRecordType] = useState('');
  const [newRecordNote, setNewRecordNote] = useState('');
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

  // Populating initial data
  useEffect(() => {
    if (initialPet) {
      setName(initialPet.name || 'Luna');
      setBreed(typeof initialPet.breed === 'object' ? initialPet.breed?.en || initialPet.breed?.vi || '' : initialPet.breed || 'Golden British');
      setGender(initialPet.gender || 'FEMALE');
      setColor(typeof initialPet.color === 'object' ? initialPet.color?.en || initialPet.color?.vi || '' : initialPet.color || 'GOLDEN');
      setDob(initialPet.dob ? String(initialPet.dob).slice(0, 10) : '2020-07-12');
      setWeight(initialPet.weight ?? 12);
      setPawLifeId(initialPet.code || initialPet.tags?.[0]?.id || 'PL-00000');
      setStatus(initialPet.status || 'AVAILABLE');
      setDescription(typeof initialPet.description === 'object' ? initialPet.description?.vi || initialPet.description?.en || '' : initialPet.description || '');
      setIsVaccinated(initialPet.isVaccinated ?? true);
      setIsSpayedNeutered(initialPet.isSpayedNeutered ?? true);
      setImages(Array.isArray(initialPet.images) ? initialPet.images : []);
    }
  }, [initialPet]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setCurrentImageIndex(images.length); // nhảy tới ảnh vừa thêm
    setImages((prev) => [...prev, ...previews]);
  };

  const goPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleRequirement = (req: string) => {
    setSelectedRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload: any = {
      name,
      breed,
      gender,
      color,
      dob,
      weight,
      status,
      description,
      isVaccinated,
      isSpayedNeutered,
      code: pawLifeId,
    };

    let success = false;
    if (mode === 'create') {
      success = await createPet(payload, imageFiles);
    } else if (initialPet) {
      success = await updatePet(initialPet.id, payload, imageFiles, images);
    }

    if (success) {
      setIsEditing(false);
      router.push('/shelter/pets');
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordType || !newRecordNote.trim() || !initialPet) return;
    setIsSubmittingRecord(true);
    try {
      await axiosClient.post(`/pets/${initialPet.id}/history`, {
        type: newRecordType,
        description: newRecordNote.trim(),
        date: new Date().toISOString(),
      });
      setNewRecordType('');
      setNewRecordNote('');
    } catch (err) {
      console.error('Submit record failed:', err);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  const pawHistory = Array.isArray(initialPet?.pawHistory) && initialPet.pawHistory.length > 0
    ? initialPet.pawHistory
    : [
        { id: '1', type: 'TRANSFER', title: 'Curren Owner', description: 'Ownership transferred to Jane Doe', date: '2026-01-01' },
        { id: '2', type: 'ANNUAL_CHECKUP', title: 'Annual Checkup', description: 'Health examination completed', date: '2026-01-01' },
        { id: '3', type: 'VACCINE', title: 'DHPP Vaccination', description: 'Vaccinated: hepatitis, rabies, parvo, and parainfluenza', date: '2026-01-01' },
        { id: '4', type: 'QR_LINKED', title: 'QR Code Registered', description: 'PawLife QR tag activated and linked to Luna', date: '2025-01-01' },
        { id: '5', type: 'BIRTH', title: 'Date of Birth', description: 'Luna was born', date: '2026-01-01' },
      ];
  const sortedHistory = [...pawHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const statusBadge = STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG.AVAILABLE;
  const genderLabel = gender === 'MALE' ? 'Male' : 'Female';

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col font-sans pb-20">
      <div className="flex flex-col lg:flex-row gap-7 items-start px-2 py-1">

        {/* ================= CỘT TRÁI: ẢNH + THÔNG TIN CƠ BẢN ================= */}
        <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0 flex flex-col gap-5 p-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/shelter/pets')}
              className="text-gray-400 hover:text-[#123832] transition-colors shrink-0"
            >
              <ChevronLeft size={26} />
            </button>
            <h1 className="text-3xl font-bold text-[#0D062D] truncate">{name || 'Luna'}</h1>
            <span className="text-lg text-[#8E8E93] truncate">({breed || 'Golden British'})</span>
          </div>

          <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col bg-white">
            {/* Main Pet Image / Slider */}
            <div
              className="relative w-full h-[300px] xl:h-[340px] bg-gray-100 group cursor-pointer overflow-hidden"
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              {images.length > 0 ? (
                <Image
                  src={images[Math.min(currentImageIndex, images.length - 1)]}
                  alt={name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                  <Camera size={32} />
                  <span className="text-xs font-medium">Thêm ảnh Pet</span>
                </div>
              )}

              {/* Nút trước/sau: chỉ active khi có nhiều hơn 1 ảnh */}
              {images.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevImage}
                    disabled={images.length <= 1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow-sm transition-colors hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/85"
                  >
                    <ChevronLeft size={16} className="text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={goNextImage}
                    disabled={images.length <= 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow-sm transition-colors hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/85"
                  >
                    <ChevronRight size={16} className="text-gray-700" />
                  </button>

                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            i === Math.min(currentImageIndex, images.length - 1) ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Status badge / dropdown, matching the detail page */}
              <div className="absolute top-4 right-4 z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditing) setIsStatusDropdownOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold border shadow-sm transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
                  style={{ backgroundColor: statusBadge.bg, borderColor: statusBadge.border, color: statusBadge.color }}
                  disabled={!isEditing}
                >
                  {statusBadge.label}
                  {isEditing && (
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {isStatusDropdownOpen && isEditing && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 flex flex-col gap-0.5">
                      {Object.entries(STATUS_BADGE_CONFIG).map(([statusKey, cfg]) => {
                        const isSelected = status === statusKey;
                        return (
                          <button
                            key={statusKey}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatus(statusKey as PetStatus);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSelected ? 'font-bold text-gray-900 bg-gray-50/80' : 'font-normal text-gray-700 hover:bg-gray-50 hover:text-black'
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Quick-glance stat pills, same style as the detail page */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl bg-[#E2EFF8] py-3.5 flex flex-col items-center gap-1.5">
                  <span className="text-[13px] text-gray-500">Gender</span>
                  <span className="text-[15px] font-semibold text-black">{genderLabel}</span>
                </div>
                <div className="rounded-2xl bg-[#FEFACA] py-3.5 flex flex-col items-center gap-1.5">
                  <span className="text-[13px] text-gray-500">Birthday</span>
                  <span className="text-[15px] font-semibold text-black">{dob}</span>
                </div>
                <div className="rounded-2xl bg-[#F9E6EC] py-3.5 flex flex-col items-center gap-1.5">
                  <span className="text-[13px] text-gray-500">Size</span>
                  <span className="text-[15px] font-semibold text-black">{weight ?? 12} kg</span>
                </div>
              </div>

              {/* Editable fields, styled like the 2x2 info grid on the detail page */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none uppercase tracking-wide disabled:text-black"
                  />
                </div>

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as PetGender)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none uppercase tracking-wide appearance-none disabled:text-black"
                  >
                    <option value="FEMALE">FEMALE</option>
                    <option value="MALE">MALE</option>
                  </select>
                </div>

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none uppercase tracking-wide disabled:text-black"
                  />
                </div>

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Birthday</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none tracking-wide disabled:text-black"
                  />
                </div>

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Size (kg)</label>
                  <input
                    type="number"
                    value={weight ?? 12}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none disabled:text-black"
                  />
                </div>

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3">
                  <label className="text-[11px] text-[#8E8E93] block mb-1">PawLife ID</label>
                  <input
                    type="text"
                    value={pawLifeId}
                    onChange={(e) => setPawLifeId(e.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-semibold text-black outline-none uppercase tracking-wide disabled:text-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI: ACTIONS + TABS + NỘI DUNG ================= */}
        <div className="flex-1 min-w-0 flex flex-col gap-5 px-2 py-1">
          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="h-[38px] px-4 rounded-lg border border-orange-200 text-[#E89B5A] bg-white text-sm font-semibold hover:bg-orange-50 transition-colors"
            >
              Live Preview
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-[38px] px-4 rounded-lg border border-gray-300 text-gray-500 text-sm font-medium flex items-center gap-2 hover:border-gray-400 transition-colors"
              >
                <Pencil size={13} /> Chỉnh sửa
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-[38px] px-5 rounded-lg bg-[#E89B5A] text-white text-sm font-bold hover:bg-[#D68B4E] transition-colors disabled:opacity-70"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex w-full bg-[#76768014] rounded-full p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-1.5 rounded-full text-sm transition-colors ${
                activeTab === 'info' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 font-medium'
              }`}
            >
              Thông tin
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className={`flex-1 px-6 py-1.5 rounded-full text-sm transition-colors ${
                activeTab === 'applications' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 font-medium'
              }`}
            >
              Đơn nhận nuôi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-6 py-1.5 rounded-full text-sm transition-colors ${
                activeTab === 'documents' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 font-medium'
              }`}
            >
              Document
            </button>
          </div>

          {/* TAB: THÔNG TIN */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">

              {/* Sub-card trái: Giới thiệu, Tags, Tính cách, Yêu cầu, Sức khỏe */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
                {/* Giới thiệu */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-2">Giới thiệu</h3>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl p-3 text-xs text-[#8E8E93] leading-relaxed outline-none resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-black">Tags</h3>
                    <span className="text-xs text-gray-400">Đã chọn {selectedTags.length}/3</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTags.map((tag, idx) => {
                      const style = TAG_COLOR_STYLES[idx % TAG_COLOR_STYLES.length];
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{ backgroundColor: style.bg, borderColor: style.border, color: style.color }}
                        >
                          {tag}
                          {isEditing && (
                            <button type="button" onClick={() => toggleTag(tag)}>
                              <X size={12} className="hover:text-red-500" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  {isEditing && (
                    <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
                      {SUGGESTED_TAGS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          className="hover:text-gray-800 transition-colors"
                        >
                          + {t}
                        </button>
                      ))}
                      <button type="button" className="text-[#E89B5A] font-semibold">+ Thêm mới</button>
                    </div>
                  )}
                </div>

                {/* Tính cách */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-2">Tính cách</h3>
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Check size={14} className="text-[#00AC47] shrink-0" />
                      <span className="font-semibold text-[#00AC47]">Thân thiện:</span>
                      <span className="text-[#8E8E93]">Children, Seniors, Dogs, Cats.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <X size={14} className="text-red-500 shrink-0" />
                      <span className="font-semibold text-red-500">Nên cân nhắc:</span>
                      <span className="text-[#8E8E93]">Children, Seniors, Dogs, Cats.</span>
                    </div>
                  </div>
                </div>

                {/* Yêu cầu */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-black">Yêu cầu</h3>
                    <span className="text-xs text-gray-400">Đã chọn {selectedRequirements.length}/5</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedRequirements.map((req, idx) => {
                      const style = TAG_COLOR_STYLES[idx % TAG_COLOR_STYLES.length];
                      return (
                        <span
                          key={req}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{ backgroundColor: style.bg, borderColor: style.border, color: style.color }}
                        >
                          {req}
                          {isEditing && (
                            <button type="button" onClick={() => toggleRequirement(req)}>
                              <X size={12} className="hover:text-red-500" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  {isEditing && (
                    <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
                      {SUGGESTED_TAGS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleRequirement(t)}
                          className="hover:text-gray-800 transition-colors"
                        >
                          + {t}
                        </button>
                      ))}
                      <button type="button" className="text-[#E89B5A] font-semibold">+ Thêm mới</button>
                    </div>
                  )}
                </div>

                {/* Sức khỏe */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-3">Sức khỏe</h3>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => isEditing && setIsVaccinated((v) => !v)}
                      className="flex-1 flex items-center gap-3 bg-[#F7F7F7] rounded-full h-[50px] px-2 text-left"
                    >
                      <div className="bg-white w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0">
                        <Syringe size={18} className="text-[#E89B5A]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] text-[#8E8E93]">Tiêm chủng</p>
                        <p className="text-[13px] font-medium text-black truncate">{isVaccinated ? 'Đầy đủ' : 'Chưa tiêm'}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => isEditing && setIsSpayedNeutered((v) => !v)}
                      className="flex-1 flex items-center gap-3 bg-[#F7F7F7] rounded-full h-[50px] px-2 text-left"
                    >
                      <div className="bg-white w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0">
                        <Check size={18} className="text-[#E89B5A]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] text-[#8E8E93]">Trạng thái</p>
                        <p className="text-[13px] font-medium text-black truncate">{isSpayedNeutered ? 'Đã triệt sản' : 'Chưa triệt sản'}</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-card phải: PawHistory + Submit New Record */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <p className="text-sm font-medium text-black mb-4">PawHistory</p>
                  <div className="flex flex-col">
                    {sortedHistory.map((item, index) => {
                      const isLastItem = index === sortedHistory.length - 1;
                      const cfg = HISTORY_TYPE_CONFIG[item.type] ?? DEFAULT_HISTORY_CONFIG;
                      const Icon = cfg.Icon;
                      return (
                        <div key={item.id ?? index} className="flex min-h-[48px]">
                          <div className="w-6 relative mr-2.5 shrink-0">
                            {!isLastItem && (
                              <div className="absolute w-[1px] bg-gray-200" style={{ top: 26, bottom: -4, left: 11.5 }} />
                            )}
                            <div className="w-6 h-6 rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: cfg.bg }}>
                              <Icon size={12} style={{ color: cfg.color }} />
                            </div>
                          </div>
                          <div className={`flex-1 ${!isLastItem ? 'pb-3' : ''}`}>
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-[12px] font-medium text-black">{item.title}</p>
                              <span className="text-[10px] text-[#8E8E93] shrink-0">
                                {new Date(item.date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-[#8E8E93] mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg py-2 px-3 mt-2">
                    <Lock size={11} className="text-[#8E8E93] shrink-0" />
                    <span className="text-[10px] text-[#8E8E93]">This timeline is permanent and append-only.</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-gray-300 p-6">
                  <p className="text-sm font-medium text-black mb-3">Submit New Record</p>
                  <form onSubmit={handleAddRecord} className="flex flex-col gap-3">
                    <div>
                      <label className="text-[13px] text-[#8E8E93] block mb-1">Record Type</label>
                      <div className="relative">
                        <select
                          value={newRecordType}
                          onChange={(e) => setNewRecordType(e.target.value)}
                          className="w-full appearance-none bg-white border border-gray-300 rounded-lg h-8 px-3 text-[12px] text-gray-700 focus:border-[#E89B5A] outline-none"
                        >
                          <option value="">Select note type...</option>
                          <option value="ANNUAL_CHECKUP">Annual Checkup</option>
                          <option value="VACCINE">Vaccine</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[13px] text-[#8E8E93] block mb-1">Note</label>
                      <textarea
                        rows={2}
                        value={newRecordNote}
                        onChange={(e) => setNewRecordNote(e.target.value)}
                        placeholder="Enter note detail..."
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[12px] text-gray-700 focus:border-[#E89B5A] outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingRecord || !newRecordType || !newRecordNote.trim()}
                      className="self-start bg-[#E89B5A] hover:bg-[#D68B4E] disabled:opacity-50 text-white text-[11px] font-semibold px-4 py-1.5 rounded-full transition-colors"
                    >
                      {isSubmittingRecord ? 'Đang gửi...' : 'Submit Record'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ĐƠN NHẬN NUÔI */}
          {activeTab === 'applications' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center text-center">
              <FileText size={22} className="text-gray-300 mb-2" />
              <p className="text-sm font-medium text-black mb-1">Chưa có đơn đăng ký nhận nuôi</p>
              <p className="text-[12px] text-gray-400 max-w-sm">
                Các đơn đăng ký nhận nuôi {name || 'thú cưng này'} sẽ hiển thị ở đây khi có người nộp.
              </p>
            </div>
          )}

          {/* TAB: DOCUMENT */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <p className="text-sm font-medium text-black mb-4">Hồ sơ y tế / Giấy tờ</p>
              <div className="flex flex-col items-center text-center py-10">
                <Clock size={20} className="text-gray-300 mb-2" />
                <p className="text-[13px] text-gray-400 italic">Chưa có hồ sơ y tế / giấy tờ nào.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};