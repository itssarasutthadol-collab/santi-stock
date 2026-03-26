# สันติพาณิชย์ Stock System

## วิธี Deploy

### 1. ตั้งค่า Supabase
1. สมัคร [supabase.com](https://supabase.com)
2. สร้าง Project ใหม่
3. ไปที่ SQL Editor → วาง `supabase_setup.sql` → Run
4. ไปที่ Settings → API → copy URL และ anon key

### 2. ใส่ Key ใน supabase.js
เปิด `src/supabase.js` แล้วแก้ 2 บรรทัด:
```js
const SUPABASE_URL = 'https://xxxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGc...';
```

### 3. Deploy บน Vercel
1. อัพโหลดโฟลเดอร์นี้ขึ้น GitHub
2. เชื่อม GitHub กับ [vercel.com](https://vercel.com)
3. Deploy — ได้ URL ใช้งานได้ทันที!
