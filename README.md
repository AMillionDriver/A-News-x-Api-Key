# NewsApp (GNews-powered)

NewsApp adalah aplikasi berita full-stack berbasis Node.js yang menampilkan artikel terkini dari [GNews API](https://gnews.io/). Aplikasi ini dibangun dengan fokus pada kesiapan produksi: server Express menangani permintaan API secara aman, aset frontend dioptimalkan untuk pengalaman pengguna modern, dan pipeline pengujian end-to-end disiapkan menggunakan Playwright.

## Fitur

- 🔒 **API Key aman** – Permintaan ke GNews dilakukan melalui server Node.js sehingga kunci API tidak terekspos di browser.
- ⚡ **Caching sisi server** – Respons berita disimpan sementara untuk mempercepat permintaan berulang dan mengurangi beban API.
- 🌙 **Mode gelap** – Preferensi tema pengguna disimpan di `localStorage` dan mengikuti preferensi sistem secara otomatis.
- 📱 **Responsif** – Navigasi dan tata letak beradaptasi untuk tampilan mobile maupun desktop.
- ✅ **Pengujian end-to-end** – Playwright memverifikasi skenario penting seperti paginasi, mode gelap, dan menu mobile.

## Persyaratan

- Node.js v18.17 atau lebih baru
- npm v9 atau lebih baru
- Akun GNews beserta API key yang masih aktif

## Menjalankan Secara Lokal

1. Instal dependensi:

   ```bash
   npm install
   ```

2. Salin berkas konfigurasi lingkungan:

   ```bash
   cp .env.example .env
   ```

3. Buka `.env` dan isi variabel berikut:

   ```env
   GNEWS_API_KEY=masukkan_api_key_anda
   # Opsional
   # PORT=4173
   # DEFAULT_PAGE_SIZE=9
   # NEWS_CACHE_TTL=300
   # GNEWS_LANGUAGE=id
   ```

4. Build proyek dan jalankan server produksi:

   ```bash
   npm run build
   npm start
   ```

   Server akan berjalan pada `http://localhost:4173` secara bawaan.

5. Selama pengembangan Anda dapat menggunakan mode hot-reload:

   ```bash
   npm run dev
   ```

## Pengujian

Perintah berikut akan melakukan kompilasi TypeScript dan menjalankan skenario Playwright:

```bash
npm test
```

Laporan HTML Playwright dapat ditemukan di direktori `playwright-report/` setelah pengujian dijalankan.

## Struktur Proyek

```
├── public/             # Aset statis yang disajikan ke browser
│   ├── index.html      # Halaman utama
│   └── js/main.js      # Logika frontend
├── src/
│   ├── app.ts          # Inisialisasi Express dan middleware
│   ├── server.ts       # Entry point server HTTP
│   ├── config/         # Konfigurasi lingkungan & konstanta
│   ├── middleware/     # Middleware penanganan error
│   ├── routes/         # Definisi routing API
│   └── services/       # Integrasi dengan layanan eksternal (GNews)
├── tests/              # Skenario Playwright
├── tsconfig.json       # Konfigurasi TypeScript
└── playwright.config.ts# Konfigurasi Playwright
```

## Deployment

1. Jalankan `npm run build` untuk menghasilkan output di direktori `dist/`.
2. Pastikan variabel lingkungan `GNEWS_API_KEY` tersedia di platform deployment Anda.
3. Jalankan aplikasi menggunakan `node dist/server.js` atau proses manager seperti PM2 / Docker.

Dengan struktur ini, NewsApp siap untuk didorong ke layanan hosting Node.js mana pun (Render, Railway, Fly.io, Vercel, dsb) atau dikontainerisasi sesuai kebutuhan.
