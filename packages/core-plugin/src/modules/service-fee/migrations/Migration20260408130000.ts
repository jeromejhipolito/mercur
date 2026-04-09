import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260408130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_service_fee_rule_fee_ref_refid" ON "service_fee_rule" ("service_fee_id", "reference", "reference_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_service_fee_rule_fee_ref_refid";`)
  }
}
