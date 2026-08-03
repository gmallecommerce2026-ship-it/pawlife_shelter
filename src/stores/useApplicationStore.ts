// src/stores/useApplicationStore.ts
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '@/lib/api/ApiClient';
import { toast } from 'react-hot-toast';
import {
  AdoptionApplication,
  ApplicationStatus,
  ApplicationFilter,
  defaultApplicationFilter,
  KANBAN_COLUMNS,
} from '@/types/application';

// --- MOCK DATA DỰ PHÒNG (5 apps / cột) ---
const MOCK_APPLICANTS = ['Maria Garcia', 'Nguyễn Thiên Ân', 'Trần Thị Bích', 'Lê Văn Cường', 'Phạm Quỳnh Như'];
const MOCK_PETS = ['Luna', 'Milu', 'Milo', 'Kiki', 'Bông'];
const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100', 
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100', 
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=100', 
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100', 
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=100',
];

const generateMockData = (): AdoptionApplication[] => {
  const data: AdoptionApplication[] = [];
  const statuses = KANBAN_COLUMNS.map((c) => c.status);
  let idCounter = 1;

  statuses.forEach((status) => {
    for (let i = 0; i < 2; i++) {
      data.push({
        id: `app_mock_${idCounter++}`,
        status: status,
        fullName: MOCK_APPLICANTS[i],
        phone: `091234567${i}`,
        zalo: `user${i}@pawlife.vn`,
        adoptFor: i % 2 === 0 ? 'Myself' : 'Someone else',
        location: 'Cầu Giấy, Hà Nội',
        housing: 'Apartment (allows pet ownership)',
        children: 'No children',
        cage: 'No',
        petExperience: i === 0 || i === 3 ? 'Chưa từng nuôi' : 'Đã từng nuôi 2 con chó',
        prevPetHistory: 'Chăm sóc cẩn thận',
        employmentStatus: 'Currently employed',
        adoptionReason: 'Muốn có một người bạn đồng hành',
        commitments: {
          vaccine: 'Yes',
          medical: 'Yes',
          expenses: 'Yes',
          updateStatus: 'Yes',
          homeVisit: 'Yes',
          provideID: 'Yes',
        },
        pet: {
          id: `pet_${i}`,
          name: MOCK_PETS[i],
          avatarUrl: MOCK_AVATARS[i],
        },
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        updatedAt: new Date().toISOString(),
        submittedAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      } as any);
    }
  });
  return data;
};

const FALLBACK_MOCK_ITEMS = generateMockData();
const KANBAN_STATUSES = KANBAN_COLUMNS.map((c) => c.status);

interface ApplicationState {
  items: AdoptionApplication[];
  filter: ApplicationFilter;
  isLoading: boolean;
  movingIds: string[];
}

interface ApplicationActions {
  fetchApplications: (override?: Partial<ApplicationFilter>) => Promise<void>;
  setFilter: (patch: Partial<ApplicationFilter>) => void;
  moveApplication: (id: string, status: ApplicationStatus, reviewNote?: string) => Promise<boolean>;
}

const useApplicationStoreBase = create<ApplicationState & ApplicationActions>()((set, get) => ({
  items: [],
  filter: defaultApplicationFilter,
  isLoading: false,
  movingIds: [],
  setFilter: (patch) => {
    const nextFilter = { ...get().filter, ...patch };
    set({ filter: nextFilter });
    get().fetchApplications(nextFilter);
  },
  fetchApplications: async (override) => {
    const filter = { ...get().filter, ...override };
    set({ isLoading: true, filter });
    try {
      const params = new URLSearchParams();
      if (filter.search) params.set('search', filter.search);
      params.set('statuses', KANBAN_STATUSES.join(','));
      
      // Vẫn gọi API thật từ Backend
      const res = await apiClient.get(`/shelter-dashboard/applications?${params.toString()}`);
      const apiItems = res.items ?? res ?? [];

      // Nếu API trả về mảng rỗng (chưa có data thật), tự động gộp thêm mock data để test UI
      const finalItems = apiItems.length > 0 ? apiItems : FALLBACK_MOCK_ITEMS;

      set({ items: finalItems });
    } catch (error) {
      console.warn('API fetch error, fallback to mock data:', error);
      // Nếu API lỗi (chưa chạy backend), dùng luôn bộ mock data để không bị trống màn hình
      set({ items: FALLBACK_MOCK_ITEMS });
    } finally {
      set({ isLoading: false });
    }
  },
  moveApplication: async (id, status, reviewNote) => {
    const prevItems = get().items;
    const target = prevItems.find((a) => a.id === id);
    if (!target) return false;

    // Optimistic update cho Kanban (Đổi cột ngay lập tức trên UI)
    set({
      items: prevItems.map((a) => (a.id === id ? { ...a, status, reviewNote: reviewNote ?? a.reviewNote } : a)),
      movingIds: [...get().movingIds, id],
    });

    try {
      // Vẫn bắn request thật lên Backend
      await apiClient.patch(`/shelter-dashboard/applications/${id}/status`, { status, reviewNote });
      toast.success('Cập nhật trạng thái đơn thành công!');
      return true;
    } catch (error) {
      console.error('Move application error:', error);
      toast.error('Cập nhật trạng thái thất bại. Đang hoàn tác.');
      set({ items: prevItems }); // Rollback nếu lỗi
      return false;
    } finally {
      set({ movingIds: get().movingIds.filter((mid) => mid !== id) });
    }
  },
}));

export const useApplicationList = () =>
  useApplicationStoreBase(useShallow((state) => ({
    items: state.items,
    isLoading: state.isLoading,
    movingIds: state.movingIds,
  })));

export const useApplicationFilter = () =>
  useApplicationStoreBase(useShallow((state) => ({
    filter: state.filter,
    setFilter: state.setFilter,
  })));

export const useApplicationActions = () =>
  useApplicationStoreBase(useShallow((state) => ({
    fetchApplications: state.fetchApplications,
    moveApplication: state.moveApplication,
  })));

export const useApplicationStore = useApplicationStoreBase;