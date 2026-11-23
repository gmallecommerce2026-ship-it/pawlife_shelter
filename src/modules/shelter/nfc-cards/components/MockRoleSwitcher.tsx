'use client';

import React from 'react';
import { FlaskConical } from 'lucide-react';
import { NFC_MOCK, NfcMyPermission, setMockMyPermission } from '@/services/nfcPermissionService';

const MOCK_ROLES: Array<{ label: string; perm: NfcMyPermission }> = [
  { label: 'Root', perm: { isRoot: true, level: null } },
  { label: 'Quản lý', perm: { isRoot: false, level: 'MANAGER' } },
  { label: 'Cấp quyền', perm: { isRoot: false, level: 'GRANTER' } },
  { label: 'Gán thẻ', perm: { isRoot: false, level: 'LINKER' } },
  { label: 'Chỉ xem', perm: { isRoot: false, level: null } },
];


/** Chỉ hiện ở mock mode — đổi vai trò để xem thử UI theo từng cấp quyền */
export const MockRoleSwitcher = ({ perm, onChanged }: { perm: NfcMyPermission; onChanged: () => void }) => {
  if (!NFC_MOCK) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-[#E89B5A]/50 bg-[#FFFBF6] px-4 py-3">
      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#E89B5A]"><FlaskConical size={14} /> Xem thử vai trò (mock)</span>
      <div className="flex flex-wrap gap-1.5">
        {MOCK_ROLES.map((r) => {
          const on = r.perm.isRoot === perm.isRoot && r.perm.level === perm.level;
          return (
            <button key={r.label} type="button" onClick={() => { setMockMyPermission(r.perm); onChanged(); }}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${on ? 'bg-[#E89B5A] text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-[#E89B5A]'}`}>
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MockRoleSwitcher;
