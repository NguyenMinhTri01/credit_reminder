## Why

Người dùng đã có dữ liệu thẻ tín dụng và nhắc nhở trong mô hình hệ thống nhưng chưa có một trang tổng quan để nhanh chóng nắm hạn mức, dư nợ, mức sử dụng và các kỳ hạn sắp tới. Dashboard mới cần biến dữ liệu này thành một điểm vào rõ ràng, hiện đại, nhất quán với design system hiện có và dùng được trên cả desktop lẫn thiết bị nhỏ.

## What Changes

- Thay nội dung placeholder của khu vực sau đăng nhập bằng dashboard được bảo vệ, lấy cảm hứng từ bố cục tham chiếu: application shell, điều hướng, khối số liệu tổng quan, danh sách thẻ và khu nhắc nhở sắp tới.
- Cung cấp API backend chỉ-đọc, giới hạn theo người dùng đã xác thực, trả về một payload tổng hợp ổn định cho dashboard.
- Hiển thị tổng hạn mức, tổng dư nợ, hạn mức còn lại, phần trăm sử dụng, số thẻ, chi tiết từng thẻ và các nhắc nhở sắp tới; có trạng thái loading, empty và error rõ ràng.
- Xây dựng giao diện từ shadcn/ui và các component dùng chung theo domain; giữ font Geist, semantic color tokens và hệ theme sáng/tối hiện tại, không sao chép markup hoặc logic giữa các section.
- Bổ sung responsive shell: sidebar trên desktop và điều hướng thu gọn trên màn hình nhỏ, với khả năng thao tác bằng bàn phím và nhãn trợ năng.
- Hiển thị các nút “Thêm thẻ” và “Tạo nhắc nhở” đúng vị trí trong bố cục nhưng chưa gắn hành vi, form, CRUD hoặc API ghi trong change này.
- Bổ sung contract types, bản dịch Việt/Anh và kiểm thử frontend/backend cho các hành vi dashboard.

## Capabilities

### New Capabilities

- `dashboard-overview`: Dashboard cá nhân hóa sau đăng nhập, bao gồm API tổng hợp chỉ-đọc, số liệu tài chính, danh sách thẻ, nhắc nhở sắp tới, application shell và các trạng thái giao diện.

### Modified Capabilities

Không có.

## Impact

- Frontend: route sau đăng nhập hiện tại (`/home`), protected layout, query hook/API client, shared types, i18n messages, reusable dashboard/navigation components và shadcn/ui primitives còn thiếu.
- Backend: module/controller/service dashboard mới, JWT guard, DTO/response types, truy vấn Prisma trên `CreditCard` và `Reminder`, Swagger và unit/e2e tests.
- Database: không yêu cầu thay đổi schema hoặc migration; change chỉ đọc các model hiện có.
- Dependencies: ưu tiên component từ registry chính thức của shadcn; chỉ bổ sung primitive cần thiết qua shadcn CLI, không đưa thêm thư viện giao diện ngoài design system hiện tại.
- Compatibility: không có breaking API; luồng đăng nhập hiện vẫn chuyển người dùng tới `/home`.
