/**
 * GREEN NGORIA SUPPLIES LIMITED — Development Seed
 *
 * Seeds:
 * - Green Ngoria organization
 * - System roles + permissions
 * - Admin user
 * - Sample engineer, project manager, sales officer
 * - Sample client organization
 * - Sample lead and project
 * - Equipment categories
 *
 * NEVER use this seed in production.
 * Production data is entered through the platform.
 */

import { PrismaClient, SystemRole } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱  Seeding Green Ngoria development database…')

  // ── Hash helper ──────────────────────────────────────────────────────────
  const hash = (pwd: string) =>
    argon2.hash(pwd, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 })

  // ── Roles & permissions ───────────────────────────────────────────────────
  const ROLES: Array<{ name: SystemRole; displayName: string }> = [
    { name: 'SUPER_ADMIN',        displayName: 'Super Administrator' },
    { name: 'ADMIN',              displayName: 'Administrator' },
    { name: 'DIRECTOR',           displayName: 'Director' },
    { name: 'MANAGING_DIRECTOR',  displayName: 'Managing Director' },
    { name: 'LEGAL_OFFICER',      displayName: 'Legal Officer' },
    { name: 'PRODUCTION_MANAGER', displayName: 'Production Manager' },
    { name: 'PROJECT_MANAGER',    displayName: 'Project Manager' },
    { name: 'MINING_ENGINEER',    displayName: 'Mining Engineer' },
    { name: 'PROCESS_ENGINEER',   displayName: 'Process Engineer' },
    { name: 'MECHANICAL_ENGINEER',displayName: 'Mechanical Engineer' },
    { name: 'ELECTRICAL_ENGINEER',displayName: 'Electrical Engineer' },
    { name: 'PROCUREMENT_OFFICER',displayName: 'Procurement Officer' },
    { name: 'FINANCE_OFFICER',    displayName: 'Finance Officer' },
    { name: 'HSE_OFFICER',        displayName: 'HSE Officer' },
    { name: 'SITE_SUPERVISOR',    displayName: 'Site Supervisor' },
    { name: 'SALES_MANAGER',      displayName: 'Sales Manager' },
    { name: 'CRM_OFFICER',        displayName: 'CRM Officer' },
    { name: 'CUSTOMER_CARE',      displayName: 'Customer Care' },
    { name: 'CLIENT_ADMIN',       displayName: 'Client Administrator' },
    { name: 'CLIENT_USER',        displayName: 'Client User' },
    { name: 'VENDOR_USER',        displayName: 'Vendor User' },
  ]

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { displayName: role.displayName },
      create: { name: role.name, displayName: role.displayName, isSystem: true },
    })
  }
  console.log(`  ✓ ${ROLES.length} roles seeded`)

  // Core permissions
  const PERMISSIONS = [
    { code: 'quotation:approve', resource: 'quotation', action: 'approve', description: 'Approve quotations' },
    { code: 'contract:approve', resource: 'contract', action: 'approve', description: 'Approve contracts' },
    { code: 'invoice:create', resource: 'invoice', action: 'create', description: 'Create invoices' },
    { code: 'engineering:approve', resource: 'engineering', action: 'approve', description: 'Approve engineering documents' },
    { code: 'commissioning:approve', resource: 'commissioning', action: 'approve', description: 'Approve commissioning tests' },
    { code: 'procurement:approve', resource: 'procurement', action: 'approve', description: 'Approve procurement' },
    { code: 'user:manage', resource: 'user', action: 'manage', description: 'Manage users' },
    { code: 'audit:view', resource: 'audit', action: 'view', description: 'View audit logs' },
  ]

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    })
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions seeded`)

  // ── Green Ngoria organization ──────────────────────────────────────────────
  const gngOrg = await prisma.organization.upsert({
    where: { slug: 'green-ngoria' },
    update: {},
    create: {
      name: 'Green Ngoria Supplies Limited',
      slug: 'green-ngoria',
      type: 'INTERNAL',
      email: 'info@greenngoria.com',
      phone: '+254 704 160 431',
      website: 'https://greenngoria.com',
      country: 'Kenya',
      city: 'Nairobi',
      description: 'Mining, mineral processing, gold processing plant engineering and construction.',
      isActive: true,
    },
  })
  console.log(`  ✓ Organization: ${gngOrg.name}`)

  // ── Default operations branch (Operations ERP is branch-scoped) ─────────────
  const mainBranch = await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: gngOrg.id, code: 'HQ' } },
    update: {},
    create: {
      organizationId: gngOrg.id,
      code: 'HQ',
      name: 'Green Ngoria LTD',
      systemName: 'Green Ngoria Management System',
      status: 'ACTIVE',
      isDefault: true,
      phone: '+254 704 160 431',
      email: 'info@greenngoria.com',
      county: 'Nairobi',
      address: 'Rehema House, 3rd Floor, Standard Street, Nairobi',
      currency: 'KES',
      currencySymbol: 'KSh',
      taxRate: 0,
      lowStockThreshold: 10,
    },
  })
  console.log(`  ✓ Branch: ${mainBranch.name}`)

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } })
  const pmRole = await prisma.role.findUnique({ where: { name: 'PROJECT_MANAGER' } })
  const engRole = await prisma.role.findUnique({ where: { name: 'MINING_ENGINEER' } })
  const salesRole = await prisma.role.findUnique({ where: { name: 'SALES_MANAGER' } })

  const seedUser = async (
    email: string, firstName: string, lastName: string, password: string, roleId: string,
  ) => {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: await hash(password),
        firstName,
        lastName,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    })

    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: gngOrg.id, userId: user.id } },
      update: {},
      create: { organizationId: gngOrg.id, userId: user.id, isOwner: false },
    })

    const existingRole = await prisma.userRole.findFirst({ where: { userId: user.id, roleId } })
    if (!existingRole) {
      await prisma.userRole.create({ data: { userId: user.id, roleId } })
    }

    return user
  }

  if (superAdminRole) {
    await seedUser('info@greenngoria.com', 'Green Ngoria', 'Administrator', 'Green&ngoria%2026', superAdminRole.id)
    console.log('  ✓ Super admin: info@greenngoria.com / Green&ngoria%2026')
    await seedUser('mwangiwanyeki@gmail.com', 'Mwangi', 'Wanyeki', 'Donate$567!20@', superAdminRole.id)
    console.log('  ✓ Super admin: mwangiwanyeki@gmail.com / Donate$567!20@')
  }

  if (pmRole) {
    await seedUser('pm@greenngoria.com', 'James', 'Kamau', 'PM@GreenNgoria2025!', pmRole.id)
    console.log('  ✓ Project Manager: pm@greenngoria.com')
  }

  if (engRole) {
    await seedUser('engineer@greenngoria.com', 'Mary', 'Wanjiku', 'Eng@GreenNgoria2025!', engRole.id)
    console.log('  ✓ Engineer: engineer@greenngoria.com')
  }

  if (salesRole) {
    await seedUser('sales@greenngoria.com', 'Peter', 'Ochieng', 'Sales@GreenNgoria2025!', salesRole.id)
    console.log('  ✓ Sales: sales@greenngoria.com')
  }

  // ── Sample client organization ─────────────────────────────────────────────
  const clientOrg = await prisma.organization.upsert({
    where: { slug: 'acacia-mining-ltd' },
    update: {},
    create: {
      name: 'Acacia Mining Ltd',
      slug: 'acacia-mining-ltd',
      type: 'CLIENT',
      email: 'info@acaciamining.example',
      country: 'Kenya',
      city: 'Bondo',
    },
  })

  const client = await prisma.client.upsert({
    where: { clientNumber: 'CLT-1001' },
    update: {},
    create: {
      organizationId: gngOrg.id,
      clientNumber: 'CLT-1001',
      companyName: 'Acacia Mining Ltd',
      country: 'Kenya',
      city: 'Bondo',
      industry: 'Gold Mining',
      miningInterest: 'Gold — alluvial and hard rock',
    },
  })
  console.log(`  ✓ Client: ${client.companyName}`)

  // ── Equipment categories ───────────────────────────────────────────────────
  const equipmentCategories = [
    { name: 'Crushing Equipment', slug: 'crushing-equipment' },
    { name: 'Grinding Equipment', slug: 'grinding-equipment' },
    { name: 'Classification Equipment', slug: 'classification-equipment' },
    { name: 'Leaching Tanks', slug: 'leaching-tanks' },
    { name: 'CIP/CIL Equipment', slug: 'cip-cil-equipment' },
    { name: 'Elution & Recovery', slug: 'elution-recovery' },
    { name: 'Tailings Management', slug: 'tailings-management' },
    { name: 'Reagent Dosing', slug: 'reagent-dosing' },
    { name: 'Pumps & Pipework', slug: 'pumps-pipework' },
    { name: 'Electrical & Instrumentation', slug: 'electrical-instrumentation' },
  ]

  for (const cat of equipmentCategories) {
    await prisma.equipmentCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, sortOrder: 0 },
    })
  }
  console.log(`  ✓ ${equipmentCategories.length} equipment categories seeded`)

  // ── Mining site ────────────────────────────────────────────────────────────
  const existingSite = await prisma.miningSite.findFirst({ where: { name: 'Bondo Gold Fields' } })
  if (!existingSite) {
    await prisma.miningSite.create({
      data: {
        name: 'Bondo Gold Fields',
        country: 'Kenya',
        county: 'Siaya County',
        coordinates: '-0.3456,34.1234',
        mineralTypes: ['GOLD'],
        description: 'Alluvial gold mining area in Siaya County, western Kenya.',
        isActive: true,
      },
    })
  }

  console.log('\n✅  Seed complete.\n')
  console.log('  Login credentials (development only):')
  console.log('  ─────────────────────────────────────')
  console.log('  info@greenngoria.com      Green&ngoria%2026        (SUPER_ADMIN)')
  console.log('  mwangiwanyeki@gmail.com   Donate$567!20@           (SUPER_ADMIN)')
  console.log('  pm@greenngoria.com        PM@GreenNgoria2025!      (PROJECT_MANAGER)')
  console.log('  engineer@greenngoria.com  Eng@GreenNgoria2025!     (MINING_ENGINEER)')
  console.log('  sales@greenngoria.com     Sales@GreenNgoria2025!   (SALES_MANAGER)')
  console.log('')
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
