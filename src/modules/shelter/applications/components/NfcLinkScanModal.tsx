// src/modules/shelter/applications/components/NfcLinkScanModal.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle2, CreditCard, Link2, Loader2, Lock, Unlink, Info, X } from 'lucide-react';
import { ResponsiveModal } from '@/components/ResponsiveModal';
import { AdoptionApplication } from '@/types/application';
import {
  describeNfcError,
  isWebNfcSupported,
  linkNfcTagToPet,
  LocalizedText,
  NfcTagResult,
  readWebNfcUid,
  scanNfcUid,
  unlinkNfcTagFromPet,
  WEB_NFC_ERR,
} from '@/services/nfcWebService';

/**
 * Quét thẻ NFC để gán cho pet của đơn — cùng luồng với màn đọc thẻ trong app:
 *   chờ chạm -> hỏi BE (POST /nfc/scan) -> thẻ trống thì gán (POST link-pet) -> quét lại để xác nhận.
 */

type Phase = 'idle' | 'scanning' | 'loading' | 'result' | 'linking' | 'unlinking';

const txt = (v: LocalizedText | undefined, fallback = '') => {
  if (!v) return fallback;
  if (typeof v === 'string') return v;
  return v.vi ?? v.en ?? fallback;
};

interface Props {
  application: AdoptionApplication;
  onClose: () => void;
  /** Mở modal chuyển trạng thái hồ sơ (luồng cũ) */
  onOpenStatus: () => void;
}

export const NfcLinkScanModal: React.FC<Props> = ({ application, onClose, onOpenStatus }) => {
  const petId = application.pet?.id ?? null;
  const petName = application.pet?.name || 'bé này';

  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<NfcTagResult | null>(null);
  const [uid, setUid] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [linkedNow, setLinkedNow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const supported = isWebNfcSupported();

  // Đóng modal hoặc rời trang -> huỷ lượt đọc đang chờ
  useEffect(() => () => abortRef.current?.abort(), []);

  const rescan = useCallback(async (tagUid: string) => {
    const data = await scanNfcUid(tagUid);
    setResult(data);
    setPhase('result');
    return data;
  }, []);

  const startScan = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setError('');
    setResult(null);
    setLinkedNow(false);
    setPhase('scanning');
    try {
      const tagUid = await readWebNfcUid(ctrl.signal);
      setUid(tagUid);
      setPhase('loading');
      await rescan(tagUid);
    } catch (err: any) {
      if (ctrl.signal.aborted || err?.message === WEB_NFC_ERR.CANCELLED) {
        setPhase('idle');
        return;
      }
      setError(describeNfcError(err, 'Không quét được thẻ.'));
      setPhase('idle');
    }
  }, [rescan]);

  const cancelScan = () => {
    abortRef.current?.abort();
    setPhase('idle');
  };

  const handleLink = async () => {
    if (!petId || !uid || phase !== 'result') return;
    setPhase('linking');
    try {
      await linkNfcTagToPet(uid, petId);
      await rescan(uid); // lấy lại kết quả: giờ thẻ đã thuộc về pet
      setLinkedNow(true);
      toast.success(`Đã gán thẻ cho bé ${petName}`);
    } catch (err: any) {
      const msg = describeNfcError(err, 'Không gán được thẻ.');
      setError(msg);
      toast.error(msg);
      setPhase('result');
    }
  };

  const handleUnlink = async () => {
    if (!uid || phase !== 'result') return;
    setPhase('unlinking');
    try {
      await unlinkNfcTagFromPet(uid);
      await rescan(uid);
      toast.success('Đã gỡ thẻ khỏi pet');
    } catch (err: any) {
      const msg = describeNfcError(err, 'Không gỡ được thẻ.');
      setError(msg);
      toast.error(msg);
      setPhase('result');
    }
  };

  const busy = phase === 'loading' || phase === 'linking' || phase === 'unlinking';

  return (
    <ResponsiveModal onClose={() => { cancelScan(); onClose(); }} maxWidth="sm:max-w-[440px]" zIndex="z-[115]">
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4EA] text-[#E89B5A]">
              <CreditCard size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-semibold text-[#0D062D]">Gán thẻ NFC</h3>
              <p className="truncate text-[13px] text-gray-500">
                Cho hồ sơ của <b className="text-gray-700">{application.fullName || 'người nhận nuôi'}</b> · bé {petName}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => { cancelScan(); onClose(); }} aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {!supported && (
          <Notice tone="info" text="Trình duyệt này không đọc được thẻ NFC. Hãy dùng Chrome trên Android, mở trang qua HTTPS, hoặc gán thẻ bằng app PawLife." />
        )}

        {supported && phase === 'idle' && !result && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF4EA] text-[#E89B5A]">
              <CreditCard size={36} />
            </div>
            <p className="text-[15px] font-medium text-gray-800">Đặt thẻ sát mặt sau điện thoại</p>
            <p className="mt-1 text-[13px] text-gray-500">Bấm “Quét thẻ” rồi chạm thẻ vào điện thoại.</p>
          </div>
        )}

        {supported && (phase === 'scanning' || phase === 'loading') && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="relative mb-4 flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#E89B5A]/25" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF4EA] text-[#E89B5A]">
                {phase === 'scanning' ? <CreditCard size={34} /> : <Loader2 size={30} className="animate-spin" />}
              </span>
            </div>
            <p className="text-[15px] font-medium text-gray-800">
              {phase === 'scanning' ? 'Đang chờ thẻ…' : 'Đang kiểm tra thẻ…'}
            </p>
          </div>
        )}

        {error && <Notice tone="error" text={error} />}

        {phase === 'result' && result && (
          <ResultView
            result={result}
            petId={petId}
            petName={petName}
            linkedNow={linkedNow}
            onLink={handleLink}
            onUnlink={handleUnlink}
          />
        )}

        {(phase === 'linking' || phase === 'unlinking') && (
          <div className="flex items-center justify-center gap-2 py-6 text-[14px] text-gray-600">
            <Loader2 size={18} className="animate-spin" />
            {phase === 'linking' ? 'Đang gán thẻ…' : 'Đang gỡ thẻ…'}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {supported && phase === 'idle' && (
            <PrimaryButton onClick={startScan} icon={<CreditCard size={17} />}>Quét thẻ</PrimaryButton>
          )}
          {supported && (phase === 'scanning') && (
            <SecondaryButton onClick={cancelScan}>Huỷ quét</SecondaryButton>
          )}
          {supported && phase === 'result' && !busy && (
            <SecondaryButton onClick={startScan}>Quét thẻ khác</SecondaryButton>
          )}
          <button type="button" onClick={() => { cancelScan(); onOpenStatus(); }} disabled={busy}
            className="mx-auto mt-1 text-[13px] font-medium text-[#5A90DA] hover:underline disabled:opacity-50">
            Chuyển trạng thái hồ sơ
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

// ---------------------------------------------------------------------------

const ResultView = ({
  result, petId, petName, linkedNow, onLink, onUnlink,
}: {
  result: NfcTagResult;
  petId: string | null;
  petName: string;
  linkedNow: boolean;
  onLink: () => void;
  onUnlink: () => void;
}) => {
  if (result.outcome === 'empty') {
    if (!result.canLink) {
      return <Notice tone="info" text="Thẻ này chưa được gán cho pet nào. Tài khoản của bạn chưa có quyền gán thẻ." />;
    }
    if (!petId) {
      return <Notice tone="error" text="Đơn này chưa có bé để gán thẻ." />;
    }
    return (
      <div className="rounded-2xl border border-gray-200 p-4">
        <p className="text-[14px] font-semibold text-gray-900">Thẻ trống</p>
        <p className="mt-1 text-[13px] text-gray-500">Gán thẻ này cho bé {petName}. Chạm thẻ bất kỳ lúc nào để xem lại.</p>
        <PrimaryButton onClick={onLink} icon={<Link2 size={17} />} className="mt-4">
          Gán cho {petName}
        </PrimaryButton>
      </div>
    );
  }

  if (result.outcome === 'pet') {
    const samePet = !!petId && result.pet.id === petId;
    const thisPetName = txt(result.pet.name, 'bé khác');
    return (
      <div className="flex flex-col gap-3">
        <div className={`flex items-start gap-3 rounded-2xl p-4 ${samePet ? 'bg-[#E8F9EE]' : 'bg-[#FFF4EA]'}`}>
          {samePet ? <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-[#00963D]" /> : <Info size={22} className="mt-0.5 shrink-0 text-[#D98744]" />}
          <div className="min-w-0">
            <p className={`text-[14px] font-semibold ${samePet ? 'text-[#00963D]' : 'text-[#B5651D]'}`}>
              {samePet ? 'Thẻ đã gắn với bé này' : `Thẻ đang gắn với ${thisPetName}`}
            </p>
            {!samePet && (
              <p className="mt-1 text-[13px] text-gray-600">Gỡ thẻ khỏi bé hiện tại trước khi gán cho {petName}.</p>
            )}
          </div>
        </div>
        {!samePet && result.canUnlink && (
          <SecondaryButton onClick={onUnlink} icon={<Unlink size={16} />}>Gỡ thẻ khỏi {thisPetName}</SecondaryButton>
        )}
        {samePet && linkedNow && <p className="text-center text-[13px] text-gray-500">Hoàn tất. Có thể đóng cửa sổ này.</p>}
      </div>
    );
  }

  if (result.outcome === 'brand') {
    return <Notice tone="info" text={`Đây là thẻ của đối tác ${result.brand.name}, không gán cho bé được.`} />;
  }

  // disabled
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
      <Lock size={20} className="mt-0.5 shrink-0 text-red-500" />
      <p className="text-[14px] text-red-600">Thẻ này đang bị vô hiệu hoá. Hãy kích hoạt lại trong trang Thẻ NFC trước khi gán.</p>
    </div>
  );
};

const Notice = ({ tone, text }: { tone: 'info' | 'error'; text: string }) => (
  <div className={`mb-4 flex items-start gap-2.5 rounded-2xl p-3.5 text-[13px] leading-relaxed ${tone === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#F5F5F7] text-gray-600'}`}>
    <Info size={16} className="mt-0.5 shrink-0" />
    <span>{text}</span>
  </div>
);

const PrimaryButton = ({
  onClick, children, icon, className = '',
}: { onClick: () => void; children: React.ReactNode; icon?: React.ReactNode; className?: string }) => (
  <button type="button" onClick={onClick}
    className={`flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#E89B5A] text-[14px] font-semibold text-white transition-colors hover:bg-[#D98744] ${className}`}>
    {icon} {children}
  </button>
);

const SecondaryButton = ({
  onClick, children, icon,
}: { onClick: () => void; children: React.ReactNode; icon?: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#F5F5F7] text-[14px] font-semibold text-gray-700 transition-colors hover:bg-gray-200">
    {icon} {children}
  </button>
);

export default NfcLinkScanModal;
