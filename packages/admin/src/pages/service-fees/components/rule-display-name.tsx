import { useProductCategory } from "../../../hooks/api/categories"
import { useProductType } from "../../../hooks/api/product-types"
import { useCollection } from "../../../hooks/api/collections"
import { useSeller } from "../../../hooks/api/sellers"
import { useProduct } from "../../../hooks/api/products"

interface RuleDisplayNameProps {
  reference: string
  reference_id: string
}

export const RuleDisplayName = ({
  reference,
  reference_id,
}: RuleDisplayNameProps) => {
  switch (reference) {
    case "product_category":
      return <CategoryName id={reference_id} />
    case "product_type":
      return <ProductTypeName id={reference_id} />
    case "product_collection":
      return <CollectionName id={reference_id} />
    case "seller":
      return <SellerName id={reference_id} />
    case "product":
      return <ProductName id={reference_id} />
    default:
      return <span>{reference_id}</span>
  }
}

const CategoryName = ({ id }: { id: string }) => {
  const { product_category } = useProductCategory(id)
  return <span>{product_category?.name ?? id}</span>
}

const ProductTypeName = ({ id }: { id: string }) => {
  const { product_type } = useProductType(id)
  return <span>{product_type?.value ?? id}</span>
}

const CollectionName = ({ id }: { id: string }) => {
  const { collection } = useCollection(id)
  return <span>{collection?.title ?? id}</span>
}

const SellerName = ({ id }: { id: string }) => {
  const { seller } = useSeller(id)
  const sellerRecord = seller as Record<string, unknown> | undefined
  return <span>{(sellerRecord?.name as string) ?? id}</span>
}

const ProductName = ({ id }: { id: string }) => {
  const { product } = useProduct(id)
  return <span>{product?.title ?? id}</span>
}
