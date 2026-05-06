## WMS — Pin NLMT

Skeleton cho WMS theo guide (Next.js App Router + Supabase Auth + Prisma + Vercel).

### Chuẩn bị môi trường

- Copy `.env.example` → `.env.local` và điền Supabase keys + `DATABASE_URL`/`DIRECT_URL`.
- Prisma đang pin **v6.19.3** (để giữ `DATABASE_URL`/`directUrl` trong `prisma/schema.prisma` đúng như guide).
- Với Supabase Pooler/PgBouncer (Vercel/serverless), cần thêm `statement_cache_size=0` vào `DATABASE_URL` để tránh lỗi prepared statement (`42P05` / `26000`).

### Database

```bash
npm run db:push
npm run db:seed
```

### Dev

```bash
npm run dev
```

### Ghi chú triển khai hiện tại

- Middleware đang bảo vệ toàn bộ UI (trừ `/login`). API routes không bị middleware redirect.
- Seed tạo admin deterministic id `11111111-1111-4111-8111-111111111111` và PIN hash cho `admin123` (lưu field `pinHash`).
- Để đăng nhập Supabase ↔ Prisma user mapping đồng bộ `User.id`, bạn cần wire Auth callback/trigger (TODO tiếp theo).

### NPM trên Windows

Nếu `npm install` treo do audit network (`ECONNRESET`), trong repo đã set:

- `npm config set audit false`
- `npm config set fund false`
