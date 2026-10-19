import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { AdoptionApplication } from '@/types/application';
import { ApplicationPdfTemplate, PDF_WIDTH } from '@/components/pdf/ApplicationPdfTemplate';

// Chuyển ảnh remote -> data URL để html2canvas không bị tainted canvas
const toDataUrl = async (url?: string | null): Promise<string | undefined> => {
  if (!url) return undefined;
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined; // nếu CORS chặn thì bỏ ảnh, PDF vẫn xuất được
  }
};

export const downloadApplicationPdf = async (application: AdoptionApplication, fileName?: string) => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  const a = application as any;
  const [petImage, avatarImage] = await Promise.all([
    toDataUrl(a.pet?.avatarUrl || a.pet?.images?.[0]?.url),
    toDataUrl(a.user?.avatarUrl),
  ]);

  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_WIDTH}px;pointer-events:none;z-index:-1;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    flushSync(() =>
      root.render(
        <ApplicationPdfTemplate application={application} petImage={petImage} avatarImage={avatarImage} />,
      ),
    );

    await (document as any).fonts?.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const el = host.firstElementChild as HTMLElement;
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FDFDFD',
      width: el.offsetWidth,
      windowWidth: PDF_WIDTH,
    });

    // 1 trang dài đúng bằng nội dung, giống hệt ảnh mẫu
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pdf = new jsPDF({ orientation: w > h ? 'l' : 'p', unit: 'px', format: [w, h], hotfixes: ['px_scaling'] });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
    pdf.save(fileName || `don-nhan-nuoi-${a.pet?.name || a.id}.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
};