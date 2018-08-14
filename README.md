Nama: Dody Prasetyo 

# Server Setup
- cd server
- npm install
- npm run start
- keep the server running while developing

Semua dokumentasi endpoints dari server bisa dilihat [di sini](https://github.com/DSCBali/mobile_web_final_project/blob/master/server/README.md)

# Client Setup
- cd client
- serve

# Things to do

### Reviews
- [x] Fetch reviews for each restaurants

### Offline
- [x] Setup service worker
- [x] Setup IndexedDb
- [x] Save to DB for every get request
- [x] Sync new reviews
### Responsive 
- [x] Setup breakpoints
  - [x] max width 600px
  - [x] between 600px & 960px
  - [x] min width 960px
  
- [x] Usage of img srcsets & picture tag (for webp support)

Note: Pastikan saat ingin melakukan testing fitur background sync nya, dalam kondisi service worker sudah activated (kunjungan web kedua, atau dengan refresh ulang, atau akses halaman lain)
