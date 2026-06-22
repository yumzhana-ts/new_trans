-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255),
    "role" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "status" VARCHAR(50),
    "winner_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stars" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "remaining_stars" INTEGER,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_stars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "group_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id","user_id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(255),
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_photos" (
    "id" SERIAL NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "photo_data" BYTEA NOT NULL,
    "content_type" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "dish_name" VARCHAR(255),
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" SERIAL NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "voter_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_challenges_group" ON "challenges"("group_id");

-- CreateIndex
CREATE INDEX "idx_challenges_status" ON "challenges"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_daily_stars" ON "daily_stars"("user_id", "challenge_id", "day");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sessions_token" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "idx_sessions_user" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_photos_submission" ON "submission_photos"("submission_id");

-- CreateIndex
CREATE INDEX "idx_submissions_challenge" ON "submissions"("challenge_id");

-- CreateIndex
CREATE INDEX "idx_submissions_user" ON "submissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_submission_user_challenge" ON "submissions"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_votes_challenge_day" ON "votes"("challenge_id", "day");

-- CreateIndex
CREATE INDEX "idx_votes_submission" ON "votes"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vote_once" ON "votes"("submission_id", "voter_id", "day");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "fk_challenges_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "fk_challenges_winner" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_stars" ADD CONSTRAINT "fk_daily_stars_challenge" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_stars" ADD CONSTRAINT "fk_daily_stars_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "fk_group_members_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "fk_group_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "fk_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "submission_photos" ADD CONSTRAINT "fk_photos_submission" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "fk_submissions_challenge" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "fk_submissions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "fk_votes_challenge" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "fk_votes_submission" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "fk_votes_voter" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
