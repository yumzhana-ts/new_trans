-- CreateTable
CREATE TABLE "two_factor_credentials" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "secret" VARCHAR(255) NOT NULL,
    "enabled_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_two_factor_credentials_user" ON "two_factor_credentials"("user_id");

-- AddForeignKey
ALTER TABLE "two_factor_credentials" ADD CONSTRAINT "fk_two_factor_credentials_user"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
