import { AdoptionApplication } from '@/types/application';

const formatAppDate = (iso?: string) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function downloadApplicationPdf(application: AdoptionApplication) {
  const applicantName = application.fullName || application.user?.name || 'Maria Garcia';
  const submitDate = formatAppDate(application.createdAt);
  const updateDate = formatAppDate(application.updatedAt || application.createdAt);

  const phone = application.phone || '0912345678';
  const email = application.user?.email || application.zalo || 'mariagarcia@email.com';
  const adoptFor = application.adoptFor === 'Someone else' ? 'Someone else' : 'Myself';
  const location = application.location || 'Cầu Giấy, Hà Nội';
  const housing = application.housing || 'Apartment (allows pet ownership)';
  const children = application.children || 'Yes, 3 children';
  const cage = application.cage || 'No';
  const petExperience = application.petExperience || 'Yes, 3 cats & 2 dogs';
  const prevPetHistory = application.prevPetHistory || 'My previous dogs passed away due to old age after 12 years together.';
  const employmentStatus = application.employmentStatus || 'Currently employed';
  const adoptionReason = application.adoptionReason || 'Because I want to give them a forever home';

  const fileName = `${applicantName.split(' ')[0]} - Application.pdf`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
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
      padding: 10px;
    }
    .modal-container {
      width: 100%;
      max-width: 680px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 20px 24px 14px 24px;
      border-bottom: 1px solid #f3f4f6;
      background: #ffffff;
    }
    .header-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      line-height: 1;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .body {
      padding: 20px 24px;
      background: #ffffff;
    }
    .section-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .section-header {
      padding: 10px 16px;
      border-bottom: 1px solid #f3f4f6;
      background: #ffffff;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
    }
    .section-body {
      padding: 12px 16px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 16px;
      row-gap: 12px;
    }
    .field {
      display: flex;
      flex-direction: column;
    }
    .field-label {
      font-size: 11px;
      color: #9ca3af;
      margin-bottom: 2px;
      line-height: 1;
      font-weight: 400;
    }
    .field-value {
      font-size: 13px;
      color: #111827;
      font-weight: 500;
      line-height: 1.35;
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
      column-gap: 16px;
      row-gap: 10px;
    }
    .commit-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .commit-text {
      font-size: 12px;
      color: #111827;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="modal-container">
    <!-- Header -->
    <div class="header">
      <div class="header-title-row">
        <h2 class="title">Application Details</h2>
      </div>
      <div class="meta-row">
        <div class="meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Submitted on ${submitDate}
        </div>
        <div class="meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Updated ${updateDate}
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="body">
      <!-- Section A -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">A - Contact Information</h3>
        </div>
        <div class="section-body">
          <div class="grid-2">
            <div class="field">
              <span class="field-label">Full Name</span>
              <span class="field-value">${applicantName}</span>
            </div>
            <div class="field">
              <span class="field-label">Phone Number</span>
              <span class="field-value">${phone}</span>
            </div>
            <div class="field">
              <span class="field-label">Email Address</span>
              <span class="field-value">${email}</span>
            </div>
            <div class="field">
              <span class="field-label">Adopting For</span>
              <span class="field-value">${adoptFor}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section B -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">B - Living Conditions</h3>
        </div>
        <div class="section-body">
          <div class="grid-2">
            <div class="field">
              <span class="field-label">Location</span>
              <span class="field-value">${location}</span>
            </div>
            <div class="field">
              <span class="field-label">Housing Type</span>
              <span class="field-value">${housing}</span>
            </div>
            <div class="field">
              <span class="field-label">Children</span>
              <span class="field-value">${children}</span>
            </div>
            <div class="field">
              <span class="field-label">Cage Plan For</span>
              <span class="field-value">${cage}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section C -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">C - Pet Experience</h3>
        </div>
        <div class="section-body">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div class="field">
              <span class="field-label">Previous Pet</span>
              <span class="field-value">${petExperience}</span>
            </div>
            <div class="field">
              <span class="field-label">Housing Type</span>
              <span class="field-value">${prevPetHistory}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section D -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">D - Employment & Personal</h3>
        </div>
        <div class="section-body">
          <div class="field">
            <span class="field-label">Employment</span>
            <span class="field-value">${employmentStatus}</span>
          </div>
        </div>
      </div>

      <!-- Section E -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">E - Adoption Commitment</h3>
        </div>
        <div class="section-body">
          <div class="field" style="margin-bottom: 12px;">
            <span class="field-label">Reason for Adoption</span>
            <span class="field-value">${adoptionReason}</span>
          </div>

          <div class="divider"></div>

          <div class="commit-grid">
            <div class="commit-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span class="commit-text">Yearly vaccinations</span>
            </div>
            <div class="commit-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span class="commit-text">Provide status updates</span>
            </div>
            <div class="commit-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span class="commit-text">Hospital treatment when needed</span>
            </div>
            <div class="commit-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span class="commit-text">Allow home visits</span>
            </div>
            <div class="commit-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span class="commit-text">Cover pre-adoption expenses</span>
            </div>
            <div class="commit-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span class="commit-text">Willing to provide needed personal info</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

  // Tạo iframe ẩn để in/xuất chuẩn A4 vector sắc nét từng pixel
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