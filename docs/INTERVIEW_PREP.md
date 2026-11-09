# ShopVerse – CV Description & Interview Preparation Guide

> **Target Role:** Fresher / Intern Software Engineer  
> **Project:** ShopVerse E-Commerce Platform

---

## 1. CV Description (copy-paste ready)

### Version A – Concise (1 line)
```
Built ShopVerse, a full-stack e-commerce platform (NestJS + React + PostgreSQL) with JWT auth, role-based access control, cart/order flow, VNPAY payment integration, 15 unit tests, Dockerization, and GitHub Actions CI.
```

### Version B – Impact-focused (2–3 lines, recommended for CV Projects section)
```
ShopVerse E-Commerce Platform  |  NestJS · React 18 · PostgreSQL · Docker · GitHub Actions
• Architected a full-stack e-commerce system from scratch: RESTful API (NestJS/TypeScript),
  SPA storefront (React + Vite + Tailwind), and PostgreSQL with Prisma ORM.
• Implemented JWT dual-token authentication, RBAC (Admin/Customer), product search & pagination,
  cart management with Prisma transactions, and VNPAY HMAC-SHA512 payment flow.
• Achieved 100% CI pipeline pass rate with 15 unit tests (Jest), automated via GitHub Actions;
  containerized all services with Docker Compose for one-command local startup.
```

### Version C – With metrics (for senior readers)
```
ShopVerse  |  TypeScript · NestJS · React · PostgreSQL · Docker
Role: Full-Stack Developer (Solo project)
- Designed 8-entity PostgreSQL schema (User, Product, Order, Payment…) with Prisma migrations.
- Implemented Refresh Token Rotation (15 min access / 7 day refresh) to minimize JWT attack surface.
- Built product catalog with dynamic filtering + cursor-based pagination, reducing over-fetching by design.
- Wrote 15 unit tests covering auth, product search, and order-checkout edge cases; CI runs on every PR.
- Containerized via Docker Compose (Postgres + API + Nginx SPA) → reproducible one-command setup.
```

---

## 2. Common Interview Questions & Model Answers

### 🏗 Architecture & Design

**Q1: Tại sao bạn chọn NestJS thay vì Express thuần?**

> NestJS cung cấp kiến trúc module hóa rõ ràng (tương tự Angular), tích hợp sẵn Dependency Injection, và Decorator-based routing giúp code có cấu trúc nhất quán trong team lớn. Ngoài ra, NestJS có hệ sinh thái tốt cho Guards, Interceptors và Pipes – rất phù hợp để implement RBAC và chuẩn hóa response format mà không phải viết middleware thủ công. Express thuần linh hoạt hơn nhưng dễ dẫn đến "Wild West Architecture" khi dự án scale.

---

**Q2: Giải thích sơ đồ kiến trúc dự án của bạn?**

> Dự án theo kiến trúc **3-tier layered**:
> - **Presentation Layer**: React SPA (Vite) chạy trên Nginx, giao tiếp qua REST API + Axios interceptors.
> - **Application Layer**: NestJS server – request đi qua: `Route → Guard (JWT/RBAC) → Interceptor (Transform) → Controller → Service → Prisma → PostgreSQL`.
> - **Data Layer**: PostgreSQL 15+ với Prisma ORM, schema đầy đủ 8 entities có quan hệ FK.
>
> Toàn bộ được Docker Compose orchestrate: 3 services (`postgres`, `server`, `client`) trong cùng internal network, chỉ expose port 80 (client) và 5000 (API) ra ngoài.

---

**Q3: Bạn implement JWT Authentication như thế nào? Tại sao dùng Refresh Token?**

> Dùng **Dual-Token Strategy**:
> - `Access Token` (15 phút): stateless, gửi trong `Authorization: Bearer` header cho mọi request bảo vệ.
> - `Refresh Token` (7 ngày): lưu trong database (hashed), gửi để lấy access token mới khi hết hạn.
>
> **Lý do**: Access token tồn tại ngắn → nếu bị đánh cắp, kẻ tấn công chỉ có 15 phút để dùng. Refresh token dài hơn nhưng được kiểm tra database nên có thể revoke bất cứ lúc nào (logout). Đây là pattern chuẩn của OAuth 2.0.
>
> Trên frontend, Axios `response interceptor` tự động gọi `/auth/refresh` khi nhận `401`, rồi retry request gốc – người dùng không phải login lại thủ công.

---

**Q4: RBAC (Role-Based Access Control) của bạn hoạt động thế nào?**

> Dùng hai custom decorator + guard:
> 1. `@Roles('admin')` decorator đánh dấu route chỉ dành cho admin.
> 2. `JwtAuthGuard` xác minh token, inject `user` vào request.
> 3. `RolesGuard` đọc metadata từ `@Roles()` và so sánh với `request.user.role`.
>
> Nếu không đủ quyền → trả `403 Forbidden`. Toàn bộ logic tách biệt hoàn toàn khỏi business logic ở Service layer.

---

### 🛒 Business Logic & Database

**Q5: Transaction trong checkout flow hoạt động thế nào?**

> Dùng **Prisma Interactive Transaction** (`prisma.$transaction(async (tx) => {...})`):
> 1. Lấy CartItems của user.
> 2. Kiểm tra tồn kho từng sản phẩm.
> 3. Tạo Order + OrderItems.
> 4. Giảm `stock` từng Product.
> 5. Xóa CartItems.
>
> Nếu bất kỳ bước nào fail (ví dụ hết hàng) → Prisma **rollback toàn bộ**, không có trạng thái dở dang. Đây là ví dụ điển hình của ACID transaction.

---

**Q6: Bạn thiết kế database schema thế nào?**

> Schema gồm 8 entities chính:
> - `User` ↔ `CartItem` (1-N), `Order` (1-N), `Review` (1-N)
> - `Product` ↔ `Category` (N-1), `CartItem` (1-N), `OrderItem` (1-N), `Review` (1-N)
> - `Order` ↔ `OrderItem` (1-N), `PaymentTransaction` (1-N)
>
> Tôi dùng **soft-delete pattern** (timestamp `deletedAt`) để không mất dữ liệu lịch sử order khi xóa product. Index được đặt trên các cột hay filter: `Product.slug`, `Product.categoryId`, `Order.userId`.

---

**Q7: Search & Pagination được implement thế nào?**

> **Search**: Dùng Prisma `contains` với mode `insensitive` trên `name` và `description` → tương đương `ILIKE '%keyword%'` trong SQL.
>
> **Filtering**: Build dynamic `where` clause từ query params (categoryId, minPrice, maxPrice, inStock).
>
> **Pagination**: Offset-based với `skip = (page-1) * limit`, response trả về `{data, meta: {total, page, limit, totalPages}}`. Với dataset lớn hơn, nên chuyển sang cursor-based để tránh O(n) offset scan.

---

### 💳 Payment & Security

**Q8: VNPAY integration hoạt động thế nào?**

> Flow:
> 1. User click "Pay" → Backend tạo URL payment với các params theo spec VNPAY + ký HMAC-SHA512.
> 2. User redirect sang trang VNPAY Sandbox.
> 3. Sau thanh toán, VNPAY gọi **IPN Webhook** về server (`POST /payments/vnpay-ipn`).
> 4. Server xác minh chữ ký HMAC-SHA512, cập nhật `PaymentTransaction` và `Order.status`.
> 5. User được redirect về frontend với `ReturnURL` chứa kết quả.
>
> **Lý do verify IPN phía server**: Client-side return URL có thể bị giả mạo; IPN là kênh server-to-server đáng tin cậy.

---

**Q9: Bạn bảo vệ API thế nào ngoài JWT?**

> - **Helmet.js**: Set các HTTP security headers (X-Frame-Options, Content-Security-Policy…).
> - **CORS**: Chỉ cho phép origin từ `CLIENT_URL` env var.
> - **Class-validator**: Validate toàn bộ request body qua DTO + ValidationPipe → reject input xấu trước khi vào service.
> - **bcryptjs**: Hash password với salt rounds 12 → không lưu plaintext.
> - **Environment variables**: Secrets (JWT keys, VNPAY secret) không hardcode vào code.

---

### ⚙️ DevOps & Scaling

**Q10: GitHub Actions CI của bạn làm gì?**

> Khi có push/PR vào `main`:
> 1. Checkout code, setup Node 20.
> 2. Install backend dependencies.
> 3. Run `npm run test` (15 Jest unit tests).
> 4. Run `npm run build` (TypeScript compile).
> 5. Run frontend type check + build.
>
> Nếu bất kỳ bước nào fail → PR bị block, không được merge. Đây là "safety net" tự động.

---

**Q11: Nếu có 10,000 user đồng thời, bạn sẽ scale thế nào?**

> **Ngắn hạn (Vertical)**:
> - Tăng RAM/CPU cho PostgreSQL.
> - Thêm database connection pool (pgBouncer).
>
> **Trung hạn (Horizontal)**:
> - Stateless NestJS server → scale nhiều instances sau **Load Balancer** (Nginx/AWS ALB) dễ dàng.
> - Thêm **Redis** làm cache layer cho product catalog (giảm DB hits).
> - Thêm **Redis** lưu Refresh Token thay vì PostgreSQL (read-heavy).
>
> **Dài hạn (Architecture)**:
> - Tách Payment service thành Microservice riêng.
> - Dùng **Message Queue** (RabbitMQ/Kafka) cho order-payment flow (async, không blocking).
> - **Read replica** PostgreSQL cho reporting queries.
> - **CDN** (Cloudflare) cho static assets.

---

**Q12: Khó khăn kỹ thuật lớn nhất bạn gặp là gì và giải quyết thế nào?**

> **Vấn đề 1 – Refresh Token Race Condition**: Khi nhiều request đồng thời hết hạn Access Token, Axios interceptor có thể gọi `/auth/refresh` nhiều lần song song. Giải quyết bằng cách implement **request queue** – chỉ gọi refresh một lần, các request khác chờ promise resolve rồi retry.
>
> **Vấn đề 2 – VNPAY Signature Verification**: VNPAY yêu cầu sort params theo alphabet trước khi hash. Nếu sai thứ tự → chữ ký không khớp → reject. Debug bằng cách log từng bước của quá trình ký và so sánh với VNPAY test tool.
>
> **Vấn đề 3 – Prisma Transaction với Nested Writes**: Khi tạo Order và update stock trong cùng transaction, cần dùng `tx` instance thay vì `this.prisma` để đảm bảo tất cả operations trong cùng connection → mới đảm bảo atomicity.

---

## 3. Checklist trước buổi phỏng vấn

- [ ] Có thể giải thích sơ đồ kiến trúc trong 2 phút không cần nhìn notes
- [ ] Demo app chạy được trên máy (server + client + DB lên)
- [ ] Mở Swagger UI (`http://localhost:5000/api/docs`) để demo API
- [ ] Mở GitHub repo, chỉ được commit history sạch với conventional commits
- [ ] Mở GitHub Actions tab để show CI pipeline pass
- [ ] Chuẩn bị câu trả lời cho "Bạn sẽ làm gì khác nếu làm lại?"
  - → Thêm Redis cache, viết E2E test với Playwright, dùng Prisma migrations thay db push

---

## 4. "Tell me about yourself" – Project angle

> *"Tôi vừa hoàn thành dự án ShopVerse – một e-commerce platform full-stack sử dụng NestJS ở backend và React ở frontend. Điều tôi tập trung nhất là code quality: mọi tính năng đều có unit test, commit history theo Conventional Commits, CI/CD tự động qua GitHub Actions, và toàn bộ được Docker hóa. Tôi muốn chứng minh rằng dù là project cá nhân, tôi vẫn làm việc theo quy trình của một team chuyên nghiệp."*
