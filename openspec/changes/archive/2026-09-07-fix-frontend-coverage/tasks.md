## 1. use-bank-catalog tests

- [x] 1.1 Create `frontend/src/hooks/use-bank-catalog.test.ts`: mock `next-auth/react` and
  `@tanstack/react-query`; assert that `useBankCatalog` returns `{ banks: [], isLoading, error }`
  when the session is absent (query disabled) and `{ banks: [...data] }` when the session is
  present (query enabled with the bank-catalog query key)

## 2. use-credit-cards tests

- [x] 2.1 Create `frontend/src/hooks/use-credit-cards.test.ts` with tests for `useCardList`:
  assert query key is `['credit-cards']`, enabled only when `accessToken` is present, returns
  `initialData` when provided
- [x] 2.2 Add tests for `useCreateCard`: assert `mutationFn` calls `apiClient.post` with
  `CREDIT_CARDS_PATH`; assert `onSuccess` invalidates `['credit-cards']` and `['dashboard']`
  query keys and calls `router.refresh()`
- [x] 2.3 Add tests for `useUpdateCard`: assert `mutationFn` calls `apiClient.patch` with the
  card-specific path; assert `onSuccess` invalidates `['credit-cards']`, the card-specific key,
  and `['dashboard']`, and calls `router.refresh()`
- [x] 2.4 Add tests for `useDeleteCard`: assert `mutationFn` calls `apiClient.delete`; assert
  `onSuccess` invalidates the expected keys and calls `router.refresh()`
- [x] 2.5 Add tests for `useRestoreCard`: assert `mutationFn` calls `apiClient.post` with the
  restore path; assert `onSuccess` invalidates the expected keys and calls `router.refresh()`
- [x] 2.6 Add tests for `useReconcileCard`: assert `mutationFn` calls `apiClient.post` with the
  reconcile path; assert `onSuccess` invalidates the expected keys and calls `router.refresh()`

## 3. use-transactions tests

- [x] 3.1 Create `frontend/src/hooks/use-transactions.test.ts` with tests for
  `useTransactionList`: assert query key includes `cardId` and `page`, enabled only when both
  `accessToken` and `cardId` are present
- [x] 3.2 Add tests for `useCreateTransaction`: assert `mutationFn` calls `apiClient.post` with
  the transactions path; assert `onSuccess` invalidates `['credit-cards', cardId]`, `['credit-cards']`,
  and `['dashboard']`, and calls `router.refresh()`
- [x] 3.3 Add tests for `useUpdateTransaction`: assert `mutationFn` calls `apiClient.patch` with
  the transaction-specific path; assert `onSuccess` invalidates the expected keys and calls
  `router.refresh()`
- [x] 3.4 Add tests for `useDeleteTransaction`: assert `mutationFn` calls `apiClient.delete` with
  the transaction-specific path; assert `onSuccess` invalidates the expected keys and calls
  `router.refresh()`

## 4. Verification

- [x] 4.1 Run `TZ=UTC pnpm --filter frontend test:cov` and confirm all metrics meet the relaxed
  thresholds (statements ≥ 80%, branches ≥ 70%, lines ≥ 80%, functions ≥ 75%) and the command
  exits with code 0
- [x] 4.2 Run `openspec validate fix-frontend-coverage --strict` and confirm the change is valid
