import { Module } from '@nestjs/common';
import { ErpReportsService } from './erp-reports.service';
import { ErpReportsController } from './erp-reports.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { SalesModule } from '../sales/sales.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DebtModule } from '../debt/debt.module';
import { AccountsModule } from '../accounts/accounts.module';
import { ErpCustomersModule } from '../erp-customers/erp-customers.module';
import { HrModule } from '../hr/hr.module';

/**
 * Read-only aggregation over the other ERP modules. It owns no tables and
 * calls the source services in-process, so every figure it reports is the same
 * figure the owning module's own screen shows.
 */
@Module({
  imports: [
    OrganizationsModule,
    SalesModule,
    ExpensesModule,
    InventoryModule,
    DebtModule,
    AccountsModule,
    ErpCustomersModule,
    HrModule,
  ],
  controllers: [ErpReportsController],
  providers: [ErpReportsService],
  exports: [ErpReportsService],
})
export class ErpReportsModule {}
