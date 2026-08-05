'use client';

import React, { useEffect, useState, useRef } from 'react';
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
import {
    PawPrint,
    Cake,
    QrCode,
    Home,
    Syringe,
    Stethoscope,
    Smile,
    User as UserIcon,
    HeartHandshake,
    SparklesIcon,
    Send,
    MoreVertical,
    Upload,
    Calendar,
    Eye,
    Pencil,
    Download,
} from 'lucide-react';
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
};

const DEFAULT_HISTORY_CONFIG = { Icon: Cake, bg: '#F5F5F5', color: '#8E8E93' };

const HISTORY_TYPE_LABEL: Record<string, string> = {
    BIRTH: 'Date of Birth',
    TRANSFER: 'Curren Owner',
    VACCINE: 'DHPP Vaccination',
    ANNUAL_CHECKUP: 'Annual Checkup',
    QR_LINKED: 'QR Code Registered',
};

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
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

    // State quản lý Dropdown đổi trạng thái
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // State Ghi chú
    const [notes, setNotes] = useState(INITIAL_NOTES);
    const [newNoteInput, setNewNoteInput] = useState('');

    // State Hồ sơ y tế
    const [medicalList, setMedicalList] = useState(INITIAL_MEDICAL_RECORDS);
    const [showMedicalForm, setShowMedicalForm] = useState(true);
    const [medicalType, setMedicalType] = useState('');
    const [medicalDetail, setMedicalDetail] = useState('');
    const [medicalDate, setMedicalDate] = useState('');
    const medicalFileInputRef = useRef<HTMLInputElement>(null);

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

                                {isStatusDropdownOpen && (
                                    <>
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
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ['Gender', genderLabel.toUpperCase()],
                                    ['Color', (showText(pet.color) || 'N/A').toUpperCase()],
                                    ['Birthday', pet.dob ? fmtDate(pet.dob).toUpperCase() : 'N/A'],
                                    ['PawLife ID', displayId],
                                ].map(([label, value]) => (
                                    <div key={label} className="bg-[#F9F9F9] border border-gray-200 rounded-2xl px-4 py-3.5">
                                        <p className="text-[13px] text-[#8E8E93] mb-1">{label}</p>                                        <p className="text-[14px] font-semibold text-black tracking-wide">{value}</p>
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

                            {/* Cột trái trong Tab Detail: Giới thiệu, Tags, Tính cách, Yêu cầu, Sức khỏe + KHỐI GHI CHÚ */}
                            <div className="flex flex-col gap-4">
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

                                {/* KHỐI GHI CHÚ BỔ SUNG */}
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

                            {/* Cột phải trong Tab Detail: PawHistory + KHỐI HỒ SƠ Y TẾ */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                    <p className="text-sm font-medium text-black mb-4">PawHistory | Hành trình</p>
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
                                            <p className="text-center text-gray-400 py-3 text-[13px] italic">Chưa có lịch sử sống.</p>)}
                                    </div>
                                    <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg py-2 px-3 mt-2">
                                        <FiLock size={11} className="text-[#8E8E93] shrink-0" />
                                        <span className="text-[10px] text-[#8E8E93]">Hành trình không thể bị xóa hay chỉnh sửa</span>
                                    </div>
                                </div>

                                {/* KHỐI HỒ SƠ Y TẾ BỔ SUNG */}
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
                                                    <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                                                        <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                                                <div className="relative w-[57px] h-[57px] rounded-full overflow-hidden bg-gray-100 shrink-0">
                                                    {isValidImageUrl(app.applicantAvatar) ? (
                                                        <Image src={app.applicantAvatar as string} alt={app.applicantName} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <UserIcon size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-[15px] font-semibold text-black truncate">{app.applicantName}</p>
                                                        <span
                                                            className="text-[11px] font-medium px-[13px] py-[5px] rounded-full shrink-0"
                                                            style={{ backgroundColor: badge.bg, color: badge.color }}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    </div>
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