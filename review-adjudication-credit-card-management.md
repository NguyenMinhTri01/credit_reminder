# Báo cáo Thẩm định Code Review (Review Adjudication Report)

**Mã nguồn / Branch:** `feat/credit-card-management`  
**Bản đối chiếu (Base):** `edd0e85` (`main`)  
**Trạng thái thẩm định:** `HOÀN THÀNH` (3/4 đề xuất được chấp thuận và áp dụng)

## 1. Bảng tổng hợp thẩm định (Adjudication Summary)

| ID | Vấn đề reviewer nêu | Phân loại | Đánh giá | Quyết định & Hành động |
|---|---|---|---|---|
| 1.1 | Delta spec bỏ các scenario baseline trong các requirement `MODIFIED` | Spec / Validation | Hợp lý | `ACCEPTED_FIX` — bổ sung scenario và xác minh strict validation |
| 1.2 | Dashboard đọc `currentBalance` deprecated thay vì suy ra từ `creditLimit - availableCredit` | Bug / Architecture | Hợp lý | `ACCEPTED_FIX` — dùng `usedBalance` có fallback và thêm regression test |
| 2.1 | Thiếu unit test riêng cho `card-tile`, `card-form`, `bank-logo` | Test coverage | Khuyến nghị hợp lý nhưng không blocking | `DEFERRED_OUT_OF_SCOPE` — ghi nhận backlog |
| 2.2 | `watch()` trong `CardForm` gây React Compiler warning | Code standard / Performance | Hợp lý, đã tái hiện bằng lint | `ACCEPTED_FIX` — thay bằng `useWatch()` và thêm test preview |

### Thống kê nhanh:

- **Tổng số đề xuất thẩm định:** 4
- **Chấp thuận & Đã sửa (`ACCEPTED_FIX`):** 3
- **Bác bỏ — Nhận định sai kỹ thuật (`REJECTED_FALSE_POSITIVE`):** 0
- **Bác bỏ — Thừa thãi / Over-engineering (`REJECTED_OVER_ENGINEERING`):** 0
- **Hoãn lại — Ngoài phạm vi (`DEFERRED_OUT_OF_SCOPE`):** 1
- **Ghi nhận thông tin / Không tác động code (`INFORMATIONAL_NOTE`):** 1 nhóm praise của reviewer, không tính vào 4 đề xuất trên

## 2. Chi tiết thẩm định từng mục (Deep Dive & Technical Justifications)

### 1.1 — Giữ lại baseline scenarios trong delta spec

- **Phân loại quyết định:** `ACCEPTED_FIX`
- **Ý kiến của Reviewer:** Các requirement `MODIFIED` đã làm mất scenario vẫn tồn tại ở baseline, khiến `openspec validate --strict` thất bại và change không thể archive.
- **Đối chiếu thực tế mã nguồn & Cơ sở dữ liệu:**
  - File: `openspec/changes/credit-card-management/specs/dashboard-overview/spec.md:3-101`
  - Trước khi sửa, validator báo thiếu 2 scenario về due date, 1 scenario về card đầy đủ dữ liệu và 5 scenario về aggregate snapshot.
  - Đây là quy tắc merge delta của OpenSpec, không phụ thuộc runtime database.
- **Lý do chấp thuận:** Khi một requirement được đánh dấu `MODIFIED`, toàn bộ block requirement cũ được thay thế lúc archive. Vì vậy các scenario baseline hợp lệ phải được giữ trong delta spec.
- **Hành động đã thực hiện:** Bổ sung toàn bộ scenario bị thiếu vào ba requirement `MODIFIED`. `openspec validate credit-card-management --strict` hiện trả về `Change 'credit-card-management' is valid`.

### 1.2 — Suy ra used balance từ available credit

- **Phân loại quyết định:** `ACCEPTED_FIX`
- **Ý kiến của Reviewer:** Dashboard đang serialize trực tiếp `card.currentBalance`, trong khi field này deprecated và card mới được cập nhật bằng `availableCredit`; kết quả là Dashboard có thể hiển thị 0 balance/utilization dù `/cards` hiển thị đúng.
- **Đối chiếu thực tế mã nguồn & Cơ sở dữ liệu:**
  - Schema: `backend/prisma/schema.prisma:73-84`
  - `currentBalance` được đánh dấu `@deprecated use availableCredit`; `availableCredit` là field lưu trữ mới.
  - Trước khi sửa, `backend/src/dashboard/dashboard.service.ts` truyền `card.currentBalance` vào `calculateUtilization()` và `aggregateDashboardMoney()`.
  - Dịch vụ tạo card lưu `availableCredit` tại `backend/src/credit-cards/credit-cards.service.ts:141-155`.
- **Lý do chấp thuận:** Với card có limit `100` và available credit `60`, used balance đúng là `40`, không phải giá trị legacy `currentBalance = 0`. Logic mới ưu tiên `creditLimit.minus(availableCredit)` khi cả hai field có dữ liệu; card legacy thiếu một trong hai field vẫn fallback về `currentBalance` để tránh phá dữ liệu cũ.
- **Hành động đã thực hiện:**
  - Thêm `deriveUsedBalance()` tại `backend/src/dashboard/dashboard-money.utils.ts:14-20`.
  - Dùng giá trị này cho card response, card utilization, tổng current balance và aggregate utilization tại `backend/src/dashboard/dashboard.service.ts:79-94` và `backend/src/dashboard/dashboard-money.utils.ts:37-49`.
  - Giữ tổng `availableCredit` dựa trên field lưu trữ, đúng với mô hình D1 trong design.

### 2.1 — Bổ sung unit test cho các card component

- **Phân loại quyết định:** `DEFERRED_OUT_OF_SCOPE`
- **Ý kiến của Reviewer:** Nên thêm test suite riêng cho `card-tile.tsx`, `card-form.tsx` và `bank-logo.tsx` để chống regression UI/form.
- **Đối chiếu thực tế mã nguồn & Cơ sở dữ liệu:**
  - Các component nằm trong `frontend/src/components/cards/` và không có lỗi chức năng hoặc lỗi type/lint được chứng minh bởi finding này.
  - Change đã có test tích hợp dashboard; việc mở rộng coverage riêng cho ba component là một nâng cấp chất lượng hơn là sai lệch spec/blocker.
- **Lý do hoãn:** Phạm vi thẩm định hiện tập trung vào blocker và lỗi được xác minh. Việc xây dựng đầy đủ ba bộ test cần thêm công sức mock UI/mutation và không cần thiết để giải quyết tính đúng đắn của change hiện tại.
- **Hành động đã thực hiện:** Không thay đổi riêng cho finding này; ghi nhận backlog. Một regression test tập trung cho preview ngày trong `CardForm` vẫn được thêm như một phần của finding 2.2.

### 2.2 — Thay `watch()` bằng `useWatch()` trong CardForm

- **Phân loại quyết định:** `ACCEPTED_FIX`
- **Ý kiến của Reviewer:** React Hook Form `watch()` được gọi trực tiếp trong component body và ESLint báo `react-hooks/incompatible-library`; nên dùng `useWatch({ control, name })`.
- **Đối chiếu thực tế mã nguồn & Cơ sở dữ liệu:**
  - File: `frontend/src/components/cards/card-form.tsx:127-165`
  - Lint trước khi sửa tái hiện warning tại `watch('statementDay')`; hai lời gọi `watch()` còn lại cũng cùng API không tương thích với React Compiler.
  - Không liên quan database.
- **Lý do chấp thuận:** Đây là cảnh báo tooling có thể làm React Compiler bỏ qua memoization của component. `useWatch()` giữ nguyên behavior theo dõi form field nhưng tương thích với rule hiện hành.
- **Hành động đã thực hiện:** Thay cả ba lời gọi `watch()` bằng `useWatch()` dùng cùng `control`, đồng thời thêm test `frontend/src/components/cards/card-form.test.tsx:39-65` để xác nhận preview ngày đến hạn cập nhật khi `statementDay` thay đổi.

### 3 — Ghi nhận các điểm reviewer đánh giá tốt

- **Phân loại quyết định:** `INFORMATIONAL_NOTE`
- **Nội dung:** Ghi nhận các nhận xét tích cực về ownership/security, transaction atomicity và idempotency, backend test coverage, và fallback logo. Không có hành động code cần thực hiện thêm.

## 3. Các thay đổi mã nguồn đã thực hiện (Applied Fixes)

- **Spec:** `openspec/changes/credit-card-management/specs/dashboard-overview/spec.md`
  - Bổ sung các scenario baseline bắt buộc cho requirement `MODIFIED`.
- **Backend:** `backend/src/dashboard/dashboard-money.utils.ts`, `backend/src/dashboard/dashboard.service.ts`
  - Suy ra used balance từ `creditLimit - availableCredit`, fallback về `currentBalance` cho dữ liệu legacy.
  - Đồng bộ giá trị card-level và aggregate-level.
- **Backend tests:** `backend/src/dashboard/dashboard-money.utils.spec.ts`, `backend/src/dashboard/dashboard.service.spec.ts`
  - Thêm assertion regression cho card có `currentBalance = 0`, `creditLimit = 100`, `availableCredit = 60`.
- **Frontend:** `frontend/src/components/cards/card-form.tsx`
  - Thay `watch()` bằng `useWatch()` cho schedule và bank selection.
- **Frontend tests/fixtures:** `frontend/src/components/cards/card-form.test.tsx`, `frontend/src/components/dashboard/dashboard-components.test.tsx`, `frontend/src/app/(app)/page.test.tsx`
  - Thêm test preview và cập nhật fixture theo các field bắt buộc của `IDashboardCard`.

## 4. Kết quả kiểm thử & xác minh (Verification Results)

- **OpenSpec strict validation:** ✅ Passed — `openspec validate credit-card-management --strict`
- **Kiểm tra kiểu dữ liệu (Typecheck):** ✅ Passed — `pnpm typecheck` (backend và frontend)
- **Kiểm thử tự động (Unit & Integration Tests):** ✅ Passed — backend `21/21` suites, `197` tests; frontend `56/56` suites, `282` tests
- **Kiểm tra chuẩn mã nguồn (Linter):** ✅ Passed — `pnpm lint`, không có error và warning `watch()` đã được loại bỏ. Còn 4 warning cũ trong auth files, không liên quan change này.
- **Diff hygiene:** ✅ Passed — `git diff --check`

## 5. Kết luận & Khuyến nghị tiếp theo (Final Verdict)

- Hai blocker của review đã được xác minh và sửa đúng phạm vi; Dashboard giờ nhất quán với mô hình `availableCredit` mới và delta spec qua được strict validation.
- Finding 2.2 cũng đã xử lý, không còn warning React Compiler trong `CardForm`.
- Branch đủ điều kiện để tiếp tục quy trình review/approve và archive OpenSpec change. Khuyến nghị backlog riêng: tăng coverage trực tiếp cho `CardTile`, `BankLogo` và các flow mutation của card.
