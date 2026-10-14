import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ROOM_STATUS_LABELS,
  ROOM_TYPE_LABELS,
  type Room,
  type RoomInput,
  type RoomStatus,
  type RoomType,
} from "@/types";
import { ExternalBlob } from "@caffeineai/object-storage";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";

const ROOM_TYPES: RoomType[] = ["putra", "putri", "campur"];
const ROOM_STATUSES: RoomStatus[] = ["available", "occupied"];

interface PhotoDraft {
  id: string;
  blob: ExternalBlob;
  previewUrl: string;
  name: string;
}

interface RoomFormProps {
  /** Existing room when editing; omitted when creating a new room. */
  room?: Room;
  onSubmit: (input: RoomInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

function parsePrice(value: string): bigint {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return 0n;
  try {
    return BigInt(digits);
  } catch {
    return 0n;
  }
}

function formatPriceInput(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

function initialPhotos(room?: Room): PhotoDraft[] {
  if (!room) return [];
  return room.photos.map((blob, index) => ({
    id: `existing-${room.id.toString()}-${index}`,
    blob,
    previewUrl: blob.getDirectURL(),
    name: blob.filename ?? `Foto ${index + 1}`,
  }));
}

/**
 * Create/edit form for a room. Owns its own draft state so a query refetch
 * never overwrites what the admin is typing. Photos upload through the
 * platform object storage with a per-file progress indicator.
 */
export function RoomForm({
  room,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: RoomFormProps) {
  const [name, setName] = useState(room?.name ?? "");
  const [roomType, setRoomType] = useState<RoomType>(room?.roomType ?? "putra");
  const [price, setPrice] = useState(
    room ? room.monthlyPrice.toLocaleString("id-ID") : "",
  );
  const [description, setDescription] = useState(room?.description ?? "");
  const [facilities, setFacilities] = useState(
    room?.facilities.join(", ") ?? "",
  );
  const [status, setStatus] = useState<RoomStatus>(room?.status ?? "available");
  const [photos, setPhotos] = useState<PhotoDraft[]>(() => initialPhotos(room));
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCounter = useRef(0);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setUploadError(null);
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Hanya berkas gambar yang dapat diunggah.");
        continue;
      }
      try {
        setUploadProgress(0);
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(
          bytes,
          file.type,
          file.name,
        ).withUploadProgress((pct) => setUploadProgress(pct));
        uploadCounter.current += 1;
        const draft: PhotoDraft = {
          id: `upload-${uploadCounter.current}-${file.name}`,
          blob,
          previewUrl: blob.getDirectURL(),
          name: file.name,
        };
        setPhotos((current) => [...current, draft]);
      } catch {
        setUploadError("Gagal mengunggah foto. Silakan coba lagi.");
      } finally {
        setUploadProgress(null);
      }
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => current.filter((photo) => photo.id !== id));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const priceValue = parsePrice(price);

    if (!trimmedName) {
      setValidationError("Nama atau nomor kamar wajib diisi.");
      return;
    }
    if (priceValue <= 0n) {
      setValidationError("Harga sewa bulanan harus lebih dari nol.");
      return;
    }
    setValidationError(null);

    const facilityList = facilities
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    onSubmit({
      name: trimmedName,
      roomType,
      monthlyPrice: priceValue,
      description: description.trim(),
      facilities: facilityList,
      status,
      photos: photos.map((photo) => photo.blob),
    });
  };

  const isUploading = uploadProgress !== null;

  return (
    <form
      data-ocid="room_form"
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="room-name">Nama / nomor kamar</Label>
          <Input
            id="room-name"
            data-ocid="room_form.name_input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Kamar A1"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="room-price">Harga sewa bulanan</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
              Rp
            </span>
            <Input
              id="room-price"
              data-ocid="room_form.price_input"
              value={price}
              onChange={(event) =>
                setPrice(formatPriceInput(event.target.value))
              }
              inputMode="numeric"
              placeholder="1.500.000"
              className="pl-10 font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="room-type">Tipe kamar</Label>
          <Select
            value={roomType}
            onValueChange={(value) => setRoomType(value as RoomType)}
          >
            <SelectTrigger
              id="room-type"
              data-ocid="room_form.type_select"
              className="w-full"
            >
              <SelectValue placeholder="Pilih tipe kamar" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ROOM_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="room-status">Status ketersediaan</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as RoomStatus)}
          >
            <SelectTrigger
              id="room-status"
              data-ocid="room_form.status_select"
              className="w-full"
            >
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {ROOM_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="room-description">Deskripsi</Label>
        <Textarea
          id="room-description"
          data-ocid="room_form.description_textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Jelaskan kondisi kamar, ukuran, dan hal penting lainnya."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="room-facilities">Fasilitas</Label>
        <Input
          id="room-facilities"
          data-ocid="room_form.facilities_input"
          value={facilities}
          onChange={(event) => setFacilities(event.target.value)}
          placeholder="AC, WiFi, kamar mandi dalam (pisahkan dengan koma)"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Pisahkan setiap fasilitas dengan tanda koma.
        </p>
      </div>

      <div className="space-y-3">
        <Label>Foto kamar</Label>
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              data-ocid={`room_form.photo.${index + 1}`}
              className="group relative size-24 overflow-hidden rounded-lg border border-border bg-muted"
            >
              <img
                src={photo.previewUrl}
                alt={photo.name}
                className="size-full object-cover"
              />
              <button
                type="button"
                aria-label={`Hapus ${photo.name}`}
                data-ocid={`room_form.remove_photo_button.${index + 1}`}
                onClick={() => removePhoto(photo.id)}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-smooth hover:bg-destructive focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}

          <button
            type="button"
            data-ocid="room_form.upload_button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground transition-smooth hover:border-primary hover:text-primary",
              isUploading && "cursor-not-allowed opacity-60",
            )}
          >
            {isUploading ? (
              <Loader2
                className="size-5 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <ImagePlus className="size-5" aria-hidden="true" />
            )}
            <span className="text-xs font-medium">
              {isUploading ? "Mengunggah" : "Tambah foto"}
            </span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          data-ocid="room_form.file_input"
          onChange={handleFiles}
        />

        {uploadProgress !== null ? (
          <div
            data-ocid="room_form.upload_progress"
            className="space-y-1.5"
            aria-live="polite"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Mengunggah foto…</span>
              <span className="font-mono">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        ) : null}

        {uploadError ? (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
        ) : null}
      </div>

      {validationError ? (
        <p
          role="alert"
          data-ocid="room_form.validation_error"
          className="text-sm text-destructive"
        >
          {validationError}
        </p>
      ) : null}

      {submitError ? (
        <p
          role="alert"
          data-ocid="room_form.submit_error"
          className="text-sm text-destructive"
        >
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          data-ocid="room_form.cancel_button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button
          type="submit"
          data-ocid="room_form.submit_button"
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Menyimpan…
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              {room ? "Simpan perubahan" : "Tambah kamar"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
