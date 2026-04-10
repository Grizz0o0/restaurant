# Restaurant Frontend Web

Ứng dụng Frontend Next.js này phục vụ cả khách hàng đặt món và người quản trị hệ thống, thuộc kiến trúc monorepo sử dụng [Turborepo](https://turbo.build/repo/docs) và `pnpm`.

Dự án sử dụng cơ chế **App Router** của Next.js 14 và kết nối backend thông qua **tRPC React v11 native** để đảm bảo tích hợp type-safe end-to-end với ứng dụng `apps/api`.

## 🚀 Tính năng nổi bật

- **Next.js 14 App Router**: Hỗ trợ Server-Side Rendering (SSR), Server Components (RSC) tối ưu.
- **tRPC React v11**: Cung cấp React Query hooks type-safe giúp gọi API tự động đồng bộ kết quả từ folder `packages/schema`. Không yêu cầu định nghĩa tay REST clients hay API schemas.
- **Zod Validation**: Types xác thực đầu vào cho form được sử dụng chung từ package schema.
- **Styles**: Tailwind CSS và class-variance-authority, kiến trúc UI shadcn/ui.
- **State Management**: Quản lý global store tĩnh gọn nhẹ qua Zustand, và Async cache thông minh qua React Query (của tRPC).
- **Form Management**: React Hook Form kết hợp Zod schema.

## 🛠 Cài đặt & Môi trường

Hãy luôn ghi nhớ chạy các lệnh `pnpm` từ thư mục gốc của toàn dự án (turborepo root) để tránh rớt `lockfile`.

### 1. Cấu hình biến môi trường

Trong `apps/web/`:

```bash
cp .env.example .env
```

Hãy thiết lập đầy đủ URL kết nối Backend:

- `NEXT_PUBLIC_API_URL`: Trỏ về địa chỉ server API (thường là http://localhost:3052/api).
- Các biến môi trường Public (NEXT*PUBLIC*\*) cho cổng thanh toán / cloudinary / v.v.

### 2. Khởi chạy App

Nếu khởi động cả cụm hệ thống:

```bash
pnpm run dev
```

Hoặc, khởi chạy môi trường web duy nhất để thiết kế linh kiện:

```bash
pnpm run dev --filter web
```

Hệ thống Next.js mặc định lắng nghe ở port `3000`: Mở [http://localhost:3000](http://localhost:3000).

## 📂 Tổ chức thư mục

Tuân thủ kiến trúc ghép linh kiện và feature-sliced:

- `app/`: Định nghĩa URL Routing (Layout, Page, Loading, Error boundary).
- `features/`: Chứa Domain Logic cách ly triệt để. Mỗi tính năng (như Admin, Booking, Menu) sẽ độc lập với module của riêng mình: `components/`, `hooks/`, `schemas/`, `api/`.
- `components/ui/`: Dumb components (Nút, Form input, Dialog, Modal). Định nghĩa tái sử dụng ở cấp toàn trang web.
- `lib/`: Nơi thiết lập tRPC Client (`trpc.ts`), `utils.ts` và các plugin core như config axios (nếu cần fallback REST).
