'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FiChevronLeft,
    FiChevronDown,
    FiEdit2,
    FiTrash2,
    FiCheck,
    FiX,
    FiLock,
    FiFileText,
    FiClock,
    FiPhone,
    FiMail,
    FiCalendar,
} from 'react-icons/fi';
import { PawPrint, Cake, QrCode, Home, Syringe, Stethoscope, Smile, User as UserIcon, HeartHandshake, SparklesIcon } from 'lucide-react';
import axiosClient from '@/lib/api/axiosClient';
import { usePetActions } from '@/stores/usePetStore';
import { PetPublic3DModal } from '@/components/PetPublic3DModal';

interface AdoptionApplication {
    id: string;
    applicantName: string;
    applicantAvatar?: string | null;
    applicantPhone?: string;
    applicantEmail?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt?: string;
}

const APPLICATION_STATUS_STYLE: Record<AdoptionApplication['status'], { bg: string; color: string; label: string }> = {
    PENDING: { bg: '#E8F1FF', color: '#5A90DA', label: 'Pending' },
    APPROVED: { bg: '#EBFFE2', color: '#77C852', label: 'Approved' },
    REJECTED: { bg: '#FFEAEA', color: '#FF5A5A', label: 'Rejected' },
};

const MOCK_APPLICATIONS: AdoptionApplication[] = Array.from({ length: 8 }).map((_, i) => ({
    id: `mock-app-${i + 1}`,
    applicantName: 'Maria Garcia',
    applicantAvatar: null,
    applicantPhone: '0912345678',
    applicantEmail: 'mariagarcia@email.com',
    status: 'PENDING',
    submittedAt: '2026-01-01T00:00:00.000Z',
}));

const isValidImageUrl = (url: unknown): url is string => typeof url === 'string' && url.trim().length > 0;

type MaybeBilingual = string | { vi?: string; en?: string } | null | undefined;
const showText = (val: MaybeBilingual): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.vi || val.en || '';
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');

const getAgeLabel = (dob?: string | null): string => {
    if (!dob) return 'Chưa rõ';
    const dobDate = new Date(dob);
    if (Number.isNaN(dobDate.getTime())) return 'Chưa rõ';
    const diffMs = Date.now() - dobDate.getTime();
    const ageDate = new Date(diffMs);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();
    if (years > 0) return `${years} tuổi`;
    if (months > 0) return `${months} tháng tuổi`;
    return 'Sơ sinh';
};

// Cấu hình màu sắc & Nhãn hiển thị trạng thái chuẩn theo yêu cầu
const STATUS_PHOTO_BADGE: Record<string, { bg: string; border: string; color: string; label: string }> = {
    AVAILABLE: { bg: '#DEFFDF', border: '#00AC47', color: '#00AC47', label: 'Chờ nhận nuôi' },
    PENDING: { bg: '#FFF8E5', border: '#FFBA00', color: '#FFBA00', label: 'Đang xét duyệt' },
    REJECTED: { bg: '#FFE2E2', border: '#9F0712', color: '#9F0712', label: 'Không đủ điều kiện' },
    HEALTH_ISSUE: { bg: '#FFEDD4', border: '#A13A17', color: '#A13A17', label: 'Vấn đề sức khoẻ' },
    ADOPTED: { bg: '#F0F0F0', border: '#BDBDBD', color: '#757575', label: 'Đã nhận nuôi' },
};

const TRAIT_STYLES = [
    { bg: '#FBF7EB', border: '#E8A53C', color: '#E8A53C' },
    { bg: '#E8F1FF', border: '#5A90DA', color: '#5A90DA' },
    { bg: '#EBFFE2', border: '#77C852', color: '#77C852' },
];

const FALLBACK_MOCK_PETS: Record<string, any>[] = [
    {
        id: 'pet_001',
        name: 'Luna',
        species: 'CAT',
        breed: { vi: 'Mèo Anh Lông Ngắn', en: 'British Shorthair' },
        gender: 'FEMALE',
        age: 24,
        status: 'AVAILABLE',
        images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400'],
        description: { vi: 'Rất ngoan, quấn người.', en: 'Very well-behaved and affectionate.' },
        healthStatus: ['Đã tiêm phòng dại', 'Tẩy giun'],
        weightKg: 4.2,
        isSterilized: true,
        isVaccinated: true,
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
    CURRENT_OWNER: { Icon: UserIcon, bg: '#FFE9B8', color: '#CF7900' },
    PREVIOUS_OWNER: { Icon: UserIcon, bg: '#FFE9B8', color: '#CF7900' },
    UNDER_SHELTER_CARE: { Icon: HeartHandshake, bg: '#FFE4F0', color: '#D6447A' },
    WAS_UNDER_SHELTER_CARE: { Icon: HeartHandshake, bg: '#FFE4F0', color: '#D6447A' },
};

const DEFAULT_HISTORY_CONFIG = { Icon: Cake, bg: '#F5F5F5', color: '#8E8E93' };

const HISTORY_TYPE_LABEL: Record<string, string> = {
    BIRTH: 'Ngày sinh',
    TRANSFER: 'Chuyển giao quyền sở hữu',
    VACCINE: 'Tiêm phòng',
    DENTAL_CARE: 'Khám răng miệng',
    ANNUAL_CHECKUP: 'Khám định kỳ',
    CURRENT_OWNER: 'Chủ sở hữu hiện tại',
    PREVIOUS_OWNER: 'Chủ cũ',
    UNDER_SHELTER_CARE: 'Đang ở trạm cứu hộ',
    WAS_UNDER_SHELTER_CARE: 'Từng ở trạm cứu hộ',
    QR_LINKED: 'Kích hoạt thẻ QR',
};

const RECORD_TYPE_NOTE_OPTIONS = [
    { value: 'VACCINE', label: 'Tiêm phòng' },
    { value: 'ANNUAL_CHECKUP', label: 'Khám tổng quát' },
    { value: 'DENTAL_CARE', label: 'Khám răng miệng' },
    { value: 'TRANSFER', label: 'Chuyển giao quyền sở hữu' },
    { value: 'OTHER', label: 'Ghi chú khác' },
];

const MEDICAL_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    DISPUTED: { bg: '#FFEAF2', color: '#D6447A', label: 'Cần xem xét' },
    VERIFIED: { bg: '#EBFFE2', color: '#77C852', label: 'Đã xác minh' },
    PENDING: { bg: '#FBF7EB', color: '#E8A53C', label: 'Đang xác minh' },
};

const MEDICAL_TYPE_ICON: Record<string, React.ElementType> = {
    VACCINE: Syringe,
    VACCINATION: Syringe,
    CHECKUP: Stethoscope,
    ANNUAL_CHECKUP: Stethoscope,
    EXAMINATION: Stethoscope,
    DENTAL: Smile,
    DENTAL_CARE: Smile,
};

type TabKey = 'detail' | 'application' | 'document';
const TABS: { key: TabKey; label: string }[] = [
    { key: 'detail', label: 'Detail' },
    { key: 'application', label: 'Application' },
    { key: 'document', label: 'Document' },
];

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { deletePet } = usePetActions() as ReturnType<typeof usePetActions> & {
        deletePet?: (id: string) => Promise<boolean | void>;
    };

    const [pet, setPet] = useState<Record<string, any> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('detail');
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [show3DModal, setShow3DModal] = useState(false);
    const [newRecordType, setNewRecordType] = useState('');
    const [newRecordNote, setNewRecordNote] = useState('');
    const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

    // State quản lý Dropdown đổi trạng thái
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            setIsLoading(true);
            setLoadError(false);
            try {
                const res = await axiosClient.get(`/pets/${id}`);
                if (active) {
                    setPet(res.data);
                    const firstAppId = Array.isArray(res.data?.applications) ? res.data.applications[0]?.id : undefined;
                    if (firstAppId) setSelectedApplicationId(firstAppId);
                }
            } catch (err) {
                console.warn('[PetDetailPage] API error, falling back to Mock Data:', err);
                const mockPet = FALLBACK_MOCK_PETS.find((p) => p.id === id);
                if (mockPet || String(id).startsWith('pet_') || String(id).startsWith('mock')) {
                    if (active) {
                        setPet(mockPet || {
                            id: id,
                            name: 'Luna',
                            species: 'CAT',
                            breed: { vi: 'Mèo Anh Lông Ngắn', en: 'British Shorthair' },
                            gender: 'FEMALE',
                            age: 24,
                            status: 'AVAILABLE',
                            images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400'],
                            description: { vi: 'Rất ngoan, quấn người.', en: 'Very well-behaved.' },
                            healthStatus: ['Đã tiêm phòng', 'Tẩy giun'],
                            weightKg: 4.2,
                            isSterilized: true,
                            isVaccinated: true,
                            applications: [],
                        });
                    }
                } else {
                    if (active) setLoadError(true);
                }
            } finally {
                if (active) setIsLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [id]);

    // Xử lý cập nhật trạng thái Pet
    const handleStatusChange = async (newStatus: string) => {
        setIsStatusDropdownOpen(false);
        if (!pet || pet.status === newStatus) return;

        const prevStatus = pet.status;
        setPet((prev) => (prev ? { ...prev, status: newStatus } : prev));

        try {
            setIsUpdatingStatus(true);
            await axiosClient.patch(`/shelter-dashboard/pets/${pet.id}`, { status: newStatus });
        } catch (err) {
            console.error('[PetDetailPage] Cập nhật trạng thái thất bại:', err);
            setPet((prev) => (prev ? { ...prev, status: prevStatus } : prev));
            alert('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!pet) return;
        const confirmed = window.confirm(`Bạn có chắc muốn xóa "${pet.name}"? Hành động này không thể hoàn tác.`);
        if (!confirmed) return;
        try {
            if (deletePet) await deletePet(pet.id);
            router.push('/shelter/pets');
        } catch (err) {
            console.error('[PetDetailPage] Xóa pet thất bại:', err);
            alert('Không thể xóa pet này, vui lòng thử lại.');
        }
    };

    const handleSubmitRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pet || !newRecordType || !newRecordNote.trim()) return;
        setIsSubmittingRecord(true);
        try {
            const res = await axiosClient.post(`/pets/${pet.id}/history`, {
                type: newRecordType,
                description: newRecordNote.trim(),
                date: new Date().toISOString(),
            });
            setPet((prev) => (prev ? { ...prev, pawHistory: [...(prev.pawHistory || []), res.data] } : prev));
            setNewRecordType('');
            setNewRecordNote('');
        } catch (err) {
            console.error('[PetDetailPage] Khảo sát thất bại:', err);
            alert('Không thể gửi ghi chú, vui lòng thử lại.');
        } finally {
            setIsSubmittingRecord(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-4">
                        <div className="h-8 w-52 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-[520px] bg-gray-100 rounded-2xl animate-pulse" />
                    </div>
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="h-9 w-64 bg-gray-100 rounded-lg animate-pulse self-end" />
                        <div className="h-[440px] bg-gray-100 rounded-2xl animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (loadError || !pet) {
        return (
            <div className="w-full max-w-2xl mx-auto text-center py-24">
                <p className="text-gray-500 mb-4">Không tìm thấy thông tin pet này, hoặc có lỗi xảy ra.</p>
                <Link href="/shelter/pets" className="text-[#E89B5A] font-medium hover:underline">
                    Quay về danh sách Pets
                </Link>
            </div>
        );
    }

    const images: string[] = Array.isArray(pet.images) ? pet.images : [];
    const primaryImage = images.find(isValidImageUrl) || null;
    const genderLower = String(pet.gender || '').toLowerCase();
    const genderLabel = ['male', 'nam'].includes(genderLower) ? 'Male' : ['female', 'nữ', 'nu'].includes(genderLower) ? 'Female' : 'Unknown';
    const displayId = pet.tags?.[0]?.id?.toString()?.slice(0, 8)?.toUpperCase() || pet.code || String(pet.id).slice(0, 8).toUpperCase();
    const statusBadge = STATUS_PHOTO_BADGE[pet.status] || STATUS_PHOTO_BADGE.AVAILABLE;
    const traits: MaybeBilingual[] = Array.isArray(pet.traitsList) ? pet.traitsList.map((t: any) => t?.name ?? t) : Array.isArray(pet.traits) ? pet.traits : [];
    const goodWith: MaybeBilingual[] = Array.isArray(pet.goodWith) ? pet.goodWith : [];
    const badWith: MaybeBilingual[] = Array.isArray(pet.badWith) ? pet.badWith : [];
    const adoptionRequirements: any[] = Array.isArray(pet.adoptionRequirements) ? pet.adoptionRequirements : [];
    const medicalRecords: any[] = Array.isArray(pet.medicalRecords) ? pet.medicalRecords : [];
    const pawHistory: any[] = Array.isArray(pet.pawHistory) ? pet.pawHistory : [];
    const sortedHistory = [...pawHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const applications: AdoptionApplication[] = (Array.isArray(pet.applications) ? pet.applications : null) || MOCK_APPLICATIONS;

    return (
        <div className="w-full">
            <div className="flex flex-col lg:flex-row gap-7 items-start px-2 py-1">
                {/* ================= CỘT TRÁI: ẢNH + THÔNG TIN NHANH ================= */}
                <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0 flex flex-col gap-5 p-1">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/shelter/pets')}
                            className="text-gray-400 hover:text-[#123832] transition-colors shrink-0"
                        >
                            <FiChevronLeft size={26} />
                        </button>
                        <h1 className="text-3xl font-bold text-[#0D062D] truncate">{pet.name}</h1>
                        <span className="text-lg text-[#8E8E93] truncate">({showText(pet.breed) || 'Chưa rõ'})</span>
                    </div>

                    <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="relative w-full h-[300px] xl:h-[340px] bg-gray-100">
                            {primaryImage ? (
                                <Image src={primaryImage} alt={pet.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <PawPrint size={40} />
                                </div>
                            )}

                            {/* DROPDOWN TRẠNG THÁI TRÊN ẢNH */}
                            <div className="absolute top-4 right-4 z-20">
                                {/* Nút bấm phía trên: Hiển thị màu của Trạng thái ĐANG CHỌN */}
                                <button
                                    type="button"
                                    onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                                    disabled={isUpdatingStatus}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold border shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                                    style={{
                                        backgroundColor: statusBadge.bg,
                                        borderColor: statusBadge.border,
                                        color: statusBadge.color,
                                    }}
                                >
                                    {isUpdatingStatus ? 'Đang lưu...' : statusBadge.label}
                                    <FiChevronDown
                                        size={14}
                                        className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Menu danh sách các trạng thái: Nền trắng, chữ đen chuẩn theo ảnh */}
                                {isStatusDropdownOpen && (
                                    <>
                                        {/* Click ra ngoài để đóng menu */}
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsStatusDropdownOpen(false)}
                                        />

                                        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                                            {Object.entries(STATUS_PHOTO_BADGE).map(([statusKey, cfg]) => {
                                                const isSelected = pet.status === statusKey;
                                                return (
                                                    <button
                                                        key={statusKey}
                                                        type="button"
                                                        onClick={() => handleStatusChange(statusKey)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                                                            ? 'font-bold text-gray-900 bg-gray-50/80'
                                                            : 'font-normal text-gray-700 hover:bg-gray-50 hover:text-black'
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
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            {/* 3 stat pills */}
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="rounded-2xl bg-[#E2EFF8] py-3.5 flex flex-col items-center gap-1.5">
                                    <span className="text-[13px] text-gray-500">Gender</span>
                                    <span className="text-[15px] font-semibold text-black">{genderLabel}</span>
                                </div>
                                <div className="rounded-2xl bg-[#FEFACA] py-3.5 flex flex-col items-center gap-1.5">
                                    <span className="text-[13px] text-gray-500">Age</span>
                                    <span className="text-[15px] font-semibold text-black">{getAgeLabel(pet.dob)}</span>
                                </div>
                                <div className="rounded-2xl bg-[#F9E6EC] py-3.5 flex flex-col items-center gap-1.5">
                                    <span className="text-[13px] text-gray-500">Size</span>
                                    <span className="text-[15px] font-semibold text-black">{pet.weight != null ? `${pet.weight} kg` : ' '}</span>
                                </div>
                            </div>
                            {/* 2x2 info grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ['Gender', genderLabel.toUpperCase()],
                                    ['Color', (showText(pet.color) || 'N/A').toUpperCase()],
                                    ['Birthday', pet.dob ? fmtDate(pet.dob).toUpperCase() : 'N/A'],
                                    ['PawLife ID', displayId],
                                ].map(([label, value]) => (
                                    <div key={label} className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3.5">
                                        <p className="text-[13px] text-[#8E8E93] mb-1">{label}</p>
                                        <p className="text-[14px] font-semibold text-black tracking-wide">{value}</p>
                                    </div>
                                ))}
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
                            className="h-[38px] px-4 rounded-lg border border-[#E89B5A] text-[#E89B5A] text-sm font-medium flex items-center gap-2 hover:bg-[#E89B5A]/5 transition-colors"
                        >
                            <SparklesIcon size={14} /> Xem ở chế độ công khai (3D)
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(`/shelter/pets/${pet.id}/edit`)}
                            className="h-[38px] px-4 rounded-lg border border-gray-300 text-gray-500 text-sm font-medium flex items-center gap-2 hover:border-gray-400 transition-colors"
                        >
                            <FiEdit2 size={13} /> Chỉnh sửa hồ sơ
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            title="Xóa pet"
                            className="h-[38px] w-[38px] rounded-lg border border-gray-300 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors shrink-0"
                        >
                            <FiTrash2 size={14} />
                        </button>
                    </div>

                    {/* Tab bar */}
                    <div className="flex w-full bg-[#76768014] rounded-full p-1 gap-1">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 px-6 py-1.5 rounded-full text-sm transition-colors ${activeTab === tab.key
                                    ? 'bg-white text-black font-semibold shadow-sm'
                                    : 'text-gray-500 font-medium'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB: DETAIL */}
                    {activeTab === 'detail' && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
                                <div>
                                    <p className="text-sm font-medium text-black mb-3">About {pet.name}</p>
                                    <p className="text-sm text-[#8E8E93] leading-relaxed">
                                        {showText(pet.description) || 'Chưa có ghi chú cho pet này.'}
                                    </p>
                                    {traits.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {traits.map((t, i) => {
                                                const style = TRAIT_STYLES[i % TRAIT_STYLES.length];
                                                return (
                                                    <span
                                                        key={`${showText(t)}_${i}`}
                                                        className="text-[11px] font-medium px-3 py-1 rounded-full border"
                                                        style={{ backgroundColor: style.bg, borderColor: style.border, color: style.color }}
                                                    >
                                                        {showText(t)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                {(goodWith.length > 0 || badWith.length > 0) && (
                                    <div>
                                        <p className="text-sm font-medium text-black mb-2">{pet.name}'s Behavior</p>
                                        {goodWith.length > 0 && (
                                            <div className="flex items-start gap-1.5 mb-1">
                                                <FiCheck size={13} className="text-[#77C852] mt-0.5 shrink-0" />
                                                <p className="text-[12px] leading-5">
                                                    <span className="font-medium text-[#77C852]">Good with: </span>
                                                    <span className="text-[#8E8E93]">{goodWith.map(showText).join(', ')}</span>
                                                </p>
                                            </div>
                                        )}
                                        {badWith.length > 0 && (
                                            <div className="flex items-start gap-1.5">
                                                <FiX size={13} className="text-[#FE7D66] mt-0.5 shrink-0" />
                                                <p className="text-[12px] leading-5">
                                                    <span className="font-medium text-[#FE7D66]">Not suitable: </span>
                                                    <span className="text-[#8E8E93]">{badWith.map(showText).join(', ')}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-black mb-3">Yêu cầu nhận nuôi</p>
                                    {adoptionRequirements.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {adoptionRequirements.map((r, i) => (
                                                <span key={r.iconKey ?? i} className="text-[12px] px-3 py-1 rounded-full border border-gray-200 text-gray-600 bg-white">
                                                    {showText(r.label)}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[#8E8E93] leading-relaxed">Chưa có yêu cầu nhận nuôi.</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-black mb-3">Health Care</p>
                                    <div className="flex gap-3">
                                        <div className="flex-1 flex items-center gap-3 bg-[#F7F7F7] rounded-full h-[50px] px-2">
                                            <div className="bg-white w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0">
                                                <Syringe size={18} className="text-[#E89B5A]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[12px] text-[#8E8E93]">Vaccination</p>
                                                <p className="text-[13px] font-medium text-black truncate">{pet.isVaccinated ? 'Fully vaccinated' : 'Chưa tiêm'}</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex items-center gap-3 bg-[#F7F7F7] rounded-full h-[50px] px-2">
                                            <div className="bg-white w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0">
                                                <FiCheck size={18} className="text-[#E89B5A]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[12px] text-[#8E8E93]">Status</p>
                                                <p className="text-[13px] font-medium text-black truncate">{pet.isSpayedNeutered ? 'Neutered' : 'Not neutered'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                    <p className="text-sm font-medium text-black mb-4">PawHistory</p>
                                    <div className="flex flex-col">
                                        {sortedHistory.length > 0 ? (
                                            sortedHistory.map((item, index) => {
                                                const isLastItem = index === sortedHistory.length - 1;
                                                const cfg = HISTORY_TYPE_CONFIG[item.type] ?? DEFAULT_HISTORY_CONFIG;
                                                const Icon = cfg.Icon;
                                                const title = item.title || HISTORY_TYPE_LABEL[item.type] || item.type;
                                                return (
                                                    <div key={item.id ?? index} className="flex min-h-[48px]">
                                                        <div className="w-6 relative mr-2.5 shrink-0">
                                                            {!isLastItem && <div className="absolute w-[1px] bg-gray-200" style={{ top: 26, bottom: -4, left: 11.5 }} />}
                                                            <div className="w-6 h-6 rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: cfg.bg }}>
                                                                <Icon size={12} style={{ color: cfg.color }} />
                                                            </div>
                                                        </div>
                                                        <div className={`flex-1 ${!isLastItem ? 'pb-3' : ''}`}>
                                                            <div className="flex justify-between items-start gap-2">
                                                                <p className="text-[12px] font-medium text-black">{title}</p>
                                                                <p className="text-[10px] text-[#8E8E93] shrink-0">{fmtDate(item.date)}</p>
                                                            </div>
                                                            {item.description && <p className="text-[10px] text-[#8E8E93] mt-0.5">{item.description}</p>}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-center text-gray-400 py-3 text-[13px] italic">Chưa có lịch sử sống.</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg py-2 px-3 mt-2">
                                        <FiLock size={11} className="text-[#8E8E93] shrink-0" />
                                        <span className="text-[10px] text-[#8E8E93]">This timeline is permanent and append-only.</span>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-dashed border-gray-300 p-6">
                                    <p className="text-sm font-medium text-black mb-3">Submit New Record</p>
                                    <form onSubmit={handleSubmitRecord} className="flex flex-col gap-3">
                                        <div>
                                            <label className="text-[13px] text-[#8E8E93] block mb-1">Record Type</label>
                                            <div className="relative">
                                                <select
                                                    value={newRecordType}
                                                    onChange={(e) => setNewRecordType(e.target.value)}
                                                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg h-8 px-3 text-[12px] text-gray-700 focus:border-[#E89B5A] outline-none"
                                                >
                                                    <option value="">Select note type...</option>
                                                    {RECORD_TYPE_NOTE_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <FiChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[13px] text-[#8E8E93] block mb-1">Note</label>
                                            <textarea
                                                value={newRecordNote}
                                                onChange={(e) => setNewRecordNote(e.target.value)}
                                                rows={2}
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

                    {/* TAB: APPLICATION */}
                    {activeTab === 'application' && (
                        applications.length > 0 ? (
                            <div className="">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {applications.map((app) => {
                                        const badge = APPLICATION_STATUS_STYLE[app.status] || APPLICATION_STATUS_STYLE.PENDING;
                                        return (
                                            <button
                                                key={app.id}
                                                type="button"
                                                onClick={() => setSelectedApplicationId(app.id)}
                                                className="text-left bg-white rounded-2xl border border-gray-200 hover:border-[#E89B5A] shadow-sm p-5 transition-colors cursor-pointer flex items-start gap-3.5"
                                            >
                                                {/* Avatar đặt bên trái, căn từ trên xuống */}
                                                <div className="relative w-[57px] h-[57px] rounded-full overflow-hidden bg-gray-100 shrink-0">
                                                    {isValidImageUrl(app.applicantAvatar) ? (
                                                        <Image src={app.applicantAvatar as string} alt={app.applicantName} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <UserIcon size={20} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Cột thông tin bên phải: Tên, SĐT, Email, Submitted At thẳng hàng tuyệt đối */}
                                                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                    {/* Dòng đầu tiên: Tên nằm ở nửa trên Avatar + Badge */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-[15px] font-semibold text-black truncate">{app.applicantName}</p>
                                                        <span
                                                            className="text-[11px] font-medium px-[13px] py-[5px] rounded-full shrink-0"
                                                            style={{ backgroundColor: badge.bg, color: badge.color }}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    </div>

                                                    {/* Các dòng tiếp theo nằm thẳng hàng lề trái với Tên */}
                                                    <div className="flex items-center gap-2 text-[13px] text-gray-600">
                                                        <FiPhone size={13} className="text-gray-400 shrink-0" />
                                                        <span className="truncate">{app.applicantPhone || 'Chưa có SĐT'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[13px] text-gray-600">
                                                        <FiMail size={13} className="text-gray-400 shrink-0" />
                                                        <span className="truncate">{app.applicantEmail || 'Chưa có email'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[13px] text-gray-600">
                                                        <FiCalendar size={13} className="text-gray-400 shrink-0" />
                                                        <span className="truncate">Submitted on: {fmtDate(app.submittedAt) || 'Chưa rõ'}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center text-center">
                                <FiFileText size={22} className="text-gray-300 mb-2" />
                                <p className="text-sm font-medium text-black mb-1">Chưa có đơn đăng ký nhận nuôi</p>
                                <p className="text-[12px] text-gray-400 max-w-sm">Các đơn đăng ký nhận nuôi {pet.name} sẽ hiển thị ở đây khi có người nộp.</p>
                            </div>
                        )
                    )}

                    {/* TAB: DOCUMENT */}
                    {activeTab === 'document' && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <p className="text-sm font-medium text-black mb-4">Hồ sơ y tế / Giấy tờ</p>
                            {medicalRecords.length > 0 ? (
                                <div className="flex flex-col gap-2.5">
                                    {medicalRecords.map((r, i) => {
                                        const Icon = MEDICAL_TYPE_ICON[String(r.type).toUpperCase()] || FiFileText;
                                        const badge = MEDICAL_BADGE[r.verificationStatus] || MEDICAL_BADGE.PENDING;
                                        const recordImage = Array.isArray(r.images) ? r.images.find(isValidImageUrl) : undefined;
                                        return (
                                            <div key={r.id ?? i} className="flex items-start gap-3 border border-gray-200 rounded-2xl p-3">
                                                {recordImage ? (
                                                    <button type="button" onClick={() => setLightboxImage(recordImage)} className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                                        <Image src={recordImage} alt="medical" fill className="object-cover" />
                                                    </button>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                        <Icon size={18} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-[13px] font-semibold text-gray-800 truncate">{showText(r.recordName)}</p>
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: badge.bg, color: badge.color }}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-gray-400 mt-0.5">
                                                        Ngày: {fmtDate(r.recordDate) || 'Chưa rõ'}
                                                        {r.hasNextDueDate && r.nextDueDate ? ` | Hạn tiếp theo: ${fmtDate(r.nextDueDate)}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center py-10">
                                    <FiClock size={20} className="text-gray-300 mb-2" />
                                    <p className="text-[13px] text-gray-400 italic">Chưa có hồ sơ y tế / giấy tờ nào.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox ảnh hồ sơ y tế */}
            {isValidImageUrl(lightboxImage) && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]" onClick={() => setLightboxImage(null)}>
                    <button
                        type="button"
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
                    >
                        <FiX size={18} />
                    </button>
                    <div className="relative w-[90%] max-w-[500px] h-[70%]" onClick={(e) => e.stopPropagation()}>
                        <Image src={lightboxImage} alt="Hồ sơ y tế" fill className="object-contain" />
                    </div>
                </div>
            )}

            {show3DModal && (
                <PetPublic3DModal
                    pet={pet}
                    onClose={() => setShow3DModal(false)}
                />
            )}
        </div>
    );
}