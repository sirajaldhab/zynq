-- CreateTable
CREATE TABLE "SiteDaySalary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "site" TEXT NOT NULL,
    "daySalary" REAL NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteDaySalary_site_key" ON "SiteDaySalary"("site");
