-- CreateEnum
CREATE TYPE "wallet_type" AS ENUM ('cash', 'bank', 'e_wallet', 'other');

-- CreateEnum
CREATE TYPE "category_type" AS ENUM ('expense', 'income');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('expense', 'income', 'transfer');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "type" "wallet_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "category_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_events" (
    "id" TEXT NOT NULL,
    "type" "transaction_type" NOT NULL,
    "note" TEXT,
    "category_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postings" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "postings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "wallets_user_id_idx" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_name_type_key" ON "wallets"("user_id", "name", "type");

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_name_type_key" ON "categories"("user_id", "name", "type");

-- CreateIndex
CREATE INDEX "transaction_events_category_id_idx" ON "transaction_events"("category_id");

-- CreateIndex
CREATE INDEX "transaction_events_occurred_at_idx" ON "transaction_events"("occurred_at");

-- CreateIndex
CREATE INDEX "postings_event_id_idx" ON "postings"("event_id");

-- CreateIndex
CREATE INDEX "postings_wallet_id_idx" ON "postings"("wallet_id");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_events" ADD CONSTRAINT "transaction_events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postings" ADD CONSTRAINT "postings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "transaction_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postings" ADD CONSTRAINT "postings_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
