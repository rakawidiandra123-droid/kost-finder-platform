import { ErrorState, LoadingState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoom } from "@/hooks/useQueries";
import { formatMonthlyPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ROOM_STATUS_LABELS, ROOM_TYPE_LABELS, type Room } from "@/types";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Check,
  ImageOff,
  Users,
} from "lucide-react";
import { useState } from "react";

/** Parse the $roomId route param into a bigint, or null when invalid. */
function parseRoomId(raw: string | undefined): bigint | null {
  if (!raw) return null;
  try {
    const value = BigInt(raw);
    return value >= 0n ? value : null;
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: Room["status"] }) {
  const available = status === "available";
  return (
    <Badge
      data-ocid="room.status_badge"
      className={cn(
        "rounded-full border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider",
        available
          ? "bg-success/15 text-success"
          : "bg-destructive/10 text-destructive",
      )}
    >
      <span
        className={cn(
          "mr-1.5 inline-block size-1.5 rounded-full",
          available ? "bg-success" : "bg-destructive",
        )}
        aria-hidden="true"
      />
      {ROOM_STATUS_LABELS[status]}
    </Badge>
  );
}

function GallerySkeleton() {
  const ids = Array.from({ length: 4 }, (_, i) => `gallery-skeleton-${i}`);
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[16/10] w-full rounded-xl" />
      <div className="grid grid-cols-4 gap-3">
        {ids.map((id) => (
          <Skeleton key={id} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const hasPhotos = photos.length > 0;
  const activeUrl = hasPhotos
    ? photos[Math.min(active, photos.length - 1)]
    : "";

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-muted shadow-subtle">
        {hasPhotos ? (
          <img
            src={activeUrl}
            alt={`Foto ${active + 1} dari ${photos.length} — ${name}`}
            data-ocid="room.gallery_image"
            className="aspect-[16/10] w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            data-ocid="room.gallery_empty"
            className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <ImageOff className="size-8" aria-hidden="true" />
            <p className="text-sm">Belum ada foto untuk kamar ini</p>
          </div>
        )}
      </div>

      {photos.length > 1 ? (
        <div
          data-ocid="room.gallery_thumbnails"
          className="grid grid-cols-4 gap-3 sm:grid-cols-5"
        >
          {photos.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`Tampilkan foto ${index + 1}`}
              aria-current={index === active}
              data-ocid={`room.gallery_thumbnail.${index + 1}`}
              onClick={() => setActive(index)}
              className={cn(
                "overflow-hidden rounded-lg border-2 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                index === active
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={url}
                alt=""
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function RoomDetail({ room }: { room: Room }) {
  const isAvailable = room.status === "available";
  const photoUrls = room.photos
    .map((photo) => photo.getDirectURL())
    .filter((url): url is string => Boolean(url));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <Link
        to="/"
        hash="kamar"
        data-ocid="room.back_link"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke katalog
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-10">
          <PhotoGallery photos={photoUrls} name={room.name} />

          <section
            data-ocid="room.description_section"
            className="space-y-3"
            aria-labelledby="room-description-heading"
          >
            <h2
              id="room-description-heading"
              className="font-display text-xl font-semibold text-foreground"
            >
              Deskripsi Kamar
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {room.description || "Deskripsi kamar belum tersedia."}
            </p>
          </section>

          <section
            data-ocid="room.facilities_section"
            className="space-y-4"
            aria-labelledby="room-facilities-heading"
          >
            <h2
              id="room-facilities-heading"
              className="font-display text-xl font-semibold text-foreground"
            >
              Fasilitas
            </h2>
            {room.facilities.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {room.facilities.map((facility) => (
                  <li
                    key={facility}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-subtle"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    {facility}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Informasi fasilitas belum tersedia.
              </p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div
            data-ocid="room.summary_card"
            className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-elevated"
          >
            <div className="space-y-3">
              <StatusBadge status={room.status} />
              <h1 className="font-display text-2xl font-bold leading-tight text-foreground">
                {room.name}
              </h1>
              <p className="font-display text-3xl font-bold text-primary">
                {formatMonthlyPrice(room.monthlyPrice)}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <DetailRow
                icon={<Users className="size-4" aria-hidden="true" />}
                label="Tipe Kamar"
                value={ROOM_TYPE_LABELS[room.roomType]}
              />
              <DetailRow
                icon={<BedDouble className="size-4" aria-hidden="true" />}
                label="Status"
                value={ROOM_STATUS_LABELS[room.status]}
              />
              <DetailRow
                icon={<Building2 className="size-4" aria-hidden="true" />}
                label="Fasilitas"
                value={`${room.facilities.length} fasilitas`}
              />
            </div>

            <Separator />

            {isAvailable ? (
              <div className="space-y-3">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full"
                  data-ocid="room.book_button"
                >
                  <Link
                    to="/kamar/$roomId/pesan"
                    params={{ roomId: room.id.toString() }}
                  >
                    Ajukan Sewa
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Ajukan permintaan sewa dan admin akan menghubungi Anda.
                </p>
              </div>
            ) : (
              <div
                data-ocid="room.unavailable_notice"
                className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
              >
                <p className="text-sm font-medium text-foreground">
                  Kamar ini sedang tidak tersedia
                </p>
                <p className="text-sm text-muted-foreground">
                  Kamar sudah terisi. Silakan lihat kamar lain yang masih
                  tersedia di katalog.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="w-full rounded-full"
                  data-ocid="room.book_button"
                >
                  Ajukan Sewa
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full rounded-full"
                  data-ocid="room.view_other_rooms_button"
                >
                  <Link to="/" hash="kamar">
                    Lihat kamar lain
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function RoomDetailPage() {
  const { roomId } = useParams({ from: "/kamar/$roomId" });
  const parsedId = parseRoomId(roomId);
  const { data: room, isLoading, isError, refetch } = useRoom(parsedId);

  if (parsedId === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <ErrorState
          title="Kamar tidak ditemukan"
          description="Tautan kamar tidak valid. Silakan kembali ke katalog dan pilih kamar yang tersedia."
        />
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/" hash="kamar" data-ocid="room.back_to_catalog_button">
              Kembali ke katalog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <GallerySkeleton />
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
        <LoadingState className="sr-only" label="Memuat detail kamar…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <ErrorState
          title="Gagal memuat kamar"
          description="Kami tidak dapat memuat detail kamar saat ini. Silakan coba lagi."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <ErrorState
          title="Kamar tidak ditemukan"
          description="Kamar yang Anda cari tidak tersedia atau sudah dihapus. Silakan kembali ke katalog."
        />
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/" hash="kamar" data-ocid="room.back_to_catalog_button">
              Kembali ke katalog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <RoomDetail room={room} />;
}
