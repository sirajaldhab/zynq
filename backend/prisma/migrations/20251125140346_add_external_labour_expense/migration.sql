-- CreateTable
CREATE TABLE "ExternalLabourExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "month" DATETIME NOT NULL,
    "totalLabour" REAL NOT NULL,
    "total" REAL NOT NULL,
    "pmBalance" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalLabourExpense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExternalLabourExpense_vendorId_month_idx" ON "ExternalLabourExpense"("vendorId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalLabourExpense_vendorId_month_key" ON "ExternalLabourExpense"("vendorId", "month");
