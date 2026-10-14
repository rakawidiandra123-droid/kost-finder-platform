import { ErrorState, LoadingState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBooking, useRoom } from "@/hooks/useQueries";
import { formatMonthlyPrice } from "@/lib/format";
import { type BookingInput, ROOM_TYPE_LABELS, type RoomId } from "@/types";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import { type FormEvent, useState } from "react";

interface FormValues {
  applicantName: string;
  phone: string;
  email: string;
  moveInDate: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  applicantName: "",
  phone: "",
  email: "",
  moveInDate: "",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.applicantName.trim()) {
    errors.applicantName = "Nama lengkap wajib diisi.";
  } else if (values.applicantName.trim().length < 3) {
    errors.applicantName = "Nama minimal 3 karakter.";
  }

  const phone = values.phone.replace(/[\s-]/g, "");
  if (!phone) {
    errors.phone = "Nomor telepon wajib diisi.";
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = "Gunakan format nomor Indonesia, mis. 081234567890.";
  }

  if (!values.email.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Format email tidak valid.";
  }

  if (!values.moveInDate) {
    errors.moveInDate = "Tanggal rencana masuk wajib diisi.";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(values.moveInDate);
    if (Number.isNaN(chosen.getTime())) {
      errors.moveInDate = "Tanggal tidak valid.";
    } else if (chosen < today) {
      errors.moveInDate = "Tanggal tidak boleh sebelum hari ini.";
    }
  }

  return errors;
}

function parseRoomId(raw: string | undefined): RoomId | null {
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

export default function BookingPage() {
  const { roomId: rawRoomId } = useParams({ from: "/kamar/$roomId/pesan" });
  const roomId = parseRoomId(rawRoomId);
  const roomQuery = useRoom(roomId);
  const createBooking = useCreateBooking();

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const room = roomQuery.data ?? null;

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!room || roomId === null) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: BookingInput = {
      applicantName: values.applicantName.trim(),
      phone: values.phone.replace(/[\s-]/g, ""),
      email: values.email.trim(),
      moveInDate: values.moveInDate,
      message: values.message.trim(),
      roomId,
    };

    createBooking.mutate(input, {
      onSuccess: () => {
        setSubmitted(true);
      },
    });
  };

  if (roomId === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <ErrorState
          title="Kamar tidak ditemukan"
          description="Tautan pemesanan tidak valid. Silakan pilih kamar dari katalog."
        />
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link to="/" data-ocid="booking.back_to_catalog_link">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Kembali ke katalog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (roomQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <LoadingState label="Memuat detail kamar…" />
      </div>
    );
  }

  if (roomQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <ErrorState
          title="Gagal memuat kamar"
          description="Kami tidak dapat memuat detail kamar saat ini. Silakan coba lagi."
          onRetry={() => void roomQuery.refetch()}
        />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <ErrorState
          title="Kamar tidak ditemukan"
          description="Kamar yang Anda cari tidak tersedia atau telah dihapus."
        />
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link to="/" data-ocid="booking.back_to_catalog_link">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Kembali ke katalog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (room.status !== "available") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <ErrorState
          title="Kamar sudah terisi"
          description={`Kamar ${room.name} saat ini tidak tersedia untuk dipesan. Silakan jelajahi kamar lain di katalog.`}
        />
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link to="/" data-ocid="booking.back_to_catalog_link">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Lihat kamar lain
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <Card
          data-ocid="booking.success_state"
          className="overflow-hidden rounded-xl border-border shadow-subtle"
        >
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-foreground">
                Permintaan pemesanan diterima
              </h1>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Terima kasih, {values.applicantName.trim()}. Pengajuan sewa
                untuk{" "}
                <span className="font-medium text-foreground">{room.name}</span>{" "}
                telah kami terima dan sedang menunggu peninjauan admin.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="gap-1.5 rounded-full px-3 py-1 text-sm"
            >
              <BadgeCheck className="size-4" aria-hidden="true" />
              Status: Menunggu
            </Badge>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/" data-ocid="booking.back_to_catalog_link">
                  Kembali ke katalog
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to="/kamar/$roomId"
                  params={{ roomId: rawRoomId ?? "" }}
                  data-ocid="booking.view_room_link"
                >
                  Lihat detail kamar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <Link
        to="/kamar/$roomId"
        params={{ roomId: rawRoomId ?? "" }}
        data-ocid="booking.back_link"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke detail kamar
      </Link>

      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Ajukan Pemesanan
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Lengkapi data berikut untuk mengajukan sewa. Admin akan meninjau
          permintaan Anda dan menghubungi melalui email atau telepon.
        </p>
      </div>

      <Card
        data-ocid="booking.room_summary_card"
        className="mb-8 overflow-hidden rounded-xl border-border shadow-subtle"
      >
        <CardHeader className="border-b border-border bg-muted/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="font-display text-lg">
                {room.name}
              </CardTitle>
              <CardDescription>
                Kamar {ROOM_TYPE_LABELS[room.roomType]}
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full bg-success/10 text-success"
            >
              Tersedia
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Harga sewa</p>
            <p className="font-display text-xl font-semibold text-foreground">
              {formatMonthlyPrice(room.monthlyPrice)}
            </p>
          </div>
          {room.facilities.length > 0 ? (
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Fasilitas</p>
              <p className="truncate text-sm font-medium text-foreground">
                {room.facilities.slice(0, 4).join(" · ")}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border-border shadow-subtle">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-display text-lg">Data pemesan</CardTitle>
          <CardDescription>
            Kolom bertanda <span className="text-destructive">*</span> wajib
            diisi.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            noValidate
            onSubmit={handleSubmit}
            className="space-y-6"
            data-ocid="booking.form"
          >
            <div className="space-y-2">
              <Label htmlFor="applicantName">
                Nama lengkap <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="applicantName"
                  name="applicantName"
                  data-ocid="booking.name_input"
                  className="pl-9"
                  placeholder="mis. Budi Santoso"
                  value={values.applicantName}
                  onChange={(e) => updateField("applicantName", e.target.value)}
                  aria-invalid={Boolean(errors.applicantName)}
                  aria-describedby={
                    errors.applicantName ? "applicantName-error" : undefined
                  }
                />
              </div>
              <FieldError
                id="applicantName-error"
                message={errors.applicantName}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Nomor telepon <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    data-ocid="booking.phone_input"
                    className="pl-9"
                    placeholder="081234567890"
                    value={values.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                </div>
                <FieldError id="phone-error" message={errors.phone} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    data-ocid="booking.email_input"
                    className="pl-9"
                    placeholder="nama@email.com"
                    value={values.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                <FieldError id="email-error" message={errors.email} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moveInDate">
                Rencana tanggal masuk{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="moveInDate"
                  name="moveInDate"
                  type="date"
                  data-ocid="booking.move_in_date_input"
                  className="pl-9"
                  value={values.moveInDate}
                  onChange={(e) => updateField("moveInDate", e.target.value)}
                  aria-invalid={Boolean(errors.moveInDate)}
                  aria-describedby={
                    errors.moveInDate ? "moveInDate-error" : undefined
                  }
                />
              </div>
              <FieldError id="moveInDate-error" message={errors.moveInDate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Pesan tambahan (opsional)</Label>
              <div className="relative">
                <MessageSquare
                  className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Textarea
                  id="message"
                  name="message"
                  data-ocid="booking.message_textarea"
                  className="min-h-28 pl-9"
                  placeholder="Ceritakan kebutuhan Anda, mis. preferensi lantai atau waktu survei."
                  value={values.message}
                  onChange={(e) => updateField("message", e.target.value)}
                />
              </div>
            </div>

            {createBooking.isError ? (
              <div
                role="alert"
                data-ocid="booking.error_state"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                Gagal mengirim permintaan. Silakan periksa koneksi Anda dan coba
                lagi.
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" type="button">
                <Link
                  to="/kamar/$roomId"
                  params={{ roomId: rawRoomId ?? "" }}
                  data-ocid="booking.cancel_button"
                >
                  Batal
                </Link>
              </Button>
              <Button
                type="submit"
                data-ocid="booking.submit_button"
                disabled={createBooking.isPending}
              >
                {createBooking.isPending
                  ? "Mengirim permintaan…"
                  : "Kirim permintaan pemesanan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
