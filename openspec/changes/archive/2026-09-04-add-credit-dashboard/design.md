## Context

Xem `proposal.md` để biết động lực. Project là monorepo pnpm gồm Next.js 16 App Router và NestJS 11/Prisma 7. `/home` hiện là placeholder nhưng đã được middleware bảo vệ và là đích redirect sau đăng nhập. Prisma đã có `CreditCard` và `Reminder`, tuy nhiên backend mới chỉ đăng ký `AuthModule`; chưa có API dashboard, cards hoặc reminders.

Frontend đã dùng React Server Components, Auth.js, next-intl, Tailwind CSS v4 và shadcn/ui style `new-york`, base `radix`. Component registry hiện có `Card`, `Button`, `Alert`, `Avatar`, `Badge`, `Separator` và một số primitive khác; chưa có `Sidebar`, `Progress`, `Empty`, `Skeleton`, `DropdownMenu` và `InputGroup`. Theme dùng Geist cùng các semantic tokens nâu/kem/trung tính trong `globals.css`, bao gồm tokens cho light/dark mode.

Ảnh tham chiếu là nguồn định hướng thứ bậc và mật độ bố cục, không phải yêu cầu sao chép màu gradient hoặc pixel-perfect. Các hành vi kiểm thử được định nghĩa trong `specs/dashboard-overview/spec.md`.

## Goals / Non-Goals

**Goals:**

- Một request đọc cung cấp đủ dữ liệu cho toàn bộ dashboard, không tạo waterfall giữa KPI, thẻ và nhắc nhở.
- Giữ JWT và lọc `userId` ở mọi truy vấn backend; không nhận user id từ query/body.
- Tách shell, sections, domain cards, formatting và state views thành các abstraction có thể tái sử dụng khi các page Cards/Reminders được phát triển sau này.
- Server-render phần dữ liệu chính để tận dụng RSC, giữ client boundary nhỏ cho sidebar mobile và account menu.
- Dùng shadcn/ui chính thức trước, chỉ custom component bằng composition và variant khi primitive không biểu đạt được domain.
- Giữ bố cục hiện đại nhưng tiết chế theo Geist và semantic tokens hiện hữu, hoạt động ở light/dark theme và đáp ứng accessibility cơ bản.

**Non-Goals:**

- Không thêm/sửa/xóa thẻ hoặc nhắc nhở; không form và không mutation endpoint.
- Không triển khai tìm kiếm, page Cards, Reminders, History, Settings hoặc hành vi của các nav item tương ứng.
- Không triển khai chart lịch sử, đồng bộ giao dịch, Gmail/Zalo, theme switcher hay real-time refresh.
- Không thay đổi Prisma schema, seed production hoặc logic nghiệp vụ thanh toán.
- Không sao chép nguyên màu sắc rực, gradient hoặc floating action buttons của ảnh tham chiếu nếu chúng xung đột với design tokens của project.

## Decisions

### 1. Giữ dashboard tại `/home` và tạo protected application layout

`/home` tiếp tục là route dashboard vì Auth.js và proxy đã redirect người dùng đã đăng nhập đến đây. Tạo route group/layout dành cho vùng authenticated để `AppShell` có thể dùng lại cho các page tương lai mà không lặp header/sidebar.

Shell gồm:

- `AppSidebar`: Dashboard active; Cards, Reminders, History và Settings hiển thị disabled/“coming soon”.
- `AppHeader`: brand, ô tìm kiếm disabled có nhãn sắp ra mắt, avatar và account menu dùng dữ liệu session hiện có.
- `SidebarProvider`/`SidebarInset` của shadcn để cùng một cấu trúc điều hướng chuyển sang mobile sheet mà không dựng hai menu riêng.

Phương án đổi route thành `/dashboard` bị loại vì làm thay đổi redirect và tạo hai URL cho cùng một capability mà không mang lại giá trị trong scope hiện tại.

### 2. Một endpoint tổng hợp `GET /api/v1/dashboard`

Tạo `DashboardModule`, `DashboardController` và `DashboardService`. Controller dùng `AuthGuard('jwt')`, lấy `req.user.id` từ strategy hiện có và không chấp nhận user id từ client. Service thực hiện hai truy vấn chọn trường tối thiểu:

1. Tất cả thẻ thuộc user, sắp xếp ổn định theo `createdAt`, để vừa tạo danh sách vừa tính summary từ đúng cùng dữ liệu.
2. Tối đa năm reminder thuộc user với `isActive = true` và `nextTriggerDate >= today`, sắp xếp `nextTriggerDate ASC`, sau đó `createdAt ASC` để phá hòa.

Hai truy vấn độc lập được chạy song song. Không dùng các endpoint cards/reminders riêng vì dashboard sẽ tạo waterfall và có nguy cơ các tổng số không khớp với danh sách đang render.

Response contract:

```ts
interface DashboardSnapshot {
  generatedAt: string
  summary: {
    cardCount: number
    totalCreditLimit: string
    totalCurrentBalance: string
    availableCredit: string
    utilizationPercent: number | null
    hasUnknownLimits: boolean
  }
  cards: Array<{
    id: string
    bankName: string
    cardName: string
    cardNumberMasked: string | null
    creditLimit: string | null
    currentBalance: string
    availableCredit: string | null
    utilizationPercent: number | null
    nextDueDate: string | null
    daysUntilDue: number | null
  }>
  upcomingReminders: Array<{
    id: string
    title: string
    amount: string | null
    frequency: 'MONTHLY' | 'QUARTERLY' | 'ONE_TIME' | null
    nextTriggerDate: string
  }>
}
```

Tiền tệ được serialize thành chuỗi thập phân hai chữ số để tránh mất chính xác từ Prisma `Decimal` qua JSON. Frontend chỉ parse để định dạng hiển thị, không dùng số đã parse cho nghiệp vụ ghi.

Phương án tạo ba endpoint summary/cards/reminders bị loại do tăng request và lặp điều kiện bảo mật. Phương án dùng endpoint GraphQL bị loại vì project hiện dùng REST và dashboard không cần query linh hoạt.

### 3. Quy tắc tổng hợp xử lý hạn mức chưa biết

- `totalCreditLimit`: tổng các `creditLimit` khác null.
- `totalCurrentBalance`: tổng `currentBalance` của tất cả thẻ.
- `availableCredit`: tổng `(creditLimit - currentBalance)` chỉ của các thẻ có hạn mức.
- `utilizationPercent`: `sum(currentBalance của thẻ có hạn mức) / totalCreditLimit * 100`; trả `null` khi tổng hạn mức bằng 0.
- `hasUnknownLimits`: true khi có ít nhất một thẻ thiếu hạn mức để UI có thể giải thích rằng KPI hạn mức không bao phủ toàn bộ thẻ.
- Giá trị tiền và phần trăm thực không bị clamp. Chỉ giá trị truyền vào visual progress bar được clamp về `[0, 100]`; label vẫn phản ánh số thực và trạng thái vượt hạn mức dùng semantic destructive variant.

Phương án coi hạn mức null là 0 bị loại vì sẽ tạo phần trăm sử dụng gây hiểu nhầm. Phương án bỏ dư nợ của thẻ thiếu hạn mức khỏi tổng dư nợ bị loại vì che giấu nghĩa vụ thanh toán thực.

### 4. Tính kỳ hạn kế tiếp tập trung ở backend

Một date utility thuần nhận `dueDay`, ngày hiện tại và application timezone. Múi giờ lấy từ `APP_TIME_ZONE`, mặc định `Asia/Ho_Chi_Minh`. Utility chọn tháng hiện tại nếu due day chưa qua, ngược lại chọn tháng kế; nếu due day vượt số ngày tháng thì dùng ngày cuối tháng. Nó trả ngày ISO `YYYY-MM-DD` và chênh lệch theo ngày lịch, không theo số giờ.

Tính tại backend giúp tất cả client có cùng kết quả và dễ unit test các biên cuối tháng/năm. Phương án tính ở browser bị loại vì múi giờ thiết bị có thể làm sai số ngày hiển thị.

### 5. Server-first data loading với state files của App Router

`/home/page.tsx` là async Server Component, gọi `apiClient` server-side để Auth.js tự lấy access token và fetch snapshot với `cache: 'no-store'`. `loading.tsx` render `DashboardSkeleton`; `error.tsx` là client error boundary render `Alert` và nút retry. Cách này không đẩy orchestration của dashboard vào một client component lớn và không cần thêm Zustand/TanStack Query state cho request chỉ-đọc theo lượt điều hướng.

Các client island duy nhất là component shadcn Sidebar cần state responsive và account menu/logout. Dữ liệu snapshot được truyền xuống presentational components bằng typed props.

Phương án dùng `useAuth` rồi truyền token vào TanStack Query bị loại cho change này vì tạo loading flash sau hydration và mở rộng phần cây client. Nếu dashboard cần background refresh hoặc mutations về sau, có thể hydrate snapshot vào Query cache mà không đổi API contract.

### 6. Component map ưu tiên shadcn và composition

Các primitive còn thiếu được thêm bằng `pnpm dlx shadcn@latest add` sau khi kiểm tra `--dry-run`/`--diff`: `sidebar`, `progress`, `empty`, `skeleton`, `dropdown-menu`, `input-group` và các dependency registry tự kéo theo. Primitive hiện có được tái sử dụng, không re-add hoặc copy source.

Domain/component structure dự kiến:

```text
components/
├── layout/
│   ├── app-shell.tsx
│   ├── app-sidebar.tsx
│   ├── app-header.tsx
│   └── account-menu.tsx
└── dashboard/
    ├── dashboard-view.tsx
    ├── summary-grid.tsx
    ├── summary-card.tsx
    ├── credit-card-grid.tsx
    ├── credit-card-tile.tsx
    ├── upcoming-reminders.tsx
    ├── dashboard-empty.tsx
    └── dashboard-skeleton.tsx
```

- `SummaryCard` nhận label/value/supporting text/icon/status; ba KPI dùng chung một component.
- `CreditCardTile` nhận một view model và variant semantic; toàn bộ thẻ dùng cùng markup.
- `UpcomingReminders` chịu trách nhiệm cả list và `Empty`, không tạo hai section khác nhau.
- Mảng navigation và formatter tiền/ngày/phần trăm là module dùng chung, tránh lặp literal và logic.
- Dùng đầy đủ composition `CardHeader/CardTitle/CardDescription/CardContent/CardFooter`, `AvatarFallback`, `DropdownMenuGroup`, `Empty`, `Skeleton`, `Progress`, `Badge`, `Separator` và `Button`.
- `className` chỉ điều khiển layout/responsive; trạng thái màu/typography đi qua variant hoặc semantic token. Không hard-code màu ảnh tham chiếu, không `space-x/y`, không tự dựng progress/empty/badge bằng `div`/`span`.

Phương án làm một component dashboard nguyên khối bị loại vì khó test và lặp lại khi thêm page cards/reminders. Phương án tạo custom primitive thay shadcn bị loại vì làm phân mảnh design system.

### 7. Visual hierarchy bám bố cục tham chiếu nhưng dùng theme hiện tại

- Desktop: header toàn chiều rộng, sidebar bên trái, main content giới hạn chiều rộng hợp lý; summary grid ba cột, card grid tối đa ba cột, reminders toàn chiều rộng.
- Tablet: summary và card grid hai cột; sidebar dùng chế độ thu gọn theo shadcn.
- Mobile: một cột, mobile sidebar sheet, CTA nằm trong section header thay vì floating để không che nội dung.
- Palette: `background`, `card`, `primary`, `secondary`, `muted`, `destructive`, `border`, `chart-*` và sidebar tokens hiện có. Credit card variants dùng các semantic surface/tone đã định nghĩa tập trung, không phát tán hex/rgb trong component.
- Typography: giữ `Geist`; số tiền dùng tabular numerals để các KPI ổn định, kích thước chữ theo hierarchy của project.
- Animation chỉ dùng transition ngắn đã có và tôn trọng reduced motion; không thêm decorative animation.

### 8. Control ngoài scope được thể hiện rõ là chưa khả dụng

Hai CTA “Thêm thẻ” và “Tạo nhắc nhở” là shadcn `Button` ở trạng thái disabled với mô tả “Sắp ra mắt” có thể đọc được. Search input và nav item chưa có route cũng disabled/aria-disabled, không gắn handler rỗng và không tạo link đến trang 404. Dashboard item là nav item duy nhất active.

Cách disabled này được chọn thay vì toast “coming soon” vì toast đòi hỏi một hành vi click dù user đã xác nhận chưa cần handle chi tiết.

### 9. Testing theo contract và ranh giới component

- Backend service tests mock Prisma và bao phủ tổng hợp Decimal, limit null/zero, over-limit, filter/sort/limit reminder và các biên due date.
- Controller tests xác nhận JWT guard metadata, user id lấy từ request và service response được chuyển nguyên vẹn.
- Backend e2e bao phủ 401 và cô lập user khi test database fixture khả dụng.
- Frontend formatter/view-model tests bao phủ VND, null, percent và clamp.
- Component/page tests dùng Testing Library cho happy, loading, empty, error/retry, disabled actions, i18n và accessible names.
- Responsive structure được xác minh bằng semantic roles/classes ở test tự động và checklist thủ công tại mobile/tablet/desktop; không dựa vào snapshot HTML lớn.
- Giữ ngưỡng coverage 90% hiện có và chạy lint, typecheck, unit tests, build cho cả hai workspace.

## Risks / Trade-offs

- [Mô hình chỉ có `dueDay`, không có timezone theo user] → dùng `APP_TIME_ZONE=Asia/Ho_Chi_Minh` tập trung và thiết kế utility để có thể nhận timezone người dùng sau này.
- [Tổng hạn mức không bao phủ thẻ thiếu limit] → trả `hasUnknownLimits` và giữ các giá trị per-card ở trạng thái null, không ngầm coi là 0.
- [Một response có thể lớn nếu user có quá nhiều thẻ] → chỉ select trường cần thiết; dashboard card list chưa phân trang vì số thẻ cá nhân thường nhỏ, bổ sung pagination khi có dữ liệu thực chứng minh cần thiết.
- [shadcn registry hiện tại và component local có thể khác phiên bản] → kiểm tra `info`, `--dry-run` và `--diff`; chỉ add component thiếu, không overwrite component đã custom.
- [UI tiết chế có thể khác màu sắc ảnh tham chiếu] → ưu tiên requirement về màu/font của project; dùng ảnh cho layout, spacing và hierarchy.
- [RSC request lỗi làm toàn page vào error boundary] → shell nằm ở authenticated layout, chỉ content dashboard thay bằng error state và có retry.
- [CTA disabled có thể khiến người dùng hiểu nhầm] → kèm text/tooltip “Sắp ra mắt” và không đặt chúng làm hành động chính duy nhất của empty state.

## Migration Plan

1. Thêm backend endpoint và tests trước; endpoint mới không ảnh hưởng consumer hiện có.
2. Thêm shared frontend contract/formatters và các shadcn primitive thiếu sau khi xem diff.
3. Thêm authenticated shell cùng dashboard components, rồi thay placeholder `/home`.
4. Bổ sung bản dịch và state boundaries; chạy kiểm thử accessibility/responsive thủ công.
5. Chạy toàn bộ lint, typecheck, test coverage và build trước khi merge.

Rollback chỉ cần revert route/layout frontend và gỡ đăng ký `DashboardModule`; không có migration hoặc dữ liệu cần khôi phục. Endpoint mới có thể tạm thời tồn tại mà không ảnh hưởng client cũ nếu frontend được rollback trước.
