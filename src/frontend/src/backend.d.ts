import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export type BookingId = bigint;
export interface BookingInput {
    applicantName: string;
    email: string;
    message: string;
    phone: string;
    roomId: RoomId;
    moveInDate: string;
}
export interface BookingRequest {
    id: BookingId;
    status: BookingStatus;
    applicantName: string;
    createdAt: Timestamp;
    email: string;
    message: string;
    phone: string;
    roomId: RoomId;
    moveInDate: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Room {
    id: RoomId;
    status: RoomStatus;
    name: string;
    description: string;
    monthlyPrice: bigint;
    facilities: Array<string>;
    roomType: RoomType;
    photos: Array<ExternalBlob>;
}
export interface RoomFilter {
    maxPrice?: bigint;
    keyword?: string;
    minPrice?: bigint;
    roomType?: RoomType;
}
export type RoomId = bigint;
export interface RoomInput {
    status: RoomStatus;
    name: string;
    description: string;
    monthlyPrice: bigint;
    facilities: Array<string>;
    roomType: RoomType;
    photos: Array<ExternalBlob>;
}
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum BookingStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum RoomStatus {
    occupied = "occupied",
    available = "available"
}
export enum RoomType {
    campur = "campur",
    putra = "putra",
    putri = "putri"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBooking(input: BookingInput): Promise<BookingRequest>;
    createRoom(input: RoomInput): Promise<Room>;
    deleteRoom(id: RoomId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getRoom(id: RoomId): Promise<Room | null>;
    isCallerAdmin(): Promise<boolean>;
    listBookings(status: BookingStatus | null): Promise<Array<BookingRequest>>;
    listRooms(filter: RoomFilter): Promise<Array<Room>>;
    schema(): Promise<string>;
    updateBookingStatus(id: BookingId, status: BookingStatus): Promise<BookingRequest | null>;
    updateRoom(id: RoomId, input: RoomInput): Promise<Room | null>;
}
