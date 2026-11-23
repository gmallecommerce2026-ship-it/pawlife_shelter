import React from 'react';
import { ShieldCheck, Eye, Crown } from 'lucide-react';
import { NfcLevel, NFC_LEVEL_META } from '@/services/nfcPermissionService';

export const NfcLevelPill = ({ level }: { level: NfcLevel }) => {
  const m = NFC_LEVEL_META[level];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap" style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
};

export const NfcRoleBadge = ({ isRoot, level }: { isRoot: boolean; level: NfcLevel | null }) => {
  const Icon = isRoot ? Crown : level ? ShieldCheck : Eye;
  const text = isRoot ? 'Root' : level ? NFC_LEVEL_META[level].label : 'Chỉ xem';
  const cls = isRoot ? 'bg-[#0D062D] text-white' : level ? 'bg-[#FFF4EA] text-[#E89B5A]' : 'bg-[#F1F1F4] text-[#6B6880]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${cls}`}>
      <Icon size={14} /> {text}
    </span>
  );
};
