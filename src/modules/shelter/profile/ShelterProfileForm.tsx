'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Mail,
  Camera,
  Globe,
  Bell,
  Pencil,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import { useShelterProfile, useShelterProfileActions } from '@/stores/useShelterProfileStore';
import { ShelterProfileFormValues, defaultOpeningHours } from '@/types/shelter';

const AddressPicker = dynamic(() => import('@/components/AddressPicker'), {
  ssr: false,
  loading: () => <div className="w-full h-[50px] bg-gray-50 border border-gray-200 rounded-xl animate-pulse" />
});

// Mở rộng type FormValues để chứa các field mới
type FormValues = ShelterProfileFormValues & {
  lat?: number;
  lng?: number;
  bio?: string;
  shelterType?: string;
  website?: string;
};

const SHELTER_TYPE_OPTIONS = [
  { value: 'Animal Shelter & Rescue', label: 'Trạm cứu hộ & Bảo trợ động vật' },
  { value: 'Foster Home', label: 'Nhà nuôi tạm (Foster Home)' },
  { value: 'Veterinary Clinic', label: 'Phòng khám thú y kiêm cứu hộ' },
  { value: 'Individual Rescuer', label: 'Cá nhân cứu hộ tự do' },
];

export const ShelterProfileForm = () => {
  const { profile, isLoading } = useShelterProfile();
  const { fetchProfile, updateProfile, isSubmitting } = useShelterProfileActions();

  // State quản lý chế độ Xem/Sửa
  const [isEditing, setIsEditing] = useState(false);

  const [values, setValues] = useState<FormValues>({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    openingHours: defaultOpeningHours,
    bio: '',
    shelterType: SHELTER_TYPE_OPTIONS[0].value,
    website: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const profileLat = profile?.latitude;
  const profileLng = profile?.longitude;
  const profileCoverUrl = profile?.coverUrl;

  // Sync dữ liệu từ API
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile) {
      populateFormWithProfile();
    }
  }, [profile]);

  const populateFormWithProfile = () => {
    if (!profile) return;
    setValues({
      name: profile.name,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
      description: profile.description,
      openingHours: profile.openingHours?.length ? profile.openingHours : defaultOpeningHours,
      latitude: profileLat,
      longitude: profileLng,
      bio: profile.bio || '',
      shelterType: profile.shelterType || SHELTER_TYPE_OPTIONS[0].value,
      website: (profile as any).website || '', // Giả sử profile có website
    });
    setLogoPreview(profile.logoUrl);
    setCoverPreview(profileCoverUrl || null);
  };

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

  const handleCancel = () => {
    // Reset lại dữ liệu về như ban đầu
    populateFormWithProfile();
    setLogoFile(null);
    setCoverFile(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!values.address) {
      alert('Vui lòng chọn địa chỉ trên bản đồ');
      return;
    }
    const success = await updateProfile(values, logoFile, coverFile);
    if (success) {
      setLogoFile(null);
      setCoverFile(null);
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-20 text-center text-gray-400 font-sans">
        Đang tải hồ sơ trạm cứu hộ...
      </div>
    );
  }

  const shelterTypeLabel =
    SHELTER_TYPE_OPTIONS.find((o) => o.value === values.shelterType)?.label ||
    SHELTER_TYPE_OPTIONS[0].label;

  return (
    <div className="w-full max-w-[1000px] mx-auto flex flex-col font-sans mb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#1E1B4B] mb-1">Quản Lý Trạm</h2>
          <p className="text-[13px] text-gray-500">Thông tin này sẽ hiển thị công khai cho người nhận nuôi trên PawLife.</p>
        </div>
        <button className="p-2 text-gray-400 hover:text-[#E89B5A] transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* TABS */}
      <div className="bg-gray-100 p-1.5 rounded-full flex w-full mb-8">
        <button className="flex-1 bg-white text-gray-900 font-semibold text-[14px] py-2.5 rounded-full shadow-sm">
          Thông tin trạm cứu hộ
        </button>
        <button className="flex-1 text-gray-500 font-medium text-[14px] py-2.5 hover:text-gray-700 transition-colors">
          Tài khoản & thành viên
        </button>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        
        {/* Cover Photo */}
        <div 
          className="relative w-full h-[180px] bg-gradient-to-r from-[#FCAE7C] to-[#F97B89] group"
          onClick={() => isEditing && coverInputRef.current?.click()}
        >
          {coverPreview && <Image src={coverPreview} alt="Cover" fill className="object-cover" />}
          {isEditing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-white bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                <Camera size={16} /> <span className="text-sm font-medium">Đổi ảnh bìa</span>
              </div>
            </div>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        <div className="px-8 pb-8">
          {/* Avatar & Header Actions */}
          <div className="flex justify-between items-end -mt-[50px] mb-6 relative z-10">
            {/* Avatar */}
            <div 
              className="relative w-[110px] h-[110px] rounded-full border-[5px] border-white bg-[#D9D9D9] group overflow-hidden"
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              {logoPreview && <Image src={logoPreview} alt="Logo" fill className="object-cover" />}
              {isEditing && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>

            {/* Action Buttons */}
            <div className="mb-2">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-gray-200 text-gray-700 font-medium text-[14px] hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={14} /> Chỉnh Sửa
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-[10px] bg-[#E89B5A] text-white font-bold text-[14px] hover:bg-[#D68B4E] transition-colors disabled:opacity-70"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                  <button 
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-[10px] border border-gray-200 text-gray-500 font-medium text-[14px] hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex flex-col gap-6">
            
            {/* Tên & Loại Trạm */}
            <div>
              <h1 className="text-[24px] font-bold text-[#1E1B4B] mb-1">{values.name || 'Sân Nhà Nhiều Chó'}</h1>
              <p className="text-[14px] text-gray-400">{shelterTypeLabel}</p>
            </div>

            {/* VIEW MODE */}
            {!isEditing ? (
              <>
                <p className="text-[15px] text-gray-500 mb-2 leading-relaxed">
                  {values.bio || 'Thông tin này sẽ hiển thị công khai cho người nhận nuôi trên PawLife.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-[#FFF8F3] text-[#E89B5A] shrink-0 mt-0.5"><Mail size={18} /></div>
                    <div className="flex flex-col">
                      <span className="text-[12px] text-gray-400 font-medium mb-0.5">Email</span>
                      <span className="text-[15px] font-medium text-gray-900">{values.email || 'Chưa cập nhật'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-[#FFF8F3] text-[#E89B5A] shrink-0 mt-0.5"><MapPin size={18} /></div>
                    <div className="flex flex-col">
                      <span className="text-[12px] text-gray-400 font-medium mb-0.5">Address</span>
                      <span className="text-[15px] font-medium text-gray-900 leading-snug">{values.address || 'Chưa cập nhật'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-[#FFF8F3] text-[#E89B5A] shrink-0 mt-0.5"><Phone size={18} /></div>
                    <div className="flex flex-col">
                      <span className="text-[12px] text-gray-400 font-medium mb-0.5">Phone</span>
                      <span className="text-[15px] font-medium text-gray-900">{values.phone || 'Chưa cập nhật'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-[#FFF8F3] text-[#E89B5A] shrink-0 mt-0.5"><Globe size={18} /></div>
                    <div className="flex flex-col">
                      <span className="text-[12px] text-gray-400 font-medium mb-0.5">Website</span>
                      <span className="text-[15px] font-medium text-gray-900">{values.website || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full border-t border-dashed border-gray-200 my-8" />

                {/* Stats */}
                <div className="flex justify-around items-center px-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[28px] font-bold text-[#4ADE80]">1000</span>
                    <span className="text-[13px] text-gray-400 font-medium">Available Pets</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[28px] font-bold text-[#F472B6]">1000</span>
                    <span className="text-[13px] text-gray-400 font-medium">Adopted</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[28px] font-bold text-[#60A5FA]">1000</span>
                    <span className="text-[13px] text-gray-400 font-medium">Followers</span>
                  </div>
                </div>
              </>
            ) : (
              /* EDIT MODE */
              <div className="flex flex-col gap-5 mt-2">
                
                {/* Giới thiệu (Bio) */}
                <div>
                  <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Giới thiệu (Bio)</label>
                  <textarea
                    value={values.bio}
                    onChange={(e) => setValues(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Thông tin này sẽ hiển thị công khai cho người nhận nuôi trên PawLife."
                    rows={3}
                    className="w-full bg-[#F9FAFB] border border-transparent rounded-[12px] p-4 text-[14px] text-gray-800 outline-none focus:border-[#E89B5A] transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Email */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Email</label>
                    <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-[12px] px-4 py-3 border border-transparent focus-within:border-[#E89B5A] transition-colors">
                      <Mail size={18} className="text-gray-400 shrink-0" />
                      <input 
                        type="email" 
                        value={values.email}
                        onChange={(e) => setValues(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-transparent outline-none text-[14px] text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Address</label>
                    <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-[12px] px-4 border border-transparent focus-within:border-[#E89B5A] transition-colors">
                      <MapPin size={18} className="text-gray-400 shrink-0" />
                      {/* Ghi đè class của AddressPicker để hoà nhập với layout mới */}
                      <div className="flex-1 w-full -ml-3">
                        <AddressPicker
                          disabled={isSubmitting}
                          initialAddress={profile?.address}
                          initialCenter={profileLat && profileLng ? [profileLat, profileLng] : undefined}
                          onSelect={(result) => setValues((p) => ({ ...p, address: result.address, latitude: result.lat, longitude: result.lng }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Phone</label>
                    <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-[12px] px-4 py-3 border border-transparent focus-within:border-[#E89B5A] transition-colors">
                      <Phone size={18} className="text-gray-400 shrink-0" />
                      <input 
                        type="text" 
                        value={values.phone}
                        onChange={(e) => setValues(p => ({ ...p, phone: e.target.value }))}
                        className="w-full bg-transparent outline-none text-[14px] text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-400 mb-1.5 block">Website</label>
                    <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-[12px] px-4 py-3 border border-transparent focus-within:border-[#E89B5A] transition-colors">
                      <Globe size={18} className="text-gray-400 shrink-0" />
                      <input 
                        type="text" 
                        value={values.website}
                        onChange={(e) => setValues(p => ({ ...p, website: e.target.value }))}
                        placeholder="https://"
                        className="w-full bg-transparent outline-none text-[14px] text-gray-900"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};