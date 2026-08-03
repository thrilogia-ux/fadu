import { prisma } from "@/lib/prisma";

let ensured = false;

const PRODUCT_COLUMNS_SQL = [
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost_price" DECIMAL(10, 2)`,
];

const ORDER_FINANCE_COLUMNS_SQL = [
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMPTZ`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "platform_fee" DECIMAL(10, 2)`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "net_received" DECIMAL(10, 2)`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoiced_at" TIMESTAMPTZ`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_number" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_amount" DECIMAL(10, 2)`,
];

const ORDER_ITEM_COLUMNS_SQL = [
  `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "unit_cost_snapshot" DECIMAL(10, 2)`,
];

const EXPENSE_CATEGORY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "expense_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
)`;

const EXPENSE_CATEGORY_UNIQUE_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS "expense_categories_name_key" ON "expense_categories" ("name")
`;

const FINANCIAL_EXPENSE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "financial_expenses" (
  "id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "expense_date" DATE NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "financial_expenses_pkey" PRIMARY KEY ("id")
)`;

const FINANCIAL_EXPENSE_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS "financial_expenses_year_month_idx" ON "financial_expenses" ("year", "month")
`;

const DEFAULT_EXPENSE_CATEGORIES = [
  "Stand feria",
  "Packaging",
  "Publicidad",
  "Comisiones bancarias",
  "Otros",
];

export async function ensureFinanceSchema(): Promise<void> {
  if (ensured) return;
  try {
    for (const sql of PRODUCT_COLUMNS_SQL) {
      await prisma.$executeRawUnsafe(sql);
    }
    for (const sql of ORDER_FINANCE_COLUMNS_SQL) {
      await prisma.$executeRawUnsafe(sql);
    }
    for (const sql of ORDER_ITEM_COLUMNS_SQL) {
      await prisma.$executeRawUnsafe(sql);
    }
    await prisma.$executeRawUnsafe(EXPENSE_CATEGORY_TABLE_SQL);
    await prisma.$executeRawUnsafe(EXPENSE_CATEGORY_UNIQUE_SQL);
    await prisma.$executeRawUnsafe(FINANCIAL_EXPENSE_TABLE_SQL);
    await prisma.$executeRawUnsafe(FINANCIAL_EXPENSE_INDEX_SQL);

    const count = await prisma.expenseCategory.count();
    if (count === 0) {
      await prisma.expenseCategory.createMany({
        data: DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ({
          name,
          sortOrder: i,
          active: true,
        })),
      });
    }

    ensured = true;
  } catch (e) {
    console.error("[finance-schema] ensureFinanceSchema:", e);
  }
}
