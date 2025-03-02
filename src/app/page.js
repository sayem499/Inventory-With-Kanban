"use client"
import { useState, useEffect } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import dynamic from "next/dynamic";
import axios from "axios";
import CategoryColumn from "./components/CategoryColumn";
import { arrayMove } from "@dnd-kit/sortable";


const BarcodeScannerComponent = dynamic(() => import("./components/BarcodeScanner"), { ssr: false });

export default function Home() {
  const [categories, setCategories] = useState({
    Uncategorized: [],
  });
  const [categoryNames, setCategoryNames] = useState(["Uncategorized"]);
  
  useEffect(() => {
    console.log("Updated categories:", categories);
  }, [categories]);
  
  useEffect(() => {
    console.log("Updated category names:", categoryNames);
  }, [categoryNames]);
  useEffect(() => {
    // Load products from database (API call can be added here)
  }, []);

  const handleBarcodeScan = async (barcode) => {
    try {
      console.log(barcode);
      const response = await axios.get(`/api/product/8901012116340`, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.status) {
        console.log(response.data.product);
        const product = response.data.product;
        setCategories((prev) => ({
          ...prev,
          Uncategorized: [...prev.Uncategorized, product],
        }));
      }
    } catch (error) {
      console.error("Error fetching product details", error);
    }
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
  
    const fromCategory = active.data.current?.category;
    const toCategory = over.data.current?.category;

    console.log(over);
    console.log(active);
  
    if (!fromCategory || !toCategory || fromCategory === toCategory) return;
  
    const barcode = active.id.replace("product-", ""); // ✅ Extract actual barcode
  
    // Optimistic update for instant UI change
    setCategories((prev) => {
      const product = prev[fromCategory]?.find((p) => p.barcode === barcode);
      if (!product) return prev;
  
      // Remove from old category and add to new category
      const updatedCategories = {
        ...prev,
        [fromCategory]: prev[fromCategory].filter((p) => p.barcode !== barcode),
        [toCategory]: [...(prev[toCategory] || []), product], // Ensure category exists
      };
  
      return updatedCategories;
    });
  
    // ✅ Force re-render to prevent jump
    setTimeout(() => {
      setCategories((prev) => ({ ...prev }));
    }, 0);
  };

  const addCategory = () => {
    const newCategory = prompt("Enter category name:");
  
    if (newCategory && !categories[newCategory]) {
      setCategoryNames((prev) => {
        const updatedNames = [...prev, newCategory];
        //console.log("✅ Updated category names:", updatedNames); // Log here
        return updatedNames;
      });
  
      setCategories((prev) => {
        const updatedCategories = { ...prev, [newCategory]: [] };
        //console.log("✅ Updated categories:", updatedCategories); // Log here
        return updatedCategories;
      });
    }
  };
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Kanban Product Manager</h1>
      <BarcodeScannerComponent onScan={handleBarcodeScan} />
      <button onClick={addCategory} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
        Add Category
      </button>
      <DndContext collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        {/* ✅ Only categories should be in this SortableContext */}
        <SortableContext items={categoryNames}>
          <div className="grid grid-cols-3 gap-4">
            {categoryNames.map((category) => (
              <div key={category} id={`category-${category}`} className="border p-2 rounded-lg">
                <CategoryColumn category={category} products={categories[category]} />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
