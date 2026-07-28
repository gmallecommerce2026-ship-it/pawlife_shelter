'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPlus } from 'react-icons/fi';
import { usePetList, usePetFilter, usePetActions } from '@/stores/usePetStore';
import { PetFilterBar } from './components/PetFilterBar';
import { PetCard } from './components/PetCard';
import { Pet, PetViewMode } from '@/types/pet';
import PetDetailPhoneModal from './components/PetDetailPhoneModal';

export const PetListPage = () => {
  const router = useRouter();
  const { items, total, isLoading } = usePetList();
  const { filter, setFilter } = usePetFilter();
  // NOTE: `deletePet` giả định usePetActions đã/sẽ có action này (song song với
  // createPet/updatePet đã có trong PetForm.tsx). Nếu store chưa có, cần bổ sung
  // 1 action gọi `axiosClient.delete('/pets/{id}')` rồi tự loại pet đó khỏi
  // `items` (hoặc gọi lại fetchPets()).
  const { fetchPets, deletePet } = usePetActions() as ReturnType<typeof usePetActions> & {
    deletePet?: (id: string) => Promise<boolean | void>;
  };
  const [viewMode, setViewMode] = useState<PetViewMode>('grid');

  // Pet đang được xem trong phone-preview modal (null = đang đóng)
  const [previewPet, setPreviewPet] = useState<Pet | null>(null);

  useEffect(() => {
    fetchPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / filter.pageSize));

  const handleView = (pet: Pet) => setPreviewPet(pet);

  // NOTE: điều chỉnh path này cho khớp route sửa pet thật của bạn (nếu khác
  // '/shelter/pets/[id]/edit').
  const handleEdit = (pet: Pet) => router.push(`/shelter/pets/${pet.id}/edit`);

  const handleDelete = async (pet: Pet) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xoá hồ sơ của "${pet.name}"? Hành động này không thể hoàn tác.`,
    );
    if (!confirmed) return;

    try {
      if (deletePet) {
        await deletePet(pet.id);
      }
      // Refetch để đồng bộ lại total/pagination, phòng khi deletePet không tự
      // cập nhật `items` trong store.
      await fetchPets();
    } catch (err) {
      console.error('[PetListPage] Xoá pet thất bại:', err);
      alert('Không thể xoá pet lúc này, vui lòng thử lại.');
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-sans text-2xl text-[#123832] font-bold">Quản lý Pets</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} pet đang được trạm quản lý</p>
        </div>
        <Link
          href="/shelter/pets/create"
          className="flex items-center gap-2 bg-[#E89B5A] hover:bg-[#D68B4E] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <FiPlus size={16} /> Thêm Pet mới
        </Link>
      </div>

      <PetFilterBar
        filter={filter}
        onFilterChange={setFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-500 mb-4">Chưa có pet nào khớp với bộ lọc hiện tại.</p>
          <Link href="/shelter/pets/create" className="text-[#E89B5A] font-medium hover:underline">
            + Thêm pet đầu tiên
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              viewMode="grid"
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              viewMode="list"
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setFilter({ page })}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  page === filter.page
                    ? 'bg-[#E89B5A] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#E89B5A]'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
      )}

      {/* Phone-preview: mở khi bấm vào 1 item pet, render lại UI PetProfileDetailScreen
          (mobile) bên trong khung điện thoại — giống PhonePreview trong ShelterProfileForm. */}
      <PetDetailPhoneModal
        pet={previewPet}
        onClose={() => setPreviewPet(null)}
        onEditPress={() => {
          if (previewPet) {
            handleEdit(previewPet);
            setPreviewPet(null);
          }
        }}
      />
    </div>
  );
};

export default PetListPage;