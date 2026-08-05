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
  SparklesIcon,
  Send,
  MoreVertical,
  Upload,
  Calendar,
  Eye,
  Download,
} from 'lucide-react';
import { usePetActions } from '@/stores/usePetStore';
import { PetSpecies, PetGender, PetStatus } from '@/types/pet';
import axiosClient from '@/lib/api/axiosClient';
import { PetPublic3DModal } from '@/components/PetPublic3DModal';
import { FiTrash2 } from 'react-icons/fi';

export interface Bilingual {
  vi: string;
  en: string;
}

export type TagValue = Bilingual & { isCustom?: boolean };

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
const MOCK_DOCUMENTS = [
  {
    id: 'doc_1',
    fileName: 'Khám tổng quát hằng năm.pdf',
    date: '01/01/2026',
    uploader: 'Nguyễn Văn A',
    statusLabel: 'Đã xác minh',
    statusClass: 'bg-[#EBFFE2] text-[#77C852]',
  },
  {
    id: 'doc_2',
    fileName: 'Khám tổng quát hằng năm.pdf',
    date: '01/01/2026',
    uploader: 'Nguyễn Văn A',
    statusLabel: 'Đang xác minh',
    statusClass: 'bg-[#E8F1FF] text-[#5A90DA]',
  },
  {
    id: 'doc_3',
    fileName: 'Khám tổng quát hằng năm.pdf',
    date: '01/01/2026',
    uploader: 'Nguyễn Văn A',
    statusLabel: 'Đã xác minh',
    statusClass: 'bg-[#EBFFE2] text-[#77C852]',
  },
  {
    id: 'doc_4',
    fileName: 'Khám tổng quát hằng năm.pdf',
    date: '01/01/2026',
    uploader: 'Nguyễn Văn A',
    statusLabel: 'Đã xác minh',
    statusClass: 'bg-[#EBFFE2] text-[#77C852]',
  },
  {
    id: 'doc_5',
    fileName: 'Khám tổng quát hằng năm.pdf',
    date: '01/01/2026',
    uploader: 'Nguyễn Văn A',
    statusLabel: 'Đã xác minh',
    statusClass: 'bg-[#EBFFE2] text-[#77C852]',
  },
  {
    id: 'doc_6',
    fileName: 'Khám tổng quát hằng năm.pdf',
    date: '01/01/2026',
    uploader: 'Nguyễn Văn A',
    statusLabel: 'Đã xác minh',
    statusClass: 'bg-[#EBFFE2] text-[#77C852]',
  },
  {
    id: 'doc_7',
    fileName: 'Khám tổng quát hằng năm.pdf',
    date: '01/01/2026',
    uploader: 'Nguyễn Văn A',
    statusLabel: 'Đã xác minh',
    statusClass: 'bg-[#EBFFE2] text-[#77C852]',
  },
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

const TAG_COLOR_STYLES = [
  { bg: '#FBF7EB', border: '#E8A53C', color: '#E8A53C' },
  { bg: '#E8F1FF', border: '#5A90DA', color: '#5A90DA' },
  { bg: '#EBFFE2', border: '#77C852', color: '#77C852' },
];

const STATUS_BADGE_CONFIG: Record<string, { bg: string; border: string; color: string; label: string }> = {
  AVAILABLE: { bg: '#DEFFDF', border: '#00AC47', color: '#00AC47', label: 'Chờ nhận nuôi' },
  PENDING: { bg: '#FFF8E5', border: '#FFBA00', color: '#FFBA00', label: 'Đang xét duyệt' },
  REJECTED: { bg: '#FFE2E2', border: '#9F0712', color: '#9F0712', label: 'Không đủ điều kiện' },
  HEALTH_ISSUE: { bg: '#FFEDD4', border: '#A13A17', color: '#A13A17', label: 'Vấn đề sức khoẻ' },
  ADOPTED: { bg: '#F0F0F0', border: '#BDBDBD', color: '#757575', label: 'Đã nhận nuôi' },
};

// Dữ liệu Ghi chú mẫu
const INITIAL_NOTES = [
  {
    id: 'n1',
    author: 'Julia Nguyễn',
    role: 'Bác sĩ thú y',
    roleBadgeClass: 'bg-[#FCE7F3] text-[#EC4899] border-[#FBCFE8]',
    date: '08/05/2020',
    content: 'Applicant provided all requested veterinary records for current pet. Documentation shows consistent preventive care.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100',
  },
  {
    id: 'n2',
    author: 'Julia Nguyễn',
    role: 'Thành viên',
    roleBadgeClass: 'bg-[#E0F2FE] text-[#3B82F6] border-[#BAE6FD]',
    date: '08/05/2020',
    content: 'Applicant provided all requested veterinary records for current pet. Documentation shows consistent preventive care.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100',
  },
  {
    id: 'n3',
    author: 'Julia Nguyễn',
    role: 'Tình nguyện viên',
    roleBadgeClass: 'bg-[#DCFCE7] text-[#22C55E] border-[#BBF7D0]',
    date: '08/05/2020',
    content: 'Applicant provided all requested veterinary records for current pet. Documentation shows consistent preventive care.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100',
  },
  {
    id: 'n4',
    author: 'Julia Nguyễn',
    role: 'Admin',
    roleBadgeClass: 'bg-[#F4E8FF] text-[#A855F7] border-[#E9D5FF]',
    date: '08/05/2020',
    content: 'Applicant provided all requested veterinary records for current pet. Documentation shows consistent preventive care.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100',
  },
];

// Dữ liệu Hồ sơ y tế mẫu
const INITIAL_MEDICAL_RECORDS = [
  {
    id: 'm1',
    title: 'DHPP (5/7in1)',
    statusLabel: 'Đang xác minh',
    statusClass: 'bg-[#FFF8E5] text-[#E8A53C] border-[#FFE1C2]',
    statusIcon: '⏱',
    type: 'Tiêm chủng',
    date: '17/7/2026',
    nextDue: '14/08/2026',
  },
  {
    id: 'm2',
    title: 'DHPP (5/7in1)',
    statusLabel: 'Đã xác minh',
    statusClass: 'bg-[#EBFFE2] text-[#77C852] border-[#D1F5BF]',
    statusIcon: '✓',
    type: 'Tiêm chủng',
    date: '17/7/2026',
    nextDue: '14/08/2026',
  },
];

export const PetForm: React.FC<{ mode: 'create' | 'edit'; initialPet?: any }> = ({ mode, initialPet }) => {
  const router = useRouter();
  const { createPet, updatePet, isSubmitting } = usePetActions();

  const [activeTab, setActiveTab] = useState<'info' | 'applications' | 'documents'>('info');
  const [isEditing, setIsEditing] = useState(mode === 'create');
  const [show3DModal, setShow3DModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('Golden British');
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

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Ghi chú State
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [newNoteInput, setNewNoteInput] = useState('');

  // Hồ sơ y tế State
  const [medicalList, setMedicalList] = useState(INITIAL_MEDICAL_RECORDS);
  const [showMedicalForm, setShowMedicalForm] = useState(true);
  const [medicalType, setMedicalType] = useState('');
  const [medicalDetail, setMedicalDetail] = useState('');
  const [medicalDate, setMedicalDate] = useState('');
  const medicalFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPet) {
      setName(initialPet.name || 'Luna');
      setBreed(
        typeof initialPet.breed === 'object'
          ? initialPet.breed?.en || initialPet.breed?.vi || ''
          : initialPet.breed || 'Golden British'
      );
      setGender(initialPet.gender || 'FEMALE');
      setColor(
        typeof initialPet.color === 'object'
          ? initialPet.color?.en || initialPet.color?.vi || ''
          : initialPet.color || 'GOLDEN'
      );
      setDob(initialPet.dob ? String(initialPet.dob).slice(0, 10) : '2020-07-12');
      setWeight(initialPet.weight ?? 12);
      setPawLifeId(initialPet.code || initialPet.tags?.[0]?.id || 'PL-00000');
      setStatus(initialPet.status || 'AVAILABLE');
      setDescription(
        typeof initialPet.description === 'object'
          ? initialPet.description?.vi || initialPet.description?.en || ''
          : initialPet.description || ''
      );
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
    setCurrentImageIndex(images.length);
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

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;
    const newNote = {
      id: `n_${Date.now()}`,
      author: 'Julia Nguyễn',
      role: 'Admin',
      roleBadgeClass: 'bg-[#F4E8FF] text-[#A855F7] border-[#E9D5FF]',
      date: new Date().toLocaleDateString('vi-VN'),
      content: newNoteInput.trim(),
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100',
    };
    setNotes((prev) => [...prev, newNote]);
    setNewNoteInput('');
  };

  const handleSaveMedical = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicalType) return;
    const newRecord = {
      id: `m_${Date.now()}`,
      title: medicalDetail || medicalType,
      statusLabel: 'Đang xác minh',
      statusClass: 'bg-[#FFF8E5] text-[#E8A53C] border-[#FFE1C2]',
      statusIcon: '⏱',
      type: medicalType,
      date: medicalDate || new Date().toLocaleDateString('vi-VN'),
      nextDue: '14/08/2026',
    };
    setMedicalList((prev) => [...prev, newRecord]);
    setMedicalType('');
    setMedicalDetail('');
    setMedicalDate('');
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

  const pawHistory =
    Array.isArray(initialPet?.pawHistory) && initialPet.pawHistory.length > 0
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

  const livePreviewPet = {
    id: initialPet?.id || 'preview_pet',
    name: name || 'Luna',
    breed: breed || 'Golden British',
    gender: gender || 'FEMALE',
    color: color || 'GOLDEN',
    dob: dob || '2020-07-12',
    weight: weight ?? 12,
    code: pawLifeId || 'PL-00000',
    status: status || 'AVAILABLE',
    description: description || '',
    isVaccinated,
    isSpayedNeutered,
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400'],
    pawHistory: sortedHistory,
    shelter: initialPet?.shelter || { name: 'PawLife Shelter', shelterType: 'Trạm cứu hộ' },
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col font-sans pb-20">
      <div className="flex flex-col lg:flex-row gap-7 items-start px-2 py-1">

        {/* ================= CỘT TRÁI: ÁNH + THÔNG TIN CƠ BẢN ================= */}
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

              {images.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevImage}
                    disabled={images.length <= 1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow-sm transition-colors hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} className="text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={goNextImage}
                    disabled={images.length <= 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow-sm transition-colors hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} className="text-gray-700" />
                  </button>

                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === Math.min(currentImageIndex, images.length - 1) ? 'bg-white' : 'bg-white/50'
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Status badge dropdown */}
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
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSelected ? 'font-bold text-gray-900 bg-gray-50/80' : 'font-normal text-gray-700 hover:bg-gray-50 hover:text-black'
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
                  <label className="text-[11px] text-[#8E8E93] block mb-1">Breed</label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    disabled={!isEditing}
                    placeholder="VD: GOLDEN BRITISH"
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

                <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3 col-span-2">
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
              onClick={() => setShow3DModal(true)}
              className="h-[38px] px-4 rounded-lg border border-orange-200 text-[#E89B5A] bg-white text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 transition-colors cursor-pointer"
            >
              <SparklesIcon size={14} /> Live Preview (3D)
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
              className={`flex-1 px-6 py-1.5 rounded-full text-sm transition-colors ${activeTab === 'info' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 font-medium'
                }`}
            >
              Thông tin
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className={`flex-1 px-6 py-1.5 rounded-full text-sm transition-colors ${activeTab === 'applications' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 font-medium'
                }`}
            >
              Đơn nhận nuôi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-6 py-1.5 rounded-full text-sm transition-colors ${activeTab === 'documents' ? 'bg-white text-black font-semibold shadow-sm' : 'text-gray-500 font-medium'
                }`}
            >
              Document
            </button>
          </div>

          {/* TAB: THÔNG TIN */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {/* Sub-card trái: Giới thiệu, Tags, Tính cách, Yêu cầu, Sức khỏe + KHỐI GHI CHÚ */}
              <div className="flex flex-col gap-4">
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

                {/* KHỐI GHI CHÚ MỚI BỔ SUNG (BÊN DƯỚI CARD 1) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-gray-900">Ghi chú</h3>

                  <div className="flex flex-col gap-4">
                    {notes.map((note) => (
                      <div key={note.id} className="flex gap-3 items-start">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5 border border-gray-100">
                          <Image src={note.avatar} alt={note.author} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">{note.author}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${note.roleBadgeClass}`}>
                              {note.role}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-auto">{note.date}</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{note.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Thêm ghi chú mới */}
                  <form onSubmit={handleAddNote} className="relative mt-2 w-full">
                    <input
                      type="text"
                      value={newNoteInput}
                      onChange={(e) => setNewNoteInput(e.target.value)}
                      placeholder="Thêm ghi chú dưới tên Julia Nguyễn"
                      className="w-full bg-[#F9FAFB] border border-gray-200 rounded-full pl-4 pr-10 py-2.5 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteInput.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E89B5A] hover:text-[#D68B4E] disabled:opacity-40 transition-colors"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Sub-card phải: PawHistory + Hồ sơ y tế */}
              <div className="flex flex-col gap-4">
                {/* PawHistory */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <p className="text-sm font-medium text-black mb-4">PawHistory | Hành trình</p>
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
                    <span className="text-[10px] text-[#8E8E93]">Hành trình không thể bị xóa hay chỉnh sửa</span>
                  </div>
                </div>

                {/* KHỐI HỒ SƠ Y TẾ MỚI BỔ SUNG (BÊN DƯỚI PAWHISTORY) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900">Hồ sơ y tế</h3>
                    <button
                      type="button"
                      onClick={() => setShowMedicalForm((v) => !v)}
                      className="text-[#E89B5A] bg-[#FFF8E6] border border-[#FFE1C2] px-3 py-1 rounded-full text-xs font-semibold hover:bg-orange-50 transition-colors"
                    >
                      Thêm hồ sơ
                    </button>
                  </div>

                  {/* Danh sách Hồ sơ y tế */}
                  <div className="flex flex-col gap-2.5">
                    {medicalList.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-2xl p-3.5 flex flex-col gap-1 bg-white relative">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Syringe size={14} className="text-gray-400 shrink-0" />
                            <span className="text-xs font-bold text-gray-900">{item.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${item.statusClass}`}>
                              {item.statusIcon} {item.statusLabel}
                            </span>
                          </div>
                          <button type="button" className="text-gray-400 hover:text-gray-600">
                            <MoreVertical size={14} />
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400 pl-5">
                          Loại: {item.type} | Ngày: {item.date}
                        </p>
                        {item.nextDue && (
                          <p className="text-[11px] text-[#E89B5A] font-semibold pl-5">
                            Lịch tiếp theo: {item.nextDue}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Form Nhập Thêm Hồ Sơ Y Tế */}
                  {showMedicalForm && (
                    <form onSubmit={handleSaveMedical} className="flex flex-col gap-3 pt-2 border-t border-dashed border-gray-200 mt-1">
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 block mb-1">Loại hồ sơ</label>
                        <div className="relative">
                          <select
                            value={medicalType}
                            onChange={(e) => setMedicalType(e.target.value)}
                            className="w-full appearance-none bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                          >
                            <option value="">Chọn loại hồ sơ</option>
                            <option value="Tiêm chủng">Tiêm chủng</option>
                            <option value="Khám tổng quát">Khám tổng quát</option>
                            <option value="Khám răng miệng">Khám răng miệng</option>
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-400 block mb-1">Chi tiết</label>
                          <div className="relative">
                            <select
                              value={medicalDetail}
                              onChange={(e) => setMedicalDetail(e.target.value)}
                              className="w-full appearance-none bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                            >
                              <option value="">Chọn chi tiết hồ sơ</option>
                              <option value="DHPP (5/7in1)">DHPP (5/7in1)</option>
                              <option value="Rabies">Rabies (Dại)</option>
                            </select>
                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-400 block mb-1">Ngày tháng</label>
                          <input
                            type="date"
                            value={medicalDate}
                            onChange={(e) => setMedicalDate(e.target.value)}
                            className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#E89B5A]"
                          />
                        </div>
                      </div>

                      {/* Khung tải file/hình ảnh */}
                      <div>
                        <div
                          onClick={() => medicalFileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 hover:border-[#E89B5A] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-[#F9FAFB]/50 transition-colors"
                        >
                          <p className="text-xs font-semibold text-[#E89B5A]">Tải hình ảnh hồ sơ y tế</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">PDF, JPG, IMG (tối đa 2MB)</p>
                        </div>
                        <input ref={medicalFileInputRef} type="file" accept="image/*,.pdf" className="hidden" />
                      </div>

                      {/* Nút bấm Form */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowMedicalForm(false)}
                          className="flex-1 border border-gray-200 bg-white text-gray-600 font-semibold py-2 rounded-full text-xs hover:bg-gray-50 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={!medicalType}
                          className="flex-1 bg-[#E89B5A] hover:bg-[#D68B4E] disabled:opacity-50 text-white font-bold py-2 rounded-full text-xs shadow-sm transition-colors"
                        >
                          Lưu hồ sơ
                        </button>
                      </div>
                    </form>
                  )}
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
            <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden w-full">
              {/* Table Header */}
              <div className="grid grid-cols-[2.5fr_1fr_1.5fr_1.2fr_1.2fr] px-6 py-4 border-b border-gray-100 bg-[#FAFAFA] text-[13px] font-medium text-gray-500">
                <span>Tên tài liệu</span>
                <span>Ngày</span>
                <span>Người đăng</span>
                <span>Trạng thái</span>
                <span>Thao tác</span>
              </div>

              {/* Table Body */}
              <div className="flex flex-col divide-y divide-gray-100">
                {MOCK_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.id}
                    className="grid grid-cols-[2.5fr_1fr_1.5fr_1.2fr_1.2fr] items-center px-6 py-4 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Tên tài liệu */}
                    <span className="font-bold text-gray-900 text-sm truncate">{doc.fileName}</span>

                    {/* Ngày */}
                    <span className="text-sm text-gray-600 font-medium">{doc.date}</span>

                    {/* Người đăng */}
                    <span className="text-sm text-gray-600 font-medium">{doc.uploader}</span>

                    {/* Trạng thái */}
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${doc.statusClass}`}>
                        {doc.statusLabel}
                      </span>
                    </div>

                    {/* Thao tác (4 Icon) */}
                    <div className="flex items-center gap-3">
                      <button type="button" title="Xem" className="text-gray-400 hover:text-gray-700 transition-colors">
                        <Eye size={16} />
                      </button>
                      <button type="button" title="Chỉnh sửa" className="text-gray-400 hover:text-gray-700 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button type="button" title="Tải xuống" className="text-gray-400 hover:text-[#3B6BE3] transition-colors">
                        <Download size={16} />
                      </button>
                      <button type="button" title="Xóa" className="text-gray-400 hover:text-red-500 transition-colors">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Live Preview 3D */}
      {show3DModal && (
        <PetPublic3DModal
          pet={livePreviewPet}
          onClose={() => setShow3DModal(false)}
        />
      )}
    </div>
  );
};