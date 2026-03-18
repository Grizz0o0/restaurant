# Restaurant Management Monorepo

Đây là hệ thống quản lý nhà hàng Fullstack sử dụng kiến trúc Monorepo (quản lý bằng [Turborepo](https://turbo.build/repo/docs) và [pnpm](https://pnpm.io/workspaces)).

## 🏗 Kiến trúc Monorepo

Hệ thống được chia thành các ứng dụng (apps) và gói chia sẻ (packages) độc lập để dễ bảo trì và tái sử dụng code:

### Apps

- `apps/web`: Ứng dụng Frontend cho khách hàng đặt món và dashboard cho quản trị viên (Next.js 14, App Router, tRPC React).
- `apps/api`: REST API backend (NestJS) kết hợp `nestjs-trpc` phục vụ API an toàn, định nghĩa chung type với web. Chứa cả thư mục `prisma` để quản lý giao tiếp cơ sở dữ liệu (PostgreSQL).

### Packages (Shared)

- `packages/schema`: Chứa Zod schemas (`*.schema.ts`) dùng chung cho cả backend validation (NestJS/tRPC) và frontend data types.
- `packages/trpc`: Chứa code cấu hình tRPC router, exported types/routers dùng để ghép nối end-to-end type safety.
- `packages/constants`: Các hằng số, metadata phân quyền (`role.constant.ts`, v.v) dùng chung cho cả backend và frontend.
- `packages/ui` (nếu có): Chứa UI components có thể tái sử dụng.
- Vài config packages khác: `packages/eslint-config`, `packages/typescript-config`.

---

## 🛠 Cài đặt & Chạy dự án

### 1. Chuẩn bị biến môi trường

Mỗi môi trường sẽ cần thiết lập `.env` cho cả `apps/api` và `apps/web`. Tham khảo `.env.example` ở mỗi thư mục.

- Sao chép `apps/api/.env.example` thành `apps/api/.env`
- Sao chép `apps/web/.env.example` thành `apps/web/.env`

### 2. Cài đặt Dependencies

Sử dụng `pnpm` từ thư mục gốc:

```bash
pnpm install
```

### 3. Database Migration & Seeding

Ứng dụng backend được quản lý bởi Prisma nằm trực tiếp bên trong `apps/api`.
Đảm bảo đã cấu hình `DATABASE_URL` trong `apps/api/.env` trước khi khởi tạo database và nạp dữ liệu mẫu.

Chạy lần lượt:

```bash
# Push schema lên database
pnpm --filter api db:push

# Generate Prisma client
pnpm --filter api db:generate

# Chạy seed dữ liệu ban đầu cơ bản (Roles, Admin User)
pnpm --filter api db:seed
```

### 4. Chạy môi trường Development

Để chạy đồng thời cả `web` và `api` với hot-reload:

```bash
pnpm run dev
```

- API sẽ chạy tại: `http://localhost:3052`
- Web sẽ chạy tại: `http://localhost:3000`
- Có thể mở Prisma Studio chạy localhost để xem database: `pnpm --filter api db:studio`

### 5. Build & Chạy môi trường Production

Build toàn bộ các apps và packages từ thư mục gốc:

```bash
pnpm run build
```

Sau đó, để chạy Prod cho thiết bị riêng biệt, có thể chạy:

```bash
pnpm --filter api start:prod
pnpm --filter web start
```

---

## 📝 Checklist Biến môi trường

### Môi trường Development:

- [ ] Database credentials (`DATABASE_URL`) trỏ về `localhost` hoặc database cloud development.
- [ ] Chỉnh `NODE_ENV=development`.
- [ ] Các config OAuth, Cloudinary có thể dùng tài khoản test.

### Môi trường Production:

- [ ] Đảm bảo `DATABASE_URL` dùng connection pool hoặc URL database xịn.
- [ ] `NODE_ENV=production`.
- [ ] **Bắt buộc** các giá trị `SECRET_API_KEY`, `AUTH_ACCESS_TOKEN_SECRET`, `AUTH_REFRESH_TOKEN_SECRET`, và `JWT_SECRET` phải thiết lập dạng chuỗi bảo mật ngẫu nhiên mạnh.
- [ ] Firebase ID & private key trỏ đúng project production.
- [ ] Các Webhook của Momo (`MOMO_IPN_URL`, `MOMO_REDIRECT_URL`) phải trỏ về URL public của Web Thay vì `localhost`.

---

## 🛑 Troubleshooting (Xử lý lỗi thường gặp)

### 1. Lỗi Database Connection (`PrismaClientInitializationError`)

- **Triệu chứng:** Console báo không kết nối được DB, server API timeout.
- **Khắc phục:**
  - Kiểm tra `DATABASE_URL` trong `apps/api/.env` đã đúng format chưa (`postgresql://user:pass@host:port/db_name`).
  - Kiểm tra kết nối mạng (thử connect trực tiếp nếu deploy backend bằng vercel).
  - Nếu báo vượt quá số connection pool limit, hãy xem biến `DATABASE_URL_POOL_MAX`.

### 2. Authentication Secret (`jwt malformed` / `invalid signature`)

- **Triệu chứng:** Không login được do token decode lỗi hoặc server API crash lúc khởi tạo module do thiếu JWT_SECRET.
- **Khắc phục:**
  - Đồng bộ `AUTH_ACCESS_TOKEN_SECRET` và `AUTH_REFRESH_TOKEN_SECRET` giữa code và `.env`.
  - Thay đổi JWT secret đồng nghĩa mọi token cũ sẽ logout (refresh token mất tác dụng).

### 3. Cloudinary Upload thất bại

- **Triệu chứng:** Client không hiển thị hình ảnh hoặc thao tác upload báo lỗi API `400/401 Unauthorized`.
- **Khắc phục:**
  - `CLOUD_NAME`, `CLOUD_API_KEY`, và `CLOUD_API_SECRET` ở `apps/api/.env` cần đồng bộ 100%. Tốt nhất là dùng copy paste từ dashboard cloudinary, và đừng quên set `CLOUD_URL`.

### 4. Lỗi Firebase (Notification/Auth)

- **Triệu chứng:** Console server báo `Invalid URL` hoặc mã `Credential implementation provided to initializeApp() is invalid`.
- **Khắc phục:**
  - Đảm bảo biến `FIREBASE_PRIVATE_KEY` được escape đúng (vd `\n` cho newline).
  - Hoặc nếu chạy docker, truyền dấu nháy `""` bọc ngoài biến môi trường private key đa phần sẽ giải quyết được vấn đề JSON parse lỗi.

### 5. Lỗi Tích hợp MoMo (Invalid Signature)

- **Triệu chứng:** Thanh toán Momo báo lỗi `Chữ ký không hợp lệ`.
- **Khắc phục:**
  - Đảm bảo `MOMO_ACCESS_KEY` và `MOMO_SECRET_KEY` lấy chính xác từ cổng merchant (chú ý môi trường Test vs Prod của MoMo).
  - Việc build chuỗi chữ ký (`signature`) phải theo sát hướng dẫn chính thức, đúng thứ tự param và sử dụng HMAC-SHA256 chuẩn.

---

## 📌 Kế hoạch hoàn thiện dự án

### Giai đoạn 1: Hoàn thiện nền tảng kỹ thuật

- [ ] Chuẩn hóa toàn bộ `.env.example` cho `apps/api` và `apps/web`, mô tả rõ biến bắt buộc/tùy chọn.
- [ ] Xây dựng script kiểm tra biến môi trường trước khi start (`prestart env validation`).
- [ ] Chuẩn hóa migration/seed Prisma cho nhiều môi trường (dev, staging, prod).
- [ ] Thiết lập logging tập trung (request log, error log) và correlation ID cho API.

### Giai đoạn 2: Hoàn thiện chức năng cốt lõi

- [ ] Xác nhận luồng phân quyền đầy đủ theo vai trò (Admin/Manager/Staff/Customer).
- [ ] Rà soát end-to-end các module chính: auth, menu, order, payment, notification.
- [ ] Bổ sung trạng thái đơn hàng và timeline xử lý rõ ràng cho dashboard vận hành.
- [ ] Hoàn thiện cơ chế xử lý lỗi nghiệp vụ đồng nhất giữa API và web (error code + message).

### Giai đoạn 3: Nâng cao chất lượng sản phẩm

- [ ] Bổ sung unit test cho business logic quan trọng (service/router/schema).
- [ ] Bổ sung integration test cho API (auth, order, payment webhook).
- [ ] Thiết lập smoke test cho web theo các hành trình chính (đăng nhập, đặt món, thanh toán).
- [ ] Áp dụng CI pipeline: lint, type-check, test, build trước khi merge.

### Giai đoạn 4: Bảo mật và vận hành

- [ ] Bổ sung rate limit, CORS policy chặt chẽ, và chuẩn hóa security headers.
- [ ] Rà soát vòng đời token (access/refresh), cơ chế revoke và đăng xuất toàn thiết bị.
- [ ] Tích hợp giám sát runtime (APM) và cảnh báo lỗi theo ngưỡng (Sentry/Grafana/Datadog).
- [ ] Viết runbook xử lý sự cố production (DB outage, payment callback fail, queue backlog).

### Giai đoạn 5: Sẵn sàng phát hành

- [ ] Chốt checklist release: versioning, migration plan, rollback plan, changelog.
- [ ] Hoàn thiện tài liệu bàn giao: kiến trúc, API contract, quy trình vận hành.
- [ ] UAT với người dùng nghiệp vụ và thu thập phản hồi để fix trước go-live.
- [ ] Thiết lập KPI sau phát hành: tỷ lệ lỗi đơn hàng, thời gian phản hồi API, tỷ lệ thanh toán thành công.

### Danh sách điều kiện cần có để dự án “hoàn thiện”

- [ ] **Tính năng:** Luồng đặt món và quản trị chạy ổn định, không có blocker nghiệp vụ.
- [ ] **Chất lượng:** Có test tự động ở mức tối thiểu (unit + integration + smoke).
- [ ] **Bảo mật:** Bí mật hệ thống, JWT, webhook signature và phân quyền được kiểm soát.
- [ ] **Vận hành:** Có monitoring, alerting, backup và quy trình xử lý sự cố.
- [ ] **Tài liệu:** README, hướng dẫn deploy, checklist release và runbook đầy đủ.
