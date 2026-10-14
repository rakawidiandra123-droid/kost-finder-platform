import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMonthlyPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ROOM_TYPE_LABELS, type Room } from "@/types";
import { Link } from "@tanstack/react-router";
import { BedDouble, Check, ImageOff } from "lucide-react";

interface RoomCardProps {
  room: Room;
  /** Stagger index used for the entrance animation delay. */
  index?: number;
}

/**
 * A single room in the public catalog. Occupied rooms are visibly desaturated
 * and their booking action is disabled — they cannot be booked.
 */
export function RoomCard({ room, index = 0 }: RoomCardProps) {
  const isAvailable = room.status === "available";
  const photo = room.photos[0];
  const photoUrl = photo ? photo.getDirectURL() : null;
  const facilities = room.facilities.slice(0, 3);

  return (
    <article
      data-ocid={`room.card.${index + 1}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className={cn(
        "group flex animate-fade-up flex-col overflow-hidden rounded-xl border border-border bg-card shadow-subtle transition-smooth motion-reduce:animate-none",
        "hover:-translate-y-1 hover:shadow-elevated",
        !isAvailable && "bg-muted/50",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Foto kamar ${room.name}`}
            loading="lazy"
            className={cn(
              "size-full object-cover transition-smooth group-hover:scale-[1.03]",
              !isAvailable && "opacity-70 saturate-50",
            )}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-7" aria-hidden="true" />
            <span className="text-xs">Foto belum tersedia</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge
            data-ocid={`room.status_badge.${index + 1}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold shadow-subtle",
              isAvailable
                ? "border-transparent bg-success text-success-foreground"
                : "border-transparent bg-muted text-muted-foreground",
            )}
          >
            {isAvailable ? "Tersedia" : "Terisi"}
          </Badge>
        </div>

        <Badge
          variant="outline"
          className="absolute right-3 top-3 rounded-full border-border bg-card/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur"
        >
          {ROOM_TYPE_LABELS[room.roomType]}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-foreground">
            <Link
              to="/kamar/$roomId"
              params={{ roomId: room.id.toString() }}
              data-ocid={`room.title_link.${index + 1}`}
              className="transition-smooth hover:text-primary"
            >
              {room.name}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {room.description}
          </p>
        </div>

        {facilities.length > 0 ? (
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {facilities.map((facility) => (
              <li
                key={facility}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <Check className="size-3 text-primary" aria-hidden="true" />
                {facility}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Harga
            </p>
            <p className="truncate font-mono text-base font-semibold text-foreground">
              {formatMonthlyPrice(room.monthlyPrice)}
            </p>
          </div>

          {isAvailable ? (
            <Button asChild size="sm" className="rounded-lg">
              <Link
                to="/kamar/$roomId/pesan"
                params={{ roomId: room.id.toString() }}
                data-ocid={`room.book_button.${index + 1}`}
              >
                <BedDouble className="size-4" aria-hidden="true" />
                Pesan
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled
              data-ocid={`room.book_button.${index + 1}`}
              title="Kamar ini sedang terisi"
            >
              <BedDouble className="size-4" aria-hidden="true" />
              Terisi
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
