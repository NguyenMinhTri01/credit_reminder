/*
  Warnings:

  - The primary key for the `reminders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `due_date` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `reminders` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `next_trigger_date` to the `reminders` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `reminders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `reminders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReminderFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'GMAIL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CARD_DUE', 'REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('ZALO', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'FAILED', 'PENDING');

-- DropForeignKey
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_user_id_fkey";

-- DropIndex
DROP INDEX "reminders_due_date_idx";

-- DropIndex
DROP INDEX "reminders_status_idx";

-- DropIndex
DROP INDEX "reminders_user_id_idx";

-- AlterTable
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_pkey",
DROP COLUMN "description",
DROP COLUMN "due_date",
DROP COLUMN "status",
DROP COLUMN "updated_at",
ADD COLUMN     "frequency" "ReminderFrequency",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "next_trigger_date" DATE NOT NULL,
ADD COLUMN     "zalo_message_template" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2),
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "reminders_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "name",
DROP COLUMN "password",
DROP COLUMN "role",
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "zalo_id" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "ReminderStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bank_name" TEXT NOT NULL,
    "card_name" TEXT NOT NULL,
    "card_number_masked" VARCHAR(20),
    "credit_limit" DECIMAL(15,2),
    "current_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "statement_day" INTEGER,
    "due_day" INTEGER,
    "encrypted_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "transaction_date" DATE NOT NULL,
    "description" TEXT,
    "merchant" TEXT,
    "source" "TransactionSource" NOT NULL DEFAULT 'MANUAL',
    "raw_email_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType",
    "channel" "NotificationChannel" NOT NULL DEFAULT 'ZALO',
    "message" TEXT,
    "sent_at" TIMESTAMP(3),
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_connections" (
    "userId" UUID NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "gmail_connections_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "credit_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_connections" ADD CONSTRAINT "gmail_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
