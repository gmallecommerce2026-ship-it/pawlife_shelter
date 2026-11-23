import React from 'react';
import { NFC_STATE_META, NfcCardState } from '@/types/nfcCard';

export const NfcStateBadge = ({ state }: { state: NfcCardState }) => {
  const m = NFC_STATE_META[state];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap" style={{ background: m.bg, color: m.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
};

export default NfcStateBadge;
