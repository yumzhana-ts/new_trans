-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified_at" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6),
    "consumed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_email_verification_tokens_token" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_email_verification_tokens_user" ON "email_verification_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "fk_email_verification_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
