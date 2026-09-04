## 1. Backend contract và phép tính dùng chung

- [x] 1.1 Khai báo response types cho `DashboardSnapshot`, summary, card và reminder trong backend shared types; xác minh TypeScript compile và Swagger có thể mô tả đầy đủ nullable/decimal-string fields.
- [x] 1.2 Viết date utility thuần cho `nextDueDate`/`daysUntilDue` theo `APP_TIME_ZONE` mặc định `Asia/Ho_Chi_Minh`, bao phủ due day thiếu, đã qua, cuối tháng, tháng 2 và giao năm; xác minh unit tests của utility pass.
- [x] 1.3 Viết monetary aggregation utility bằng Prisma `Decimal` cho limit null/zero, dư nợ âm hoặc vượt hạn mức, `hasUnknownLimits` và serialize hai chữ số thập phân; xác minh unit tests không dùng JavaScript floating-point trong phép tính nghiệp vụ.

## 2. API dashboard chỉ-đọc

- [x] 2.1 Tạo `DashboardService` truy vấn song song cards và tối đa năm upcoming reminders theo `userId`, select đúng trường cần thiết, sort ổn định và map sang contract; xác minh service tests bao phủ happy path, user không có dữ liệu, lọc user khác, reminder inactive/quá hạn và giới hạn năm mục.
- [x] 2.2 Tạo `DashboardController` với `GET /dashboard`, JWT guard và user id chỉ lấy từ authenticated request; xác minh controller tests trả service payload và request thiếu/sai user context không thể chọn user khác.
- [x] 2.3 Tạo `DashboardModule`, đăng ký trong `AppModule` và bổ sung Swagger operation/response/error metadata; xác minh backend module test và Swagger document generation test pass.
- [x] 2.4 Bổ sung e2e coverage cho `GET /api/v1/dashboard`, ít nhất gồm 401 khi thiếu token và dữ liệu được cô lập theo user với fixture phù hợp; xác minh e2e suite pass mà không thay đổi Prisma schema.

## 3. Nền tảng shadcn và frontend contract

- [x] 3.1 Chạy `shadcn info`, tra docs chính thức và kiểm tra `add --dry-run`/`--diff` cho `sidebar`, `progress`, `empty`, `skeleton`, `dropdown-menu`, `input-group` cùng dependency; chỉ add primitive còn thiếu và xác minh không overwrite hoặc duplicate component local.
- [x] 3.2 Review source các component registry vừa thêm theo base Radix và quy tắc shadcn (group composition, accessible title, icon API, semantic tokens, `gap-*`); xác minh lint/typecheck frontend pass sau khi sửa import/vi phạm nếu có.
- [x] 3.3 Khai báo typed frontend `DashboardSnapshot`, mở rộng server-side API request để hỗ trợ `cache: 'no-store'`, và thêm formatter/view-model helpers cho VND, ngày, percent, mask, null và progress clamp; xác minh unit tests bao phủ dữ liệu bình thường, thiếu limit và over-limit.
- [x] 3.4 Bổ sung toàn bộ message keys dashboard/navigation/state vào cả `vi.json` và `en.json`; xác minh test i18n phát hiện key thiếu giữa hai locale và component không hard-code nhãn người dùng nhìn thấy.

## 4. Authenticated application shell

- [x] 4.1 Tạo route group/layout authenticated dùng chung mà vẫn giữ URL `/home`, bao bọc nội dung bằng shadcn `SidebarProvider`/`SidebarInset`; xác minh proxy redirect hiện tại và test route `/home` không bị đổi.
- [x] 4.2 Tạo một navigation config dùng chung và `AppSidebar` với Dashboard active, các feature chưa có route ở trạng thái aria-disabled/“Sắp ra mắt”; xác minh desktop và mobile dùng cùng một danh sách item, không copy markup và không có link 404.
- [x] 4.3 Tạo `AppHeader` từ `InputGroup`, `Avatar` có fallback và `DropdownMenu` đúng group composition; search disabled có accessible description, account menu dùng session hiện có, và component tests xác minh keyboard/accessibility roles.
- [x] 4.4 Tạo `AppShell` responsive cho desktop/tablet/mobile, không gây horizontal page scroll và giữ shell khi child route loading/error; xác minh tests cho responsive classes/landmarks và kiểm tra thủ công các breakpoint chính.

## 5. Dashboard presentation components

- [x] 5.1 Tạo reusable `SummaryCard` và `SummaryGrid` bằng full shadcn `Card` composition và `Progress`; xác minh tests hiển thị đúng các KPI, trạng thái unknown-limit, percent null và over-limit từ typed props.
- [x] 5.2 Tạo một `CreditCardTile` cùng `CreditCardGrid` dùng centralized semantic variants, `Badge`, `Progress` và formatter dùng chung; xác minh tests bao phủ full data, optional data, due date, masked number, over-limit và danh sách rỗng mà không lặp card markup.
- [x] 5.3 Tạo `UpcomingReminders` dùng `Card`, `Separator` và shadcn `Empty`; xác minh tests render đúng thứ tự/tối đa năm item, amount nullable và empty state.
- [x] 5.4 Đặt “Thêm thẻ”, “Tạo nhắc nhở”, search và feature nav ngoài scope ở trạng thái disabled/aria-disabled với nhãn “Sắp ra mắt”; xác minh interaction tests không tạo navigation, mutation request, dialog hoặc form.
- [x] 5.5 Compose `DashboardView` với section headings, CTA đúng vị trí và responsive grid bám hierarchy của ảnh tham chiếu; xác minh component test chỉ cần một snapshot payload và không phát sinh request con theo section.

## 6. Data loading và UI states

- [x] 6.1 Thay placeholder `/home/page.tsx` bằng async Server Component gọi một lần `GET /dashboard` qua server-side API client và truyền payload typed vào `DashboardView`; xác minh page test có bearer token server-side, `no-store` và render dữ liệu thành công.
- [x] 6.2 Tạo `home/loading.tsx` với reusable `DashboardSkeleton` dùng shadcn `Skeleton` theo kích thước các section; xác minh test không render số liệu giả và cấu trúc giữ chỗ bao phủ summary/cards/reminders.
- [x] 6.3 Tạo `home/error.tsx` client boundary dùng shadcn `Alert` và `Button` retry; xác minh test hiển thị thông điệp localize, gọi `reset()` khi thử lại và shell không biến mất.
- [x] 6.4 Xác minh thủ công bằng dữ liệu có thẻ/reminder, dữ liệu rỗng và API lỗi rằng dashboard không hiển thị `NaN`/`Infinity`, không rò dữ liệu user khác và không làm lộ bearer token trong log hoặc DOM.

## 7. Hoàn thiện chất lượng

- [x] 7.1 Audit UI theo quy tắc shadcn: không custom primitive đã có, không raw hex/rgb trong component, không manual dark overrides, không `space-x/y`, icon trong button đúng API, Card/Avatar/Menu/Empty đúng composition; xác minh bằng code review và frontend lint.
- [x] 7.2 Kiểm tra light/dark tokens, contrast, keyboard focus, screen-reader names và reduced-motion; xác minh thủ công ở mobile, tablet, desktop và ghi lại checklist kết quả trong PR/change notes.
- [x] 7.3 Chạy `pnpm lint`, `pnpm typecheck`, `pnpm test`, coverage và `pnpm build`; sửa mọi lỗi liên quan và xác minh backend/frontend tiếp tục đạt ngưỡng coverage toàn cục 90%.
