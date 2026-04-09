import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Service Fees", () => {
      let appContainer: MedusaContainer
      let seller: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const result = await createSellerUser(appContainer)
        seller = result.seller
      })

      // ---------------------------------------------------------------
      // 1. CRUD Operations
      // ---------------------------------------------------------------

      describe("POST /admin/service-fees", () => {
        it("should create a percentage service fee", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Standard Fee",
              display_name: "Standard Service Fee",
              code: "STANDARD_PCT",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Standard Fee",
              display_name: "Standard Service Fee",
              code: "STANDARD_PCT",
              type: "percentage",
              charging_level: "item",
              value: 10,
            })
          )
        })

        it("should create a fixed service fee", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Fixed Fee",
              display_name: "Fixed Service Fee",
              code: "FIXED_FEE",
              type: "fixed",
              charging_level: "item",
              value: 500,
              currency_code: "usd",
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Fixed Fee",
              display_name: "Fixed Service Fee",
              code: "FIXED_FEE",
              type: "fixed",
              value: 500,
              currency_code: "usd",
            })
          )
        })

        it("should create a service fee with rules", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Seller Specific Fee",
              display_name: "Seller Fee",
              code: "SELLER_FEE",
              type: "percentage",
              charging_level: "item",
              value: 8,
              priority: 10,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Seller Specific Fee",
              code: "SELLER_FEE",
              value: 8,
              priority: 10,
            })
          )
        })

        it("should create a service fee with a period", async () => {
          const startDate = new Date(
            Date.now() - 24 * 60 * 60 * 1000
          ).toISOString()
          const endDate = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString()

          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Seasonal Fee",
              display_name: "Seasonal Service Fee",
              code: "SEASONAL_FEE",
              type: "percentage",
              charging_level: "item",
              value: 5,
              start_date: startDate,
              end_date: endDate,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Seasonal Fee",
              code: "SEASONAL_FEE",
              value: 5,
            })
          )
          expect(response.data.service_fee.start_date).toBeDefined()
          expect(response.data.service_fee.end_date).toBeDefined()
        })

        it("should create a shipping target service fee", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Shipping Fee",
              display_name: "Shipping Service Fee",
              code: "SHIPPING_FEE",
              type: "percentage",
              target: "shipping",
              charging_level: "item",
              value: 15,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Shipping Fee",
              code: "SHIPPING_FEE",
              target: "shipping",
              value: 15,
            })
          )
        })

        it("should create a service fee with min and max amounts", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Capped Fee",
              display_name: "Capped Service Fee",
              code: "CAPPED_FEE",
              type: "percentage",
              charging_level: "item",
              value: 10,
              min_amount: 100,
              max_amount: 5000,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Capped Fee",
              code: "CAPPED_FEE",
              value: 10,
              min_amount: 100,
              max_amount: 5000,
            })
          )
        })

        it("should create a service fee with include_tax enabled", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Tax Inclusive Fee",
              display_name: "Tax Inclusive Service Fee",
              code: "TAX_INCLUSIVE",
              type: "percentage",
              charging_level: "item",
              value: 10,
              include_tax: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Tax Inclusive Fee",
              code: "TAX_INCLUSIVE",
              include_tax: true,
            })
          )
        })
      })

      describe("GET /admin/service-fees", () => {
        it("should list service fees", async () => {
          await api.post(
            `/admin/service-fees`,
            {
              name: "List Test Fee",
              display_name: "List Test",
              code: "LIST_TEST",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fees).toBeDefined()
          expect(Array.isArray(response.data.service_fees)).toBe(true)
          expect(response.data.count).toBeGreaterThanOrEqual(1)
        })

        it("should filter service fees by status", async () => {
          await api.post(
            `/admin/service-fees`,
            {
              name: "Active Fee",
              display_name: "Active Fee",
              code: "STATUS_ACTIVE",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees?status=active`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fees.length).toBeGreaterThanOrEqual(1)
          response.data.service_fees.forEach((fee: any) => {
            expect(fee.status).toEqual("active")
          })
        })

        it("should filter service fees by charging_level", async () => {
          await api.post(
            `/admin/service-fees`,
            {
              name: "Global Fee",
              display_name: "Global Fee",
              code: "GLOBAL_LEVEL",
              type: "percentage",
              charging_level: "global",
              value: 5,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees?charging_level=global`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fees.length).toBeGreaterThanOrEqual(1)
          response.data.service_fees.forEach((fee: any) => {
            expect(fee.charging_level).toEqual("global")
          })
        })

        it("should filter service fees by type", async () => {
          await api.post(
            `/admin/service-fees`,
            {
              name: "Fixed Type Fee",
              display_name: "Fixed Type Fee",
              code: "FIXED_TYPE_FILTER",
              type: "fixed",
              charging_level: "item",
              value: 200,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees?type=fixed`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fees.length).toBeGreaterThanOrEqual(1)
          response.data.service_fees.forEach((fee: any) => {
            expect(fee.type).toEqual("fixed")
          })
        })

        it("should filter service fees by code", async () => {
          await api.post(
            `/admin/service-fees`,
            {
              name: "Code Filter Fee",
              display_name: "Code Filter Fee",
              code: "CODE_FILTER_TEST",
              type: "percentage",
              charging_level: "item",
              value: 7,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees?code=CODE_FILTER_TEST`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fees).toHaveLength(1)
          expect(response.data.service_fees[0].code).toEqual(
            "CODE_FILTER_TEST"
          )
        })

        it("should filter service fees by is_enabled", async () => {
          await api.post(
            `/admin/service-fees`,
            {
              name: "Disabled Fee",
              display_name: "Disabled Fee",
              code: "DISABLED_FILTER",
              type: "percentage",
              charging_level: "item",
              value: 10,
              is_enabled: false,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees?is_enabled=false`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          response.data.service_fees.forEach((fee: any) => {
            expect(fee.is_enabled).toEqual(false)
          })
        })
      })

      describe("GET /admin/service-fees/:id", () => {
        it("should get a service fee by id", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Get Test Fee",
              display_name: "Get Test Fee",
              code: "GET_TEST",
              type: "percentage",
              charging_level: "item",
              value: 12,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const response = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              id: feeId,
              name: "Get Test Fee",
              code: "GET_TEST",
              type: "percentage",
              value: 12,
            })
          )
        })

        it("should return 404 for non-existent service fee", async () => {
          const response = await api
            .get(`/admin/service-fees/non_existent_id`, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/service-fees/:id", () => {
        it("should update a service fee name and value", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Update Test Fee",
              display_name: "Update Test Fee",
              code: "UPDATE_TEST",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const response = await api.post(
            `/admin/service-fees/${feeId}`,
            {
              name: "Updated Fee Name",
              value: 15,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              id: feeId,
              name: "Updated Fee Name",
              value: 15,
            })
          )
        })

        it("should update service fee type", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Type Change Fee",
              display_name: "Type Change Fee",
              code: "TYPE_CHANGE",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const response = await api.post(
            `/admin/service-fees/${feeId}`,
            {
              type: "fixed",
              value: 500,
              currency_code: "usd",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              type: "fixed",
              value: 500,
              currency_code: "usd",
            })
          )
        })

        it("should disable a service fee", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Disable Test Fee",
              display_name: "Disable Test Fee",
              code: "DISABLE_TEST",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const response = await api.post(
            `/admin/service-fees/${feeId}`,
            {
              is_enabled: false,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fee.is_enabled).toEqual(false)
        })

        it("should update service fee display_name", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Display Name Test",
              display_name: "Original Display Name",
              code: "DISPLAY_UPDATE",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const response = await api.post(
            `/admin/service-fees/${feeId}`,
            {
              display_name: "Updated Display Name",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fee.display_name).toEqual(
            "Updated Display Name"
          )
        })

        it("should update service fee priority", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Priority Test Fee",
              display_name: "Priority Test Fee",
              code: "PRIORITY_TEST",
              type: "percentage",
              charging_level: "item",
              value: 10,
              priority: 0,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const response = await api.post(
            `/admin/service-fees/${feeId}`,
            {
              priority: 100,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fee.priority).toEqual(100)
        })
      })

      describe("DELETE /admin/service-fees/:id", () => {
        it("should delete a service fee", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Delete Test Fee",
              display_name: "Delete Test Fee",
              code: "DELETE_TEST",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const deleteResponse = await api.delete(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          expect(deleteResponse.status).toEqual(200)
          expect(deleteResponse.data).toEqual({
            id: feeId,
            object: "service_fee",
            deleted: true,
          })

          // Verify it's deleted
          const getResponse = await api
            .get(`/admin/service-fees/${feeId}`, adminHeaders)
            .catch((e) => e.response)

          expect(getResponse.status).toEqual(404)
        })
      })

      // ---------------------------------------------------------------
      // 2. Validation
      // ---------------------------------------------------------------

      describe("Service fee validation", () => {
        it("should require name field", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                display_name: "No Name",
                code: "NO_NAME",
                type: "percentage",
                charging_level: "item",
                value: 10,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should require display_name field", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "No Display Name",
                code: "NO_DISPLAY",
                type: "percentage",
                charging_level: "item",
                value: 10,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should require code field", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "No Code Fee",
                display_name: "No Code Fee",
                type: "percentage",
                charging_level: "item",
                value: 10,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should require type field", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "No Type Fee",
                display_name: "No Type Fee",
                code: "NO_TYPE",
                charging_level: "item",
                value: 10,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should require charging_level field", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "No Level Fee",
                display_name: "No Level Fee",
                code: "NO_LEVEL",
                type: "percentage",
                value: 10,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should require value field", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "No Value Fee",
                display_name: "No Value Fee",
                code: "NO_VALUE",
                type: "percentage",
                charging_level: "item",
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject value of 0 (must be positive)", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "Zero Value Fee",
                display_name: "Zero Value Fee",
                code: "ZERO_VALUE",
                type: "percentage",
                charging_level: "item",
                value: 0,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject negative value", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "Negative Value Fee",
                display_name: "Negative Value Fee",
                code: "NEG_VALUE",
                type: "percentage",
                charging_level: "item",
                value: -5,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject percentage value exceeding 100", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "Over 100 Fee",
                display_name: "Over 100 Fee",
                code: "OVER_100",
                type: "percentage",
                charging_level: "item",
                value: 101,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should allow percentage value at exactly 100", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Max Percentage Fee",
              display_name: "Max Percentage Fee",
              code: "MAX_PCT",
              type: "percentage",
              charging_level: "item",
              value: 100,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee.value).toEqual(100)
        })

        it("should allow fixed value exceeding 100", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "High Fixed Fee",
              display_name: "High Fixed Fee",
              code: "HIGH_FIXED",
              type: "fixed",
              charging_level: "item",
              value: 5000,
              currency_code: "usd",
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee.value).toEqual(5000)
        })

        it("should reject invalid type enum", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "Invalid Type Fee",
                display_name: "Invalid Type Fee",
                code: "INVALID_TYPE",
                type: "invalid",
                charging_level: "item",
                value: 10,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject invalid charging_level enum", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "Invalid Level Fee",
                display_name: "Invalid Level Fee",
                code: "INVALID_LEVEL",
                type: "percentage",
                charging_level: "invalid",
                value: 10,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject invalid rule reference type", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "Invalid Ref Fee",
                display_name: "Invalid Ref Fee",
                code: "INVALID_REF",
                type: "percentage",
                charging_level: "item",
                value: 10,
                rules: [
                  {
                    reference: "invalid_reference",
                    reference_id: "some_id",
                  },
                ],
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject invalid rule mode", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "Invalid Mode Fee",
                display_name: "Invalid Mode Fee",
                code: "INVALID_MODE",
                type: "percentage",
                charging_level: "item",
                value: 10,
                rules: [
                  {
                    reference: "seller",
                    reference_id: seller.id,
                    mode: "invalid_mode",
                  },
                ],
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject min_amount greater than max_amount", async () => {
          const response = await api
            .post(
              `/admin/service-fees`,
              {
                name: "Bad Range Fee",
                display_name: "Bad Range Fee",
                code: "BAD_RANGE",
                type: "percentage",
                charging_level: "item",
                value: 10,
                min_amount: 5000,
                max_amount: 100,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })
      })

      // ---------------------------------------------------------------
      // 3. Deactivation + Audit Trail
      // ---------------------------------------------------------------

      describe("POST /admin/service-fees/:id/deactivate", () => {
        it("should deactivate a service fee", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Deactivate Test Fee",
              display_name: "Deactivate Test Fee",
              code: "DEACTIVATE_TEST",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const response = await api.post(
            `/admin/service-fees/${feeId}/deactivate`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              id: feeId,
              status: "inactive",
              is_enabled: false,
            })
          )
        })
      })

      describe("GET /admin/service-fees/:id/change-logs", () => {
        it("should have a 'created' log entry after create", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Changelog Create Test",
              display_name: "Changelog Create Test",
              code: "CHANGELOG_CREATE",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const response = await api.get(
            `/admin/service-fees/${feeId}/change-logs`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.change_logs).toBeDefined()
          expect(response.data.change_logs.length).toBeGreaterThanOrEqual(1)

          const createdLog = response.data.change_logs.find(
            (log: any) => log.action === "created"
          )
          expect(createdLog).toBeDefined()
          expect(createdLog.service_fee_id).toEqual(feeId)
          expect(createdLog.changed_by).toBeDefined()
        })

        it("should have an 'updated' log entry after update", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Changelog Update Test",
              display_name: "Changelog Update Test",
              code: "CHANGELOG_UPDATE",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          await api.post(
            `/admin/service-fees/${feeId}`,
            {
              name: "Updated Changelog Test",
              value: 20,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees/${feeId}/change-logs`,
            adminHeaders
          )

          expect(response.status).toEqual(200)

          const updatedLog = response.data.change_logs.find(
            (log: any) => log.action === "updated"
          )
          expect(updatedLog).toBeDefined()
          expect(updatedLog.service_fee_id).toEqual(feeId)
          expect(updatedLog.previous_snapshot).toBeDefined()
          expect(updatedLog.new_snapshot).toBeDefined()
          expect(updatedLog.changed_by).toBeDefined()
        })

        it("should have a 'deactivated' log entry after deactivate", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Changelog Deactivate Test",
              display_name: "Changelog Deactivate Test",
              code: "CHANGELOG_DEACT",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          await api.post(
            `/admin/service-fees/${feeId}/deactivate`,
            {},
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees/${feeId}/change-logs`,
            adminHeaders
          )

          expect(response.status).toEqual(200)

          const deactivatedLog = response.data.change_logs.find(
            (log: any) => log.action === "deactivated"
          )
          expect(deactivatedLog).toBeDefined()
          expect(deactivatedLog.service_fee_id).toEqual(feeId)
          expect(deactivatedLog.previous_snapshot).toBeDefined()
          expect(deactivatedLog.new_snapshot).toBeDefined()
        })

        it("should track full audit trail across lifecycle", async () => {
          // Create
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Full Audit Fee",
              display_name: "Full Audit Fee",
              code: "FULL_AUDIT",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          // Update
          await api.post(
            `/admin/service-fees/${feeId}`,
            { value: 20 },
            adminHeaders
          )

          // Deactivate
          await api.post(
            `/admin/service-fees/${feeId}/deactivate`,
            {},
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees/${feeId}/change-logs`,
            adminHeaders
          )

          expect(response.status).toEqual(200)

          const actions = response.data.change_logs.map(
            (log: any) => log.action
          )
          expect(actions).toContain("created")
          expect(actions).toContain("updated")
          expect(actions).toContain("deactivated")
          expect(response.data.change_logs.length).toBeGreaterThanOrEqual(3)
        })
      })

      // ---------------------------------------------------------------
      // 4. Batch Rules
      // ---------------------------------------------------------------

      describe("POST /admin/service-fees/:id/rules", () => {
        it("should add rules to a service fee", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Rules Test Fee",
              display_name: "Rules Test Fee",
              code: "RULES_TEST",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          const response = await api.post(
            `/admin/service-fees/${feeId}/rules`,
            {
              create: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.created).toBeDefined()
          expect(response.data.created.length).toEqual(1)
          expect(response.data.created[0]).toEqual(
            expect.objectContaining({
              reference: "seller",
              reference_id: seller.id,
            })
          )
        })

        it("should update rules of a service fee", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Update Rules Fee",
              display_name: "Update Rules Fee",
              code: "UPDATE_RULES",
              type: "percentage",
              charging_level: "item",
              value: 10,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
              ],
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          // Get the fee to find the rule ID
          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          const ruleId = getResponse.data.service_fee.rules[0].id

          // Create another seller to update the rule reference
          const seller2Result = await createSellerUser(appContainer, {
            email: "seller2@test.com",
            name: "Test Seller 2",
          })

          const response = await api.post(
            `/admin/service-fees/${feeId}/rules`,
            {
              update: [
                {
                  id: ruleId,
                  reference_id: seller2Result.seller.id,
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.updated).toBeDefined()
          expect(response.data.updated.length).toEqual(1)
        })

        it("should delete rules from a service fee", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Delete Rules Fee",
              display_name: "Delete Rules Fee",
              code: "DELETE_RULES",
              type: "percentage",
              charging_level: "item",
              value: 10,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
              ],
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          // Get the fee to find the rule ID
          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          const ruleId = getResponse.data.service_fee.rules[0].id

          const response = await api.post(
            `/admin/service-fees/${feeId}/rules`,
            {
              delete: [ruleId],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.deleted).toBeDefined()
          expect(response.data.deleted.length).toEqual(1)
          expect(response.data.deleted[0]).toEqual(ruleId)
        })

        it("should batch create, update, and delete rules simultaneously", async () => {
          const seller2Result = await createSellerUser(appContainer, {
            email: "seller3@test.com",
            name: "Test Seller 3",
          })

          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Batch Rules Fee",
              display_name: "Batch Rules Fee",
              code: "BATCH_RULES",
              type: "percentage",
              charging_level: "item",
              value: 10,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
                {
                  reference: "seller",
                  reference_id: seller2Result.seller.id,
                },
              ],
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          // Get the fee to find the rule IDs
          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          const rules = getResponse.data.service_fee.rules
          const ruleToUpdate = rules[0]
          const ruleToDelete = rules[1]

          // Create a third seller for the new rule
          const seller3Result = await createSellerUser(appContainer, {
            email: "seller4@test.com",
            name: "Test Seller 4",
          })

          const response = await api.post(
            `/admin/service-fees/${feeId}/rules`,
            {
              create: [
                {
                  reference: "product_category",
                  reference_id: "pcat_test123",
                },
              ],
              update: [
                {
                  id: ruleToUpdate.id,
                  reference_id: seller3Result.seller.id,
                },
              ],
              delete: [ruleToDelete.id],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.created.length).toEqual(1)
          expect(response.data.updated.length).toEqual(1)
          expect(response.data.deleted.length).toEqual(1)
        })

        it("should create 'rules_updated' change log entry after batch rules", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Rules Log Fee",
              display_name: "Rules Log Fee",
              code: "RULES_LOG",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          await api.post(
            `/admin/service-fees/${feeId}/rules`,
            {
              create: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
              ],
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees/${feeId}/change-logs`,
            adminHeaders
          )

          expect(response.status).toEqual(200)

          const rulesLog = response.data.change_logs.find(
            (log: any) => log.action === "rules_updated"
          )
          expect(rulesLog).toBeDefined()
          expect(rulesLog.service_fee_id).toEqual(feeId)
        })
      })

      // ---------------------------------------------------------------
      // 5. Rules with Include/Exclude
      // ---------------------------------------------------------------

      describe("Rules with include/exclude modes", () => {
        it("should create a fee with include rule for product_category", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Category Include Fee",
              display_name: "Category Include Fee",
              code: "CAT_INCLUDE",
              type: "percentage",
              charging_level: "item",
              value: 5,
              rules: [
                {
                  reference: "product_category",
                  reference_id: "pcat_test_123",
                  mode: "include",
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)

          // Verify rules are returned in GET response
          const feeId = response.data.service_fee.id
          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          expect(getResponse.data.service_fee.rules).toBeDefined()
          expect(getResponse.data.service_fee.rules.length).toEqual(1)
          expect(getResponse.data.service_fee.rules[0]).toEqual(
            expect.objectContaining({
              reference: "product_category",
              reference_id: "pcat_test_123",
              mode: "include",
            })
          )
        })

        it("should create a fee with exclude rule for seller", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Seller Exclude Fee",
              display_name: "Seller Exclude Fee",
              code: "SELLER_EXCLUDE",
              type: "percentage",
              charging_level: "item",
              value: 10,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                  mode: "exclude",
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)

          // Verify rules are returned in GET response
          const feeId = response.data.service_fee.id
          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          expect(getResponse.data.service_fee.rules).toBeDefined()
          expect(getResponse.data.service_fee.rules.length).toEqual(1)
          expect(getResponse.data.service_fee.rules[0]).toEqual(
            expect.objectContaining({
              reference: "seller",
              reference_id: seller.id,
              mode: "exclude",
            })
          )
        })

        it("should create a fee with mixed include and exclude rules", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Mixed Rules Fee",
              display_name: "Mixed Rules Fee",
              code: "MIXED_RULES",
              type: "percentage",
              charging_level: "item",
              value: 8,
              rules: [
                {
                  reference: "product_category",
                  reference_id: "pcat_include_123",
                  mode: "include",
                },
                {
                  reference: "seller",
                  reference_id: seller.id,
                  mode: "exclude",
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)

          const feeId = response.data.service_fee.id
          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          expect(getResponse.data.service_fee.rules.length).toEqual(2)

          const includeRule = getResponse.data.service_fee.rules.find(
            (r: any) => r.mode === "include"
          )
          const excludeRule = getResponse.data.service_fee.rules.find(
            (r: any) => r.mode === "exclude"
          )

          expect(includeRule).toBeDefined()
          expect(includeRule.reference).toEqual("product_category")
          expect(excludeRule).toBeDefined()
          expect(excludeRule.reference).toEqual("seller")
        })

        it("should create rules for all valid reference types", async () => {
          const validReferences = [
            "product",
            "product_type",
            "product_collection",
            "product_category",
            "seller",
          ]

          for (const reference of validReferences) {
            const response = await api.post(
              `/admin/service-fees`,
              {
                name: `${reference} Rule Fee`,
                display_name: `${reference} Rule Fee`,
                code: `REF_${reference.toUpperCase()}`,
                type: "percentage",
                charging_level: "item",
                value: 5,
                rules: [
                  {
                    reference,
                    reference_id: `test_${reference}_id`,
                  },
                ],
              },
              adminHeaders
            )

            expect(response.status).toEqual(201)
          }
        })
      })

      // ---------------------------------------------------------------
      // 6. Period & Status
      // ---------------------------------------------------------------

      describe("Period and status behavior", () => {
        it("should default to active status when no period is set", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "No Period Fee",
              display_name: "No Period Fee",
              code: "NO_PERIOD",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee.status).toEqual("active")
        })

        it("should be active when start_date is in the past", async () => {
          const pastDate = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString()

          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Past Start Fee",
              display_name: "Past Start Fee",
              code: "PAST_START",
              type: "percentage",
              charging_level: "item",
              value: 10,
              start_date: pastDate,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          // Default status is active; the start_date is just a filter boundary
          expect(response.data.service_fee.status).toEqual("active")
        })

        it("should allow creating a fee with pending status", async () => {
          const futureDate = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString()

          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Pending Fee",
              display_name: "Pending Fee",
              code: "PENDING_FEE",
              type: "percentage",
              charging_level: "item",
              value: 10,
              status: "pending",
              effective_date: futureDate,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee.status).toEqual("pending")
        })

        it("should allow creating a fee with explicit active status", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Explicit Active Fee",
              display_name: "Explicit Active Fee",
              code: "EXPLICIT_ACTIVE",
              type: "percentage",
              charging_level: "item",
              value: 10,
              status: "active",
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee.status).toEqual("active")
        })
      })

      // ---------------------------------------------------------------
      // 6b. Pending Fee Activation
      // ---------------------------------------------------------------

      describe("Pending fee activation", () => {
        it("should create a fee with future effective_date as pending", async () => {
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + 30) // 30 days from now

          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Pending Activation Test",
              display_name: "Pending Test",
              code: "PENDING_ACTIVATE",
              type: "percentage",
              charging_level: "item",
              value: 5,
              status: "pending",
              effective_date: futureDate.toISOString(),
              start_date: futureDate.toISOString(),
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee.status).toEqual("pending")
        })
      })

      // ---------------------------------------------------------------
      // 6c. Rule verification for fee calculation
      // ---------------------------------------------------------------

      describe("Rule verification for fee calculation", () => {
        it("should store include rule correctly for calculation", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Include Rule Calc Test",
              display_name: "Include Rule Calc Test",
              code: "INCLUDE_CALC",
              type: "percentage",
              charging_level: "item",
              value: 5,
              rules: [
                {
                  reference: "product_category",
                  reference_id: "pcat_calc_test_1",
                  mode: "include",
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          const feeId = response.data.service_fee.id

          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          expect(getResponse.data.service_fee.rules).toHaveLength(1)
          expect(getResponse.data.service_fee.rules[0]).toEqual(
            expect.objectContaining({
              reference: "product_category",
              reference_id: "pcat_calc_test_1",
              mode: "include",
            })
          )
        })

        it("should store exclude rule correctly for calculation", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Exclude Rule Calc Test",
              display_name: "Exclude Rule Calc Test",
              code: "EXCLUDE_CALC",
              type: "percentage",
              charging_level: "item",
              value: 8,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                  mode: "exclude",
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          const feeId = response.data.service_fee.id

          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          expect(getResponse.data.service_fee.rules).toHaveLength(1)
          expect(getResponse.data.service_fee.rules[0]).toEqual(
            expect.objectContaining({
              reference: "seller",
              reference_id: seller.id,
              mode: "exclude",
            })
          )
        })

        it("should store multiple mixed rules correctly", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Mixed Rules Calc Test",
              display_name: "Mixed Rules Calc Test",
              code: "MIXED_CALC",
              type: "percentage",
              charging_level: "item",
              value: 7,
              rules: [
                {
                  reference: "product_category",
                  reference_id: "pcat_mixed_1",
                  mode: "include",
                },
                {
                  reference: "seller",
                  reference_id: seller.id,
                  mode: "exclude",
                },
                {
                  reference: "product_type",
                  reference_id: "ptyp_mixed_1",
                  mode: "include",
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          const feeId = response.data.service_fee.id

          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          const rules = getResponse.data.service_fee.rules
          expect(rules).toHaveLength(3)

          const includeRules = rules.filter(
            (r: { mode: string }) => r.mode === "include"
          )
          const excludeRules = rules.filter(
            (r: { mode: string }) => r.mode === "exclude"
          )
          expect(includeRules).toHaveLength(2)
          expect(excludeRules).toHaveLength(1)
        })

        it("should verify all 5 reference types are accepted", async () => {
          const referenceTypes = [
            { reference: "product", reference_id: "prod_ref_test" },
            { reference: "product_type", reference_id: "ptyp_ref_test" },
            { reference: "product_collection", reference_id: "pcol_ref_test" },
            { reference: "product_category", reference_id: "pcat_ref_test" },
            { reference: "seller", reference_id: seller.id },
          ]

          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "All Refs Calc Test",
              display_name: "All Refs Calc Test",
              code: "ALL_REFS_CALC",
              type: "percentage",
              charging_level: "item",
              value: 3,
              rules: referenceTypes.map((r) => ({
                ...r,
                mode: "include",
              })),
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          const feeId = response.data.service_fee.id

          const getResponse = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )

          const rules = getResponse.data.service_fee.rules
          expect(rules).toHaveLength(5)

          const storedReferences = rules.map(
            (r: { reference: string }) => r.reference
          )
          expect(storedReferences).toContain("product")
          expect(storedReferences).toContain("product_type")
          expect(storedReferences).toContain("product_collection")
          expect(storedReferences).toContain("product_category")
          expect(storedReferences).toContain("seller")
        })
      })

      // ---------------------------------------------------------------
      // 7. Activate and Deactivate Lifecycle
      // ---------------------------------------------------------------

      describe("Activate and deactivate lifecycle", () => {
        it("should deactivate an active fee", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Deactivate Lifecycle Fee",
              display_name: "Deactivate Lifecycle Fee",
              code: "DEACT_LIFECYCLE",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          expect(createResponse.status).toEqual(201)
          expect(createResponse.data.service_fee.status).toEqual("active")

          const feeId = createResponse.data.service_fee.id

          const deactivateResponse = await api.post(
            `/admin/service-fees/${feeId}/deactivate`,
            {},
            adminHeaders
          )

          expect(deactivateResponse.status).toEqual(200)
          expect(deactivateResponse.data.service_fee).toEqual(
            expect.objectContaining({
              id: feeId,
              status: "inactive",
              is_enabled: false,
            })
          )
        })

        it("should activate an inactive fee", async () => {
          // Create active fee
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Activate Lifecycle Fee",
              display_name: "Activate Lifecycle Fee",
              code: "ACT_LIFECYCLE",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          // Deactivate it first
          await api.post(
            `/admin/service-fees/${feeId}/deactivate`,
            {},
            adminHeaders
          )

          // Verify it's inactive
          const getInactive = await api.get(
            `/admin/service-fees/${feeId}`,
            adminHeaders
          )
          expect(getInactive.data.service_fee.status).toEqual("inactive")

          // Activate it
          const activateResponse = await api.post(
            `/admin/service-fees/${feeId}/activate`,
            {},
            adminHeaders
          )

          expect(activateResponse.status).toEqual(200)
          expect(activateResponse.data.service_fee).toEqual(
            expect.objectContaining({
              id: feeId,
              status: "active",
              is_enabled: true,
            })
          )
        })

        it("should log deactivation in change logs", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Deact Log Fee",
              display_name: "Deact Log Fee",
              code: "DEACT_LOG",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          // Deactivate
          await api.post(
            `/admin/service-fees/${feeId}/deactivate`,
            {},
            adminHeaders
          )

          // Check change logs
          const response = await api.get(
            `/admin/service-fees/${feeId}/change-logs`,
            adminHeaders
          )

          expect(response.status).toEqual(200)

          const deactivatedLog = response.data.change_logs.find(
            (log: any) => log.action === "deactivated"
          )
          expect(deactivatedLog).toBeDefined()
          expect(deactivatedLog.service_fee_id).toEqual(feeId)
        })

        it("should log activation in change logs", async () => {
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Act Log Fee",
              display_name: "Act Log Fee",
              code: "ACT_LOG",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const feeId = createResponse.data.service_fee.id

          // Deactivate first
          await api.post(
            `/admin/service-fees/${feeId}/deactivate`,
            {},
            adminHeaders
          )

          // Activate
          await api.post(
            `/admin/service-fees/${feeId}/activate`,
            {},
            adminHeaders
          )

          // Check change logs
          const response = await api.get(
            `/admin/service-fees/${feeId}/change-logs`,
            adminHeaders
          )

          expect(response.status).toEqual(200)

          const activatedLog = response.data.change_logs.find(
            (log: any) => log.action === "activated"
          )
          expect(activatedLog).toBeDefined()
          expect(activatedLog.service_fee_id).toEqual(feeId)
        })

        it("should return 404 when activating non-existent fee", async () => {
          const response = await api
            .post(
              `/admin/service-fees/non_existent/activate`,
              {},
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })

        it("should handle full lifecycle: create → deactivate → activate → deactivate", async () => {
          // Create (active)
          const createResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Full Lifecycle Fee",
              display_name: "Full Lifecycle Fee",
              code: "FULL_LIFECYCLE",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          expect(createResponse.status).toEqual(201)
          const feeId = createResponse.data.service_fee.id
          expect(createResponse.data.service_fee.status).toEqual("active")

          // Deactivate (inactive)
          const deact1 = await api.post(
            `/admin/service-fees/${feeId}/deactivate`,
            {},
            adminHeaders
          )
          expect(deact1.data.service_fee.status).toEqual("inactive")

          // Activate (active)
          const act1 = await api.post(
            `/admin/service-fees/${feeId}/activate`,
            {},
            adminHeaders
          )
          expect(act1.data.service_fee.status).toEqual("active")

          // Deactivate again (inactive)
          const deact2 = await api.post(
            `/admin/service-fees/${feeId}/deactivate`,
            {},
            adminHeaders
          )
          expect(deact2.data.service_fee.status).toEqual("inactive")

          // Verify change logs has 4 entries: created, deactivated, activated, deactivated
          const response = await api.get(
            `/admin/service-fees/${feeId}/change-logs`,
            adminHeaders
          )

          expect(response.status).toEqual(200)

          const actions = response.data.change_logs.map(
            (log: any) => log.action
          )
          expect(actions).toContain("created")
          expect(actions).toContain("deactivated")
          expect(actions).toContain("activated")
          expect(response.data.change_logs.length).toBeGreaterThanOrEqual(4)
        })
      })

      // ---------------------------------------------------------------
      // 8. Global Fee
      // ---------------------------------------------------------------

      describe("Global fee behavior", () => {
        it("should create a global fee", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Global Fee",
              display_name: "Global Platform Fee",
              code: "GLOBAL_FEE",
              type: "percentage",
              charging_level: "global",
              value: 5,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Global Fee",
              charging_level: "global",
              value: 5,
              status: "active",
            })
          )
        })

        it("should create a global fee with replaces_fee_id for succession", async () => {
          // Create the first global fee
          const firstResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Global Fee V1",
              display_name: "Global Platform Fee V1",
              code: "GLOBAL_V1",
              type: "percentage",
              charging_level: "global",
              value: 5,
            },
            adminHeaders
          )

          expect(firstResponse.status).toEqual(201)
          const firstFeeId = firstResponse.data.service_fee.id

          // Create a second global fee that is pending and replaces the first
          const futureDate = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString()

          const secondResponse = await api.post(
            `/admin/service-fees`,
            {
              name: "Global Fee V2",
              display_name: "Global Platform Fee V2",
              code: "GLOBAL_V2",
              type: "percentage",
              charging_level: "global",
              value: 7,
              status: "pending",
              effective_date: futureDate,
              replaces_fee_id: firstFeeId,
            },
            adminHeaders
          )

          expect(secondResponse.status).toEqual(201)
          expect(secondResponse.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Global Fee V2",
              charging_level: "global",
              status: "pending",
              replaces_fee_id: firstFeeId,
            })
          )
        })

        it("should be able to filter global fees by charging_level", async () => {
          await api.post(
            `/admin/service-fees`,
            {
              name: "Global Filter Test",
              display_name: "Global Filter Test",
              code: "GLOBAL_FILTER",
              type: "percentage",
              charging_level: "global",
              value: 3,
            },
            adminHeaders
          )

          await api.post(
            `/admin/service-fees`,
            {
              name: "Item Level Fee",
              display_name: "Item Level Fee",
              code: "ITEM_LEVEL",
              type: "percentage",
              charging_level: "item",
              value: 10,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/service-fees?charging_level=global`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.service_fees.length).toBeGreaterThanOrEqual(1)
          response.data.service_fees.forEach((fee: any) => {
            expect(fee.charging_level).toEqual("global")
          })
        })

        it("should create shop-level fee", async () => {
          const response = await api.post(
            `/admin/service-fees`,
            {
              name: "Shop Fee",
              display_name: "Shop Service Fee",
              code: "SHOP_FEE",
              type: "percentage",
              charging_level: "shop",
              value: 8,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.service_fee).toEqual(
            expect.objectContaining({
              name: "Shop Fee",
              charging_level: "shop",
              value: 8,
            })
          )
        })
      })
    })
  },
})
