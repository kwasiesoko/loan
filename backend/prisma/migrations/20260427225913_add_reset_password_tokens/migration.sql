-- AlterTable
ALTER TABLE "LoanOfficer" ADD COLUMN "resetPasswordExpires" DATETIME;
ALTER TABLE "LoanOfficer" ADD COLUMN "resetPasswordToken" TEXT;
