-- DropIndex
DROP INDEX "feedbacks_message_id_key";

-- CreateIndex
CREATE INDEX "feedbacks_message_id_idx" ON "feedbacks"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_user_id_message_id_key" ON "feedbacks"("user_id", "message_id");
