# Restaurant API Backend

Đây là ứng dụng backend REST API được xây dựng bằng [NestJS](https://nestjs.com/) kết hợp với thiết lập **tRPC v11 native**, nằm trong hệ thống dự án monorepo. Ứng dụng này phục vụ các endpoint cho frontend (`apps/web`), đảm bảo end-to-end type safety và quản lý cơ sở dữ liệu qua [Prisma](https://www.prisma.io/).

## 🚀 Tính năng nổi bật

- **NestJS Framework**: Kiến trúc robust, dễ mở rộng, dựa trên module.
- **tRPC native v11**: Cung cấp các procedure an toàn về kiểu dữ liệu (type-safe). Định nghĩa thư viện chung trong `packages/trpc`.
- **Prisma ORM**: Quản lý PostgreSQL database với migration, generator client mạnh mẽ.
- **Bảo mật**: JWT Auth tĩnh (Access/Refresh Tokens).
- **Phân quyền**: Cơ chế RBAC (Role-Based Access Control) chặt chẽ bằng NestJS Guards/Decorators.
- **Tích hợp**: Cloudinary (Upload ảnh), Firebase (Notification), MoMo (Payment).

## 🛠 Cài đặt & Môi trường

Bắt buộc sử dụng `pnpm` từ thư mục gốc (root) của dự án. Lệnh được sử dụng qua cơ chế `--filter` của Turborepo.

### 1. Các bước cài đặt ban đầu

Bên trong `apps/api`, sao chép cấu hình môi trường:

```bash
cp .env.example .env
```

Hãy đảm bảo bạn thiết lập đầy đủ các biến môi trường quan trọng:

- `DATABASE_URL`
- `SECRET_API_KEY`, `AUTH_ACCESS_TOKEN_SECRET`, `AUTH_REFRESH_TOKEN_SECRET`
- `PORT` (mặc định 3052)

### 2. Quản lý Database với Prisma

Từ thư mục gốc của dự án:

```bash
# Push schema lên db
pnpm --filter api db:push

# Generate client
pnpm --filter api db:generate

# Nạp dữ liệu mặc định (seeding logic phân quyền ban đầu)
pnpm --filter api db:seed
```

Có thể sử dụng lệnh mở giao diện Prisma Studio:

```bash
pnpm --filter api db:studio
```

### 3. Khởi chạy App

Từ thư mục gốc dự án:

```bash
pnpm run dev --filter api
```

Hoặc chạy chung toàn bộ dự án (`api` + `web`):

```bash
pnpm run dev
```

## 📂 Cấu trúc thư mục lõi

- `src/modules/*`: Các module nghiệp vụ cụ thể.
- `src/trpc/`: Quản lý các router và tích hợp tRPC Native v11 cùng NestJS router.
- `prisma/`: Folder chứa `schema.prisma` và lịch sử migrations.
