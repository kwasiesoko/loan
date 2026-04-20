# 📱 Loan Application System (Mobile-Friendly Web App)

## 🧾 Overview
A **mobile-friendly / responsive loan application system** built with:
- **NestJS** (Backend)
- **Prisma ORM** (Database)
- **JWT Authentication**
- **React + Tailwind CSS** (Frontend)

### 🚀 Features Included
- Loan officer authentication (JWT)
- Customer registration
- Loan creation & interest calculation
- Repayment tracking
- Installment scheduling
- Admin dashboard (analytics)
- WhatsApp/SMS reminders

---

## 🔐 Authentication (JWT)

### Auth Flow
Authorization: Bearer <token>

---

## 🗄️ Prisma Schema

model LoanOfficer {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}

model Customer {
  id              String   @id @default(uuid())
  firstName       String
  lastName        String
  phone           String
  email           String?
  ghanaCardFront  String
  ghanaCardBack   String
  createdAt       DateTime @default(now())
}

---

## 📐 Interest Calculation
monthlyInterest = (amount * rate) / duration

---

## 💳 Installment Schedule
- Monthly breakdown of payments
- Auto-generated due dates

---

## 💰 Repayment Tracking
- Track payments
- Calculate remaining balance

---

## 📊 Admin Dashboard
- Total Loans
- Total Amount
- Repayments
- Outstanding Balance

---

## 📲 Notifications
- WhatsApp reminders
- SMS alerts

---

## 🚀 Setup
npm install
npx prisma init
npm run start:dev

---

## 📌 Summary
A complete loan system with authentication, analytics, and automation.

---

## 🔍 Recommendations

### 🗄️ Complete the Prisma Schema

The current schema only defines `LoanOfficer` and `Customer`. The following models are required to support core features:

```prisma
model Loan {
  id               String   @id @default(uuid())
  customerId       String
  customer         Customer @relation(fields: [customerId], references: [id])
  officerId        String
  officer          LoanOfficer @relation(fields: [officerId], references: [id])
  amount           Float
  interestRate     Float
  durationMonths   Int
  monthlyPayment   Float
  totalRepayable   Float
  status           LoanStatus @default(ACTIVE)
  disbursedAt      DateTime @default(now())
  createdAt        DateTime @default(now())
  installments     Installment[]
  repayments       Repayment[]
}

model Installment {
  id        String   @id @default(uuid())
  loanId    String
  loan      Loan     @relation(fields: [loanId], references: [id])
  dueDate   DateTime
  amount    Float
  paid      Boolean  @default(false)
  paidAt    DateTime?
}

model Repayment {
  id        String   @id @default(uuid())
  loanId    String
  loan      Loan     @relation(fields: [loanId], references: [id])
  amount    Float
  paidAt    DateTime @default(now())
  note      String?
}

model Notification {
  id         String   @id @default(uuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  type       NotificationType
  message    String
  sentAt     DateTime @default(now())
  status     String   @default("SENT")
}

enum LoanStatus {
  ACTIVE
  COMPLETED
  DEFAULTED
  CANCELLED
}

enum NotificationType {
  WHATSAPP
  SMS
}
```

---

### 💰 Clarify the Interest Model

The current formula `monthlyInterest = (amount * rate) / duration` is a **flat-rate** model — interest is calculated on the original principal for every installment, regardless of how much has been repaid.

Consider whether a **reducing-balance** model is more appropriate:

| Model | Description | Monthly Payment |
|---|---|---|
| Flat rate | Interest on full principal always | Higher total cost to borrower |
| Reducing balance | Interest on outstanding balance only | Lower total cost; fairer |

Flat-rate is common in Ghanaian microfinance but should be clearly disclosed to borrowers. Whichever model you choose, document it explicitly and display total repayable amount at loan creation.

---

### 🔐 Security Hardening

- **Password hashing**: Use `bcrypt` (cost factor 12+) before storing any passwords. Never store plaintext.
- **Rate limiting**: Apply `@nestjs/throttler` to auth endpoints to prevent brute-force attacks.
- **JWT expiry**: Set short-lived access tokens (15–60 min) and implement refresh token rotation.
- **Ghana Card image access**: Do not expose raw file URLs publicly. Serve documents through a signed/authenticated endpoint only accessible to authorised officers.
- **Input validation**: Use `class-validator` DTOs on all incoming request bodies to prevent injection and malformed data.

---

### 📁 File Storage for KYC Documents

The `ghanaCardFront` and `ghanaCardBack` fields are strings (URLs), but the upload pipeline is not defined. Choose one approach:

- **Cloud storage** (recommended): Upload to AWS S3, Cloudinary, or Supabase Storage. Store only the signed URL or object key in the database.
- **Local storage** (simple but risky): Store files on disk with a unique filename. Add a static file serve guard behind JWT auth. Not recommended for production.

Also enforce file type validation (accept only `image/jpeg`, `image/png`, `application/pdf`) and set a max upload size (e.g. 5MB) to prevent abuse.

---

### 👥 Role-Based Access Control (RBAC)

Currently there is only one user type (`LoanOfficer`). You will likely need at minimum:

- **Admin**: Can manage loan officers, view all analytics, configure system settings.
- **Loan Officer**: Can register customers, create loans, record repayments, view own portfolio.

Add a `role` field to `LoanOfficer` and use NestJS Guards + Decorators (`@Roles('admin')`) to enforce access at the route level.

---

### ⏰ Background Job Scheduler

WhatsApp/SMS reminders require a scheduler to run automatically. Add `@nestjs/schedule` to the project:

```bash
npm install @nestjs/schedule
```

Example cron job to send daily overdue reminders:

```typescript
@Cron('0 9 * * *') // Every day at 9:00 AM
async sendOverdueReminders() {
  const overdueInstallments = await this.prisma.installment.findMany({
    where: { paid: false, dueDate: { lt: new Date() } },
    include: { loan: { include: { customer: true } } }
  });
  for (const installment of overdueInstallments) {
    await this.notificationService.sendReminder(installment);
  }
}
```

---

### 📊 Admin Dashboard — Recommended Metrics

Extend the dashboard beyond basic totals with actionable metrics:

| Metric | Description |
|---|---|
| Portfolio At Risk (PAR) | % of loans with payments overdue > 30 days |
| Collection Rate | Repayments received / repayments due this month |
| Default Rate | Defaulted loans / total loans disbursed |
| Average Loan Size | Total disbursed / number of loans |
| Officer Performance | Loans and repayments per officer |

---

### 🧪 Testing Strategy

- **Unit tests**: Test the interest calculation, installment generation, and repayment balance logic with `Jest`.
- **E2E tests**: Use `@nestjs/testing` + `supertest` to test auth flows and loan creation end-to-end.
- **Seed data**: Create a `prisma/seed.ts` file with realistic test data (officers, customers, loans in various states) to speed up development.

---

### 🚀 Deployment Checklist

- [ ] Set `DATABASE_URL`, `JWT_SECRET`, and notification API keys as environment variables (never hardcode)
- [ ] Use `prisma migrate deploy` (not `prisma db push`) in production
- [ ] Enable HTTPS — required for WhatsApp Business API webhooks
- [ ] Add database backups (daily at minimum)
- [ ] Set `NODE_ENV=production` and disable stack traces in error responses
