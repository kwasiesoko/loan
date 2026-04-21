-- CreateTable
CREATE TABLE "SusuWithdrawal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "withdrawnAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    CONSTRAINT "SusuWithdrawal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SusuWithdrawal_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "LoanOfficer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Installment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "penaltyAmount" REAL NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    CONSTRAINT "Installment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Installment" ("amount", "dueDate", "id", "loanId", "paid", "paidAt") SELECT "amount", "dueDate", "id", "loanId", "paid", "paidAt" FROM "Installment";
DROP TABLE "Installment";
ALTER TABLE "new_Installment" RENAME TO "Installment";
CREATE TABLE "new_Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "interestRate" REAL NOT NULL,
    "interestModel" TEXT NOT NULL DEFAULT 'FLAT',
    "durationMonths" INTEGER NOT NULL,
    "monthlyPayment" REAL NOT NULL,
    "totalRepayable" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "disbursedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Loan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Loan_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "LoanOfficer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("amount", "createdAt", "customerId", "disbursedAt", "durationMonths", "id", "interestRate", "monthlyPayment", "officerId", "status", "totalRepayable") SELECT "amount", "createdAt", "customerId", "disbursedAt", "durationMonths", "id", "interestRate", "monthlyPayment", "officerId", "status", "totalRepayable" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
