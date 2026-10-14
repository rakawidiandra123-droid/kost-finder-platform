import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";
import { registerCaller } from "./test-utils";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

const admin = createIdentity("kostku-admin");
const tenant = createIdentity("kostku-tenant");

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(
    actor.listRooms({ maxPrice: [], keyword: [], minPrice: [], roomType: [] }),
  ).resolves.toEqual([]);
});

it("round-trips a room through the real canister", async () => {
  const adminActor = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    admin,
  );

  const created = await adminActor.createRoom({
    name: "Kamar A1",
    roomType: { putra: null },
    monthlyPrice: 1_500_000n,
    description: "Kamar nyaman",
    facilities: ["AC", "WiFi"],
    status: { available: null },
    photos: [],
  });
  expect(created.name).toBe("Kamar A1");
  expect(created.monthlyPrice).toBe(1_500_000n);

  const fetched = await actor.getRoom(created.id);
  expect(fetched).not.toBeNull();
  expect(fetched?.[0]?.name).toBe("Kamar A1");

  const listed = await actor.listRooms({
    maxPrice: [],
    keyword: [],
    minPrice: [],
    roomType: [],
  });
  expect(listed).toHaveLength(1);
  expect(listed[0].id).toBe(created.id);
});

it("filters rooms by keyword, type, and price range", async () => {
  const adminActor = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    admin,
  );
  await adminActor.createRoom({
    name: "Kamar B2",
    roomType: { putri: null },
    monthlyPrice: 900_000n,
    description: "",
    facilities: [],
    status: { available: null },
    photos: [],
  });

  const byKeyword = await actor.listRooms({
    maxPrice: [],
    keyword: ["B2"],
    minPrice: [],
    roomType: [],
  });
  expect(byKeyword.map((r) => r.name)).toEqual(["Kamar B2"]);

  const byType = await actor.listRooms({
    maxPrice: [],
    keyword: [],
    minPrice: [],
    roomType: [{ putri: null }],
  });
  expect(byType.map((r) => r.name)).toEqual(["Kamar B2"]);

  const byPrice = await actor.listRooms({
    maxPrice: [1_000_000n],
    keyword: [],
    minPrice: [],
    roomType: [],
  });
  expect(byPrice.map((r) => r.name)).toEqual(["Kamar B2"]);
});

it("round-trips a booking and starts it as pending", async () => {
  const adminActor = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    admin,
  );
  const room = await adminActor.createRoom({
    name: "Kamar C3",
    roomType: { campur: null },
    monthlyPrice: 1_200_000n,
    description: "",
    facilities: [],
    status: { available: null },
    photos: [],
  });

  const tenantActor = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    tenant,
  );
  const booking = await tenantActor.createBooking({
    applicantName: "Budi Santoso",
    phone: "081234567890",
    email: "budi@example.com",
    moveInDate: "2026-11-01",
    message: "Tolong sediakan lantai dua",
    roomId: room.id,
  });
  expect(booking.status).toEqual({ pending: null });
  expect(booking.applicantName).toBe("Budi Santoso");

  const listed = await adminActor.listBookings([]);
  expect(listed).toHaveLength(1);
  expect(listed[0].id).toBe(booking.id);
});

it("lets an admin approve a booking and persists the new status", async () => {
  const adminActor = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    admin,
  );
  const room = await adminActor.createRoom({
    name: "Kamar D4",
    roomType: { putra: null },
    monthlyPrice: 1_000_000n,
    description: "",
    facilities: [],
    status: { available: null },
    photos: [],
  });
  const tenantActor = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    tenant,
  );
  const booking = await tenantActor.createBooking({
    applicantName: "Siti Aminah",
    phone: "081298765432",
    email: "siti@example.com",
    moveInDate: "2026-12-01",
    message: "",
    roomId: room.id,
  });

  const updated = await adminActor.updateBookingStatus(booking.id, {
    approved: null,
  });
  expect(updated?.[0]?.status).toEqual({ approved: null });

  const approved = await adminActor.listBookings([{ approved: null }]);
  expect(approved.map((b) => b.id)).toContain(booking.id);
});

it("rejects an anonymous caller creating a booking", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(
    guest.createBooking({
      applicantName: "Anon",
      phone: "081200000000",
      email: "anon@example.com",
      moveInDate: "2026-11-01",
      message: "",
      roomId: 0n,
    }),
  ).rejects.toThrow();
});

it("rejects a non-admin caller mutating rooms", async () => {
  const tenantActor = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    tenant,
  );
  await expect(
    tenantActor.createRoom({
      name: "Kamar Ilegal",
      roomType: { putra: null },
      monthlyPrice: 1n,
      description: "",
      facilities: [],
      status: { available: null },
      photos: [],
    }),
  ).rejects.toThrow();
});
