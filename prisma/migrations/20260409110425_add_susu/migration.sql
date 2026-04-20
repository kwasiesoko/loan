-- CreateTable
CREATE TABLE "SusuContribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "SusuContribution_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SusuContribution_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "LoanOfficer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
