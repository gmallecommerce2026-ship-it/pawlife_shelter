import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'react-hot-toast';
import { shelterTeamService } from '@/services/shelterTeamService';
import type { ShelterTeamMember, ShelterInvitationItem, ShelterStaffRole } from '@/types/shelterTeam';

interface ShelterTeamState {
  members: ShelterTeamMember[];
  invitations: ShelterInvitationItem[];
  isLoading: boolean;
  isSubmitting: boolean;
}

interface ShelterTeamActions {
  fetchTeam: () => Promise<void>;
  inviteMember: (email: string, role: ShelterStaffRole, name?: string) => Promise<boolean>;
  updateMemberRole: (userId: string, role: ShelterStaffRole) => Promise<boolean>;
  removeMember: (userId: string) => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
}

const useShelterTeamStoreBase = create<ShelterTeamState & ShelterTeamActions>()((set, get) => ({
  members: [],
  invitations: [],
  isLoading: false,
  isSubmitting: false,

  fetchTeam: async () => {
    set({ isLoading: true });
    try {
      const data = await shelterTeamService.getTeam();
      set({ members: data.members, invitations: data.invitations });
    } catch (e: any) {
      toast.error(e.message || 'Không thể tải danh sách thành viên.');
    } finally {
      set({ isLoading: false });
    }
  },

  inviteMember: async (email, role, name) => {
    set({ isSubmitting: true });
    try {
      await shelterTeamService.inviteMember(email, role, name);
      toast.success('Đã gửi lời mời qua email!');
      await get().fetchTeam();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể gửi lời mời.');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateMemberRole: async (userId, role) => {
    try {
      await shelterTeamService.updateMemberRole(userId, role);
      toast.success('Đã cập nhật vai trò.');
      await get().fetchTeam();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể cập nhật vai trò.');
      return false;
    }
  },

  removeMember: async (userId) => {
    try {
      await shelterTeamService.removeMember(userId);
      toast.success('Đã xoá thành viên.');
      await get().fetchTeam();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể xoá thành viên.');
      return false;
    }
  },

  cancelInvitation: async (invitationId) => {
    try {
      await shelterTeamService.cancelInvitation(invitationId);
      toast.success('Đã thu hồi lời mời.');
      await get().fetchTeam();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Không thể thu hồi lời mời.');
      return false;
    }
  },
}));

export const useShelterTeam = () =>
  useShelterTeamStoreBase(useShallow((s) => ({
    members: s.members,
    invitations: s.invitations,
    isLoading: s.isLoading,
  })));

export const useShelterTeamActions = () =>
  useShelterTeamStoreBase(useShallow((s) => ({
    fetchTeam: s.fetchTeam,
    inviteMember: s.inviteMember,
    updateMemberRole: s.updateMemberRole,
    removeMember: s.removeMember,
    cancelInvitation: s.cancelInvitation,
    isSubmitting: s.isSubmitting,
  })));