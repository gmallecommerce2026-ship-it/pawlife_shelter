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

interface ApplicationState {
  items: AdoptionApplication[];
  filter: ApplicationFilter;
  isLoading: boolean;
  movingIds: string[]; // id các đơn đang gọi API đổi trạng thái (để disable card tương ứng)
}

interface ApplicationActions {
  fetchApplications: (override?: Partial<ApplicationFilter>) => Promise<void>;
  setFilter: (patch: Partial<ApplicationFilter>) => void;
  moveApplication: (id: string, status: ApplicationStatus, reviewNote?: string) => Promise<boolean>;
}

const KANBAN_STATUSES = KANBAN_COLUMNS.map((c) => c.status);

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
      // Chỉ lấy các trạng thái hiển thị trên Kanban — đơn CLOSED (người dùng tự rút) không cần shelter xử lý.
      params.set('statuses', KANBAN_STATUSES.join(','));

      const res = await apiClient.get(`/shelter-dashboard/applications?${params.toString()}`);
      set({ items: res.items ?? res ?? [] });
    } catch (error) {
      console.error('Fetch applications error:', error);
      toast.error('Không tải được danh sách đơn nhận nuôi. Vui lòng thử lại.');
    } finally {
      set({ isLoading: false });
    }
  },

  moveApplication: async (id, status, reviewNote) => {
    const prevItems = get().items;
    const target = prevItems.find((a) => a.id === id);
    if (!target) return false;

    // Optimistic update — Kanban cần mượt, không chờ round-trip mới thấy thẻ nhảy cột
    set({
      items: prevItems.map((a) => (a.id === id ? { ...a, status, reviewNote: reviewNote ?? a.reviewNote } : a)),
      movingIds: [...get().movingIds, id],
    });

    try {
      await apiClient.patch(`/shelter-dashboard/applications/${id}/status`, { status, reviewNote });
      return true;
    } catch (error) {
      console.error('Move application error:', error);
      toast.error('Cập nhật trạng thái đơn thất bại. Đã hoàn tác thay đổi.');
      set({ items: prevItems }); // rollback
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
