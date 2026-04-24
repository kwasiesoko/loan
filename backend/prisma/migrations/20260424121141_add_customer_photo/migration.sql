-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "ghanaCardNumber" TEXT,
    "ghanaCardFront" TEXT NOT NULL,
    "ghanaCardBack" TEXT NOT NULL,
    "photo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "officerId" TEXT,
    CONSTRAINT "Customer_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "LoanOfficer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("createdAt", "email", "firstName", "ghanaCardBack", "ghanaCardFront", "ghanaCardNumber", "id", "lastName", "officerId", "phone") SELECT "createdAt", "email", "firstName", "ghanaCardBack", "ghanaCardFront", "ghanaCardNumber", "id", "lastName", "officerId", "phone" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
