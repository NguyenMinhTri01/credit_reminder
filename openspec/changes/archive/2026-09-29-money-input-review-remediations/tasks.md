## 1. MoneyInput editing behavior

- [x] 1.1 [2026-09-28 RA-002; 2026-09-29 RA-006] Preserve a stored negative sign when sanitization leaves amount digits unchanged, while keeping real digit edits and explicit sign deletion effective; add component regressions and verify with `pnpm --filter frontend test -- src/components/ui/money-input.test.tsx`.
- [x] 1.2 [2026-09-29 RA-007] Reject a non-empty digitless replacement of a selected amount while preserving explicit clear; add both `userEvent` cases and verify with `pnpm --filter frontend test -- src/components/ui/money-input.test.tsx`.
- [x] 1.3 [2026-09-29 RA-008] Restore the pre-edit selection after rejecting a multi-digit over-wide paste; assert the unchanged value and caret in a component regression and verify with `pnpm --filter frontend test -- src/components/ui/money-input.test.tsx`.
- [x] 1.4 [2026-09-28 RA-001; 2026-09-29 RA-009] Restrict Delete redirection to a grouping comma so Delete before a leading minus removes only the sign; retain comma deletion coverage and verify with `pnpm --filter frontend test -- src/components/ui/money-input.test.tsx`.

## 2. Maximum display boundary

- [x] 2.1 [2026-09-28 RA-003; 2026-09-29 RA-010] For valid stored values whose rounded magnitude exceeds 13 integer digits, cap the display to the signed maximum whole amount; cover positive and negative round-trip normalization to `.00`, keep existing handling of already over-precision values, and verify with `pnpm --filter frontend test -- src/lib/money-input.utils.test.ts`.

## 3. Transaction fixture type safety

- [x] 3.1 [2026-09-29 RA-004] Replace the partial `unknown` cast with a complete `ITransaction` fixture; verify with `pnpm typecheck:frontend` and `pnpm --filter frontend test -- src/components/cards/transaction-form.test.tsx`.
