/**
 * Các route ai cũng truy cập được, không cần login
 */
export const publicRoutes = ["/login", "/register", "/about"];
export const authRoutes = ["/login", "/register"];

export const shelterRoutesPrefix = "/shelter"; // Đổi từ admin/staff sang shelter
export const apiAuthPrefix = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/shelter/pets";
