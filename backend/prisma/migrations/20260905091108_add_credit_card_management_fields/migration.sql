/*
  Warnings:

  - A unique constraint covering the columns `[card_id,idempotency_key]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EXPENSE', 'PAYMENT', 'REFUND', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "credit_cards" ADD COLUMN     "available_credit" DECIMAL(15,2),
ADD COLUMN     "bank_code" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "expiry_month" INTEGER,
ADD COLUMN     "expiry_year" INTEGER,
ADD COLUMN     "last_four_digits" CHAR(4),
ADD COLUMN     "last_reconciled_at" TIMESTAMP(3),
ADD COLUMN     "payment_due_days_after_statement" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "idempotency_key" UUID,
ADD COLUMN     "reconciled_at" TIMESTAMP(3),
ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'EXPENSE';

-- CreateIndex
CREATE UNIQUE INDEX "transactions_card_id_idempotency_key_key" ON "transactions"("card_id", "idempotency_key");

-- DataMigration: populate available_credit from credit_limit - current_balance
UPDATE "credit_cards"
SET "available_credit" = CASE
  WHEN "credit_limit" IS NOT NULL THEN "credit_limit" - "current_balance"
  ELSE NULL
END
WHERE "available_credit" IS NULL;

-- DataMigration: extract last 4 digits from card_number_masked (pattern: •••• XXXX or **** XXXX)
UPDATE "credit_cards"
SET "last_four_digits" = RIGHT(TRIM("card_number_masked"), 4)
WHERE "card_number_masked" IS NOT NULL
  AND "last_four_digits" IS NULL
  AND "card_number_masked" ~ '[\u2022*]{4} \d{4}$';

-- DataMigration: map known bank_name values to bank_code for unambiguous matches
UPDATE "credit_cards"
SET "bank_code" = CASE
  WHEN LOWER("bank_name") LIKE '%vietcombank%' OR LOWER("bank_name") LIKE '%vcb%' THEN 'vietcombank'
  WHEN LOWER("bank_name") LIKE '%bidv%' THEN 'bidv'
  WHEN LOWER("bank_name") LIKE '%vietinbank%' OR LOWER("bank_name") LIKE '%vietin%' THEN 'vietinbank'
  WHEN LOWER("bank_name") LIKE '%agribank%' THEN 'agribank'
  WHEN LOWER("bank_name") LIKE '%vpbank%' OR LOWER("bank_name") = 'vp bank' THEN 'vpbank'
  WHEN LOWER("bank_name") LIKE '%techcombank%' THEN 'techcombank'
  WHEN LOWER("bank_name") LIKE '%sacombank%' THEN 'sacombank'
  WHEN LOWER("bank_name") LIKE '%vib%' THEN 'vib'
  WHEN LOWER("bank_name") LIKE '%mbbank%' OR LOWER("bank_name") = 'mb bank' OR LOWER("bank_name") = 'mb' THEN 'mbbank'
  WHEN LOWER("bank_name") LIKE '%acb%' THEN 'acb'
  WHEN LOWER("bank_name") LIKE '%uob%' THEN 'uob'
  WHEN LOWER("bank_name") LIKE '%hsbc%' THEN 'hsbc'
  WHEN LOWER("bank_name") LIKE '%standard chartered%' THEN 'standard-chartered'
  WHEN LOWER("bank_name") LIKE '%home credit%' THEN 'home-credit'
  ELSE NULL
END
WHERE "bank_code" IS NULL;
