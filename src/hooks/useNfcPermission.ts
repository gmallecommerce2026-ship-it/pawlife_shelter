'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  NO_NFC_PERMISSION, NfcMyPermission, canLinkTag, canManagePermissions, getMyNfcPermission,
} from '@/services/nfcPermissionService';

/** Quyền NFC của user hiện tại. Lỗi mạng -> coi như chỉ xem (an toàn). Tự tải lại khi tab được focus lại. */
export const useNfcPermission = () => {
  const [perm, setPerm] = useState<NfcMyPermission>(NO_NFC_PERMISSION);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { setPerm(await getMyNfcPermission()); } catch { setPerm(NO_NFC_PERMISSION); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh(); // quyền có thể bị thu hồi bất cứ lúc nào
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  return { perm, loading, refresh, canLink: canLinkTag(perm), canManage: canManagePermissions(perm) };
};
