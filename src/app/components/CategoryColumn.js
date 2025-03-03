import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ProductCard from "./ProductCard";

export default function CategoryColumn({ category, products }) {

  // ✅ Set up Droppable and attach category as data
  const { setNodeRef, isOver } = useDroppable({
    id: category,  // Use category name as the ID
    data: { category }, // ✅ Pass category name as droppable data
  });
  return (
    <div ref={setNodeRef} className={`bg-gray-100 p-4 rounded-lg shadow-md min-h-[200px] flex flex-col w-full transition-all ${
      isOver ? "bg-blue-200" : "" // Highlight when dragging over
    }`}>
      {console.log("Products in category column ", products)}
      {console.log("Category in category column ", category)}
      <h2 className="text-lg font-semibold mb-2 text-center text-gray-800">{category}</h2>
      <div className="space-y-2">
        <SortableContext items={products?.map((p) => `product-${p.barcode}`)} strategy={verticalListSortingStrategy}>
          {products?.map((product) => (
            <ProductCard key={product?.barcode} product={product} category={category}/>
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
