import { RoomCard } from "@/components/RoomCard";
import {
  CardGridSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRooms } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { ROOM_TYPE_LABELS, type RoomFilter, type RoomType } from "@/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ALL_TYPES = "semua" as const;

const FACILITY_HIGHLIGHTS = [
  {
    icon: Wifi,
    title: "WiFi cepat",
    description: "Koneksi internet stabil untuk belajar dan bekerja.",
  },
  {
    icon: Sparkles,
    title: "Kamar bersih",
    description: "Kebersihan terjaga dengan perawatan rutin.",
  },
  {
    icon: ShieldCheck,
    title: "Aman & nyaman",
    description: "Lingkungan tenang dengan akses yang terkendali.",
  },
] as const;

const ABOUT_STATS = [
  { label: "Kamar", value: "Pilihan" },
  { label: "Harga", value: "Transparan" },
  { label: "Pemesanan", value: "Langsung" },
] as const;

/**
 * Filter state lives in the URL so it survives a reload and can be shared.
 * The `/` route does not declare `validateSearch`, so we read the raw search
 * record and narrow each field defensively.
 */
interface CatalogSearch {
  q?: string;
  tipe?: RoomType;
  min?: number;
  max?: number;
}

function parseSearch(raw: Record<string, unknown>): CatalogSearch {
  const result: CatalogSearch = {};
  if (typeof raw.q === "string" && raw.q.trim()) result.q = raw.q;
  if (raw.tipe === "putra" || raw.tipe === "putri" || raw.tipe === "campur") {
    result.tipe = raw.tipe;
  }
  if (typeof raw.min === "number" && Number.isFinite(raw.min)) {
    result.min = raw.min;
  }
  if (typeof raw.max === "number" && Number.isFinite(raw.max)) {
    result.max = raw.max;
  }
  return result;
}

const PRICE_PRESETS = [
  { label: "Semua harga", min: undefined, max: undefined },
  { label: "< Rp 1.000.000", min: undefined, max: 1_000_000 },
  { label: "Rp 1.000.000 – Rp 1.500.000", min: 1_000_000, max: 1_500_000 },
  { label: "Rp 1.500.000 – Rp 2.000.000", min: 1_500_000, max: 2_000_000 },
  { label: "> Rp 2.000.000", min: 2_000_000, max: undefined },
] as const;

function presetKey(min?: number, max?: number): string {
  const match = PRICE_PRESETS.find((p) => p.min === min && p.max === max);
  return match ? match.label : "custom";
}

export default function CatalogPage() {
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();

  const {
    q: keyword = "",
    tipe: roomType,
    min: minPrice,
    max: maxPrice,
  } = parseSearch(rawSearch);

  // Local draft for the search box; committed to the URL on submit.
  const [draft, setDraft] = useState(keyword);
  useEffect(() => {
    setDraft(keyword);
  }, [keyword]);

  const filter = useMemo<RoomFilter>(() => {
    const next: RoomFilter = {};
    if (keyword.trim()) next.keyword = keyword.trim();
    if (roomType) next.roomType = roomType;
    if (typeof minPrice === "number") next.minPrice = BigInt(minPrice);
    if (typeof maxPrice === "number") next.maxPrice = BigInt(maxPrice);
    return next;
  }, [keyword, roomType, minPrice, maxPrice]);

  const { data: rooms, isLoading, isError, refetch } = useRooms(filter);

  const hasActiveFilter =
    keyword.trim() !== "" ||
    roomType !== undefined ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  const updateSearch = (patch: Partial<CatalogSearch>) => {
    void navigate({
      to: "/",
      search: (prev: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...prev, ...patch };
        for (const key of Object.keys(next)) {
          if (next[key] === undefined) delete next[key];
        }
        return next;
      },
      replace: true,
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSearch({ q: draft.trim() || undefined });
  };

  const handleReset = () => {
    setDraft("");
    void navigate({ to: "/", search: {}, replace: true });
  };

  const handlePriceChange = (value: string) => {
    const preset = PRICE_PRESETS.find((p) => p.label === value);
    if (!preset) return;
    updateSearch({ min: preset.min, max: preset.max });
  };

  const resultCount = rooms?.length ?? 0;

  return (
    <div data-ocid="catalog.page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="max-w-3xl animate-fade-in space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary shadow-subtle">
              Katalog Kamar Kost
            </span>
            <h1 className="text-balance font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Temukan kamar kost yang nyaman untuk Anda
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Jelajahi kamar putra, putri, dan campur dengan harga transparan.
              Bandingkan fasilitas, lalu ajukan pemesanan langsung dari halaman
              kamar.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section
        id="kamar"
        className="border-b border-border bg-background"
        aria-label="Pencarian dan filter kamar"
      >
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-subtle md:grid-cols-[1fr_auto_auto_auto] md:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="catalog-search">Cari kamar</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="catalog-search"
                  data-ocid="catalog.search_input"
                  type="search"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Nama atau nomor kamar…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catalog-type">Tipe kamar</Label>
              <Select
                value={roomType ?? ALL_TYPES}
                onValueChange={(value) =>
                  updateSearch({
                    tipe: value === ALL_TYPES ? undefined : (value as RoomType),
                  })
                }
              >
                <SelectTrigger
                  id="catalog-type"
                  data-ocid="catalog.type_select"
                  className="w-full md:w-44"
                >
                  <SelectValue placeholder="Semua tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TYPES}>Semua tipe</SelectItem>
                  {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {ROOM_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catalog-price">Rentang harga</Label>
              <Select
                value={presetKey(minPrice, maxPrice)}
                onValueChange={handlePriceChange}
              >
                <SelectTrigger
                  id="catalog-price"
                  data-ocid="catalog.price_select"
                  className="w-full md:w-56"
                >
                  <SelectValue placeholder="Semua harga" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_PRESETS.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                data-ocid="catalog.search_button"
                className="rounded-lg"
              >
                <Search className="size-4" aria-hidden="true" />
                Cari
              </Button>
              {hasActiveFilter ? (
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="catalog.reset_button"
                  onClick={handleReset}
                  className="rounded-lg"
                >
                  <X className="size-4" aria-hidden="true" />
                  Reset
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <section
        className="bg-muted/40"
        aria-label="Hasil pencarian kamar"
        aria-live="polite"
      >
        {" "}
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-4xl">
                Daftar Kamar
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Memuat kamar…" : `${resultCount} kamar ditemukan`}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {hasActiveFilter ? "Filter aktif" : "Semua kamar"}
            </span>
          </div>

          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : isError ? (
            <ErrorState
              title="Gagal memuat kamar"
              description="Kami tidak dapat mengambil daftar kamar saat ini. Periksa koneksi Anda lalu coba lagi."
              onRetry={() => void refetch()}
            />
          ) : resultCount === 0 ? (
            <EmptyState
              title="Tidak ada kamar yang cocok"
              description={
                hasActiveFilter
                  ? "Coba ubah kata kunci, tipe, atau rentang harga untuk melihat lebih banyak kamar."
                  : "Belum ada kamar yang tersedia saat ini. Silakan periksa kembali nanti."
              }
              action={
                hasActiveFilter ? (
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="catalog.empty_reset_button"
                    onClick={handleReset}
                    className="rounded-lg"
                  >
                    <X className="size-4" aria-hidden="true" />
                    Hapus filter
                  </Button>
                ) : null
              }
            />
          ) : (
            <div
              data-ocid="catalog.list"
              className={cn(
                "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {rooms?.map((room, index) => (
                <RoomCard key={room.id.toString()} room={room} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Facilities */}
      <section
        id="fasilitas"
        className="border-t border-border bg-background"
        aria-label="Fasilitas umum"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="mb-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary shadow-subtle">
              Fasilitas
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-4xl">
              Fasilitas yang membuat betah
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Setiap kamar dilengkapi fasilitas pilihan untuk kenyamanan
              sehari-hari. Fasilitas dapat berbeda antar kamar — lihat detail
              kamar untuk daftar lengkapnya.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FACILITY_HIGHLIGHTS.map((facility) => (
              <li
                key={facility.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-subtle"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <facility.icon className="size-4" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {facility.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {facility.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* About */}
      <section
        id="tentang"
        className="border-t border-border bg-muted/40"
        aria-label="Tentang KOSTKU"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary shadow-subtle">
              Tentang
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-4xl">
              Tentang KOSTKU
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              KOSTKU membantu Anda menemukan kamar kost yang bersih, aman, dan
              terpercaya. Jelajahi katalog, bandingkan fasilitas dan harga yang
              transparan, lalu ajukan pemesanan langsung tanpa perantara.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ABOUT_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-5 text-center shadow-subtle"
              >
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="mt-2 font-display text-2xl font-bold text-primary">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
