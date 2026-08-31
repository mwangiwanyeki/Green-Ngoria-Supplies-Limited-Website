-- CreateTable: atomic backing store for human-readable reference numbers
CREATE TABLE "reference_sequences" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reference_sequences_key_key" ON "reference_sequences"("key");

-- AlterTable: Notification.metadata String -> Json
ALTER TABLE "notifications"
  ALTER COLUMN "metadata" TYPE JSONB USING (
    CASE
      WHEN "metadata" IS NULL THEN NULL
      ELSE "metadata"::jsonb
    END
  );

-- CreateIndex: missing FK indexes flagged in the schema audit
CREATE INDEX "clients_clientOrgId_idx" ON "clients"("clientOrgId");
CREATE INDEX "mineral_projects_clientId_idx" ON "mineral_projects"("clientId");
CREATE INDEX "mineral_projects_miningSiteId_idx" ON "mineral_projects"("miningSiteId");
CREATE INDEX "plant_assessments_assignedEngineerId_idx" ON "plant_assessments"("assignedEngineerId");
CREATE INDEX "project_tasks_milestoneId_idx" ON "project_tasks"("milestoneId");
CREATE INDEX "project_tasks_assigneeId_idx" ON "project_tasks"("assigneeId");
CREATE INDEX "assessment_recommendations_findingId_idx" ON "assessment_recommendations"("findingId");
CREATE INDEX "rfq_items_equipmentId_idx" ON "rfq_items"("equipmentId");
CREATE INDEX "quotations_approvedById_idx" ON "quotations"("approvedById");
CREATE INDEX "quotations_createdById_idx" ON "quotations"("createdById");
CREATE INDEX "engineering_documents_reviewerId_idx" ON "engineering_documents"("reviewerId");
CREATE INDEX "engineering_documents_approverId_idx" ON "engineering_documents"("approverId");
CREATE INDEX "procurement_requisitions_requestedById_idx" ON "procurement_requisitions"("requestedById");
CREATE INDEX "procurement_requisitions_approvedById_idx" ON "procurement_requisitions"("approvedById");
CREATE INDEX "purchase_orders_vendorId_idx" ON "purchase_orders"("vendorId");
CREATE INDEX "contracts_approvedById_idx" ON "contracts"("approvedById");
CREATE INDEX "invoices_contractId_idx" ON "invoices"("contractId");
CREATE INDEX "invoices_projectId_idx" ON "invoices"("projectId");
CREATE INDEX "hse_incidents_responsibleId_idx" ON "hse_incidents"("responsibleId");
CREATE INDEX "hse_incidents_createdById_idx" ON "hse_incidents"("createdById");
CREATE INDEX "assets_equipmentId_idx" ON "assets"("equipmentId");
CREATE INDEX "maintenance_work_orders_assignedToId_idx" ON "maintenance_work_orders"("assignedToId");
CREATE INDEX "maintenance_work_orders_verifiedById_idx" ON "maintenance_work_orders"("verifiedById");
CREATE INDEX "support_tickets_clientId_idx" ON "support_tickets"("clientId");

-- AddForeignKey: newly-declared relations
ALTER TABLE "clients" ADD CONSTRAINT "clients_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "mineral_projects" ADD CONSTRAINT "mineral_projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mineral_projects" ADD CONSTRAINT "mineral_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mineral_projects" ADD CONSTRAINT "mineral_projects_miningSiteId_fkey" FOREIGN KEY ("miningSiteId") REFERENCES "mining_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "plant_assessments" ADD CONSTRAINT "plant_assessments_assignedEngineerId_fkey" FOREIGN KEY ("assignedEngineerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Align Lead-child onDelete behavior: consultations should cascade with their
-- parent lead, matching crm_activities (already ON DELETE CASCADE). This is a
-- drop/recreate since Postgres has no ALTER CONSTRAINT for referential actions.
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_leadId_fkey";
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
