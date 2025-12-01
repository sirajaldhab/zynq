-- AlterTable
ALTER TABLE "ManpowerRecord" ADD COLUMN "date" DATETIME;

-- CreateIndex
CREATE INDEX "ManpowerRecord_projectId_vendorId_date_idx" ON "ManpowerRecord"("projectId", "vendorId", "date");
