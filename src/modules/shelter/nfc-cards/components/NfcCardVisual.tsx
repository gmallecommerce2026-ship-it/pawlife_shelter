'use client';

import React from 'react';
import { NfcCardState } from '@/types/nfcCard';

/**
 * Thẻ PawLife — dựng lại đúng thiết kế thẻ mẫu của app (app/nfc-reader.tsx):
 *  - tỉ lệ 164 x 262, bo góc 20 (ở kích thước 164)
 *  - nền cam đào gradient, bóng đổ màu #C36616
 *  - pet ở ~45% chiều cao, chiếm ~52% chiều cao thẻ, có bóng dưới chân
 *  - chữ PawLife cách mép dưới 36, giãn chữ 3.5, gạch nhỏ phía dưới
 *  - viền trắng mảnh (inset) và ánh bóng chéo như mặt kính
 * Thẻ DISABLED: xám, giống trạng thái "off" của thẻ.
 */

const CARD_W = 200;             // px hiển thị
const SCALE = CARD_W / 164;     // quy đổi từ kích thước gốc của app
const CARD_H = Math.round(262 * SCALE);
const PET_SIZE = Math.round(CARD_H * 0.52);
const PET_TOP = Math.round(CARD_H * 0.45 - PET_SIZE / 2);
const RADIUS = Math.round(20 * SCALE);
const FALLBACK_PET = '/images/nfc/nfc-pet.png'; // ảnh mẫu của app, nằm ở public/images/nfc/

/** Luôn dùng ảnh mẫu nfc-pet.png như thẻ mẫu của app. petImage/petName/code chỉ để tương thích, không hiển thị trên thẻ. */
export const NfcCardVisual = ({
  state,
}: {
  code?: string;
  state: NfcCardState;
  petName?: string | null;
  petImage?: string | null;
}) => {
  const off = state === 'DISABLED';
  const bg = off
    ? 'linear-gradient(160deg, #A3A1AD 0%, #8E8C99 50%, #B9B7C4 100%)'
    : 'linear-gradient(160deg, #F0A862 0%, #F3B873 50%, #F6C78C 100%)';
  const shadow = off
    ? '0 8px 16px rgba(60,58,70,0.18)'
    : '0 12px 20px rgba(195,102,22,0.35)';

  return (
    <div className="mx-auto" style={{ width: CARD_W, height: CARD_H }}>
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: RADIUS,
          background: bg,
          boxShadow: `${shadow}, inset 0 0 0 0.6px #FFFFFF`,
          filter: off ? 'grayscale(0.4)' : undefined,
        }}
      >
        {/* Ánh bóng chéo như mặt thẻ phủ kính */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 55%)' }}
        />

        {/* Quầng sáng sau lưng pet */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: (CARD_W - PET_SIZE) / 2, top: PET_TOP, width: PET_SIZE, height: PET_SIZE,
            background: 'rgba(255,236,205,0.30)',
            boxShadow: '0 0 36px 10px rgba(255,236,205,0.45)',
          }}
        />

        {/* Bóng dưới chân pet */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: (CARD_W - 78 * SCALE) / 2, top: PET_TOP + PET_SIZE - 12 * SCALE,
            width: 78 * SCALE, height: 12 * SCALE,
            boxShadow: '0 0 10px 2px rgba(170,95,30,0.30)',
          }}
        />

        {/* Pet */}
        <div
          className="pointer-events-none absolute"
          style={{ left: (CARD_W - PET_SIZE) / 2, top: PET_TOP, width: PET_SIZE, height: PET_SIZE }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FALLBACK_PET}
            alt=""
            className="h-full w-full object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
          />
        </div>

        {/* Chữ thương hiệu + gạch nhỏ */}
        <div className="absolute inset-x-0 flex justify-center" style={{ bottom: 36 * SCALE }}>
          <span
            className="font-light"
            style={{ color: 'rgba(255,246,230,0.96)', letterSpacing: '0.27em', fontSize: 13 * SCALE }}
          >
            PawLife
          </span>
        </div>
        <div
          className="absolute"
          style={{ left: (CARD_W - 16 * SCALE) / 2, bottom: 30 * SCALE, width: 16 * SCALE, height: 1, background: 'rgba(255,246,230,0.75)' }}
        />

        {/* Viền trắng bất đối xứng như viền navbar của app */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: RADIUS,
            boxShadow: 'inset 0.9px 0.9px 0 #FFFFFF, inset -0.9px -0.9px 0 #FFFFFF',
          }}
        />
      </div>
    </div>
  );
};

export default NfcCardVisual;
