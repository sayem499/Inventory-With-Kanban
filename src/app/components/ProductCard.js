import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function ProductCard({ product, category }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id:`product-${product.barcode}`, // Use barcode as unique identifier
      data: { barcode: product.barcode, category }, // Also store the category
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-lg shadow-md border border-gray-300 flex flex-col items-center md:items-start w-full cursor-grab"
    >
      <p className="text-sm font-semibold text-gray-800 text-center md:text-left">
        {product.description}
      </p>
      <span className="text-xs text-gray-500">Barcode: {product.barcode}</span>
    </div>
  );
}
