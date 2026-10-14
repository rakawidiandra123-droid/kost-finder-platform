import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBookings,
  useRooms,
  useUpdateBookingStatus,
} from "@/hooks/useQueries";
import { formatDateString, formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS_LABELS,
  type BookingRequest,
  type BookingStatus,
  type RoomId,
} from "@/types";
import {
  CalendarDays,
  Check,
  Inbox,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type StatusFilter = BookingStatus | "all";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

const STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  pending: "border-warning/40 bg-warning/10 text-warning-foreground",
  approved: "border-success/40 bg-success/10 text-success-foreground",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        STATUS_BADGE_CLASS[status],
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}

interface BookingCardProps {
  booking: BookingRequest;
  roomName: string;
  index: number;
  isUpdating: boolean;
  onUpdate: (id: BookingRequest["id"], status: BookingStatus) => void;
}

function BookingCard({
  booking,
  roomName,
  index,
  isUpdating,
  onUpdate,
}: BookingCardProps) {
  const position = index + 1;
  return (
    <Card
      data-ocid={`booking.item.${position}`}
      className="overflow-hidden rounded-xl border-border shadow-subtle"
    >
      <div className="flex flex-col gap-4 border-b border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-display text-lg font-semibold text-foreground">
            {booking.applicantName}
          </h3>
          <p className="text-xs text-muted-foreground">
            Diajukan {formatTimestamp(booking.createdAt)}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <Phone
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Telepon
              </p>
              <p className="break-words text-foreground">{booking.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Mail
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <p className="break-words text-foreground">{booking.email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Kamar
              </p>
              <p className="break-words text-foreground">{roomName}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CalendarDays
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rencana masuk
              </p>
              <p className="text-foreground">
                {formatDateString(booking.moveInDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {booking.message ? (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pesan
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-foreground">
            {booking.message}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/20 px-5 py-4">
        <Button
          type="button"
          size="sm"
          data-ocid={`booking.approve_button.${position}`}
          onClick={() => onUpdate(booking.id, "approved")}
          disabled={isUpdating || booking.status === "approved"}
        >
          <Check className="size-4" aria-hidden="true" />
          Setujui
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-ocid={`booking.reject_button.${position}`}
          onClick={() => onUpdate(booking.id, "rejected")}
          disabled={isUpdating || booking.status === "rejected"}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-4" aria-hidden="true" />
          Tolak
        </Button>
      </div>
    </Card>
  );
}

function BookingListSkeleton() {
  const ids = Array.from({ length: 3 }, (_, i) => `booking-skeleton-${i}`);
  return (
    <div data-ocid="loading_state" className="space-y-5">
      {ids.map((id) => (
        <div
          key={id}
          className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle"
        >
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex gap-2 border-t border-border px-5 py-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const statusParam: BookingStatus | null = filter === "all" ? null : filter;

  const bookingsQuery = useBookings(statusParam);
  const roomsQuery = useRooms();
  const updateStatus = useUpdateBookingStatus();

  const roomNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of roomsQuery.data ?? []) {
      map.set(room.id.toString(), room.name);
    }
    return map;
  }, [roomsQuery.data]);

  const roomNameFor = (roomId: RoomId) =>
    roomNames.get(roomId.toString()) ?? `Kamar #${roomId.toString()}`;

  const bookings = bookingsQuery.data ?? [];

  return (
    <div
      data-ocid="admin_bookings.page"
      className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14"
    >
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Dasbor Admin
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Kelola Pemesanan
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Tinjau permintaan sewa kamar, lalu setujui atau tolak pengajuan yang
          masuk.
        </p>
      </header>

      <div className="mb-6">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as StatusFilter)}
        >
          <TabsList data-ocid="booking.filter.tabs">
            {FILTERS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                data-ocid={`booking.filter.tab.${item.value}`}
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {bookingsQuery.isLoading ? (
        <BookingListSkeleton />
      ) : bookingsQuery.isError ? (
        <ErrorState
          title="Gagal memuat pemesanan"
          description="Kami tidak dapat mengambil daftar permintaan sewa saat ini. Silakan coba lagi."
          onRetry={() => void bookingsQuery.refetch()}
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" aria-hidden="true" />}
          title={
            filter === "all"
              ? "Belum ada permintaan sewa"
              : `Tidak ada pemesanan berstatus ${BOOKING_STATUS_LABELS[filter].toLowerCase()}`
          }
          description={
            filter === "all"
              ? "Permintaan sewa dari calon penyewa akan muncul di sini."
              : "Coba pilih filter status lain untuk melihat permintaan lainnya."
          }
        />
      ) : (
        <div data-ocid="booking.list" className="space-y-5">
          {bookings.map((booking, index) => (
            <BookingCard
              key={booking.id.toString()}
              booking={booking}
              roomName={roomNameFor(booking.roomId)}
              index={index}
              isUpdating={updateStatus.isPending}
              onUpdate={(id, status) => updateStatus.mutate({ id, status })}
            />
          ))}
        </div>
      )}

      {updateStatus.isError ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Gagal memperbarui status pemesanan. Silakan coba lagi.
        </p>
      ) : null}
    </div>
  );
}
