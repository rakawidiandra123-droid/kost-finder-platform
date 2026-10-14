import { RoomForm } from "@/components/RoomForm";
import {
  CardGridSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/StateViews";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateRoom,
  useDeleteRoom,
  useRooms,
  useUpdateRoom,
} from "@/hooks/useQueries";
import { formatMonthlyPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ROOM_STATUS_LABELS,
  ROOM_TYPE_LABELS,
  type Room,
  type RoomInput,
} from "@/types";
import {
  BedDouble,
  Building2,
  ImageOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

type FormMode = { kind: "create" } | { kind: "edit"; room: Room } | null;

function StatusBadge({ status }: { status: Room["status"] }) {
  const isAvailable = status === "available";
  return (
    <Badge
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        isAvailable
          ? "border-transparent bg-success text-success-foreground"
          : "border-transparent bg-muted text-muted-foreground",
      )}
    >
      {ROOM_STATUS_LABELS[status]}
    </Badge>
  );
}

function RoomPhoto({ room }: { room: Room }) {
  const photo = room.photos[0];
  if (!photo) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-muted-foreground">
        <ImageOff className="size-8" aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={photo.getDirectURL()}
      alt={`Foto ${room.name}`}
      className="aspect-[4/3] w-full object-cover"
    />
  );
}

export default function AdminRoomsPage() {
  const roomsQuery = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [pendingDelete, setPendingDelete] = useState<Room | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rooms = roomsQuery.data ?? [];

  const closeForm = () => {
    setFormMode(null);
    setActionError(null);
  };

  const handleSubmit = (input: RoomInput) => {
    setActionError(null);
    if (formMode?.kind === "edit") {
      updateRoom.mutate(
        { id: formMode.room.id, input },
        {
          onSuccess: () => closeForm(),
          onError: () =>
            setActionError("Gagal menyimpan perubahan. Silakan coba lagi."),
        },
      );
      return;
    }
    createRoom.mutate(input, {
      onSuccess: () => closeForm(),
      onError: () => setActionError("Gagal menambah kamar. Silakan coba lagi."),
    });
  };

  const handleToggleStatus = (room: Room) => {
    setActionError(null);
    const nextStatus = room.status === "available" ? "occupied" : "available";
    updateRoom.mutate(
      {
        id: room.id,
        input: {
          name: room.name,
          roomType: room.roomType,
          monthlyPrice: room.monthlyPrice,
          description: room.description,
          facilities: room.facilities,
          status: nextStatus,
          photos: room.photos,
        },
      },
      {
        onError: () =>
          setActionError("Gagal mengubah status kamar. Silakan coba lagi."),
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    setActionError(null);
    deleteRoom.mutate(target.id, {
      onError: () =>
        setActionError("Gagal menghapus kamar. Silakan coba lagi."),
    });
  };

  const isSubmitting = createRoom.isPending || updateRoom.isPending;

  return (
    <div
      data-ocid="admin_rooms.page"
      className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14"
    >
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
            Dasbor Admin
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Kelola Kamar
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Tambah, ubah, dan atur ketersediaan kamar kost yang tampil di
            katalog.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          data-ocid="admin_rooms.add_button"
          onClick={() => {
            setActionError(null);
            setFormMode({ kind: "create" });
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah Kamar
        </Button>
      </header>

      {actionError ? (
        <p
          role="alert"
          data-ocid="admin_rooms.action_error"
          className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </p>
      ) : null}

      <section className="mt-8">
        {roomsQuery.isLoading ? (
          <CardGridSkeleton count={6} />
        ) : roomsQuery.isError ? (
          <ErrorState
            title="Gagal memuat daftar kamar"
            description="Kami tidak dapat mengambil data kamar saat ini. Silakan coba lagi."
            onRetry={() => void roomsQuery.refetch()}
          />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-6" aria-hidden="true" />}
            title="Belum ada kamar"
            description="Mulai dengan menambahkan kamar pertama Anda agar tampil di katalog."
            action={
              <Button
                type="button"
                data-ocid="admin_rooms.empty_add_button"
                onClick={() => {
                  setActionError(null);
                  setFormMode({ kind: "create" });
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Tambah Kamar
              </Button>
            }
          />
        ) : (
          <div
            data-ocid="admin_rooms.list"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {rooms.map((room, index) => (
              <article
                key={room.id.toString()}
                data-ocid={`admin_rooms.item.${index + 1}`}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-subtle transition-smooth hover:shadow-elevated"
              >
                <div className="relative">
                  <RoomPhoto room={room} />
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={room.status} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 font-display text-lg font-semibold tracking-tight text-foreground">
                      {room.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                      {ROOM_TYPE_LABELS[room.roomType]}
                    </Badge>
                  </div>

                  <p className="font-mono text-base font-semibold text-accent-foreground">
                    {formatMonthlyPrice(room.monthlyPrice)}
                  </p>

                  {room.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {room.description}
                    </p>
                  ) : null}

                  {room.facilities.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {room.facilities.slice(0, 4).map((facility) => (
                        <li
                          key={facility}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                        >
                          {facility}
                        </li>
                      ))}
                      {room.facilities.length > 4 ? (
                        <li className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                          +{room.facilities.length - 4}
                        </li>
                      ) : null}
                    </ul>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-ocid={`admin_rooms.edit_button.${index + 1}`}
                      onClick={() => {
                        setActionError(null);
                        setFormMode({ kind: "edit", room });
                      }}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      Ubah
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-ocid={`admin_rooms.toggle_button.${index + 1}`}
                      onClick={() => handleToggleStatus(room)}
                      disabled={updateRoom.isPending}
                    >
                      <BedDouble className="size-4" aria-hidden="true" />
                      {room.status === "available"
                        ? "Tandai Terisi"
                        : "Tandai Tersedia"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-ocid={`admin_rooms.delete_button.${index + 1}`}
                      onClick={() => setPendingDelete(room)}
                      className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={formMode !== null}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent
          data-ocid="admin_rooms.form_dialog"
          className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold tracking-tight">
              {formMode?.kind === "edit" ? "Ubah Kamar" : "Tambah Kamar"}
            </DialogTitle>
            <DialogDescription>
              {formMode?.kind === "edit"
                ? "Perbarui detail kamar lalu simpan perubahan."
                : "Lengkapi detail kamar baru untuk ditampilkan di katalog."}
            </DialogDescription>
          </DialogHeader>
          {formMode ? (
            <RoomForm
              key={
                formMode.kind === "edit"
                  ? formMode.room.id.toString()
                  : "create"
              }
              room={formMode.kind === "edit" ? formMode.room : undefined}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              isSubmitting={isSubmitting}
              submitError={actionError}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent data-ocid="admin_rooms.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-bold tracking-tight">
              Hapus kamar ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `Kamar "${pendingDelete.name}" akan dihapus permanen dari katalog. Tindakan ini tidak dapat dibatalkan.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin_rooms.delete_cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin_rooms.delete_confirm_button"
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Kamar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
