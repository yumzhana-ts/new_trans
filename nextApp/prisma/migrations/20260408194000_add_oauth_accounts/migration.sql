-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "provider_user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_oauth_accounts_provider_user" ON "oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_oauth_accounts_user_provider" ON "oauth_accounts"("user_id", "provider");

-- CreateIndex
CREATE INDEX "idx_oauth_accounts_user" ON "oauth_accounts"("user_id");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "fk_oauth_accounts_user"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
