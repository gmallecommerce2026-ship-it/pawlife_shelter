// src/stores/usePetStore.ts
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '@/lib/api/ApiClient';
import axiosClient from '@/lib/api/axiosClient';
import { toast } from 'react-hot-toast';
import {
  Pet,
  PetFilter,
  PetFormValues,
  defaultPetFilter,
} from '@/types/pet';

// --- MOCK DATA DỰ PHÒNG CHO TRANG QUẢN LÝ PET ---
const FALLBACK_MOCK_PETS: Pet[] = [
  {
    id: 'pet_001',
    name: 'Luna',
    species: 'CAT',
    breed: { vi: 'Mèo Anh Lông Ngắn', en: 'British Shorthair' },
    age: 24, // 2 tuổi
    gender: 'FEMALE',
    status: 'AVAILABLE',
    images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400'],
    description: { vi: 'Rất ngoan, quấn người và thích được chải lông.', en: 'Very well-behaved and affectionate.' },
    healthStatus: ['Đã tiêm phòng dại', 'Đã tẩy giun'],
    weightKg: 4.2,
    isSterilized: true,
    isVaccinated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pet_002',
    name: 'Max',
    species: 'DOG',
    breed: { vi: 'Chó Golden Retriever', en: 'Golden Retriever' },
    age: 6, // 6 tháng
    gender: 'MALE',
    status: 'PENDING',
    images: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400'],
    description: { vi: 'Năng động, thích chơi nhặt bóng.', en: 'Energetic and loves fetching.' },
    healthStatus: ['Khỏe mạnh', 'Đang chờ tiêm mũi 2'],
    weightKg: 12.5,
    isSterilized: false,
    isVaccinated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pet_003',
    name: 'Milo',
    species: 'CAT',
    breed: { vi: 'Mèo ta (Mướp)', en: 'Domestic Shorthair' },
    age: 36, // 3 năm
    gender: 'MALE',
    status: 'ADOPTED',
    images: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=400'],
    description: { vi: 'Hơi nhút nhát ban đầu nhưng rất tình cảm.', en: 'A bit shy at first but very affectionate.' },
    healthStatus: ['Đã khám tổng quát', 'Khỏe mạnh'],
    weightKg: 5.1,
    isSterilized: true,
    isVaccinated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pet_004',
    name: 'Bella',
    species: 'DOG',
    breed: { vi: 'Chó Poodle', en: 'Poodle' },
    age: 12, // 1 năm
    gender: 'FEMALE',
    status: 'AVAILABLE',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400'],
    description: { vi: 'Thông minh, không rụng lông.', en: 'Smart and non-shedding.' },
    healthStatus: ['Đã cạo vôi răng', 'Sức khỏe tốt'],
    weightKg: 3.8,
    isSterilized: true,
    isVaccinated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pet_005',
    name: 'Bông',
    species: 'DOG',
    breed: { vi: 'Chó Corgi', en: 'Corgi' },
    age: 48,
    gender: 'MALE',
    status: 'AVAILABLE',
    images: ['https://images.unsplash.com/photo-1597626133663-cb34ae9231f4?q=80&w=400'],
    description: { vi: 'Ham ăn, vui vẻ và thích đi dạo.', en: 'Loves to eat and enjoy walks.' },
    healthStatus: ['Hơi thừa cân'],
    weightKg: 14.0,
    isSterilized: true,
    isVaccinated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// ... (Các hàm sanitizePayload, normalizeEnums, mapAdoptionRequirements, preparePayload, uploadOne giữ nguyên) ...

// GIỮ NGUYÊN CÁC HÀM SANITIZE VÀ UPLOAD CỦA BẠN Ở ĐÂY
function sanitizePayload<T extends Record<string, any>>(values: T): T {
  const cleaned: Record<string, any> = {};
  Object.entries(values).forEach(([key, val]) => {
    if (val === '' || val === null) return;
    cleaned[key] = val;
  });
  return cleaned as T;
}

const ENUM_FIELDS = ['size', 'gender', 'status'] as const;
function normalizeEnums<T extends Record<string, any>>(values: T): T {
  const result: Record<string, any> = { ...values };
  ENUM_FIELDS.forEach((field) => {
    if (typeof result[field] === 'string' && result[field] !== '') {
      result[field] = result[field].toUpperCase();
    }
  });
  return result as T;
}

function mapAdoptionRequirements<T extends Record<string, any>>(values: T): T {
  const { adoptionRequirements, ...rest } = values as any;
  if (Array.isArray(adoptionRequirements)) {
    return {
      ...rest,
      adoptionRequirementKeys: adoptionRequirements
        .map((r: any) => r.key ?? r.iconKey)
        .filter(Boolean),
    };
  }
  return values;
}

function preparePayload<T extends Record<string, any>>(values: T): T {
  return normalizeEnums(mapAdoptionRequirements(sanitizePayload(values)));
}

async function uploadOne(file: File, folder: string): Promise<string> {
  const { data } = await axiosClient.post('/storage/presigned-url', {
    fileName: file.name,
    fileType: file.type || 'image/jpeg',
    folder,
  });
  const res = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Upload ảnh thất bại');
  return data.fileUrl;
}

interface PetState {
  items: Pet[];
  total: number;
  filter: PetFilter;
  isLoading: boolean;
  isSubmitting: boolean;
}

interface PetActions {
  fetchPets: (override?: Partial<PetFilter>) => Promise<void>;
  setFilter: (patch: Partial<PetFilter>) => void;
  getPetById: (id: string) => Promise<Pet | null>;
  createPet: (values: PetFormValues, images: File[]) => Promise<boolean>;
  updatePet: (id: string, values: PetFormValues, newImages: File[], keepImageUrls: string[]) => Promise<boolean>;
  deletePet: (id: string) => Promise<boolean>;
}

const usePetStoreBase = create<PetState & PetActions>()((set, get) => ({
  items: [],
  total: 0,
  filter: defaultPetFilter,
  isLoading: false,
  isSubmitting: false,

  setFilter: (patch) => {
    const nextFilter = { ...get().filter, ...patch };
    if (!('page' in patch)) nextFilter.page = 1;
    set({ filter: nextFilter });
    get().fetchPets(nextFilter);
  },

  fetchPets: async (override) => {
    const filter = { ...get().filter, ...override };
    set({ isLoading: true, filter });
    try {
      const params = new URLSearchParams();
      if (filter.search) params.set('search', filter.search);
      if (filter.species !== 'ALL') params.set('species', filter.species);
      if (filter.status !== 'ALL') params.set('status', filter.status);
      params.set('page', String(filter.page));
      params.set('pageSize', String(filter.pageSize));

      const res = await apiClient.get(`/shelter-dashboard/pets?${params.toString()}`);

      // SỬ DỤNG MOCK DATA NẾU API TRẢ VỀ RỖNG HOẶC LỖI
      const apiItems = res.items ?? res ?? [];
      const finalItems = apiItems.length > 0 ? apiItems : FALLBACK_MOCK_PETS;
      const finalTotal = apiItems.length > 0 ? (res.total ?? 0) : FALLBACK_MOCK_PETS.length;

      // Áp dụng bộ lọc cho Mock Data ở local để UI filter hoạt động mượt mà
      let filteredMock = [...finalItems];
      if (apiItems.length === 0) {
        if (filter.search) {
          filteredMock = filteredMock.filter(p => p.name.toLowerCase().includes(filter.search.toLowerCase()));
        }
        if (filter.species !== 'ALL') {
          filteredMock = filteredMock.filter(p => p.species === filter.species);
        }
        if (filter.status !== 'ALL') {
          filteredMock = filteredMock.filter(p => p.status === filter.status);
        }
      }

      set({ items: filteredMock, total: apiItems.length > 0 ? finalTotal : filteredMock.length });

    } catch (error) {
      console.warn('Fetch pets error, fallback to mock data:', error);

      // FALLBACK TO MOCK DATA KHI LỖI MẠNG / API CHƯA CHẠY
      let filteredMock = [...FALLBACK_MOCK_PETS];
      if (filter.search) filteredMock = filteredMock.filter(p => p.name.toLowerCase().includes(filter.search.toLowerCase()));
      if (filter.species !== 'ALL') filteredMock = filteredMock.filter(p => p.species === filter.species);
      if (filter.status !== 'ALL') filteredMock = filteredMock.filter(p => p.status === filter.status);

      set({ items: filteredMock, total: filteredMock.length });
    } finally {
      set({ isLoading: false });
    }
  },

  // ... (Các hàm getPetById, createPet, updatePet, deletePet giữ nguyên như file cũ của bạn) ...
  getPetById: async (id) => {
    try {
      const res = await apiClient.get(`/shelter-dashboard/pets/${id}`);
      return res as Pet;
    } catch (error) {
      console.warn('Get pet error, fallback to mock data:', error);

      // Lấy thông tin từ danh sách hiện tại trong Zustand store hoặc mảng mock fallback
      const mockPet = get().items.find((p) => p.id === id) || FALLBACK_MOCK_PETS.find((p) => p.id === id);
      if (mockPet) return mockPet;

      toast.error('Không tìm thấy thông tin pet.');
      return null;
    }
  },

  createPet: async (values, images) => {
    set({ isSubmitting: true });
    try {
      const imageUrls = await Promise.all(images.map((file) => uploadOne(file, 'pet-images')));
      const newPet = await apiClient.post('/shelter-dashboard/pets', {
        ...preparePayload(values),
        images: imageUrls,
      });
      if (values.tagId) {
        await apiClient.post(`/pets/${newPet.id}/link-qr`, { tagId: values.tagId });
      }
      toast.success('Thêm pet mới thành công!');
      await get().fetchPets({ page: 1 });
      return true;
    } catch (error) {
      console.error('Create pet error:', error);
      toast.error('Thêm pet thất bại. Vui lòng thử lại.');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updatePet: async (id, values, newImages, keepImageUrls) => {
    set({ isSubmitting: true });
    try {
      const newImageUrls = await Promise.all(newImages.map((file) => uploadOne(file, 'pet-images')));
      const images = [...keepImageUrls, ...newImageUrls];
      await apiClient.patch(`/shelter-dashboard/pets/${id}`, {
        ...preparePayload(values),
        images,
      });
      if (values.tagId) {
        await apiClient.patch(`/pets/${id}/replace-qr`, { newTagId: values.tagId });
      }
      toast.success('Cập nhật thông tin pet thành công!');
      await get().fetchPets();
      return true;
    } catch (error) {
      console.error('Update pet error:', error);
      toast.error('Cập nhật thất bại. Vui lòng thử lại.');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  deletePet: async (id) => {
    const prevItems = get().items;
    set({ items: prevItems.filter((p) => p.id !== id) });
    try {
      await apiClient.delete(`/shelter-dashboard/pets/${id}`);
      toast.success('Đã xóa pet.');
      return true;
    } catch (error) {
      console.error('Delete pet error:', error);
      set({ items: prevItems });
      toast.error('Xóa thất bại. Vui lòng thử lại.');
      return false;
    }
  },
}));

export const usePetList = () =>
  usePetStoreBase(useShallow((state) => ({
    items: state.items,
    total: state.total,
    isLoading: state.isLoading,
  })));

export const usePetFilter = () =>
  usePetStoreBase(useShallow((state) => ({
    filter: state.filter,
    setFilter: state.setFilter,
  })));

export const usePetActions = () =>
  usePetStoreBase(useShallow((state) => ({
    fetchPets: state.fetchPets,
    getPetById: state.getPetById,
    createPet: state.createPet,
    updatePet: state.updatePet,
    deletePet: state.deletePet,
    isSubmitting: state.isSubmitting,
  })));

export const usePetStore = usePetStoreBase;