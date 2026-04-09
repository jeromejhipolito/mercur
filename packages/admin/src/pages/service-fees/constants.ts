export const RULE_REFERENCE_TYPES = [
  { value: "product_category", label: "serviceFees.rules.productCategory", group: "serviceFees.rules.byProduct" },
  { value: "product_type", label: "serviceFees.rules.productType", group: "serviceFees.rules.byProduct" },
  { value: "product_collection", label: "serviceFees.rules.productCollection", group: "serviceFees.rules.byProduct" },
  { value: "product", label: "serviceFees.rules.specificProduct", group: "serviceFees.rules.byProduct" },
  { value: "seller", label: "serviceFees.rules.seller", group: "serviceFees.rules.bySeller" },
] as const

export type RuleReferenceType = typeof RULE_REFERENCE_TYPES[number]["value"]
