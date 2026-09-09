# Báo cáo thẩm định code review — Credit Card Management

## Phạm vi và kết luận

- Phạm vi: 36 finding trong bản review được cung cấp.
- Nhánh: `feat/credit-card-management`.
- Commit tại thời điểm thẩm định: `560df6e` (`fix(cards): harden balance, validation, and UI after post-review`).
- Kết quả: **27 `ACCEPTED_FIX`**, **1 `REJECTED_FALSE_POSITIVE`**, **8 `DEFERRED_OUT_OF_SCOPE`**.
- Không có finding cần làm rõ thêm hoặc chỉ mang tính thông tin.

Các archive dưới `openspec/changes/archive/` được xem là lịch sử bất biến. Vì vậy, các finding chỉ yêu cầu sửa nội dung archive được ghi nhận nhưng không chỉnh sửa archive. Những contract hiện hành trong `openspec/specs/`, README đang dùng và mã chạy thực tế đã được đồng bộ khi cần.

## Các thay đổi đã thực hiện

### 1. Tính nguyên tử của số dư và biên đối soát

`TransactionsService` khóa và đọc lại card trong cùng transaction bằng `FOR UPDATE`, sau đó đọc lại transaction trước khi kiểm tra immutability và tính delta. Kiểm tra idempotency cũng được lặp lại sau khi lấy lock. Luồng update/delete dùng cùng chiến lược.

`CreditCardsService.reconcile` khóa card, đánh dấu các transaction đã nằm trong baseline bằng `reconciledAt`, cập nhật số dư tuyệt đối, rồi tạo `ADJUSTMENT` có delta có dấu. Luồng transaction không áp dụng `ADJUSTMENT` lần thứ hai.

### 2. Tương thích fallback số dư legacy

Không biến `availableCredit = NULL` thành `0`: NULL vẫn có nghĩa là hạn mức khả dụng chưa biết. Thay vào đó:

- Card mới khởi tạo `currentBalance = creditLimit - availableCredit`.
- Create/update/delete transaction dual-write `availableCredit` và `currentBalance` theo chiều ngược nhau.
- Reconcile đồng bộ `currentBalance` khi có `creditLimit`, còn card không có hạn mức thì giữ fallback hiện có.
- Dashboard chỉ serialize `availableCredit` khi cả `creditLimit` và `availableCredit` đều khác NULL.

### 3. Validation backend và API boundary

- Tắt `enableImplicitConversion` cho body để các DTO chuỗi không nhận nhầm JSON number.
- Giữ chuyển đổi tường minh `@Type(() => Number)` cho query pagination.
- Giới hạn `page` ở `1_000_000`, payment grace ở `366` ngày và expiry year ở `9999`.
- Thêm `ParseUUIDPipe` cho toàn bộ card route có `:id`.

### 4. Frontend và hợp đồng response

- Không biến lỗi fetch server-side thành danh sách rỗng giả.
- Form edit cho phép card legacy thiếu credit limit/schedule; giá trị không đổi hoặc không biết được loại khỏi payload.
- Xóa card name truyền rõ `''`; so sánh money bằng canonical decimal.
- Money input từ chối text/punctuation không hợp lệ và precision quá hai chữ số.
- Dialog xóa chỉ đóng sau khi mutation thành công; `-0` bị từ chối trước API.
- Hook dùng response trực tiếp của API và lấy session token hiện tại khi mutation chạy.
- Sửa nhãn `overLimit` và cập nhật các spec hiện hành về recycle bin, reconciliation và ngày schedule.

## Ma trận quyết định

| # | Quyết định | Root cause / technical justification |
|---:|---|---|
| 1 | `ACCEPTED_FIX` | Đúng: đọc snapshot ngoài transaction tạo TOCTOU với update/delete/reconcile. Đã lock và re-read card/transaction trong transaction; idempotency được kiểm tra lại sau lock. |
| 2 | `DEFERRED_OUT_OF_SCOPE` | Rủi ro trong design archive là hợp lý, nhưng migration hiện hành đã giữ `NULL` bằng `CASE ... ELSE NULL`; không còn defect runtime. Archive không được sửa. |
| 3 | `DEFERRED_OUT_OF_SCOPE` | Đúng về mặt tài liệu lịch sử, nhưng schema và migration hiện hành đã là `NOT NULL DEFAULT CURRENT_TIMESTAMP`; chỉ archive cần sửa nên không làm thay đổi lịch sử. |
| 4 | `ACCEPTED_FIX` | Đúng: dashboard cũ fallback vào `currentBalance`, trong khi chỉ update `availableCredit` sẽ cho số dư cũ. Đã dual-write và khởi tạo `currentBalance` từ limit/available credit. |
| 5 | `ACCEPTED_FIX` | Đúng: catch server fetch rồi truyền `[]` làm mất trạng thái lỗi và tạo empty state giả. Đã để lỗi đi qua error boundary; client vẫn có trạng thái retry cho các lần fetch phía client. |
| 6 | `ACCEPTED_FIX` | Quan sát PostgreSQL về increment trên NULL là đúng, nhưng backfill thành zero sẽ bịa giá trị tài chính. Giữ NULL theo contract unknown-limit và cập nhật `currentBalance` fallback để transaction vẫn được theo dõi. |
| 7 | `DEFERRED_OUT_OF_SCOPE` | Đúng đối với proposal cũ: suffix legacy có thể không trích xuất được. Schema thực tế đã nullable (`String?`), còn DTO vẫn enforce 4 chữ số cho create/update; không sửa archive. |
| 8 | `ACCEPTED_FIX` | Đúng: `reconciledAt` phải có semantics thực tế. Reconcile nay stamp các transaction đã thuộc baseline và cả adjustment; update/delete kiểm tra field này cùng fallback timestamp cũ. |
| 9 | `DEFERRED_OUT_OF_SCOPE` | Mô tả impact trong proposal archive không còn khớp migration thực tế. Migration hiện tại là một migration và giữ unknown limit là NULL; archive được giữ nguyên. |
| 10 | `ACCEPTED_FIX` | Đúng: rule ba loại transaction chỉ áp dụng cho user-created transaction. Spec hiện hành tách `ADJUSTMENT` system-generated. |
| 11 | `ACCEPTED_FIX` | Đúng: reconciliation có thể giảm available credit, nên adjustment phải là signed delta thay vì chịu rule positive amount của manual transaction. |
| 12 | `ACCEPTED_FIX` | Đúng: nếu áp dụng generic transaction effect cho adjustment sẽ double-count. Spec hiện hành ghi rõ direct assignment là balance change duy nhất; code đã tạo adjustment mà không increment lần hai. |
| 13 | `REJECTED_FALSE_POSITIVE` | Không phải bug trong product flow: `findAll` cố ý trả cả soft-deleted card để recycle bin/restore. `CardsPageView` tách active/deleted; detail/dashboard vẫn loại deleted theo đúng vai trò. |
| 14 | `ACCEPTED_FIX` | Đúng về contract mismatch. Spec hiện hành cho phép owner list gồm deleted card để restore và trả `deletedAt`; dashboard chịu trách nhiệm loại khỏi aggregate. |
| 15 | `ACCEPTED_FIX` | Đúng: câu metadata cũ mâu thuẫn với scenario đổi credit limit. Spec đã tách `creditLimit` thành field có thể update và recompute available credit theo used amount được giữ lại. |
| 16 | `ACCEPTED_FIX` | Đúng: expected date của scenario không khớp input. Spec schedule hiện hành dùng cặp ngày `2026-10-06` và `2026-09-11`. |
| 17 | `ACCEPTED_FIX` | Đúng: `|| undefined` làm mất ý định clear name. Edit sheet nay gửi `cardName: ''`, backend nhận đây là update hợp lệ. |
| 18 | `ACCEPTED_FIX` | Đúng: required credit limit chặn metadata-only edit trên card legacy. Edit schema cho phép rỗng; payload chỉ gửi canonical limit khi user thực sự nhập/thay đổi. |
| 19 | `ACCEPTED_FIX` | Đúng: schedule legacy có thể thiếu cả hai field. Edit schema cho phép undefined và sheet không gửi field thiếu, nên các thay đổi metadata khác vẫn lưu được. |
| 20 | `ACCEPTED_FIX` | Đúng: page hữu hạn rất lớn có thể làm phép nhân `skip` mất an toàn. DTO và service cùng giới hạn page trước arithmetic. |
| 21 | `ACCEPTED_FIX` | Đúng: implicit conversion làm numeric JSON amount vượt qua string validator. Đã tắt global implicit conversion; chỉ query pagination có transform tường minh. |
| 22 | `ACCEPTED_FIX` | Đúng: integer schedule/year không nên để trôi tới Prisma. Đã thêm upper bound domain (`366`, `9999`) và custom future-year validator cũng áp dụng giới hạn năm. |
| 23 | `ACCEPTED_FIX` | Cùng root cause với #18 ở tầng form: empty credit limit legacy không phải validation error khi edit. Đã xử lý bằng schema conditional dùng chung. |
| 24 | `DEFERRED_OUT_OF_SCOPE` | Finding chỉ yêu cầu sửa kết luận trong CI design archive. Không thay đổi runtime/source; archive giữ nguyên để bảo toàn lịch sử. |
| 25 | `DEFERRED_OUT_OF_SCOPE` | Đây là wording về lifecycle của command trong post-review design archive, không phải defect chạy ứng dụng. Không chỉnh archive. |
| 26 | `ACCEPTED_FIX` | Đúng: API controller trả card trực tiếp hoặc `{ message }`, không bọc `IApiResponse`. Hook nay dùng generic đúng với payload thực tế. |
| 27 | `ACCEPTED_FIX` | Đúng: Radix default action đóng dialog trước khi async delete xong. Handler gọi `preventDefault` và chỉ clear state khi mutation thành công; lỗi giữ dialog mở. |
| 28 | `ACCEPTED_FIX` | Đúng: `Number('-0.00') >= 0` là true nhưng canonical string vẫn bị backend reject. Validation nay loại mọi canonical string bắt đầu bằng dấu `-`. |
| 29 | `DEFERRED_OUT_OF_SCOPE` | Mismatch tồn tại trong CRUD spec archive, nhưng spec hiện hành đã mô tả rõ list active + deleted cho restore. Archive bất biến nên không sửa bản sao lịch sử. |
| 30 | `ACCEPTED_FIX` | Đúng: available credit không có ý nghĩa dashboard khi credit limit unknown. Serialization nay trả NULL nếu một trong hai field là NULL, khớp aggregate fallback. |
| 31 | `ACCEPTED_FIX` | Đúng, cùng root cause với #21 nhưng áp dụng cụ thể cho update-card DTO. Tắt implicit conversion bảo toàn string contract cho `creditLimit`, `lastFourDigits`, v.v. |
| 32 | `ACCEPTED_FIX` | Đúng: payment grace/year thiếu upper bound trước persistence. Đã thêm `@Max` và giới hạn custom validator. |
| 33 | `ACCEPTED_FIX` | Đúng: mutation function có thể đóng băng token undefined trong lúc hydration. Hook transaction resolve lại `getSession()` tại thời điểm gọi mutation nếu token render hiện tại chưa có. |
| 34 | `DEFERRED_OUT_OF_SCOPE` | Finding chỉ nhắm task archive nhưng README hiện hành đã sửa mô tả GET list gồm active và soft-deleted. Không sửa archive. |
| 35 | `ACCEPTED_FIX` | Đúng: malformed UUID có thể đi tới Prisma và thành 500. Toàn bộ card handlers có `:id` nay dùng `ParseUUIDPipe`. |
| 36 | `ACCEPTED_FIX` | Đúng: `isOverLimit` không phải overdue. Đã thêm key `cards.urgency.overLimit` cho en/vi và dùng đúng key. |

## Kiểm chứng

- `pnpm typecheck`: pass backend và frontend.
- `pnpm test`: pass **21 backend suites / 212 tests** và **69 frontend suites / 345 tests**.
- `pnpm lint`: pass; chỉ còn 4 warning có sẵn ngoài phạm vi trong auth code (`auth.service.ts`, `register.dto.ts`).
- `openspec validate --specs --strict`: 6/6 spec pass.
- `openspec validate --archived --strict`: 7/7 archived change pass.
- `git diff --check`: pass.

## Giới hạn kiểm chứng

Các test hiện có là unit tests với Prisma mock; chưa chạy integration test trên PostgreSQL thật để tạo hai request concurrent. Vì vậy, row-lock/concurrency fix đã được kiểm tra qua contract và mock call assertions, nhưng nên bổ sung integration test dùng database thật nếu CI có môi trường PostgreSQL phù hợp.
