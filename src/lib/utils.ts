import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface UserInfo {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  call_center_id: string | null;
  manager_id: string | null;
  avatar_url: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export function getUserInfo(): UserInfo | null {
  if (typeof window === "undefined") return null;
  
  const userInfoStr = localStorage.getItem("userInfo");
  if (!userInfoStr) return null;
  
  try {
    return JSON.parse(userInfoStr) as UserInfo;
  } catch (error) {
    console.error("Error parsing userInfo from localStorage:", error);
    return null;
  }
}

export function setUserInfo(userInfo: UserInfo): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
}

export function clearUserInfo(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("userInfo");
  localStorage.removeItem("userRole"); // Also clear the old userRole if it exists
}

export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

