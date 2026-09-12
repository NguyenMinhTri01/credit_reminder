-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('VISA', 'MASTERCARD', 'AMERICAN_EXPRESS', 'JCB', 'NAPAS');

-- AlterTable
ALTER TABLE "credit_cards" ADD COLUMN "card_type" "CardType";
