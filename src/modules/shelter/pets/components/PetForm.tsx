'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FiX,
  FiUpload,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiMapPin,
  FiHome,
  FiAward,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiAlertCircle,
  FiLock,
  FiHeart,
} from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { usePetActions } from '@/stores/usePetStore';
import {
  Pet,
  PetFormValues,
  PetSpecies,
  PetGender,
  PetStatus,
  emptyPetFormValues,
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
} from '@/types/pet';
import axiosClient from '@/lib/api/axiosClient';

// ============================================================================
// CSS THEME: JAPANESE MINIMALISM
// ============================================================================
const inputClass =
  'w-full bg-transparent border-b border-gray-300 py-3 text-gray-800 placeholder-gray-300 focus:border-[#E89B5A] outline-none transition-colors text-[15px] font-medium';
const labelClass = 'text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1';
const sectionHeaderClass = 'text-xs font-bold text-gray-500 tracking-[0.2em] uppercase border-b border-gray-200 pb-3 mb-6 mt-12';

// ============================================================================
// UTILS & FULL CONSTANTS (Đã khôi phục 100%)
// ============================================================================
export type Bilingual = { vi: string; en: string };

export function parseBilingual(val: any): Bilingual {
  if (!val) return { vi: '', en: '' };
  if (typeof val === 'object' && ('vi' in val || 'en' in val)) return { vi: val.vi || '', en: val.en || val.vi || '' };
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return { vi: parsed.vi || '', en: parsed.en || parsed.vi || '' };
      } catch { return { vi: val, en: val }; }
    }
    return { vi: val, en: val };
  }
  return { vi: String(val), en: String(val) };
}

export function displayBilingual(bi: Bilingual, isVi = true): string {
  return (isVi ? bi.vi || bi.en : bi.en || bi.vi) || '';
}

export async function translateText(text: string, from: 'vi' | 'en', to: 'vi' | 'en'): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return trimmed;
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${from}|${to}`);
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    return translated && typeof translated === 'string' ? translated : trimmed;
  } catch (err) { return trimmed; }
}

export async function buildBilingualOnSubmit(currentVi: string, original: Bilingual): Promise<Bilingual> {
  const trimmed = (currentVi || '').trim();
  if (!trimmed) return { vi: '', en: '' };
  if (trimmed === (original.vi || '').trim() && original.en) return { vi: trimmed, en: original.en };
  const en = await translateText(trimmed, 'vi', 'en');
  return { vi: trimmed, en };
}

export async function buildBilingualFreeText(text: string): Promise<Bilingual> {
  const trimmed = (text || '').trim();
  if (!trimmed) return { vi: '', en: '' };
  const en = await translateText(trimmed, 'vi', 'en');
  return { vi: trimmed, en };
}

const SIZE_OPTIONS = [
  { value: 'Small', label: 'Nhỏ' },
  { value: 'Medium', label: 'Trung bình' },
  { value: 'Large', label: 'Lớn' },
];

const CUSTOM_BREED_VALUE = '__custom__';

const DOG_BREEDS: Bilingual[] = [
  { vi: 'Chó ta / Chó cỏ', en: 'Vietnamese native dog' },
  { vi: 'Golden Retriever', en: 'Golden Retriever' },
  { vi: 'Labrador Retriever', en: 'Labrador Retriever' },
  { vi: 'Poodle', en: 'Poodle' },
  { vi: 'Phốc sóc (Pomeranian)', en: 'Pomeranian' },
  { vi: 'Corgi', en: 'Corgi' },
  { vi: 'Husky Sibir', en: 'Siberian Husky' },
  { vi: 'Alaskan Malamute', en: 'Alaskan Malamute' },
  { vi: 'Becgie (German Shepherd)', en: 'German Shepherd' },
  { vi: 'Chó Phú Quốc', en: 'Phu Quoc Ridgeback' },
  { vi: 'Bulldog Pháp', en: 'French Bulldog' },
  { vi: 'Bulldog Anh', en: 'English Bulldog' },
  { vi: 'Chihuahua', en: 'Chihuahua' },
  { vi: 'Shiba Inu', en: 'Shiba Inu' },
  { vi: 'Border Collie', en: 'Border Collie' },
  { vi: 'Rottweiler', en: 'Rottweiler' },
  { vi: 'Doberman', en: 'Doberman' },
  { vi: 'Pug', en: 'Pug' },
];

const CAT_BREEDS: Bilingual[] = [
  { vi: 'Mèo ta (Mèo mướp)', en: 'Domestic shorthair cat' },
  { vi: 'Anh lông ngắn (British Shorthair)', en: 'British Shorthair' },
  { vi: 'Ba Tư (Persian)', en: 'Persian' },
  { vi: 'Xiêm (Siamese)', en: 'Siamese' },
  { vi: 'Munchkin (chân ngắn)', en: 'Munchkin' },
  { vi: 'Maine Coon', en: 'Maine Coon' },
  { vi: 'Scottish Fold (tai cụp)', en: 'Scottish Fold' },
  { vi: 'Bengal', en: 'Bengal' },
  { vi: 'Ragdoll', en: 'Ragdoll' },
  { vi: 'Sphynx (không lông)', en: 'Sphynx' },
];

const BREED_OPTIONS: Record<'Dog' | 'Cat', Bilingual[]> = { Dog: DOG_BREEDS, Cat: CAT_BREEDS };

const TRAIT_OPTIONS: Bilingual[] = [
  { vi: 'Hiền lành', en: 'Gentle' },
  { vi: 'Năng động', en: 'Active' },
  { vi: 'Nhút nhát', en: 'Shy' },
  { vi: 'Thông minh', en: 'Smart' },
  { vi: 'Quấn chủ', en: 'Affectionate' },
  { vi: 'Độc lập', en: 'Independent' },
  { vi: 'Trung thành', en: 'Loyal' },
  { vi: 'Thích chơi đùa', en: 'Playful' },
  { vi: 'Dễ huấn luyện', en: 'Easy to train' },
  { vi: 'Ít sủa / kêu', en: 'Rarely barks / meows' },
  { vi: 'Thích được ôm ấp', en: 'Loves cuddles' },
  { vi: 'Cảnh giác', en: 'Alert' },
  { vi: 'Hiếu động', en: 'Energetic' },
  { vi: 'Điềm tĩnh', en: 'Calm' },
  { vi: 'Hoà đồng', en: 'Sociable' },
  { vi: 'Bảo vệ tốt', en: 'Protective' },
  { vi: 'Ăn uống dễ, không kén ăn', en: 'Easy eater, not picky' },
  { vi: 'Thích nước', en: 'Loves water' },
  { vi: 'Sợ tiếng ồn lớn', en: 'Afraid of loud noises' },
  { vi: 'Thích đi dạo', en: 'Loves walks' },
];

const COMPANION_OPTIONS: Bilingual[] = [
  { vi: 'Trẻ em', en: 'Children' },
  { vi: 'Người lớn tuổi', en: 'Elderly people' },
  { vi: 'Chó khác', en: 'Other dogs' },
  { vi: 'Mèo khác', en: 'Other cats' },
  { vi: 'Người lạ', en: 'Strangers' },
  { vi: 'Vật nuôi nhỏ (chim, thỏ...)', en: 'Small pets (birds, rabbits...)' },
  { vi: 'Người mới nuôi thú cưng lần đầu', en: 'First-time pet owners' },
];

const ADOPTION_REQUIREMENT_OPTIONS: { iconKey: string; vi: string; en: string; Icon: React.ElementType }[] = [
  { iconKey: 'home', vi: 'Có nhà riêng / sân vườn', en: 'Has a house / yard', Icon: FiHome },
  { iconKey: 'experience', vi: 'Có kinh nghiệm nuôi thú cưng', en: 'Has pet-raising experience', Icon: FiAward },
  { iconKey: 'income', vi: 'Thu nhập ổn định', en: 'Stable income', Icon: FiDollarSign },
  { iconKey: 'time', vi: 'Có thời gian chăm sóc', en: 'Has time to care for the pet', Icon: FiClock },
  { iconKey: 'family', vi: 'Được gia đình đồng ý', en: 'Family agreement required', Icon: FiUsers },
  { iconKey: 'sterilize', vi: 'Cam kết triệt sản nếu chưa', en: 'Commits to sterilization if not done yet', Icon: FiAward },
  { iconKey: 'no_cage', vi: 'Không nhốt lồng cả ngày', en: 'Will not cage the pet all day', Icon: FiHome },
  { iconKey: 'home_visit', vi: 'Đồng ý cho thăm nhà sau nhận', en: 'Allows a home visit after adoption', Icon: FiUsers },
  { iconKey: 'vet_checkup', vi: 'Đưa thú cưng đi khám định kỳ', en: 'Takes the pet for regular vet checkups', Icon: FiClock },
  { iconKey: 'other', vi: 'Khác', en: 'Other', Icon: FiMoreHorizontal },
];

type MedicalRecordType = 'vaccination' | 'examination' | 'dental' | 'other';

const RECORD_TYPE_OPTIONS: { id: MedicalRecordType; label: string }[] = [
  { id: 'vaccination', label: 'Tiêm phòng' },
  { id: 'examination', label: 'Khám bệnh' },
  { id: 'dental', label: 'Răng miệng' },
  { id: 'other', label: 'Khác' },
];

const VACCINE_OPTIONS: Record<'Dog' | 'Cat', { id: string; vi: string; en: string }[]> = {
  Dog: [
    { id: 'DOG_DHP', vi: 'DHP (3in1)', en: 'DHP (3-in-1)' },
    { id: 'DOG_DHPP', vi: 'DHPP (5/7in1)', en: 'DHPP (5/7-in-1)' },
    { id: 'DOG_RABIES', vi: 'Rabies (Dại)', en: 'Rabies' },
    { id: 'DOG_LEPTO', vi: 'Lepto', en: 'Leptospirosis' },
    { id: 'DOG_BORDETELLA', vi: 'Bordetella', en: 'Bordetella' },
    { id: 'DOG_CIV', vi: 'CIV', en: 'Canine Influenza (CIV)' },
  ],
  Cat: [
    { id: 'CAT_FVRCP', vi: 'FVRCP (3/4in1)', en: 'FVRCP (3/4-in-1)' },
    { id: 'CAT_RABIES', vi: 'Rabies (Dại)', en: 'Rabies' },
    { id: 'CAT_FELV', vi: 'FeLV', en: 'Feline Leukemia (FeLV)' },
  ],
};

const resolveVaccineSpeciesKey = (species: PetSpecies): 'Dog' | 'Cat' => {
  return String(species).toLowerCase().includes('cat') ? 'Cat' : 'Dog';
};

type TagValue = Bilingual & { isCustom?: boolean };

type MedicalRecordDraft = {
  localId: string; type: MedicalRecordType; recordName: Bilingual; vaccineType?: string; doseNumber?: 1 | 2 | 3;
  recordDate: string; hasNextDueDate: boolean; nextDueName?: Bilingual; nextDueDate?: string;
  images: string[]; newImageFiles: File[];
};

const emptyMedicalDraft = (): MedicalRecordDraft => ({
  localId: `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, type: 'vaccination', recordName: { vi: '', en: '' },
  vaccineType: '', doseNumber: 1, recordDate: new Date().toISOString().slice(0, 10), hasNextDueDate: false,
  nextDueName: { vi: '', en: '' }, nextDueDate: '', images: [], newImageFiles: [],
});

const computeNextDue = async (
  draft: MedicalRecordDraft,
  speciesKey: 'Dog' | 'Cat',
): Promise<{ nextDueDate: string; nextDueName: Bilingual } | null> => {
  const base = new Date(draft.recordDate || Date.now());

  if (draft.type === 'vaccination' && draft.vaccineType) {
    const next = new Date(base);
    if (draft.vaccineType === 'DOG_RABIES' || draft.vaccineType === 'CAT_RABIES') {
      next.setDate(next.getDate() + 365);
    } else if (draft.vaccineType === 'DOG_BORDETELLA') {
      next.setDate(next.getDate() + 180);
    } else if (draft.doseNumber === 1 || draft.doseNumber === 2) {
      next.setDate(next.getDate() + 28);
    } else {
      next.setDate(next.getDate() + 365);
    }
    const v = VACCINE_OPTIONS[speciesKey].find((x) => x.id === draft.vaccineType);
    return {
      nextDueDate: next.toISOString().slice(0, 10),
      nextDueName: { vi: v?.vi || '', en: v?.en || '' },
    };
  }

  if (draft.type === 'examination') {
    const next = new Date(base);
    next.setFullYear(next.getFullYear() + 1);
    const nameVi = draft.recordName.vi || 'Khám bệnh';
    return { nextDueDate: next.toISOString().slice(0, 10), nextDueName: await buildBilingualFreeText(nameVi) };
  }

  if (draft.type === 'dental') {
    const next = new Date(base);
    next.setMonth(next.getMonth() + 6);
    const nameVi = draft.recordName.vi || 'Khám răng';
    return { nextDueDate: next.toISOString().slice(0, 10), nextDueName: await buildBilingualFreeText(nameVi) };
  }

  return null;
};

async function uploadImageToStorage(file: File): Promise<string> {
  const fileType = file.type || 'image/jpeg';
  const presignedRes = await axiosClient.post('/storage/presigned-url', {
    fileName: file.name || `medical-record-${Date.now()}.jpg`, fileType, folder: 'medical-records',
  });
  const uploadRes = await fetch(presignedRes.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': fileType }, body: file });
  if (!uploadRes.ok) throw new Error('Upload ảnh thất bại');
  return presignedRes.data.fileUrl as string;
}

type FormValues = Omit<PetFormValues, 'age' | 'weightKg' | 'isSterilized'> & {
  dob?: string; size?: string; color?: string; microchipNumber?: string; traits?: TagValue[];
  goodWith?: TagValue[]; badWith?: TagValue[]; adoptionRequirements?: { iconKey: string; label: Bilingual }[];
  medicalRecords?: MedicalRecordDraft[]; weight?: number; isSpayedNeutered?: boolean;
};

const emptyFormValues: FormValues = {
  ...(emptyPetFormValues as any), dob: '', size: SIZE_OPTIONS[0].value, color: '', microchipNumber: '',
  traits: [], goodWith: [], badWith: [], adoptionRequirements: [], medicalRecords: [], weight: undefined, isSpayedNeutered: false,
};
delete (emptyFormValues as any).age; delete (emptyFormValues as any).weightKg; delete (emptyFormValues as any).isSterilized;

// ============================================================================
// COMPONENT: TagInput (Minimalist)
// ============================================================================
const TagInput = ({ value, onChange, suggestions, placeholder }: { value: TagValue[]; onChange: (next: TagValue[]) => void; suggestions?: Bilingual[]; placeholder: string; }) => {
  const [draft, setDraft] = useState('');
  const hasTag = (vi: string) => value.some((v) => v.vi.trim().toLowerCase() === vi.trim().toLowerCase());
  const addCustomTag = (text: string) => {
    const trimmed = text.trim(); if (!trimmed || hasTag(trimmed)) return;
    onChange([...value, { vi: trimmed, en: '', isCustom: true }]); setDraft('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((tag, i) => (
          <span key={`${tag.vi}_${i}`} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm border border-gray-300 text-gray-700 bg-gray-50/50">
            {tag.vi}
            <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><FiX size={14} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-4 items-center">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCustomTag(draft); } }} placeholder={placeholder} className={inputClass} />
        <button type="button" onClick={() => addCustomTag(draft)} className="text-[#E89B5A] hover:text-[#1a665c] shrink-0 p-2"><FiPlus size={22} /></button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {suggestions.filter((s) => !hasTag(s.vi)).map((s) => (
            <button key={s.vi} type="button" onClick={() => { if (!hasTag(s.vi)) onChange([...value, { vi: s.vi, en: s.en }]); }} className="text-xs px-3 py-1 rounded-full text-gray-400 border border-transparent hover:border-gray-200 transition-all">
              + {s.vi}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HÀM TÍNH TUỔI CHO ĐIỆN THOẠI PREVIEW
// ============================================================================
function calculateAgeString(dobStr?: string): string {
  if (!dobStr) return '--';
  const birthDate = new Date(dobStr);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (years > 0) return `${years} tuổi`;
  if (months > 0) return `${months} tháng`;
  return '< 1 tháng';
}

// ============================================================================
// TRAIT PILL COLORS — sao chép chính xác logic từ pet-detail-modal.tsx để
// preview và app thật luôn ra cùng một màu cho cùng một tên trait
// ============================================================================
const TRAIT_COLOR_GROUPS = [
  [ // Nhóm 1
    { bg: 'bg-[#FFF4E8]', text: 'text-[#F3B27B]', border: 'border-[#E8A53C]/25' },
    { bg: 'bg-[#FFEFF6]', text: 'text-[#F40C6D]', border: 'border-[#F40C6D]/25' },
  ],
  [ // Nhóm 2
    { bg: 'bg-[#EBF4FE]', text: 'text-[#88B2F3]', border: 'border-[#5A90DA]/25' },
    { bg: 'bg-[#FDF1FF]', text: 'text-[#C75ADA]', border: 'border-[#C75ADA]/25' },
  ],
  [ // Nhóm 3
    { bg: 'bg-[#EAF8EF]', text: 'text-[#8FD49D]', border: 'border-[#83DA5A]/25' },
    { bg: 'bg-[#E7FFF9]', text: 'text-[#1DB08E]', border: 'border-[#38DFB8]/25' },
  ],
];

function getStableVariant(str: string): number {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 2;
}

function getTraitPillStyle(text: string, index: number) {
  const groupIndex = index % TRAIT_COLOR_GROUPS.length;
  const variantIndex = getStableVariant(text);
  return TRAIT_COLOR_GROUPS[groupIndex][variantIndex];
}

function getGenderLabelVi(gender?: string): string {
  switch (gender) {
    case 'MALE': return 'Đực';
    case 'FEMALE': return 'Cái';
    default: return 'Không rõ';
  }
}

// Sao chép logic đếm mũi tiêm còn thiếu từ pet-detail-modal.tsx (1 mũi Dại + 3 mũi lõi)
function computeVaccineSummary(values: FormValues, speciesKey: 'Dog' | 'Cat') {
  const vaccinations = (values.medicalRecords || []).filter((r) => r.type === 'vaccination');
  const rabiesIds = speciesKey === 'Dog' ? ['DOG_RABIES'] : ['CAT_RABIES'];
  const coreIds = speciesKey === 'Dog' ? ['DOG_DHP', 'DOG_DHPP'] : ['CAT_FVRCP'];
  const rabiesCount = vaccinations.filter((r) => rabiesIds.includes(r.vaccineType || '')).length;
  const coreCount = vaccinations.filter((r) => coreIds.includes(r.vaccineType || '')).length;
  const missingRabies = Math.max(0, 1 - rabiesCount);
  const missingCore = Math.max(0, 3 - coreCount);
  const totalMissing = missingRabies + missingCore;
  const isFullyVaccinated = !!values.isVaccinated || totalMissing === 0;
  return { isFullyVaccinated, totalMissing };
}

// ============================================================================
// COMPONENT: MobilePreview (The iPhone Mockup with Drag-to-Scroll)
// Bố cục & màu sắc bám sát 1:1 theo app/pet-detail-modal.tsx
// ============================================================================
const MobilePreview = ({ values, images, isBusy, isUploadingMedicalImages, isLocalizing }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartY(e.pageY - scrollRef.current.offsetTop);
    setScrollTop(scrollRef.current.scrollTop);
  };

  const onMouseLeave = () => { setIsDragging(false); };
  const onMouseUp = () => { setIsDragging(false); };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const y = e.pageY - scrollRef.current.offsetTop;
    const walk = (y - startY) * 1.5; // Tốc độ cuộn
    scrollRef.current.scrollTop = scrollTop - walk;
  };

  const speciesKey = resolveVaccineSpeciesKey(values.species);
  const { isFullyVaccinated, totalMissing } = computeVaccineSummary(values, speciesKey);
  const vaccineText = isFullyVaccinated ? 'Đầy đủ' : `Thiếu ${totalMissing}`;
  const spayedText = values.isSpayedNeutered ? 'Đã triệt sản' : 'Chưa triệt sản';
  const genderLabel = getGenderLabelVi(values.gender);
  const sizeLabel = SIZE_OPTIONS.find((s) => s.value === values.size)?.label || '--';
  const weightOrSizeText = values.weight ? `${values.weight} kg` : sizeLabel;
  const displayImages: string[] = Array.isArray(images) ? images : [];
  const hasBehavior = (values.goodWith && values.goodWith.length > 0) || (values.badWith && values.badWith.length > 0);

  return (
    <div className="w-[320px] h-[680px] bg-[#F9FAFB] rounded-[45px] border-[10px] border-gray-900 shadow-[0_20px_50px_rgb(0,0,0,0.15)] relative overflow-hidden flex flex-col shrink-0 mx-auto select-none font-sans">
      
      {/* Dynamic Island / Notch */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50 pointer-events-none">
        <div className={`bg-black rounded-[24px] transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)] flex items-center shadow-lg overflow-hidden ${isBusy ? 'w-[160px] h-[36px] px-4 justify-between mt-2' : 'w-[110px] h-6 justify-end px-3'}`}>
             {isBusy ? (
               <>
                 <span className="text-white text-xs font-semibold animate-pulse tracking-wide">
                   {isUploadingMedicalImages ? 'Uploading...' : isLocalizing ? 'Translating...' : 'Saving...'}
                 </span>
                 <div className="w-4 h-4 border-2 border-[#E89B5A] border-t-transparent rounded-full animate-spin"></div>
               </>
             ) : (
                <div className="w-3 h-3 rounded-full bg-[#141414] shadow-inner ring-1 ring-white/10 flex items-center justify-center opacity-0"></div>
             )}
        </div>
      </div>

      {/* Back chevron — giống nút back trên pet-detail-modal */}
      <div className="absolute top-10 left-4 z-40 pointer-events-none">
        <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
          <FiChevronLeft color="white" size={20} />
        </div>
      </div>

      {/* Scrollable Container (Drag to scroll) */}
      <div 
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className={`h-full w-full overflow-y-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Ẩn scrollbar
      >
        <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />
        
        {/* Cover Image / Carousel — cao ~48% giống màn chi tiết thật */}
        <div className="h-[326px] relative bg-gray-200 w-full shrink-0 pointer-events-none">
          {displayImages[0] ? (
            <Image src={displayImages[0]} alt="Preview" fill className="object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400"><FiUpload size={32} opacity={0.5} /></div>
          )}
          {displayImages.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-1.5 z-10">
              {displayImages.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all ${i === 0 ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Sheet — bố cục theo đúng thứ tự app/pet-detail-modal.tsx */}
        <div className="bg-white -mt-6 rounded-t-3xl relative z-10 pb-32 pointer-events-none">

          {/* Header: tên + giống + nút "more" + địa chỉ/ID */}
          <div className="px-[22px] pt-4 pb-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline flex-1 min-w-0">
                <h2 className="text-[22px] font-semibold text-black truncate">{values.name || 'Tên thú cưng'}</h2>
                <span className="text-[13px] text-gray-400 ml-2 truncate">({values.breed || 'Chưa rõ giống'})</span>
              </div>
              <FiMoreHorizontal className="text-gray-400 shrink-0" size={16} />
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center min-w-0">
                <FiMapPin size={12} className="text-gray-400 shrink-0" />
                <span className="text-[11px] text-gray-400 ml-1.5 truncate max-w-[150px]">Địa chỉ trạm cứu hộ</span>
              </div>
              <div className="flex items-center shrink-0">
                <FiAward size={12} className="text-gray-400" />
                <span className="text-[11px] text-gray-400 ml-1.5">—</span>
              </div>
            </div>
          </div>

          <div className="px-[22px] flex flex-col gap-5 mt-5">
            {/* Stat cards: Giới tính / Tuổi / Cân nặng */}
            <div className="flex justify-between gap-2.5">
              <div className={`flex-1 ${values.gender === 'FEMALE' ? 'bg-[#FAE8ED]' : 'bg-[#EAF4FB]'} py-3 rounded-2xl flex flex-col items-center`}>
                <span className="text-[11px] text-gray-400 mb-1">Giới tính</span>
                <span className="text-[13px] font-semibold text-black">{genderLabel}</span>
              </div>
              <div className="flex-1 bg-[#FCF8D6] py-3 rounded-2xl flex flex-col items-center">
                <span className="text-[11px] text-gray-400 mb-1">Tuổi</span>
                <span className="text-[13px] font-semibold text-black">{calculateAgeString(values.dob)}</span>
              </div>
              <div className="flex-1 bg-[#E8F9E6] py-3 rounded-2xl flex flex-col items-center">
                <span className="text-[11px] text-gray-400 mb-1">Cân nặng</span>
                <span className="text-[13px] font-semibold text-black">{weightOrSizeText}</span>
              </div>
            </div>

            {/* Shelter row */}
            <div className="flex items-center">
              <div className="w-[42px] h-[42px] rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-orange-400 shrink-0">
                <FiMapPin size={16} />
              </div>
              <div className="flex-1 ml-3 min-w-0">
                <p className="text-[13px] font-medium text-black truncate">PawLife Shelter</p>
                <p className="text-[11px] text-gray-400 truncate">Trạm cứu hộ động vật</p>
              </div>
              <FiChevronRight className="text-gray-400 shrink-0" size={16} />
            </div>

            {/* About + Traits */}
            <div>
              <h3 className="text-[15px] font-medium text-black mb-2">Về {values.name || 'bé'}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {values.description || 'Mô tả tính cách và thói quen của bé sẽ hiển thị ở đây để người nhận nuôi dễ dàng tìm hiểu.'}
              </p>
              {(values.traits && values.traits.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {values.traits.map((t: TagValue, i: number) => {
                    const style = getTraitPillStyle(t.vi, i);
                    return (
                      <span key={`${t.vi}_${i}`} className={`${style.bg} ${style.text} ${style.border} border px-3.5 py-1 rounded-full text-[11px] font-medium`}>
                        {t.vi}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Behavior */}
            {hasBehavior && (
              <div>
                <h3 className="text-[15px] font-medium text-black mb-2">Tính cách của {values.name || 'bé'}</h3>
                {values.goodWith && values.goodWith.length > 0 && (
                  <div className="flex items-start">
                    <div className="flex items-center gap-1 mt-[2px] shrink-0">
                      <FiCheck size={12} className="text-[#77C852]" />
                      <span className="text-[12px] font-medium text-[#77C852]">Thân thiện:</span>
                    </div>
                    <span className="flex-1 ml-1.5 text-[12px] text-gray-500 leading-5">
                      {values.goodWith.map((t: TagValue) => t.vi).join(', ')}
                    </span>
                  </div>
                )}
                {values.badWith && values.badWith.length > 0 && (
                  <div className="flex items-start mt-1">
                    <div className="flex items-center gap-1 mt-[2px] shrink-0">
                      <FiX size={12} className="text-[#FE7D66]" />
                      <span className="text-[12px] font-medium text-[#FE7D66]">Nên cân nhắc:</span>
                    </div>
                    <span className="flex-1 ml-1.5 text-[12px] text-gray-500 leading-5">
                      {values.badWith.map((t: TagValue) => t.vi).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Health Care capsules */}
            <div>
              <h3 className="text-[15px] font-medium text-black mb-3">Chăm sóc sức khỏe</h3>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center rounded-[44px] bg-[#F7F7F7] h-[46px] px-[5px]">
                  <div className="bg-white w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                    {isFullyVaccinated ? <FiCheckCircle className="text-[#E89B5A]" size={17} /> : <FiAlertCircle className="text-[#E89B5A]" size={17} />}
                  </div>
                  <div className="ml-1.5 min-w-0">
                    <p className="text-[11px] text-gray-400 truncate">Tiêm chủng</p>
                    <p className="text-[12px] font-medium text-black truncate">{vaccineText}</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center rounded-[44px] bg-[#F7F7F7] h-[46px] px-[5px]">
                  <div className="bg-white w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                    {values.isSpayedNeutered ? <FiCheckCircle className="text-[#E89B5A]" size={17} /> : <FiAlertCircle className="text-[#E89B5A]" size={17} />}
                  </div>
                  <div className="ml-1.5 min-w-0">
                    <p className="text-[11px] text-gray-400 truncate">Trạng thái</p>
                    <p className="text-[12px] font-medium text-black truncate">{spayedText}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Adoption Requirements */}
            <div>
              <h3 className="text-[15px] font-medium text-black mb-3">Yêu cầu nhận nuôi</h3>
              {values.adoptionRequirements && values.adoptionRequirements.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {values.adoptionRequirements.map((r: { iconKey: string; label: Bilingual }) => {
                    const opt = ADOPTION_REQUIREMENT_OPTIONS.find((o) => o.iconKey === r.iconKey);
                    const Icon = opt?.Icon || FiMoreHorizontal;
                    return (
                      <div key={r.iconKey} className="flex items-center px-3 h-[25px] rounded-full bg-white border border-[#E5E5E5] shadow-sm">
                        <Icon size={12} className="text-gray-500" />
                        <span className="text-[11px] text-gray-500 ml-1.5">{r.label.vi}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px] text-gray-400 italic">Chưa có yêu cầu nhận nuôi cụ thể.</p>
              )}
            </div>

            {/* Paw History — hồ sơ mới nên luôn ở trạng thái rỗng, đúng như app thật */}
            <div>
              <h3 className="text-[15px] font-medium text-black mb-3">Lịch sử hoạt động</h3>
              <div className="border border-gray-200 rounded-[20px] bg-white py-6 px-4">
                <p className="text-center text-gray-400 text-[12px] italic">Chưa có lịch sử hoạt động.</p>
                <div className="flex items-center justify-center gap-2 mt-4 bg-gray-50 rounded-lg py-2">
                  <FiLock size={11} className="text-gray-400" />
                  <span className="text-[11px] text-gray-400">Hành trình không thể bị xoá hay chỉnh sửa.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar — nút yêu thích + nút đăng ký nhận nuôi, giống app thật */}
      <div className="absolute bottom-0 inset-x-0 px-5 pt-4 bg-white z-20 pointer-events-none flex items-center gap-3" style={{ paddingBottom: 18 }}>
        <div className="w-[46px] h-[46px] rounded-full border-2 border-gray-200 flex items-center justify-center bg-white shrink-0">
          <FiHeart className="text-gray-300" size={20} />
        </div>
        <div className="flex-1 bg-[#E89B5A] text-white py-3.5 rounded-full text-center font-bold text-sm shadow-lg shadow-orange-200">
          Đăng ký nhận nuôi
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const PetForm: React.FC<{ mode: 'create' | 'edit'; initialPet?: any }> = ({ mode, initialPet }) => {
  const router = useRouter();
  const { createPet, updatePet, isSubmitting } = usePetActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const medicalFileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<FormValues>(emptyFormValues);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [customBreedMode, setCustomBreedMode] = useState(false);
  const [originalBilingual, setOriginalBilingual] = useState({ description: { vi: '', en: '' }, color: { vi: '', en: '' }, breed: { vi: '', en: '' } });
  const [isLocalizing, setIsLocalizing] = useState(false);
  
  const [medicalDraft, setMedicalDraft] = useState<MedicalRecordDraft | null>(null);
  const [isUploadingMedicalImages, setIsUploadingMedicalImages] = useState(false);

  const speciesKey = resolveVaccineSpeciesKey(values.species);
  const isBusy = isSubmitting || isLocalizing || isUploadingMedicalImages;

  const medicalNewImagePreviews = useMemo(() => {
    if (!medicalDraft) return [];
    return medicalDraft.newImageFiles.map((f) => URL.createObjectURL(f));
  }, [medicalDraft?.newImageFiles]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      medicalNewImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews, medicalNewImagePreviews]);

  useEffect(() => {
    if (initialPet) {
      const initialSpeciesKey = resolveVaccineSpeciesKey(initialPet.species);
      const descriptionBi = parseBilingual(initialPet.description);
      const colorBi = parseBilingual(initialPet.color);
      const breedBi = parseBilingual(initialPet.breed);
      const matchedBreed = BREED_OPTIONS[initialSpeciesKey].find((b) => b.vi === breedBi.vi);
      
      setCustomBreedMode(!!breedBi.vi && !matchedBreed);
      setOriginalBilingual({ description: descriptionBi, color: colorBi, breed: breedBi });

      const normalizeTag = (raw: any): TagValue => {
        const bi = parseBilingual(raw);
        return { ...bi, isCustom: !bi.en || bi.en === bi.vi };
      };

      setValues({
        name: initialPet.name, species: initialPet.species, breed: breedBi.vi, gender: initialPet.gender, status: initialPet.status,
        description: descriptionBi.vi, healthStatus: initialPet.healthStatus ?? [], weight: initialPet.weight, isVaccinated: initialPet.isVaccinated ?? false,
        isSpayedNeutered: initialPet.isSpayedNeutered ?? false, dob: initialPet.dob ? String(initialPet.dob).slice(0, 10) : '',
        size: initialPet.size || SIZE_OPTIONS[0].value, color: colorBi.vi, microchipNumber: initialPet.microchipNumber || '',
        traits: (initialPet.traitsList || initialPet.traits || []).map(normalizeTag),
        goodWith: (Array.isArray(initialPet.goodWith) ? initialPet.goodWith : []).map(normalizeTag),
        badWith: (Array.isArray(initialPet.badWith) ? initialPet.badWith : []).map(normalizeTag),
        adoptionRequirements: (initialPet.adoptionRequirements || []).map((r: any) => ({ iconKey: r.iconKey, label: parseBilingual(r.label) })),
        medicalRecords: (initialPet.medicalRecords || []).map((r: any) => ({
          localId: r.id || `existing_${Math.random().toString(36).slice(2, 8)}`,
          type: r.type, recordName: parseBilingual(r.recordName), vaccineType: r.vaccineType || '', doseNumber: r.doseNumber || 1,
          recordDate: r.recordDate ? String(r.recordDate).slice(0, 10) : '', hasNextDueDate: !!r.hasNextDueDate, nextDueName: parseBilingual(r.nextDueName),
          nextDueDate: r.nextDueDate ? String(r.nextDueDate).slice(0, 10) : '', images: Array.isArray(r.images) ? r.images.filter(Boolean) : [], newImageFiles: [],
        })),
      } as FormValues);
      setExistingImages((initialPet.images ?? []).map((url: string) => ({ url, removed: false })));
    }
  }, [initialPet]);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setNewImages((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };
  const toggleExistingImage = (url: string) => setExistingImages((prev) => prev.map((img) => (img.url === url ? { ...img, removed: !img.removed } : img)));
  
  // -- YÊU CẦU NHẬN NUÔI --
  const toggleRequirement = (opt: { iconKey: string; vi: string; en: string }) => {
    setValues((prev) => {
      const exists = prev.adoptionRequirements?.some((r) => r.iconKey === opt.iconKey);
      return {
        ...prev,
        adoptionRequirements: exists
          ? prev.adoptionRequirements!.filter((r) => r.iconKey !== opt.iconKey)
          : [...(prev.adoptionRequirements || []), { iconKey: opt.iconKey, label: { vi: opt.vi, en: opt.en } }],
      };
    });
  };

  // -- HỒ SƠ Y TẾ --
  const handleAddMedicalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!medicalDraft) return;
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remainingSlots = 3 - (medicalDraft.images.length + medicalDraft.newImageFiles.length);
    if (remainingSlots <= 0) { alert('Tối đa 3 ảnh cho mỗi hồ sơ y tế.'); e.target.value = ''; return; }
    const filesToAdd = files.slice(0, remainingSlots);
    setMedicalDraft((d) => (d ? { ...d, newImageFiles: [...d.newImageFiles, ...filesToAdd] } : d));
    e.target.value = '';
  };
  const removeMedicalExistingImage = (url: string) => setMedicalDraft((d) => (d ? { ...d, images: d.images.filter((img) => img !== url) } : d));
  const removeMedicalNewImageFile = (index: number) => setMedicalDraft((d) => (d ? { ...d, newImageFiles: d.newImageFiles.filter((_, i) => i !== index) } : d));
  
  const saveMedicalDraft = async () => {
    if (!medicalDraft) return;
    if (medicalDraft.type === 'vaccination' && !medicalDraft.vaccineType) return;
    if (medicalDraft.type !== 'vaccination' && !medicalDraft.recordName.vi.trim()) return;
    if (medicalDraft.images.length + medicalDraft.newImageFiles.length === 0) {
      alert('Vui lòng tải lên ít nhất 1 ảnh (sổ tiêm phòng / hoá đơn khám) trước khi lưu hồ sơ.');
      return;
    }
    let finalDraft: MedicalRecordDraft = medicalDraft;
    try {
      setIsUploadingMedicalImages(true);
      let images = medicalDraft.images;
      if (medicalDraft.newImageFiles.length > 0) {
        const uploadedUrls = await Promise.all(medicalDraft.newImageFiles.map((f) => uploadImageToStorage(f)));
        images = [...images, ...uploadedUrls];
      }
      let recordName: Bilingual;
      if (medicalDraft.type === 'vaccination') {
        const v = VACCINE_OPTIONS[speciesKey].find((x) => x.id === medicalDraft.vaccineType);
        recordName = { vi: v?.vi || '', en: v?.en || '' };
      } else { recordName = await buildBilingualFreeText(medicalDraft.recordName.vi); }
      finalDraft = { ...medicalDraft, images, newImageFiles: [], recordName };
    } catch (err) {
      alert('Không thể xử lý ảnh hoặc song ngữ cho hồ sơ lúc này, vui lòng thử lại.');
      setIsUploadingMedicalImages(false); return;
    }
    setIsUploadingMedicalImages(false);

    if (finalDraft.hasNextDueDate) {
      if (!finalDraft.nextDueDate) {
        const computed = await computeNextDue(finalDraft, speciesKey);
        if (computed) finalDraft = { ...finalDraft, nextDueDate: computed.nextDueDate, nextDueName: computed.nextDueName };
      } else {
        finalDraft = { ...finalDraft, nextDueName: await buildBilingualFreeText(finalDraft.nextDueName?.vi || '') };
      }
    }
    setValues((prev) => {
      const already = prev.medicalRecords?.some((r) => r.localId === finalDraft.localId);
      return { ...prev, medicalRecords: already ? prev.medicalRecords!.map((r) => (r.localId === finalDraft.localId ? finalDraft : r)) : [...(prev.medicalRecords || []), finalDraft] };
    });
    setMedicalDraft(null);
  };
  const removeMedicalRecord = (localId: string) => setValues((prev) => ({ ...prev, medicalRecords: prev.medicalRecords?.filter((r) => r.localId !== localId) }));

  const localizeTags = async (tags: TagValue[]): Promise<Bilingual[]> => {
    return Promise.all(tags.map(async (t) => (t.isCustom ? { vi: t.vi, en: await translateText(t.vi, 'vi', 'en') } : { vi: t.vi, en: t.en })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLocalizing(true);
    let payload: any;
    try {
      const [descriptionBi, colorBi] = await Promise.all([
        buildBilingualOnSubmit(values.description, originalBilingual.description),
        buildBilingualOnSubmit(values.color || '', originalBilingual.color),
      ]);
      const predefinedBreed = BREED_OPTIONS[speciesKey].find((b) => b.vi === values.breed);
      const breedBi = predefinedBreed ? { vi: predefinedBreed.vi, en: predefinedBreed.en } : await buildBilingualOnSubmit(values.breed, originalBilingual.breed);
      const [traitsBi, goodWithBi, badWithBi] = await Promise.all([
        localizeTags(values.traits || []), localizeTags(values.goodWith || []), localizeTags(values.badWith || []),
      ]);
      
      const { healthStatus, ...restValues } = values; 
      payload = { ...restValues, description: descriptionBi, color: colorBi, breed: breedBi, traits: traitsBi, goodWith: goodWithBi, badWith: badWithBi };
    } catch (err) {
      alert('Không thể xử lý song ngữ, vui lòng thử lại.');
      setIsLocalizing(false); return;
    }
    setIsLocalizing(false);
    let success = false;
    if (mode === 'create') success = await createPet(payload, newImages);
    else if (initialPet) success = await updatePet(initialPet.id, payload, newImages, existingImages.filter((img) => !img.removed).map((img) => img.url));
    if (success) router.push('/shelter/pets');
  };

  const previewImages = useMemo(() => {
    const kept = existingImages.filter((img) => !img.removed).map((img) => img.url);
    return [...kept, ...newImagePreviews];
  }, [existingImages, newImagePreviews]);

  return (
    <div className="relative min-h-screen bg-[#FDFDFD] font-sans flex flex-col lg:flex-row gap-12 lg:p-12 p-6 max-w-[1600px] mx-auto">
      
      {/* ================= LEFT PANE: FORM ================= */}
      <div className="flex-1 max-w-3xl">
        <div className="mb-10">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-2">
            {mode === 'create' ? 'Thêm Thú Cưng' : 'Chỉnh Sửa Hồ Sơ'}
          </h1>
          <p className="text-sm text-gray-400 font-medium">Nhập thông tin cơ bản. Nội dung sẽ được tự động dịch sang tiếng Anh.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* HÌNH ẢNH */}
          <h3 className={sectionHeaderClass}>Thư viện ảnh</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            {existingImages.map((img) => (
              <div key={img.url} className={`relative w-24 h-24 overflow-hidden rounded-xl transition-all ${img.removed ? 'opacity-30 grayscale' : ''}`}>
                <Image src={img.url} alt="pet" fill className="object-cover" />
                <button type="button" onClick={() => toggleExistingImage(img.url)} className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-gray-800"><FiX size={12} /></button>
              </div>
            ))}
            {newImagePreviews.map((src, i) => (
              <div key={src} className="relative w-24 h-24 overflow-hidden rounded-xl">
                <Image src={src} alt="new pet" fill className="object-cover" />
                <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-gray-800"><FiX size={12} /></button>
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-xl border border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-800 hover:text-gray-800 transition-colors">
              <FiPlus size={24} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
          </div>

          {/* CƠ BẢN */}
          <h3 className={sectionHeaderClass}>Thông tin cơ bản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className={labelClass}>Tên thú cưng</label>
              <input value={values.name} onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="VD: Cậu Vàng" required />
            </div>

            <div>
              <label className={labelClass}>Loài</label>
              <select value={values.species} onChange={(e) => { setValues((p) => ({ ...p, species: e.target.value as PetSpecies, breed: '' })); setCustomBreedMode(false); }} className={inputClass}>
                {(Object.keys(PET_SPECIES_LABEL) as PetSpecies[]).map((s) => <option key={s} value={s}>{PET_SPECIES_LABEL[s]}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Giống</label>
              {!customBreedMode ? (
                <select value={BREED_OPTIONS[speciesKey].some((b) => b.vi === values.breed) ? values.breed : ''} onChange={(e) => { if (e.target.value === CUSTOM_BREED_VALUE) { setCustomBreedMode(true); setValues((p) => ({ ...p, breed: '' })); } else { setValues((p) => ({ ...p, breed: e.target.value })); } }} className={inputClass}>
                  <option value="">Chọn giống...</option>
                  {BREED_OPTIONS[speciesKey].map((b) => <option key={b.vi} value={b.vi}>{b.vi}</option>)}
                  <option value={CUSTOM_BREED_VALUE}>Khác (tự nhập)...</option>
                </select>
              ) : (
                <div className="flex gap-4 items-center border-b border-gray-300">
                  <input value={values.breed} onChange={(e) => setValues((p) => ({ ...p, breed: e.target.value }))} placeholder="Nhập giống..." className="w-full bg-transparent py-3 outline-none text-[15px] font-medium" />
                  <button type="button" onClick={() => setCustomBreedMode(false)} className="text-xs font-bold text-gray-400 hover:text-gray-800 uppercase tracking-widest shrink-0">Danh sách</button>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Màu sắc</label>
              <input value={values.color || ''} onChange={(e) => setValues((p) => ({ ...p, color: e.target.value }))} className={inputClass} placeholder="VD: Vàng, Đen trắng" />
            </div>

            <div>
              <label className={labelClass}>Giới tính</label>
              <select value={values.gender} onChange={(e) => setValues((p) => ({ ...p, gender: e.target.value as PetGender }))} className={inputClass}>
                <option value="MALE">Đực</option><option value="FEMALE">Cái</option><option value="UNKNOWN">Chưa rõ</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Ngày sinh</label>
              <input type="date" value={values.dob || ''} onChange={(e) => setValues((p) => ({ ...p, dob: e.target.value }))} max={new Date().toISOString().slice(0, 10)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Cân nặng (kg)</label>
              <input type="number" min={0} step={0.1} value={values.weight ?? ''} onChange={(e) => setValues((p) => ({ ...p, weight: e.target.value ? Number(e.target.value) : undefined }))} className={inputClass} placeholder="VD: 5.5" />
            </div>
            
            <div>
              <label className={labelClass}>Kích thước</label>
              <select value={values.size} onChange={(e) => setValues((p) => ({ ...p, size: e.target.value }))} className={inputClass}>
                {SIZE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Trạng thái hệ thống</label>
              <select value={values.status} onChange={(e) => setValues((p) => ({ ...p, status: e.target.value as PetStatus }))} className={inputClass}>
                {(Object.keys(PET_STATUS_LABEL) as PetStatus[]).map((s) => <option key={s} value={s}>{PET_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-8 mt-6 mb-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={values.isVaccinated} onChange={(e) => setValues((p) => ({ ...p, isVaccinated: e.target.checked }))} className="sr-only peer" />
              <div className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center peer-checked:bg-[#E89B5A] peer-checked:border-[#E89B5A] transition-colors"><FiCheckCircle className="text-white opacity-0 peer-checked:opacity-100" size={12}/></div>
              <span className="text-sm font-medium text-gray-700">Đã tiêm phòng</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={values.isSpayedNeutered} onChange={(e) => setValues((p) => ({ ...p, isSpayedNeutered: e.target.checked }))} className="sr-only peer" />
              <div className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center peer-checked:bg-[#E89B5A] peer-checked:border-[#E89B5A] transition-colors"><FiCheckCircle className="text-white opacity-0 peer-checked:opacity-100" size={12}/></div>
              <span className="text-sm font-medium text-gray-700">Đã triệt sản</span>
            </label>
          </div>

          {/* TÍNH CÁCH */}
          <h3 className={sectionHeaderClass}>Tính cách & Thói quen</h3>
          <div className="flex flex-col gap-8">
            <div>
              <label className={labelClass}>Đặc điểm tính cách</label>
              <TagInput value={values.traits || []} onChange={(next) => setValues((p) => ({ ...p, traits: next }))} suggestions={TRAIT_OPTIONS} placeholder="Thêm đặc điểm..." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>Thân thiện với</label>
                <TagInput value={values.goodWith || []} onChange={(next) => setValues((p) => ({ ...p, goodWith: next }))} suggestions={COMPANION_OPTIONS} placeholder="VD: Trẻ em..." />
              </div>
              <div>
                <label className={labelClass}>Cân nhắc với</label>
                <TagInput value={values.badWith || []} onChange={(next) => setValues((p) => ({ ...p, badWith: next }))} suggestions={COMPANION_OPTIONS} placeholder="VD: Người lạ..." />
              </div>
            </div>

            <div>
              <label className={labelClass}>Mô tả chi tiết / Câu chuyện</label>
              <textarea value={values.description} onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder="Hãy kể một chút về tính cách của bé..." className={`${inputClass} resize-none bg-gray-50/50 p-4 border-t`} />
            </div>
          </div>

          {/* KHÔI PHỤC YÊU CẦU NHẬN NUÔI */}
          <h3 className={sectionHeaderClass}>Yêu cầu nhận nuôi</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {ADOPTION_REQUIREMENT_OPTIONS.map((opt) => {
              const active = values.adoptionRequirements?.some((r) => r.iconKey === opt.iconKey);
              return (
                <button
                  type="button"
                  key={opt.iconKey}
                  onClick={() => toggleRequirement(opt)}
                  className={`px-4 py-2 rounded-full text-sm transition-all border ${
                    active ? 'bg-[#E89B5A]/10 border-[#E89B5A] text-[#E89B5A] font-semibold' : 'bg-transparent border-gray-300 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {opt.vi}
                </button>
              );
            })}
          </div>

          {/* KHÔI PHỤC HỒ SƠ Y TẾ */}
          <h3 className={sectionHeaderClass}>
            Hồ sơ y tế
            {!medicalDraft && (
              <button type="button" onClick={() => setMedicalDraft(emptyMedicalDraft())} className="float-right text-[#E89B5A] flex items-center gap-1 normal-case tracking-normal">
                <FiPlus /> Thêm hồ sơ
              </button>
            )}
          </h3>
          
          <div className="flex flex-col gap-3">
            {(values.medicalRecords || []).map((r) => (
              <div key={r.localId} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-4">
                  {r.images[0] ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                      <Image src={r.images[0]} alt="medical" fill className="object-cover" />
                    </div>
                  ) : (
                     <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                       <FiClock className="text-gray-400" size={18} />
                     </div>
                  )}
                  <div>
                    <p className="text-[14px] font-bold text-gray-800">
                      {RECORD_TYPE_OPTIONS.find((t) => t.id === r.type)?.label}
                      {r.recordName?.vi ? ` — ${r.recordName.vi}` : ''}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {r.recordDate || '—'}
                      {r.hasNextDueDate && r.nextDueDate ? ` · Hẹn: ${r.nextDueDate}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <button type="button" onClick={() => setMedicalDraft(r)} className="text-sm font-medium text-gray-500 hover:text-[#E89B5A]">Sửa</button>
                  <button type="button" onClick={() => removeMedicalRecord(r.localId)} className="text-sm font-medium text-red-400 hover:text-red-500"><FiTrash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          {medicalDraft && (
            <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-200 flex flex-col gap-5 mt-2">
              <h4 className="font-bold text-gray-700">Thêm / Sửa Hồ Sơ Y Tế</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {RECORD_TYPE_OPTIONS.map((opt) => (
                  <button type="button" key={opt.id} onClick={() => setMedicalDraft((d) => (d ? { ...d, type: opt.id, vaccineType: '', recordName: { vi: '', en: '' } } : d))} className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${medicalDraft.type === opt.id ? 'bg-white border-[#E89B5A] text-[#E89B5A] shadow-sm' : 'bg-transparent border-gray-300 text-gray-500'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {medicalDraft.type === 'vaccination' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select value={medicalDraft.vaccineType} onChange={(e) => setMedicalDraft((d) => (d ? { ...d, vaccineType: e.target.value } : d))} className={inputClass}>
                    <option value="">Chọn loại vắc-xin...</option>
                    {VACCINE_OPTIONS[speciesKey].map((v) => <option key={v.id} value={v.id}>{v.vi}</option>)}
                  </select>
                  {medicalDraft.vaccineType && !['DOG_RABIES', 'CAT_RABIES', 'DOG_BORDETELLA'].includes(medicalDraft.vaccineType) && (
                    <div className="flex items-center gap-6 border-b border-gray-300 py-3">
                      <span className="text-[13px] font-bold text-gray-500">Mũi tiêm:</span>
                      {[1, 2, 3].map((d) => (
                        <label key={d} className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                          <input type="radio" checked={medicalDraft.doseNumber === d} onChange={() => setMedicalDraft((draft) => (draft ? { ...draft, doseNumber: d as 1 | 2 | 3 } : draft))} className="accent-[#E89B5A]" />
                          {d}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input value={medicalDraft.recordName.vi} onChange={(e) => setMedicalDraft((d) => (d ? { ...d, recordName: { vi: e.target.value, en: d.recordName.en } } : d))} placeholder="Nhập tên hồ sơ..." className={inputClass} />
              )}

              <div>
                <label className={labelClass}>Ngày ghi nhận</label>
                <input type="date" value={medicalDraft.recordDate} onChange={(e) => setMedicalDraft((d) => (d ? { ...d, recordDate: e.target.value } : d))} max={new Date().toISOString().slice(0, 10)} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Ảnh hồ sơ (Sổ tiêm / Hoá đơn) — Tối đa 3 ảnh</label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {medicalDraft.images.map((url) => (
                    <div key={url} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                      <Image src={url} alt="medical" fill className="object-cover" />
                      <button type="button" onClick={() => removeMedicalExistingImage(url)} className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-gray-700"><FiX size={12} /></button>
                    </div>
                  ))}
                  {medicalDraft.newImageFiles.map((_, i) => (
                    <div key={`new_${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E89B5A]">
                      <Image src={medicalNewImagePreviews[i]} alt="new medical" fill className="object-cover" />
                      <button type="button" onClick={() => removeMedicalNewImageFile(i)} className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-gray-700"><FiX size={12} /></button>
                    </div>
                  ))}
                  {medicalDraft.images.length + medicalDraft.newImageFiles.length < 3 && (
                    <button type="button" onClick={() => medicalFileInputRef.current?.click()} className="w-16 h-16 rounded-xl border border-gray-300 flex items-center justify-center text-gray-400 bg-transparent hover:border-gray-800 transition-all">
                      <FiUpload size={16} />
                    </button>
                  )}
                </div>
                <input ref={medicalFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddMedicalImages} />
              </div>

              <div className="flex items-center gap-3 mt-2">
                <input type="checkbox" checked={medicalDraft.hasNextDueDate} onChange={(e) => setMedicalDraft((d) => (d ? { ...d, hasNextDueDate: e.target.checked } : d))} className="accent-[#E89B5A] w-4 h-4" />
                <span className="text-[14px] font-bold text-gray-700">Có lịch hẹn tiếp theo</span>
              </div>
              
              {medicalDraft.hasNextDueDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={medicalDraft.nextDueName?.vi || ''} onChange={(e) => setMedicalDraft((d) => d ? { ...d, nextDueName: { vi: e.target.value, en: d.nextDueName?.en || '' } } : d)} placeholder="Ghi chú nhắc lịch..." className={inputClass} />
                  <input type="date" value={medicalDraft.nextDueDate} onChange={(e) => setMedicalDraft((d) => (d ? { ...d, nextDueDate: e.target.value } : d))} className={inputClass} />
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setMedicalDraft(null)} className="text-sm font-bold text-gray-400 hover:text-gray-800">HUỶ</button>
                <button type="button" onClick={saveMedicalDraft} disabled={isUploadingMedicalImages} className="text-sm font-bold text-[#E89B5A] hover:text-[#1c645a] disabled:opacity-50">
                  {isUploadingMedicalImages ? 'ĐANG TẢI ẢNH LÊN...' : 'LƯU HỒ SƠ Y TẾ'}
                </button>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-6 mt-12 pt-8 border-t border-gray-200">
            <button type="button" onClick={() => router.push('/shelter/pets')} className="px-8 py-3 text-sm font-bold tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors">
              Huỷ
            </button>
            <button type="submit" disabled={isSubmitting || isLocalizing} className="px-10 py-3 text-sm font-bold tracking-widest uppercase bg-gray-900 text-white rounded-full hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-gray-900/20">
              {isLocalizing ? 'Translating...' : isSubmitting ? 'Saving...' : 'Lưu Hồ Sơ'}
            </button>
          </div>
        </form>
      </div>

      {/* ================= RIGHT PANE: PHONE MOCKUP PREVIEW ================= */}
      <div className="hidden lg:block w-[360px] shrink-0 relative pt-4">
        <div className="sticky top-12">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">Live App Preview</p>
          <MobilePreview values={values} images={previewImages} isBusy={isBusy} isUploadingMedicalImages={isUploadingMedicalImages} isLocalizing={isLocalizing} />
        </div>
      </div>

    </div>
  );
};