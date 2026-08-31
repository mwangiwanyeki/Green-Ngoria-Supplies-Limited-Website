-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'RETURN', 'WRITE_OFF', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'COMPLETED', 'PARTIALLY_PAID', 'CREDIT', 'REFUNDED', 'VOIDED');

-- CreateEnum
CREATE TYPE "SaleChannel" AS ENUM ('POS', 'BACK_OFFICE', 'ONLINE');

-- CreateEnum
CREATE TYPE "DebtAccountStatus" AS ENUM ('CURRENT', 'OVERDUE', 'SETTLED', 'WRITTEN_OFF', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "FinancialAccountType" AS ENUM ('CASH', 'BANK', 'MOBILE_MONEY', 'PETTY_CASH', 'RECEIVABLE', 'PAYABLE', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountTransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "VatLeachStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'UNDER_MAINTENANCE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "VatLeachRentalStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "StockPileStatus" AS ENUM ('ACCUMULATING', 'READY_FOR_PROCESSING', 'PROCESSING', 'PROCESSED', 'DEPLETED');

-- CreateEnum
CREATE TYPE "StockPileMovementType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'ADJUSTMENT', 'ASSAY_CORRECTION');

-- CreateEnum
CREATE TYPE "SecurityLogType" AS ENUM ('INCIDENT', 'PATROL', 'ACCESS_DENIED', 'THEFT', 'TRESPASS', 'EQUIPMENT_TAMPERING', 'SHIFT_HANDOVER', 'OTHER');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SecurityLogStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'PROBATION');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "StaffPaymentTerms" AS ENUM ('MONTHLY', 'BIWEEKLY', 'WEEKLY', 'DAILY', 'PER_TASK');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollEntryStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'COMPASSIONATE', 'UNPAID', 'STUDY', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'ABSENT', 'LATE', 'HALF_DAY');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'DENIED');

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "companyName" TEXT;

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemName" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "email" TEXT,
    "county" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "logoUrl" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'KES',
    "currencySymbol" TEXT NOT NULL DEFAULT 'KSh',
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "autoLogoutEnabled" BOOLEAN NOT NULL DEFAULT true,
    "idleTimeoutMinutes" INTEGER NOT NULL DEFAULT 120,
    "warningCountdownSeconds" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "storeId" TEXT,
    "categoryId" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'pcs',
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "costPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "barcode" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "storeId" TEXT,
    "type" "StockMovementType" NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "unitCost" DECIMAL(15,2),
    "reason" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp_customers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "clientId" TEXT,
    "customerNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "company" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "erp_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT,
    "cashierId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "channel" "SaleChannel" NOT NULL DEFAULT 'POS',
    "currency" "Currency" NOT NULL DEFAULT 'KES',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "amountPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amountDue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "amount" DECIMAL(15,2) NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_debt_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "DebtAccountStatus" NOT NULL DEFAULT 'CURRENT',
    "creditLimit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstanding" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalBilled" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "lastPaymentAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customer_debt_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "debtAccountId" TEXT NOT NULL,
    "saleId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "notes" TEXT,
    "receivedById" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "categoryId" TEXT,
    "accountId" TEXT,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'KES',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "receiptUrl" TEXT,
    "incurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancialAccountType" NOT NULL DEFAULT 'CASH',
    "accountNumber" TEXT,
    "provider" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'KES',
    "openingBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "AccountTransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balanceAfter" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
    "recordedById" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vat_leach_units" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "miningSiteId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "location" TEXT,
    "capacityTonnes" DECIMAL(10,2),
    "status" "VatLeachStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vat_leach_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vat_leach_rentals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "vatLeachUnitId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "VatLeachRentalStatus" NOT NULL DEFAULT 'ACTIVE',
    "renterName" TEXT NOT NULL,
    "renterPhone" TEXT,
    "renterEmail" TEXT,
    "renterIdNumber" TEXT,
    "renterLocation" TEXT,
    "rentalRate" DECIMAL(15,2) NOT NULL,
    "depositHeld" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalBilled" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstanding" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'KES',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextPaymentDue" TIMESTAMP(3),
    "lastPaymentAt" TIMESTAMP(3),
    "depositRefunded" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vat_leach_rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vat_leach_payments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "vatLeachRentalId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "isDeposit" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vat_leach_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_piles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "miningSiteId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "oreType" TEXT,
    "mineralType" "MineralType",
    "location" TEXT,
    "status" "StockPileStatus" NOT NULL DEFAULT 'ACCUMULATING',
    "tonnage" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "estimatedGrade" DECIMAL(8,3),
    "estimatedValue" DECIMAL(15,2),
    "currency" "Currency" NOT NULL DEFAULT 'KES',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "stock_piles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_pile_movements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "stockPileId" TEXT NOT NULL,
    "type" "StockPileMovementType" NOT NULL,
    "tonnageDelta" DECIMAL(15,4) NOT NULL,
    "balanceAfter" DECIMAL(15,4) NOT NULL,
    "grade" DECIMAL(8,3),
    "reason" TEXT,
    "recordedById" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_pile_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "miningSiteId" TEXT,
    "reference" TEXT NOT NULL,
    "type" "SecurityLogType" NOT NULL DEFAULT 'INCIDENT',
    "severity" "SecuritySeverity" NOT NULL DEFAULT 'LOW',
    "status" "SecurityLogStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "guardName" TEXT,
    "shift" TEXT,
    "reportedById" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT,
    "staffNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "idNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "position" TEXT,
    "department" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'PERMANENT',
    "paymentTerms" "StaffPaymentTerms" NOT NULL DEFAULT 'MONTHLY',
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "baseSalary" DECIMAL(15,2),
    "currency" "Currency" NOT NULL DEFAULT 'KES',
    "hireDate" TIMESTAMP(3),
    "terminationAt" TIMESTAMP(3),
    "photoUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "totalGross" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "staffCount" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'KES',
    "processedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_entries" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "status" "PayrollEntryStatus" NOT NULL DEFAULT 'PENDING',
    "grossPay" DECIMAL(15,2) NOT NULL,
    "allowances" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(15,2) NOT NULL,
    "daysWorked" INTEGER,
    "overtimeHours" DECIMAL(8,2),
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL DEFAULT 'ANNUAL',
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "workDate" TIMESTAMP(3) NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "hoursWorked" DECIMAL(8,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "status" "VisitorStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "fullName" TEXT NOT NULL,
    "idNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "company" TEXT,
    "purpose" TEXT,
    "hostName" TEXT,
    "vehiclePlate" TEXT,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "notes" TEXT,
    "registeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branches_organizationId_idx" ON "branches"("organizationId");

-- CreateIndex
CREATE INDEX "branches_status_idx" ON "branches"("status");

-- CreateIndex
CREATE INDEX "branches_deletedAt_idx" ON "branches"("deletedAt");

-- CreateIndex
CREATE INDEX "branches_organizationId_status_deletedAt_idx" ON "branches"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "branches_organizationId_code_key" ON "branches"("organizationId", "code");

-- CreateIndex
CREATE INDEX "inventory_categories_organizationId_idx" ON "inventory_categories"("organizationId");

-- CreateIndex
CREATE INDEX "inventory_categories_branchId_idx" ON "inventory_categories"("branchId");

-- CreateIndex
CREATE INDEX "inventory_categories_deletedAt_idx" ON "inventory_categories"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_categories_branchId_name_key" ON "inventory_categories"("branchId", "name");

-- CreateIndex
CREATE INDEX "stores_organizationId_idx" ON "stores"("organizationId");

-- CreateIndex
CREATE INDEX "stores_branchId_idx" ON "stores"("branchId");

-- CreateIndex
CREATE INDEX "stores_deletedAt_idx" ON "stores"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "stores_branchId_name_key" ON "stores"("branchId", "name");

-- CreateIndex
CREATE INDEX "inventory_items_organizationId_idx" ON "inventory_items"("organizationId");

-- CreateIndex
CREATE INDEX "inventory_items_branchId_idx" ON "inventory_items"("branchId");

-- CreateIndex
CREATE INDEX "inventory_items_categoryId_idx" ON "inventory_items"("categoryId");

-- CreateIndex
CREATE INDEX "inventory_items_storeId_idx" ON "inventory_items"("storeId");

-- CreateIndex
CREATE INDEX "inventory_items_deletedAt_idx" ON "inventory_items"("deletedAt");

-- CreateIndex
CREATE INDEX "inventory_items_branchId_deletedAt_quantity_idx" ON "inventory_items"("branchId", "deletedAt", "quantity");

-- CreateIndex
CREATE INDEX "inventory_items_branchId_isActive_deletedAt_idx" ON "inventory_items"("branchId", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_branchId_sku_key" ON "inventory_items"("branchId", "sku");

-- CreateIndex
CREATE INDEX "stock_movements_organizationId_idx" ON "stock_movements"("organizationId");

-- CreateIndex
CREATE INDEX "stock_movements_branchId_idx" ON "stock_movements"("branchId");

-- CreateIndex
CREATE INDEX "stock_movements_itemId_idx" ON "stock_movements"("itemId");

-- CreateIndex
CREATE INDEX "stock_movements_storeId_idx" ON "stock_movements"("storeId");

-- CreateIndex
CREATE INDEX "stock_movements_performedById_idx" ON "stock_movements"("performedById");

-- CreateIndex
CREATE INDEX "stock_movements_branchId_createdAt_idx" ON "stock_movements"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_itemId_createdAt_idx" ON "stock_movements"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "erp_customers_organizationId_idx" ON "erp_customers"("organizationId");

-- CreateIndex
CREATE INDEX "erp_customers_branchId_idx" ON "erp_customers"("branchId");

-- CreateIndex
CREATE INDEX "erp_customers_clientId_idx" ON "erp_customers"("clientId");

-- CreateIndex
CREATE INDEX "erp_customers_deletedAt_idx" ON "erp_customers"("deletedAt");

-- CreateIndex
CREATE INDEX "erp_customers_branchId_deletedAt_createdAt_idx" ON "erp_customers"("branchId", "deletedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "erp_customers_branchId_customerNumber_key" ON "erp_customers"("branchId", "customerNumber");

-- CreateIndex
CREATE INDEX "sales_organizationId_idx" ON "sales"("organizationId");

-- CreateIndex
CREATE INDEX "sales_branchId_idx" ON "sales"("branchId");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateIndex
CREATE INDEX "sales_cashierId_idx" ON "sales"("cashierId");

-- CreateIndex
CREATE INDEX "sales_deletedAt_idx" ON "sales"("deletedAt");

-- CreateIndex
CREATE INDEX "sales_branchId_soldAt_idx" ON "sales"("branchId", "soldAt");

-- CreateIndex
CREATE INDEX "sales_branchId_status_deletedAt_soldAt_idx" ON "sales"("branchId", "status", "deletedAt", "soldAt");

-- CreateIndex
CREATE UNIQUE INDEX "sales_branchId_receiptNumber_key" ON "sales"("branchId", "receiptNumber");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_itemId_idx" ON "sale_items"("itemId");

-- CreateIndex
CREATE INDEX "sale_payments_saleId_idx" ON "sale_payments"("saleId");

-- CreateIndex
CREATE INDEX "sale_payments_paidAt_idx" ON "sale_payments"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "customer_debt_accounts_customerId_key" ON "customer_debt_accounts"("customerId");

-- CreateIndex
CREATE INDEX "customer_debt_accounts_organizationId_idx" ON "customer_debt_accounts"("organizationId");

-- CreateIndex
CREATE INDEX "customer_debt_accounts_branchId_idx" ON "customer_debt_accounts"("branchId");

-- CreateIndex
CREATE INDEX "customer_debt_accounts_status_idx" ON "customer_debt_accounts"("status");

-- CreateIndex
CREATE INDEX "customer_debt_accounts_deletedAt_idx" ON "customer_debt_accounts"("deletedAt");

-- CreateIndex
CREATE INDEX "customer_debt_accounts_branchId_status_dueDate_idx" ON "customer_debt_accounts"("branchId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "debt_payments_organizationId_idx" ON "debt_payments"("organizationId");

-- CreateIndex
CREATE INDEX "debt_payments_branchId_idx" ON "debt_payments"("branchId");

-- CreateIndex
CREATE INDEX "debt_payments_debtAccountId_idx" ON "debt_payments"("debtAccountId");

-- CreateIndex
CREATE INDEX "debt_payments_saleId_idx" ON "debt_payments"("saleId");

-- CreateIndex
CREATE INDEX "debt_payments_receivedById_idx" ON "debt_payments"("receivedById");

-- CreateIndex
CREATE INDEX "debt_payments_branchId_paidAt_idx" ON "debt_payments"("branchId", "paidAt");

-- CreateIndex
CREATE INDEX "expense_categories_organizationId_idx" ON "expense_categories"("organizationId");

-- CreateIndex
CREATE INDEX "expense_categories_branchId_idx" ON "expense_categories"("branchId");

-- CreateIndex
CREATE INDEX "expense_categories_deletedAt_idx" ON "expense_categories"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_branchId_name_key" ON "expense_categories"("branchId", "name");

-- CreateIndex
CREATE INDEX "expenses_organizationId_idx" ON "expenses"("organizationId");

-- CreateIndex
CREATE INDEX "expenses_branchId_idx" ON "expenses"("branchId");

-- CreateIndex
CREATE INDEX "expenses_categoryId_idx" ON "expenses"("categoryId");

-- CreateIndex
CREATE INDEX "expenses_accountId_idx" ON "expenses"("accountId");

-- CreateIndex
CREATE INDEX "expenses_recordedById_idx" ON "expenses"("recordedById");

-- CreateIndex
CREATE INDEX "expenses_deletedAt_idx" ON "expenses"("deletedAt");

-- CreateIndex
CREATE INDEX "expenses_branchId_incurredAt_idx" ON "expenses"("branchId", "incurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_branchId_reference_key" ON "expenses"("branchId", "reference");

-- CreateIndex
CREATE INDEX "financial_accounts_organizationId_idx" ON "financial_accounts"("organizationId");

-- CreateIndex
CREATE INDEX "financial_accounts_branchId_idx" ON "financial_accounts"("branchId");

-- CreateIndex
CREATE INDEX "financial_accounts_type_idx" ON "financial_accounts"("type");

-- CreateIndex
CREATE INDEX "financial_accounts_deletedAt_idx" ON "financial_accounts"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "financial_accounts_branchId_name_key" ON "financial_accounts"("branchId", "name");

-- CreateIndex
CREATE INDEX "account_transactions_organizationId_idx" ON "account_transactions"("organizationId");

-- CreateIndex
CREATE INDEX "account_transactions_branchId_idx" ON "account_transactions"("branchId");

-- CreateIndex
CREATE INDEX "account_transactions_accountId_idx" ON "account_transactions"("accountId");

-- CreateIndex
CREATE INDEX "account_transactions_recordedById_idx" ON "account_transactions"("recordedById");

-- CreateIndex
CREATE INDEX "account_transactions_accountId_occurredAt_idx" ON "account_transactions"("accountId", "occurredAt");

-- CreateIndex
CREATE INDEX "account_transactions_branchId_occurredAt_idx" ON "account_transactions"("branchId", "occurredAt");

-- CreateIndex
CREATE INDEX "vat_leach_units_organizationId_idx" ON "vat_leach_units"("organizationId");

-- CreateIndex
CREATE INDEX "vat_leach_units_branchId_idx" ON "vat_leach_units"("branchId");

-- CreateIndex
CREATE INDEX "vat_leach_units_miningSiteId_idx" ON "vat_leach_units"("miningSiteId");

-- CreateIndex
CREATE INDEX "vat_leach_units_status_idx" ON "vat_leach_units"("status");

-- CreateIndex
CREATE INDEX "vat_leach_units_deletedAt_idx" ON "vat_leach_units"("deletedAt");

-- CreateIndex
CREATE INDEX "vat_leach_units_branchId_status_deletedAt_idx" ON "vat_leach_units"("branchId", "status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "vat_leach_units_branchId_code_key" ON "vat_leach_units"("branchId", "code");

-- CreateIndex
CREATE INDEX "vat_leach_rentals_organizationId_idx" ON "vat_leach_rentals"("organizationId");

-- CreateIndex
CREATE INDEX "vat_leach_rentals_branchId_idx" ON "vat_leach_rentals"("branchId");

-- CreateIndex
CREATE INDEX "vat_leach_rentals_vatLeachUnitId_idx" ON "vat_leach_rentals"("vatLeachUnitId");

-- CreateIndex
CREATE INDEX "vat_leach_rentals_recordedById_idx" ON "vat_leach_rentals"("recordedById");

-- CreateIndex
CREATE INDEX "vat_leach_rentals_status_idx" ON "vat_leach_rentals"("status");

-- CreateIndex
CREATE INDEX "vat_leach_rentals_deletedAt_idx" ON "vat_leach_rentals"("deletedAt");

-- CreateIndex
CREATE INDEX "vat_leach_rentals_branchId_status_deletedAt_nextPaymentDue_idx" ON "vat_leach_rentals"("branchId", "status", "deletedAt", "nextPaymentDue");

-- CreateIndex
CREATE UNIQUE INDEX "vat_leach_rentals_branchId_reference_key" ON "vat_leach_rentals"("branchId", "reference");

-- CreateIndex
CREATE INDEX "vat_leach_payments_organizationId_idx" ON "vat_leach_payments"("organizationId");

-- CreateIndex
CREATE INDEX "vat_leach_payments_branchId_idx" ON "vat_leach_payments"("branchId");

-- CreateIndex
CREATE INDEX "vat_leach_payments_vatLeachRentalId_idx" ON "vat_leach_payments"("vatLeachRentalId");

-- CreateIndex
CREATE INDEX "vat_leach_payments_branchId_paidAt_idx" ON "vat_leach_payments"("branchId", "paidAt");

-- CreateIndex
CREATE INDEX "stock_piles_organizationId_idx" ON "stock_piles"("organizationId");

-- CreateIndex
CREATE INDEX "stock_piles_branchId_idx" ON "stock_piles"("branchId");

-- CreateIndex
CREATE INDEX "stock_piles_miningSiteId_idx" ON "stock_piles"("miningSiteId");

-- CreateIndex
CREATE INDEX "stock_piles_status_idx" ON "stock_piles"("status");

-- CreateIndex
CREATE INDEX "stock_piles_deletedAt_idx" ON "stock_piles"("deletedAt");

-- CreateIndex
CREATE INDEX "stock_piles_branchId_status_deletedAt_idx" ON "stock_piles"("branchId", "status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "stock_piles_branchId_code_key" ON "stock_piles"("branchId", "code");

-- CreateIndex
CREATE INDEX "stock_pile_movements_organizationId_idx" ON "stock_pile_movements"("organizationId");

-- CreateIndex
CREATE INDEX "stock_pile_movements_branchId_idx" ON "stock_pile_movements"("branchId");

-- CreateIndex
CREATE INDEX "stock_pile_movements_stockPileId_idx" ON "stock_pile_movements"("stockPileId");

-- CreateIndex
CREATE INDEX "stock_pile_movements_recordedById_idx" ON "stock_pile_movements"("recordedById");

-- CreateIndex
CREATE INDEX "stock_pile_movements_stockPileId_occurredAt_idx" ON "stock_pile_movements"("stockPileId", "occurredAt");

-- CreateIndex
CREATE INDEX "security_logs_organizationId_idx" ON "security_logs"("organizationId");

-- CreateIndex
CREATE INDEX "security_logs_branchId_idx" ON "security_logs"("branchId");

-- CreateIndex
CREATE INDEX "security_logs_miningSiteId_idx" ON "security_logs"("miningSiteId");

-- CreateIndex
CREATE INDEX "security_logs_reportedById_idx" ON "security_logs"("reportedById");

-- CreateIndex
CREATE INDEX "security_logs_status_idx" ON "security_logs"("status");

-- CreateIndex
CREATE INDEX "security_logs_severity_idx" ON "security_logs"("severity");

-- CreateIndex
CREATE INDEX "security_logs_deletedAt_idx" ON "security_logs"("deletedAt");

-- CreateIndex
CREATE INDEX "security_logs_branchId_status_deletedAt_occurredAt_idx" ON "security_logs"("branchId", "status", "deletedAt", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "security_logs_branchId_reference_key" ON "security_logs"("branchId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "staff_userId_key" ON "staff"("userId");

-- CreateIndex
CREATE INDEX "staff_organizationId_idx" ON "staff"("organizationId");

-- CreateIndex
CREATE INDEX "staff_branchId_idx" ON "staff"("branchId");

-- CreateIndex
CREATE INDEX "staff_userId_idx" ON "staff"("userId");

-- CreateIndex
CREATE INDEX "staff_status_idx" ON "staff"("status");

-- CreateIndex
CREATE INDEX "staff_deletedAt_idx" ON "staff"("deletedAt");

-- CreateIndex
CREATE INDEX "staff_branchId_status_deletedAt_idx" ON "staff"("branchId", "status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_branchId_staffNumber_key" ON "staff"("branchId", "staffNumber");

-- CreateIndex
CREATE INDEX "payroll_runs_organizationId_idx" ON "payroll_runs"("organizationId");

-- CreateIndex
CREATE INDEX "payroll_runs_branchId_idx" ON "payroll_runs"("branchId");

-- CreateIndex
CREATE INDEX "payroll_runs_processedById_idx" ON "payroll_runs"("processedById");

-- CreateIndex
CREATE INDEX "payroll_runs_approvedById_idx" ON "payroll_runs"("approvedById");

-- CreateIndex
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs"("status");

-- CreateIndex
CREATE INDEX "payroll_runs_deletedAt_idx" ON "payroll_runs"("deletedAt");

-- CreateIndex
CREATE INDEX "payroll_runs_branchId_periodYear_periodMonth_status_idx" ON "payroll_runs"("branchId", "periodYear", "periodMonth", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_branchId_periodYear_periodMonth_key" ON "payroll_runs"("branchId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_branchId_reference_key" ON "payroll_runs"("branchId", "reference");

-- CreateIndex
CREATE INDEX "payroll_entries_payrollRunId_idx" ON "payroll_entries"("payrollRunId");

-- CreateIndex
CREATE INDEX "payroll_entries_staffId_idx" ON "payroll_entries"("staffId");

-- CreateIndex
CREATE INDEX "payroll_entries_status_idx" ON "payroll_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_entries_payrollRunId_staffId_key" ON "payroll_entries"("payrollRunId", "staffId");

-- CreateIndex
CREATE INDEX "leave_requests_organizationId_idx" ON "leave_requests"("organizationId");

-- CreateIndex
CREATE INDEX "leave_requests_branchId_idx" ON "leave_requests"("branchId");

-- CreateIndex
CREATE INDEX "leave_requests_staffId_idx" ON "leave_requests"("staffId");

-- CreateIndex
CREATE INDEX "leave_requests_reviewedById_idx" ON "leave_requests"("reviewedById");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_requests_deletedAt_idx" ON "leave_requests"("deletedAt");

-- CreateIndex
CREATE INDEX "leave_requests_branchId_status_deletedAt_endDate_idx" ON "leave_requests"("branchId", "status", "deletedAt", "endDate");

-- CreateIndex
CREATE INDEX "attendance_records_organizationId_idx" ON "attendance_records"("organizationId");

-- CreateIndex
CREATE INDEX "attendance_records_branchId_idx" ON "attendance_records"("branchId");

-- CreateIndex
CREATE INDEX "attendance_records_staffId_idx" ON "attendance_records"("staffId");

-- CreateIndex
CREATE INDEX "attendance_records_branchId_workDate_idx" ON "attendance_records"("branchId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_staffId_workDate_key" ON "attendance_records"("staffId", "workDate");

-- CreateIndex
CREATE INDEX "visitors_organizationId_idx" ON "visitors"("organizationId");

-- CreateIndex
CREATE INDEX "visitors_branchId_idx" ON "visitors"("branchId");

-- CreateIndex
CREATE INDEX "visitors_registeredById_idx" ON "visitors"("registeredById");

-- CreateIndex
CREATE INDEX "visitors_status_idx" ON "visitors"("status");

-- CreateIndex
CREATE INDEX "visitors_deletedAt_idx" ON "visitors"("deletedAt");

-- CreateIndex
CREATE INDEX "visitors_branchId_status_deletedAt_checkInAt_idx" ON "visitors"("branchId", "status", "deletedAt", "checkInAt");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_branchId_badgeNumber_key" ON "visitors"("branchId", "badgeNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_branchId_idx" ON "purchase_orders"("branchId");

-- CreateIndex
CREATE INDEX "purchase_orders_branchId_status_createdAt_idx" ON "purchase_orders"("branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "vendors_branchId_idx" ON "vendors"("branchId");

-- CreateIndex
CREATE INDEX "vendors_branchId_deletedAt_createdAt_idx" ON "vendors"("branchId", "deletedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "inventory_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp_customers" ADD CONSTRAINT "erp_customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp_customers" ADD CONSTRAINT "erp_customers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp_customers" ADD CONSTRAINT "erp_customers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "erp_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_debt_accounts" ADD CONSTRAINT "customer_debt_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_debt_accounts" ADD CONSTRAINT "customer_debt_accounts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_debt_accounts" ADD CONSTRAINT "customer_debt_accounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "erp_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtAccountId_fkey" FOREIGN KEY ("debtAccountId") REFERENCES "customer_debt_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_leach_units" ADD CONSTRAINT "vat_leach_units_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_leach_units" ADD CONSTRAINT "vat_leach_units_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_leach_units" ADD CONSTRAINT "vat_leach_units_miningSiteId_fkey" FOREIGN KEY ("miningSiteId") REFERENCES "mining_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_leach_rentals" ADD CONSTRAINT "vat_leach_rentals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_leach_rentals" ADD CONSTRAINT "vat_leach_rentals_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_leach_rentals" ADD CONSTRAINT "vat_leach_rentals_vatLeachUnitId_fkey" FOREIGN KEY ("vatLeachUnitId") REFERENCES "vat_leach_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_leach_rentals" ADD CONSTRAINT "vat_leach_rentals_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_leach_payments" ADD CONSTRAINT "vat_leach_payments_vatLeachRentalId_fkey" FOREIGN KEY ("vatLeachRentalId") REFERENCES "vat_leach_rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_piles" ADD CONSTRAINT "stock_piles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_piles" ADD CONSTRAINT "stock_piles_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_piles" ADD CONSTRAINT "stock_piles_miningSiteId_fkey" FOREIGN KEY ("miningSiteId") REFERENCES "mining_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pile_movements" ADD CONSTRAINT "stock_pile_movements_stockPileId_fkey" FOREIGN KEY ("stockPileId") REFERENCES "stock_piles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_pile_movements" ADD CONSTRAINT "stock_pile_movements_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_miningSiteId_fkey" FOREIGN KEY ("miningSiteId") REFERENCES "mining_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

