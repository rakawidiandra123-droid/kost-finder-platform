import type { ExternalBlob } from "@caffeineai/object-storage";

export type RoomId = bigint;
export type BookingId = bigint;
export type Timestamp = bigint;

export type RoomType = "putra" | "putri" | "campur";
export type RoomStatus = "available" | "occupied";
export type BookingStatus = "pending" | "approved" | "rejected";

export interface Room {
  id: RoomId;
  name: string;
  roomType: RoomType;
  monthlyPrice: bigint;
  description: string;
  facilities: string[];
  status: RoomStatus;
  photos: ExternalBlob[];
}

export interface RoomFilter {
  keyword?: string;
  roomType?: RoomType;
  minPrice?: bigint;
  maxPrice?: bigint;
}

export interface RoomInput {
  name: string;
  roomType: RoomType;
  monthlyPrice: bigint;
  description: string;
  facilities: string[];
  status: RoomStatus;
  photos: ExternalBlob[];
}

export interface BookingRequest {
  id: BookingId;
  applicantName: string;
  phone: string;
  email: string;
  moveInDate: string;
  message: string;
  roomId: RoomId;
  status: BookingStatus;
  createdAt: Timestamp;
}

export interface BookingInput {
  applicantName: string;
  phone: string;
  email: string;
  moveInDate: string;
  message: string;
  roomId: RoomId;
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  putra: "Putra",
  putri: "Putri",
  campur: "Campur",
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: "Tersedia",
  occupied: "Terisi",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};
