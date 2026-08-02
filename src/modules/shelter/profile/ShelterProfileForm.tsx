'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Mail,
  FileText,
  Camera,
  Clock,
  ImageIcon,
  Building2,
  Wifi,
  BatteryFull,
  ChevronLeft,
  Search,
  MoreVertical,
  PawPrint,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import { useShelterProfile, useShelterProfileActions } from '@/stores/useShelterProfileStore';
import {
  OpeningHour,
  ShelterProfileFormValues,
  WEEKDAY_LABEL,
  defaultOpeningHours,
} from '@/types/shelter';
const AddressPicker = dynamic(() => import('@/components/AddressPicker'), {
  ssr: false,
  loading: () => <div className="w-full h-[50px] bg-gray-50 border border-gray-200 rounded-xl animate-pulse" />
});

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-[#123832] placeholder-gray-400 focus:border-[#E89B5A] focus:ring-2 focus:ring-[#E89B5A]/20 focus:outline-none transition-colors font-sans text-[15px]';

const labelClass = 'text-sm font-medium text-gray-700 mb-1.5 block';

// NOTE: ShelterProfileFormValues hiện chưa khai báo lat/lng/coverUrl/bio/shelterType.
// Mở rộng kiểu tại chỗ bằng intersection type để không phải sửa file types/shelter.ts ngay bây giờ.
// Khi bạn đã thêm các field này vào ShelterProfileFormValues (khuyến nghị nên làm sớm),
// phần mở rộng dưới đây vẫn hoạt động bình thường (không xung đột).
type FormValues = ShelterProfileFormValues & {
  lat?: number;
  lng?: number;
  bio?: string;
  shelterType?: string;
};

// ⚠️ LƯU Ý QUAN TRỌNG VỀ TÊN FIELD:
// Màn hình mobile (shelter-profile.tsx) đang đọc `shelterInfo.emailAddress` và
// `shelterInfo.contactInfo`, trong khi form web này đang dùng `email` và `phone`.
// Nếu API backend trả về đúng 2 tên `emailAddress` / `contactInfo` thì form đang
// LƯU SAI FIELD -> dữ liệu người dùng nhập trên web sẽ không hiển thị bên mobile.
// Cần xác nhận lại với backend/API contract xem tên chuẩn là gì rồi đồng bộ 2 phía.
// Tạm thời mình vẫn giữ nguyên tên `email`/`phone` như code gốc, chỉ note lại ở đây.

const SHELTER_TYPE_OPTIONS = [
  { value: 'Animal Shelter & Rescue', label: 'Trạm cứu hộ & Bảo trợ động vật' },
  { value: 'Foster Home', label: 'Nhà nuôi tạm (Foster Home)' },
  { value: 'Veterinary Clinic', label: 'Phòng khám thú y kiêm cứu hộ' },
  { value: 'Individual Rescuer', label: 'Cá nhân cứu hộ tự do' },
];

// ---------------------------------------------------------------------------
// PHONE PREVIEW — mô phỏng khung iPhone với Dynamic Island, hiển thị real-time
// dữ liệu người dùng đang nhập, layout phỏng theo app-shelter-profile.tsx (mobile).
// Đây chỉ là bản xem trước tĩnh (không gọi API thật), giúp shelter hình dung
// hồ sơ của mình sẽ trông ra sao trên app trước khi bấm "Lưu thay đổi".
// ---------------------------------------------------------------------------
type PhonePreviewProps = {
  coverUrl: string | null;
  logoUrl: string | null;
  name: string;
  bio: string;
  shelterTypeLabel: string;
  address: string;
  phone: string;
  email: string;
  description: string;
};

const PhonePreview = ({
  coverUrl,
  logoUrl,
  name,
  bio,
  shelterTypeLabel,
  address,
  phone,
  email,
  description,
}: PhonePreviewProps) => {
  // State riêng của khung preview: bấm "Liên hệ" sẽ chuyển tab giống hệt
  // logic activeTab bên app-shelter-profile.tsx (mobile) — không đụng tới
  // state `values` của form chính, vì đây chỉ là xem trước UI.
  const [activeTab, setActiveTab] = useState<'pets' | 'info'>('pets');

  return (
    <div className="sticky top-6">
      <p className="text-xs font-medium text-gray-400 mb-3 text-center uppercase tracking-wide">
        Xem trước trên app
      </p>

      {/* Bezel */}
      <div className="w-[300px] mx-auto bg-[#111] rounded-[42px] p-2.5 shadow-xl">
        {/* Screen */}
        <div className="relative w-full h-[620px] bg-white rounded-[34px] overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[84px] h-[22px] bg-black rounded-full z-30" />

          {/* Status bar */}
          <div className="absolute top-2.5 left-5 right-5 z-20 flex items-center justify-between text-white text-[11px] font-medium">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <Wifi size={12} />
              <BatteryFull size={14} />
            </span>
          </div>

          {/* Scrollable content */}
          <div className="absolute inset-0 overflow-y-auto">
            {/* Cover */}
            <div className="relative w-full h-[130px] bg-[#5DCAA5]">
              {coverUrl ? (
                <Image src={coverUrl} alt="Ảnh bìa" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PawPrint size={40} className="text-[#04342C]/60" />
                </div>
              )}
              <div className="absolute top-9 left-3 right-3 flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-white/85 flex items-center justify-center">
                  <ChevronLeft size={16} />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/85 flex items-center justify-center">
                  <Search size={14} />
                </div>
              </div>
            </div>

            <div className="px-4">
              {/* Avatar + name row */}
              <div className="flex items-end gap-3 -mt-8">
                <div className="w-16 h-16 rounded-full bg-white p-1">
                  <div className="relative w-full h-full rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                    {logoUrl ? (
                      <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                    ) : (
                      <Camera size={18} className="text-gray-300" />
                    )}
                  </div>
                </div>
                <div className="flex-1 pb-1 flex items-center justify-between">
                  <p className="font-semibold text-[15px] text-black truncate max-w-[160px]">
                    {name || 'Tên trạm cứu hộ'}
                  </p>
                  <MoreVertical size={16} className="text-gray-500" />
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-[12px] mt-2 mb-2">
                <span><b>0</b> thú cưng</span>
                <span><b>0</b> đã nhận nuôi</span>
              </div>

              <p className="text-[11px] text-gray-400 mb-0.5">{shelterTypeLabel}</p>
              <p className="text-[13px] text-black mb-1.5 leading-snug">
                {bio || 'Câu giới thiệu ngắn sẽ hiện ở đây'}
              </p>
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-3">
                <MapPin size={11} />
                <span className="truncate">{address || 'Chưa cập nhật địa chỉ'}</span>
              </p>

              {/* Follow / Contact buttons */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 py-2 rounded-full bg-[#E89B5A] text-white text-[12px] font-medium text-center">
                  Theo dõi
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab((t) => (t === 'pets' ? 'info' : 'pets'))}
                  className={`flex-1 py-2 rounded-full text-[12px] font-medium text-center transition-colors ${activeTab === 'info' ? 'bg-[#E89B5A] text-white' : 'bg-[#F6F6F6] text-gray-600'
                    }`}
                >
                  {activeTab === 'pets' ? 'Liên hệ' : 'Xem thú cưng'}
                </button>
              </div>

              {activeTab === 'pets' ? (
                // Tab "Thú cưng": form này chưa quản lý danh sách pet nên chỉ show empty state,
                // đúng tinh thần "No pets found" ở app-shelter-profile.tsx.
                <div className="border-t border-gray-100 pt-8 pb-10 flex flex-col items-center gap-2 text-center">
                  <PawPrint size={22} className="text-gray-300" />
                  <p className="text-[12px] text-gray-400">Chưa có thú cưng nào được đăng</p>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-3 pb-6 flex flex-col gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-black mb-1">Giới thiệu về trạm</p>
                    <p className="text-[12px] text-gray-500 leading-4">
                      {description || 'Chưa có mô tả giới thiệu.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[13px] font-medium text-black mb-1.5">Thông tin liên hệ</p>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[12px] text-gray-500">Gửi tin nhắn</p>
                      <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
                        <Phone size={12} /> {phone || 'Chưa cập nhật'}
                      </p>
                      <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
                        <Mail size={12} /> {email || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[13px] font-medium text-black mb-1.5">Thêm thông tin</p>
                    <div className="flex flex-col gap-1.5 text-[12px] text-gray-500">
                      <p>Hoạt động tại Việt Nam</p>
                      <p>Tham gia: đang chờ hệ thống cập nhật</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShelterProfileForm = () => {
  const { profile, isLoading } = useShelterProfile();
  const { fetchProfile, updateProfile, isSubmitting } = useShelterProfileActions();

  const [values, setValues] = useState<ShelterProfileFormValues>({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    openingHours: defaultOpeningHours,
    bio: '',
    shelterType: SHELTER_TYPE_OPTIONS[0].value,
  });

  const [addressError, setAddressError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Đọc lat/lng trực tiếp từ `profile` (không phải từ `values`) để tránh race condition:
  // `values` chỉ được đồng bộ trong useEffect bên dưới, chạy SAU lần render đầu tiên
  // của AddressPicker — nếu dùng values.lat/lng thì bản đồ sẽ mount với vị trí mặc định
  // (Hà Nội) một nhịp trước khi có toạ độ thật.
  // NOTE: giả định profile có field lat/lng (number | null). Nếu backend/type ShelterProfile
  // chưa có 2 field này, cần bổ sung ở backend + type trước khi tính năng này lưu được toạ độ.
  const profileLat = profile?.latitude;
  const profileLng = profile?.longitude;
  const profileCoverUrl = profile?.coverUrl;

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile) {
      setValues({
        name: profile.name,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        description: profile.description,
        openingHours: profile.openingHours?.length ? profile.openingHours : defaultOpeningHours,
        latitude: profileLat, // Map đúng latitude
        longitude: profileLng, // Map đúng longitude
        bio: profile.bio || '',
        shelterType: profile.shelterType || SHELTER_TYPE_OPTIONS[0].value,
      });
      setLogoPreview(profile.logoUrl);
      setCoverPreview(profileCoverUrl || null);
    }
  }, [profile]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleHourChange = (day: OpeningHour['day'], patch: Partial<OpeningHour>) => {
    setValues((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((oh) => (oh.day === day ? { ...oh, ...patch } : oh)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (!values.address) {
      setAddressError('Vui lòng chọn địa chỉ trên bản đồ');
      return;
    }

    // NOTE: updateProfile hiện chỉ nhận (values, logoFile). Nếu muốn upload ảnh bìa
    // cùng lúc, cần mở rộng action/API updateProfile để nhận thêm coverFile,
    // ví dụ: updateProfile(values, logoFile, coverFile).
    await updateProfile(values, logoFile, coverFile);
    setLogoFile(null);
    setCoverFile(null);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[900px] py-20 text-center text-gray-400 font-sans">
        Đang tải hồ sơ trạm cứu hộ...
      </div>
    );
  }

  const shelterTypeLabel =
    SHELTER_TYPE_OPTIONS.find((o) => o.value === values.shelterType)?.label ||
    SHELTER_TYPE_OPTIONS[0].label;

  return (
    <div className="w-full max-w-[1280px] flex flex-col lg:flex-row gap-10 items-start">
      {/* FORM */}
      <form onSubmit={handleSubmit} className="w-full max-w-[900px] flex flex-col gap-10">
        {/* Header */}
        <div>
          <h2 className="font-['Be Vietnam Pro',_sans-serif] text-[40px] text-[#000000] font-semibold mb-1">Hồ sơ trạm cứu hộ</h2>
          <p className="text-sm text-gray-500">
            Thông tin này sẽ hiển thị công khai cho người nhận nuôi trên PawLife.
          </p>
        </div>

        {/* Cover photo */}
        <div>
          <label className={labelClass}>
            <ImageIcon size={14} className="inline mr-1.5 -mt-0.5" />
            Ảnh bìa trạm
          </label>
          <div
            onClick={() => coverInputRef.current?.click()}
            className="relative w-full h-40 md:h-48 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#E89B5A] transition-colors group"
          >
            {coverPreview ? (
              <Image src={coverPreview} alt="Ảnh bìa trạm" fill className="object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-[#E89B5A]">
                <Camera size={28} />
                <span className="text-xs">Chọn ảnh bìa (khuyến nghị 1200x400px)</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100">Đổi ảnh bìa</span>
            </div>
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        {/* Logo + Basic info */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Logo upload */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-32 h-32 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#E89B5A] transition-colors group"
            >
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo trạm" fill className="object-cover" />
              ) : (
                <Camera className="text-gray-400 group-hover:text-[#E89B5A]" size={28} />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100">Đổi logo</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <span className="text-xs text-gray-400">Logo trạm (JPG/PNG)</span>
          </div>

          {/* Name + contact fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Tên trạm cứu hộ</label>
              <input
                value={values.name}
                onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
                placeholder="VD: Trạm cứu hộ PawLife Hà Nội"
                className={inputClass}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                <Building2 size={14} className="inline mr-1.5 -mt-0.5" />
                Loại hình trạm
              </label>
              <select
                value={values.shelterType}
                onChange={(e) => setValues((p) => ({ ...p, shelterType: e.target.value }))}
                className={inputClass}
              >
                {SHELTER_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Câu giới thiệu ngắn (bio)</label>
              <input
                value={values.bio}
                onChange={(e) => setValues((p) => ({ ...p, bio: e.target.value }))}
                placeholder="VD: Cứu giúp và tìm mái ấm cho thú cưng bị bỏ rơi 🐾"
                maxLength={100}
                className={inputClass}
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Hiển thị ngay dưới tên trạm, tối đa 100 ký tự ({(values.bio || '').length}/100)
              </span>
            </div>

            <div>
              <label className={labelClass}><Phone size={14} className="inline mr-1.5 -mt-0.5" />Số điện thoại</label>
              <input
                value={values.phone}
                onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(+84) 91.222.2222"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}><Mail size={14} className="inline mr-1.5 -mt-0.5" />Email liên hệ</label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
                placeholder="contact@pawlife.vn"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}><MapPin size={14} className="inline mr-1.5 -mt-0.5" />Địa chỉ</label>
              <AddressPicker
                disabled={isSubmitting}
                initialAddress={profile?.address}
                initialCenter={profileLat && profileLng ? [profileLat, profileLng] : undefined}
                onSelect={(result) =>
                  setValues((p) => ({
                    ...p,
                    address: result.address,
                    latitude: result.lat,
                    longitude: result.lng
                  }))
                }
              />
              {addressError && (
                <p className="text-red-600 text-xs mt-1.5 font-medium">{addressError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}><FileText size={14} className="inline mr-1.5 -mt-0.5" />Mô tả giới thiệu</label>
          <textarea
            value={values.description}
            onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
            rows={4}
            placeholder="Giới thiệu ngắn về trạm cứu hộ, sứ mệnh, số lượng pet đang chăm sóc..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Opening hours */}
        <div>
          <label className={labelClass}><Clock size={14} className="inline mr-1.5 -mt-0.5" />Giờ hoạt động</label>
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {values.openingHours.map((oh) => (
              <div key={oh.day} className="flex items-center gap-4 px-4 py-3 bg-white">
                <label className="flex items-center gap-2 w-28 shrink-0 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={oh.isOpen}
                    onChange={(e) => handleHourChange(oh.day, { isOpen: e.target.checked })}
                    className="accent-[#E89B5A] w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">{WEEKDAY_LABEL[oh.day]}</span>
                </label>
                {oh.isOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={oh.openTime}
                      onChange={(e) => handleHourChange(oh.day, { openTime: e.target.value })}
                      className="border border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:border-[#E89B5A] focus:outline-none"
                    />
                    <span className="text-gray-400 text-sm">—</span>
                    <input
                      type="time"
                      value={oh.closeTime}
                      onChange={(e) => handleHourChange(oh.day, { closeTime: e.target.value })}
                      className="border border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:border-[#E89B5A] focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Đóng cửa</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="!bg-[#E89B5A] hover:!bg-[#D68B4E] !text-white !rounded-lg !px-8 !py-3 !font-medium !text-[15px]"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>

      {/* PHONE PREVIEW — chỉ hiện từ màn lg trở lên, ẩn trên tablet/mobile để không chiếm chỗ */}
      <div className="hidden lg:block shrink-0">
        <PhonePreview
          coverUrl={coverPreview}
          logoUrl={logoPreview}
          name={values.name}
          bio={values.bio || ''}
          shelterTypeLabel={shelterTypeLabel}
          address={values.address}
          phone={values.phone}
          email={values.email}
          description={values.description}
        />
      </div>
    </div>
  );
};