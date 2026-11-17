// src/utils/petAge.ts
// Hàm tính tuổi DUY NHẤT cho web. Phải giữ đúng logic với petAgeLabel() bên backend (pets/pet-fields.util.ts).
// Tính theo UTC để không lệch ngày khi múi giờ trình duyệt khác server.

export function formatPetAge(birthDate?: string | Date | null): string {
  if (!birthDate) return 'Chưa rõ tuổi';

  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 'Chưa rõ tuổi';

  const now = new Date();
  let months =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birth.getUTCMonth());

  // Trừ thêm 1 tháng nếu chưa tới ngày trong tháng
  if (now.getUTCDate() < birth.getUTCDate()) {
    months -= 1;
  }

  if (months < 1) return 'Dưới 1 tháng tuổi';

  // Pet chỉ biết năm sinh (1/1): chỉ hiện số tuổi tròn, không hiện tháng
  const ageOnly = birth.getUTCMonth() === 0 && birth.getUTCDate() === 1;
  if (ageOnly && months >= 12) return `${Math.floor(months / 12)} tuổi`;

  if (months < 12) {
    return `${months} tháng tuổi`;
  }

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  return remMonths > 0 ? `${years} tuổi ${remMonths} tháng` : `${years} tuổi`;
}

// Giữ tên cũ để các màn đang import getPetAgeLabel không phải sửa
export const getPetAgeLabel = formatPetAge;
