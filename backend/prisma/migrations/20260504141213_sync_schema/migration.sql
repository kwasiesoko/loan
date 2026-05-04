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
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "officerId" TEXT,
    CONSTRAINT "Customer_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "LoanOfficer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("createdAt", "email", "firstName", "ghanaCardBack", "ghanaCardFront", "ghanaCardNumber", "id", "lastName", "officerId", "phone", "photo") SELECT "createdAt", "email", "firstName", "ghanaCardBack", "ghanaCardFront", "ghanaCardNumber", "id", "lastName", "officerId", "phone", "photo" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE TABLE "new_Installment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "penaltyAmount" REAL NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Installment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Installment" ("amount", "dueDate", "id", "loanId", "paid", "paidAt", "penaltyAmount") SELECT "amount", "dueDate", "id", "loanId", "paid", "paidAt", "penaltyAmount" FROM "Installment";
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
    "repaymentFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "disbursedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Loan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Loan_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "LoanOfficer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("amount", "createdAt", "customerId", "disbursedAt", "durationMonths", "id", "interestModel", "interestRate", "monthlyPayment", "officerId", "status", "totalRepayable") SELECT "amount", "createdAt", "customerId", "disbursedAt", "durationMonths", "id", "interestModel", "interestRate", "monthlyPayment", "officerId", "status", "totalRepayable" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
CREATE TABLE "new_Repayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Repayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Repayment" ("amount", "id", "loanId", "note", "paidAt") SELECT "amount", "id", "loanId", "note", "paidAt" FROM "Repayment";
DROP TABLE "Repayment";
ALTER TABLE "new_Repayment" RENAME TO "Repayment";
CREATE TABLE "new_SusuContribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SusuContribution_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SusuContribution_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "LoanOfficer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SusuContribution" ("amount", "collectedAt", "customerId", "id", "note", "officerId") SELECT "amount", "collectedAt", "customerId", "id", "note", "officerId" FROM "SusuContribution";
DROP TABLE "SusuContribution";
ALTER TABLE "new_SusuContribution" RENAME TO "SusuContribution";
CREATE TABLE "new_SusuWithdrawal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "withdrawnAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SusuWithdrawal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SusuWithdrawal_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "LoanOfficer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SusuWithdrawal" ("amount", "customerId", "id", "note", "officerId", "status", "withdrawnAt") SELECT "amount", "customerId", "id", "note", "officerId", "status", "withdrawnAt" FROM "SusuWithdrawal";
DROP TABLE "SusuWithdrawal";
ALTER TABLE "new_SusuWithdrawal" RENAME TO "SusuWithdrawal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
