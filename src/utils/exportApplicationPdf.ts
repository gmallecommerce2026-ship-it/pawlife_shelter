// src/utils/exportApplicationPdf.ts

import { AdoptionApplication, localizedText, getPetAgeLabel, COMMITMENTS_CONFIG } from '@/types/application';
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

const formatAppDate = (iso?: string) => {
  if (!iso) return 'Chưa cập nhật';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Chưa cập nhật';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const isCommitmentAgreed = (val: unknown): boolean => {
  if (val === true || val === 1) return true;
  if (typeof val === 'string') {
    const clean = val.trim().toLowerCase();
    return ['có', 'co', 'yes', 'true', 'đồng ý', 'dong y', '1'].includes(clean);
  }
  return false;
};

export async function downloadApplicationPdf(application: AdoptionApplication) {
  const applicantName = application.fullName || application.user?.name || 'Người nhận nuôi';
  const submitDate = formatAppDate(application.createdAt);
  const updateDate = formatAppDate(application.updatedAt || application.createdAt);
  const phone = application.phone || 'Chưa cập nhật';
  const email = application.user?.email || application.zalo || 'Chưa cập nhật';

  // Các trường không cần dịch: tên người, tên thú cưng, địa chỉ, ngày tháng...
  const location = application.location || 'Chưa cập nhật';
  const petName = application.pet?.name || 'Thú cưng';
  const petAge = getPetAgeLabel(application.pet?.dob);

  // Bước 1: dịch tĩnh theo rule (map enum có sẵn trong translateApplication.ts)
  const adoptForRaw = translateAdoptFor(application.adoptFor);
  const housingRaw = translateHousing(application.housing);
  const childrenRaw = translateChildren(application.children);
  const cageRaw = translateCage(application.cage);
  const petExperienceRaw = translatePetExperience(application.petExperience);
  const prevPetHistoryRaw = translatePetHistory(application.prevPetHistory);
  const employmentStatusRaw = translateEmploymentStatus(application.employmentStatus);
  const adoptionReasonRaw = translateAdoptionReason(application.adoptionReason);
  const petBreedRaw = localizedText(application.pet?.breed) || 'Giống lai';

  // Bước 2: fallback qua API dịch để "vét" nốt phần còn sót tiếng Anh
  // (enum mới chưa được map, text tự do nhập từ DB, breed tiếng Anh, lý do nhận nuôi
  // người dùng gõ tiếng Anh, v.v). Nếu text đã có dấu tiếng Việt hoặc API lỗi thì
  // giữ nguyên giá trị ở bước 1, không làm gián đoạn việc xuất PDF.
  const {
    adoptFor,
    housing,
    children,
    cage,
    petExperience,
    prevPetHistory,
    employmentStatus,
    adoptionReason,
    petBreed,
  } = await translateManyToVi({
    adoptFor: adoptForRaw,
    housing: housingRaw,
    children: childrenRaw,
    cage: cageRaw,
    petExperience: petExperienceRaw,
    prevPetHistory: prevPetHistoryRaw,
    employmentStatus: employmentStatusRaw,
    adoptionReason: adoptionReasonRaw,
    petBreed: petBreedRaw,
  });

  const fileName = `${applicantName.split(' ')[0]} - Don_nhan_nuoi.pdf`;

  const checkSvg = `
    <svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `;

  const crossSvg = `
    <svg class="cross-svg" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  const commitmentsHtml = COMMITMENTS_CONFIG.map((item) => {
    const rawVal = application.commitments?.[item.key] ?? (application.commitments as any)?.[item.label];
    const isAgreed = isCommitmentAgreed(rawVal);

    return `
      <div class="commit-item">
        ${isAgreed ? checkSvg : crossSvg}
        <span class="${isAgreed ? 'commit-text-agreed' : 'commit-text-declined'}">
          ${item.label}
        </span>
      </div>
    `;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${fileName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      background-color: #ffffff;
      color: #111827;
      display: flex;
      justify-content: center;
      padding: 0;
    }
    .container {
      width: 100%;
      max-width: 680px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      padding: 18px 24px 14px 24px;
      border-bottom: 1px solid #f3f4f6;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .title {
      font-size: 19px;
      font-weight: 800;
      color: #111827;
    }
    .pet-badge {
      display: inline-flex;
      padding: 4px 12px;
      background: #FFF8F3;
      border: 1px solid #FCE8D5;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      color: #E89B5A;
    }
    .meta-row {
      display: flex;
      gap: 16px;
      font-size: 11.5px;
      color: #6b7280;
      font-weight: 500;
    }
    .body {
      padding: 18px 24px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .card-header {
      padding: 9px 16px;
      border-bottom: 1px solid #f3f4f6;
      background: #fafafa;
      font-size: 12.5px;
      font-weight: 700;
      color: #111827;
    }
    .card-body {
      padding: 12px 16px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 20px;
      row-gap: 10px;
    }
    .field-label {
      font-size: 11px;
      color: #9ca3af;
      margin-bottom: 2px;
      font-weight: 500;
    }
    .field-value {
      font-size: 13px;
      color: #111827;
      font-weight: 600;
    }
    .divider {
      width: 100%;
      height: 1px;
      background-color: #f3f4f6;
      margin: 12px 0;
    }
    .commit-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 24px;
      row-gap: 12px;
    }
    .commit-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .check-svg {
      width: 15px;
      height: 15px;
      color: #10B981;
      flex-shrink: 0;
    }
    .cross-svg {
      width: 15px;
      height: 15px;
      color: #F43F5E;
      flex-shrink: 0;
    }
    .commit-text-agreed {
      font-size: 12.5px;
      color: #111827;
      font-weight: 500;
    }
    .commit-text-declined {
      font-size: 12.5px;
      color: #6B7280;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <h2 class="title">Chi tiết đơn đăng ký nhận nuôi</h2>
        <div class="pet-badge">Bé: ${petName} (${petAge} • ${petBreed})</div>
      </div>
      <div class="meta-row">
        <span>📅 Ngày nộp: <strong>${submitDate}</strong></span>
        <span>🔄 Cập nhật: <strong>${updateDate}</strong></span>
      </div>
    </div>

    <div class="body">
      <!-- Section A -->
      <div class="card">
        <div class="card-header">A - Thông tin liên hệ</div>
        <div class="card-body">
          <div class="grid-2">
            <div><div class="field-label">Họ và tên</div><div class="field-value">${applicantName}</div></div>
            <div><div class="field-label">Số điện thoại</div><div class="field-value">${phone}</div></div>
            <div><div class="field-label">Email / Zalo</div><div class="field-value">${email}</div></div>
            <div><div class="field-label">Đối tượng nhận nuôi</div><div class="field-value">${adoptFor}</div></div>
          </div>
        </div>
      </div>

      <!-- Section B -->
      <div class="card">
        <div class="card-header">B - Điều kiện sinh sống</div>
        <div class="card-body">
          <div class="grid-2">
            <div><div class="field-label">Khu vực sinh sống</div><div class="field-value">${location}</div></div>
            <div><div class="field-label">Loại nhà ở</div><div class="field-value">${housing}</div></div>
            <div><div class="field-label">Trẻ em trong nhà</div><div class="field-value">${children}</div></div>
            <div><div class="field-label">Kế hoạch chuồng / xích</div><div class="field-value">${cage}</div></div>
          </div>
        </div>
      </div>

      <!-- Section C -->
      <div class="card">
        <div class="card-header">C - Kinh nghiệm & Cá nhân</div>
        <div class="card-body">
          <div class="grid-2">
            <div><div class="field-label">Đã từng nuôi thú cưng</div><div class="field-value">${petExperience}</div></div>
            <div><div class="field-label">Tình trạng việc làm</div><div class="field-value">${employmentStatus}</div></div>
            <div style="grid-column: span 2;"><div class="field-label">Lịch sử chăm sóc trước đây</div><div class="field-value">${prevPetHistory}</div></div>
          </div>
        </div>
      </div>

      <!-- Section E: Cam kết nhận nuôi -->
      <div class="card">
        <div class="card-header">E - Cam kết nhận nuôi</div>
        <div class="card-body">
          <div style="margin-bottom: 8px;">
            <div class="field-label">Lý do nhận nuôi</div>
            <div class="field-value" style="font-size: 13.5px; margin-top: 2px;">${adoptionReason}</div>
          </div>
          <div class="divider"></div>
          <div class="commit-grid">
            ${commitmentsHtml}
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 400);
  }
}