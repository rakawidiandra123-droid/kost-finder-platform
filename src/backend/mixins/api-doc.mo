mixin () {
  public query func getApiDoc() : async Text {
    "# API Katalog Kost

Backend canister untuk aplikasi katalog kost: menampilkan daftar kamar kepada pengunjung dan menyediakan panel admin untuk mengelola kamar serta permintaan sewa.

## Autentikasi dan Otorisasi

- `listRooms` dan `getRoom` adalah query publik: siapa pun, termasuk pemanggil anonim, dapat membacanya.
- `createRoom`, `updateRoom`, `deleteRoom`, `listBookings`, dan `updateBookingStatus` hanya dapat dipanggil oleh admin. Pemanggil non-admin menerima trap dengan pesan berbahasa Indonesia (mis. \"Hanya admin yang dapat menambah kamar\").
- `createBooking` memerlukan pemanggil yang sudah masuk (bukan anonim); pemanggil anonim menerima trap \"Harus masuk untuk mengirim permintaan sewa\".
- Peran admin diberikan melalui sistem otorisasi (`_initialize_access_control` dan `assignRole`). Pemanggil pertama yang menginisialisasi akses menerima peran admin; pemanggil berikutnya menerima peran pengguna biasa.
- Frontend memakai derivation origin Internet Identity yang dipublikasikan di `/.well-known/ii-derivation-origin`. Agen yang sudah memegang otorisasi Internet Identity pengguna menurunkan principal per-aplikasi terhadap origin tersebut (mis. `icp identity link web <name> --app <host>`). Delegasi semacam itu bertindak dengan otoritas penuh pengguna di aplikasi ini sampai kedaluwarsa.
- Pemanggil yang belum terdaftar (belum pernah masuk melalui frontend aplikasi) akan gagal pada endpoint yang dijaga admin, meskipun principal tersebut milik pemilik aplikasi. Principal yang diturunkan terhadap origin berbeda adalah principal yang berbeda dari yang didaftarkan frontend.

## Unit dan Encoding

- `monthlyPrice` adalah harga sewa bulanan dalam Rupiah (bilangan bulat `Nat`).
- `createdAt` adalah timestamp dalam nanodetik sejak epoch Unix (`Int`), diisi otomatis oleh backend saat permintaan sewa dibuat.
- `moveInDate` adalah teks tanggal yang diisi pengguna (format bebas, tidak divalidasi backend).
- `photos` adalah daftar `Storage.ExternalBlob` dari object storage; unggahan file ditangani melalui endpoint object storage yang disediakan mixin.
- `roomType` adalah varian `#putra`, `#putri`, atau `#campur`. `status` kamar adalah `#available` atau `#occupied`.
- `status` permintaan sewa adalah `#pending`, `#approved`, atau `#rejected`.

## Siklus Hidup dan Polling

- Permintaan sewa baru selalu dibuat dengan status `#pending`.
- Admin mengubah status melalui `updateBookingStatus` menjadi `#approved` atau `#rejected`.
- Tidak ada proses latar belakang; semua perubahan bersifat sinkron dan langsung terlihat pada pembacaan berikutnya.

## Keamanan Pengulangan Mutasi

- `createRoom` dan `createBooking` tidak idempoten: setiap panggilan yang berhasil membuat ID baru dan menambah data. Hindari mengirim ulang permintaan yang gagal di tengah jalan tanpa memeriksa hasil sebelumnya.
- `updateRoom`, `deleteRoom`, dan `updateBookingStatus` idempoten terhadap nilai target: memanggil ulang dengan argumen sama menghasilkan keadaan akhir yang sama.
- `deleteRoom` bersifat destruktif dan tidak dapat dibatalkan.

## Kesalahan dan Catatan Integrasi

- Endpoint admin dan `createBooking` menggunakan trap (bukan varian error) untuk penolakan; frontend harus menangani reject dan menampilkan pesan.
- `updateRoom` dan `updateBookingStatus` mengembalikan `null` bila ID tidak ditemukan, bukan trap.
- `deleteRoom` mengembalikan `false` bila ID tidak ditemukan.
- Filter `listRooms` mencocokkan kata kunci pada nama kamar (case-insensitive) dan menyaring berdasarkan tipe kamar serta rentang harga; filter kosong mengembalikan semua kamar.
";
  };
};
