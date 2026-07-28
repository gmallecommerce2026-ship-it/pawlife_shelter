export type PetSpecies = 'DOG' | 'CAT';
export type PetGender = 'MALE' | 'FEMALE';
export type PetStatus = 'AVAILABLE' | 'PENDING' | 'ADOPTED';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: number; // tính theo tháng tuổi
  gender: PetGender;
  status: PetStatus;
  images: string[]; // danh sách URL ảnh, ảnh đầu tiên là ảnh đại diện
  description: string;
  healthStatus: string[]; // vd: ["Đã tiêm phòng", "Đã triệt sản"]
  weightKg?: number;
  isSterilized?: boolean;
  isVaccinated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Payload gửi lên khi tạo/sửa pet (chưa có id, ảnh xử lý riêng qua FormData)
export interface PetFormValues {
  name: string;
  species: PetSpecies;
  breed: string;
  age: number;
  gender: PetGender;
  status: PetStatus;
  description: string;
  healthStatus: string[];
  weightKg?: number;
  isSterilized: boolean;
  isVaccinated: boolean;
}

export const emptyPetFormValues: PetFormValues = {
  name: '',
  species: 'DOG',
  breed: '',
  age: 0,
  gender: 'MALE',
  status: 'AVAILABLE',
  description: '',
  healthStatus: [],
  weightKg: undefined,
  isSterilized: false,
  isVaccinated: false,
};

export type PetViewMode = 'grid' | 'list';

export interface PetFilter {
  search: string;
  species: PetSpecies | 'ALL';
  status: PetStatus | 'ALL';
  page: number;
  pageSize: number;
}

export const defaultPetFilter: PetFilter = {
  search: '',
  species: 'ALL',
  status: 'ALL',
  page: 1,
  pageSize: 12,
};

export interface PetListResponse {
  items: Pet[];
  total: number;
  page: number;
  pageSize: number;
}

export const PET_STATUS_LABEL: Record<PetStatus, string> = {
  AVAILABLE: 'Đang tìm chủ',
  PENDING: 'Đang xử lý',
  ADOPTED: 'Đã có chủ',
};

export const PET_SPECIES_LABEL: Record<PetSpecies, string> = {
  DOG: 'Chó',
  CAT: 'Mèo',
};
