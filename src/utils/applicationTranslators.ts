const matchKeyword = (
  val: string,
  rules: { keywords: string[]; result: string }[],
  fallback: string,
) => {
  const clean = val.trim().toLowerCase();
  for (const r of rules) if (r.keywords.some((k) => clean.includes(k))) return r.result;
  return fallback;
};

export const translateHousing = (v?: string | null) =>
  !v ? 'Chưa cập nhật' : matchKeyword(v, [
    { keywords: ['garden', 'yard'], result: 'Nhà riêng có sân vườn' },
    { keywords: ['townhouse'], result: 'Nhà phố' },
    { keywords: ['villa'], result: 'Biệt thự' },
    { keywords: ['dorm'], result: 'Ký túc xá' },
    { keywords: ['rent'], result: 'Nhà thuê' },
    { keywords: ['apartment', 'chung cư'], result: 'Chung cư' },
    { keywords: ['house', 'nhà riêng'], result: 'Nhà riêng / Nhà đất' },
  ], v);

export const translatePetExperience = (v?: string | null) =>
  !v ? 'Chưa cập nhật' : matchKeyword(v, [
    { keywords: ['first time'], result: 'Lần đầu nuôi thú cưng' },
    { keywords: ['currently have', 'still living', 'hiện đang có'], result: 'Hiện đang có thú cưng ở nhà' },
    { keywords: ['no experience', 'never', 'chưa có'], result: 'Chưa có kinh nghiệm' },
    { keywords: ['used to have', 'had pets before', 'yes', 'từng nuôi'], result: 'Đã từng nuôi trước đây' },
  ], v);

export const translateEmploymentStatus = (v?: string | null) =>
  !v ? 'Chưa cập nhật' : matchKeyword(v, [
    { keywords: ['full-time', 'full time'], result: 'Toàn thời gian' },
    { keywords: ['part-time', 'part time'], result: 'Bán thời gian' },
    { keywords: ['self-employed', 'freelance'], result: 'Làm việc tự do' },
    { keywords: ['student'], result: 'Học sinh / Sinh viên' },
    { keywords: ['unemployed', 'looking for'], result: 'Đang tìm việc' },
    { keywords: ['retired'], result: 'Đã nghỉ hưu' },
    { keywords: ['employed', 'đang đi làm'], result: 'Đang đi làm' },
  ], v);

export const translateYesNo = (v?: string | null) => {
  if (!v) return 'Chưa cập nhật';
  const c = v.trim().toLowerCase();
  if (['có', 'yes', 'true'].includes(c)) return 'Có';
  if (['không', 'no', 'false'].includes(c)) return 'Không';
  return v;
};

export const translatePetHistory = (v?: string | null) => {
  if (!v) return 'Đã từng chăm sóc chu đáo trước đây.';
  const map: Record<string, string> = {
    'carefully cared for': 'Đã từng chăm sóc chu đáo trước đây.',
    'good care': 'Chăm sóc tốt, đầy đủ tiêm phòng.',
    'fully vaccinated': 'Được tiêm phòng và chăm sóc định kỳ đầy đủ.',
  };
  return map[v.trim().toLowerCase()] || v;
};

export const translateAdoptionReason = (v?: string | null) => {
  if (!v) return 'Mong muốn mang lại cho bé một mái ấm trọn đời';
  const map: Record<string, string> = {
    'because i want to give them a forever home': 'Mong muốn mang lại cho bé một mái ấm trọn đời',
    'love animals': 'Yêu thương động vật và muốn đồng hành cùng bé',
    'looking for a companion': 'Tìm kiếm một người bạn thú cưng đồng hành',
  };
  return map[v.trim().toLowerCase()] || v;
};

export const isCommitmentAgreed = (val: unknown): boolean => {
  if (val === true || val === 1) return true;
  if (typeof val === 'string')
    return ['có', 'co', 'yes', 'true', 'đồng ý', 'dong y', '1'].includes(val.trim().toLowerCase());
  return false;
};

export const checkCommitmentValue = (commitments: any, key: string, label: string): boolean => {
  if (!commitments) return false;
  if (Array.isArray(commitments)) return commitments.includes(key) || commitments.includes(label);
  if (typeof commitments === 'object') return isCommitmentAgreed(commitments[key] ?? commitments[label]);
  return false;
};