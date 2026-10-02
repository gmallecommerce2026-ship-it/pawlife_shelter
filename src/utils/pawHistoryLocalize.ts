type MaybeBilingual = string | { vi?: string; en?: string } | null | undefined;

const toStr = (v: MaybeBilingual): string =>
  !v ? '' : typeof v === 'string' ? v : v.vi || v.en || '';

// Tiêu đề: khớp chính xác (không phân biệt hoa thường)
const TITLE_MAP: Record<string, string> = {
  'birthday': 'Sinh nhật',
  'date of birth': 'Sinh nhật',
  'joined pawlife': 'Tham gia PawLife',
  "under shelter's care": 'Đang được trạm cứu hộ chăm sóc',
  'under shelter care': 'Đang được trạm cứu hộ chăm sóc',
  'annual checkup': 'Khám tổng quát',
  'dental care': 'Khám răng miệng',
  'qr code registered': 'Đã đăng ký mã QR',
  'curren owner': 'Chủ hiện tại',
  'current owner': 'Chủ hiện tại',
  'previous owner': 'Chủ trước đây',
  'ownership transfer': 'Chuyển quyền sở hữu',
};

// Mô tả: khớp theo mẫu câu
const DESC_RULES: [RegExp, string][] = [
  [/^(.+?)'s birthday\.?$/i, 'Sinh nhật của $1.'],
  [/^The profile for (.+?) was created\.?$/i, 'Hồ sơ của $1 đã được tạo.'],
  [/^Currently under the care of (.+?)\.?$/i, 'Hiện đang được chăm sóc bởi $1.'],
  [/^vaccination:\s*(.+)$/i, 'Tiêm chủng: $1'],
  [/^dental care:\s*(.+)$/i, 'Khám răng miệng: $1'],
  [/^(?:annual )?check-?up:\s*(.+)$/i, 'Khám tổng quát: $1'],
  [/^Ownership transferred to (.+?)\.?$/i, 'Quyền sở hữu được chuyển cho $1.'],
  [/^Health examination completed\.?$/i, 'Đã hoàn tất khám sức khỏe.'],
  [/^PawLife QR tag activated and linked to (.+?)\.?$/i, 'Thẻ QR PawLife đã được kích hoạt và liên kết với $1.'],
];

// Dự phòng theo type khi title rỗng hoặc không khớp
const TYPE_TITLE_FALLBACK: Record<string, string> = {
  BIRTH: 'Sinh nhật',
  CREATED: 'Tham gia PawLife',
  QR_LINKED: 'Đã đăng ký mã QR',
  TRANSFER: 'Chuyển quyền sở hữu',
  ANNUAL_CHECKUP: 'Khám tổng quát',
  DENTAL_CARE: 'Khám răng miệng',
  CURRENT_OWNER: 'Chủ hiện tại',
  PREVIOUS_OWNER: 'Chủ trước đây',
  UNDER_SHELTER_CARE: 'Đang được trạm cứu hộ chăm sóc',
};

export const localizeHistoryTitle = (item: { type?: string; title?: MaybeBilingual }): string => {
  const raw = toStr(item.title).trim();
  if (raw) {
    const mapped = TITLE_MAP[raw.toLowerCase()];
    if (mapped) return mapped;
    // Tên vaccine (VD: "DHPP (5/7in1)") hoặc tiếng Việt sẵn -> giữ nguyên
    if (item.type === 'VACCINE' || !/^[\x00-\x7F]+$/.test(raw) === false && item.type === 'VACCINE') return raw;
    return raw;
  }
  return (item.type && TYPE_TITLE_FALLBACK[item.type]) || item.type || '';
};

export const localizeHistoryDescription = (desc?: MaybeBilingual): string => {
  const raw = toStr(desc).trim();
  if (!raw) return '';
  for (const [re, replacement] of DESC_RULES) {
    if (re.test(raw)) return raw.replace(re, replacement);
  }
  return raw;
};