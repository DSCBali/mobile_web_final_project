- git clone
- git checkout -b your_name
- modify README dan isi nama kalian seperti di bawah
- git add & commit perubahan readme ke branch kalian

Nama: 

# Server Setup
- cd server
- npm install
- npm run start
- keep the server running while developing

Semua dokumentasi endpoints dari server bisa dilihat [di sini](https://github.com/DSCBali/mobile_web_final_project/blob/master/server/README.md)

# Client Setup
- cd client
- serve

# Berikut hal-hal yang perlu dilakukan

### Reviews
Fetch reviews for each restaurants:
- buka page salah satu detail restaurant
- tampilkan reviews dari restaurant tersebut

### Offline
- Setup service worker (workbox optional)
- Setup IndexedDb
- Save to DB for every get request
- Sync new reviews (sudah disiapkan contoh codenya silahkan dilihat [di sini](https://github.com/DSCBali/mobile_web_final_project/blob/master/client/service-worker.js))

### Responsive 
- Setup breakpoints
  - max width 600px
  - between 600px & 960px
  - min width 960px

- Usage of img srcsets & picture tag (for webp support)


## Notes
Pengumpulan paling lambat adalah 19 Agustus 2018.
Semua hasil kalian silahkan di push ke branch masing-masing.
Jika sudah dikumpul branch kalian akan dihapus di sini supaya yang lain tidak bisa menyontek.

Semua hasil karya kalian nanti akan digabungkan menjadi satu dan akan ditampilkan di http://gdgbali.com/showcase.

Bagi hasil yang paling bagus akan diundang untuk berbicara sedikit tentang final projectnya di GDG Devfest 2018 pada november nanti.
