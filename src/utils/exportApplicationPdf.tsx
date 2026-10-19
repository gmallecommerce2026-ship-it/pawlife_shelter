import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { AdoptionApplication, localizedText } from '@/types/application';
import {
  translateAdoptFor,
  translateHousing,
  translateChildren,
  translateCage,
  translatePetExperience,
  translateEmploymentStatus,
  translatePetHistory,
  translateAdoptionReason,
} from '@/utils/translateApplication';
import { translateManyToVi } from '@/utils/translateText';
import {
  ApplicationPdfTemplate,
  PDF_WIDTH,
  type PdfTranslated,
} from '@/components/pdf/ApplicationPdfTemplate';

// Tải ảnh qua proxy của Next (tránh CORS của R2) rồi đổi thành data URL
const toDataUrl = async (url?: string | null): Promise<string | undefined> => {
  if (!url) return undefined;
  try {
    const isExternal = /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
    const src = isExternal ? `/api/image-proxy?url=${encodeURIComponent(url)}` : url;
    const res = await fetch(src, { cache: 'reload' });
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
};

const buildTranslated = async (application: AdoptionApplication): Promise<PdfTranslated> => {
  // Bước 1: dịch tĩnh theo rule
  const raw: PdfTranslated = {
    adoptFor: translateAdoptFor(application.adoptFor),
    housing: translateHousing(application.housing),
    children: translateChildren(application.children),
    cage: translateCage(application.cage),
    petExperience: translatePetExperience(application.petExperience),
    prevPetHistory: translatePetHistory(application.prevPetHistory),
    employmentStatus: translateEmploymentStatus(application.employmentStatus),
    adoptionReason: translateAdoptionReason(application.adoptionReason),
    petBreed: localizedText(application.pet?.breed) || 'Giống lai',
  };

  // Bước 2: "vét" nốt phần còn tiếng Anh qua API dịch; lỗi thì giữ bước 1
  try {
    const translated = await translateManyToVi({ ...raw });
    return { ...raw, ...(translated as Partial<PdfTranslated>) };
  } catch (err) {
    console.warn('Dịch tự động thất bại, dùng bản dịch tĩnh:', err);
    return raw;
  }
};

const safeFileName = (application: AdoptionApplication) => {
  const first = (application.fullName || application.user?.name || 'Nguoi_nhan_nuoi')
    .trim()
    .split(/\s+/)[0];
  return `${first} - Don_nhan_nuoi.pdf`;
};

export const downloadApplicationPdf = async (application: AdoptionApplication, fileName?: string) => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  const [tr, petImage, avatarImage] = await Promise.all([
    buildTranslated(application),
    toDataUrl(application.pet?.avatarUrl || application.pet?.images?.[0]?.url),
    toDataUrl(application.user?.avatarUrl),
  ]);

  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_WIDTH}px;pointer-events:none;z-index:-1;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    flushSync(() =>
      root.render(
        <ApplicationPdfTemplate
          application={application}
          tr={tr}
          petImage={petImage}
          avatarImage={avatarImage}
        />,
      ),
    );

    await (document as any).fonts?.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const el = host.firstElementChild as HTMLElement | null;
    if (!el) throw new Error('Không render được template PDF');

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FDFDFD',
      width: el.offsetWidth,
      windowWidth: PDF_WIDTH,
    });

    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pdf = new jsPDF({ orientation: w > h ? 'l' : 'p', unit: 'px', format: [w, h], hotfixes: ['px_scaling'] });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
    pdf.save(fileName || safeFileName(application));
  } finally {
    root.unmount();
    host.remove();
  }
};