-- CreateTable
CREATE TABLE "ManpowerRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "main_contractor" TEXT,
    "totalLabour" REAL NOT NULL,
    "dailyRate" REAL NOT NULL,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ManpowerRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ManpowerRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ManpowerRecord_projectId_vendorId_idx" ON "ManpowerRecord"("projectId", "vendorId");
