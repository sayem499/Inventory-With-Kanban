"use client";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  pointerIntersection,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import dynamic from "next/dynamic";
import axios from "axios";
import CategoryColumn from "./components/CategoryColumn";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; //

const BarcodeScannerComponent = dynamic(
  () => import("./components/BarcodeScanner"),
  { ssr: false }
);

export default function Home() {
  const [categories, setCategories] = useState({
    Uncategorized: [],
  });
  const [categoryNames, setCategoryNames] = useState(["Uncategorized"]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/categories/`
      );
      if (response.data.status) {
        const fetchedCategories = response.data.categories; // Assuming backend returns an array of categories

        const categoryData = {};
        const categoryNamesList = [];
        console.log("Fetched Categories ", fetchedCategories);
        fetchedCategories.forEach((category) => {
          categoryNamesList.push(category.category_name);
          categoryData[category.category_name] = [];
        });

        // ✅ Only add "Uncategorized" if it's NOT in fetchedCategories
        if (!categoryNamesList.includes("Uncategorized")) {
          categoryNamesList.unshift("Uncategorized"); // Ensure it's the first category
          categoryData["Uncategorized"] = [];
        }

        setCategoryNames(categoryNamesList);
        setCategories(categoryData);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories!", { autoClose: 2000 });
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/`
      );
      if (response.data.status) {
        const fetchedProducts = response.data.products;

        // Create a fresh categories object
        const newCategories = {};

        fetchedProducts.forEach((product) => {
          const category =
            product.category_id?.category_name || "Uncategorized";
          // Ensure the category exists in the newCategories object
          if (!newCategories[category]) {
            newCategories[category] = [];
          }

          newCategories[category].push(product);
        });

        setCategories(newCategories);
        console.log("Updated categories:", newCategories);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products!", { autoClose: 2000 });
    }
  };

  const updateProductCategory = async (barcode, newCategory) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${barcode}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category_name: newCategory,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.statusText}`);
      }

      toast.success(`Product moved to "${newCategory}" successfully!`);
    } catch (error) {
      toast.error("Failed to update product category. Please try again.");
    }
  };

  useEffect(() => {
    console.log("Updated categories:", categories);
  }, [categories]);

  useEffect(() => {
    console.log("Updated category names:", categoryNames);
  }, [categoryNames]);
  useEffect(() => {
    const fetchData = async () => {
      await fetchCategories(); // Fetch categories first
      await fetchProducts(); // Then fetch products
    };

    fetchData();
  }, []);

  const handleBarcodeScan = async (barcode) => {
    try {
      console.log(barcode);
      const response = await axios.get(`/api/product/${barcode}`, {
        //8901012116340
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.status) {
        const product = response.data.product;
        let alreadyExists;

        setCategories((prev) => {
          // ✅ Check if the barcode already exists in any category
          alreadyExists = Object.values(prev).some((categoryProducts) =>
            categoryProducts.some((p) => p.barcode === product.barcode)
          );

          if (alreadyExists) {
            toast.warning("Product already exists in a category!", {
              autoClose: 2000,
            });
            return prev; // Don't update state if product already exists
          }

          return {
            ...prev,
            Uncategorized: [...prev.Uncategorized, product], // ✅ Add only if not present
          };
        });

        // ✅ Save to database only if not already in state
        if (!alreadyExists) {
          await saveProductToDatabase({
            ...product,
            category_name: "Uncategorized",
          });
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error(`Product with barcode ${barcode} not found!`); // 🚀 Show toast on 404
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return null; // ✅ Return null to prevent crashes
    }
  };

  // ✅ Function to save product to the database
  const saveProductToDatabase = async (product) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products`,
        [product],
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.status) {
        toast.success("Product saved in 'Uncategorized' category!", {
          autoClose: 2000,
        });
      } else {
        toast.error("Failed to save product in database!", { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Error saving product", error);
      toast.error("Error saving product!", { autoClose: 2000 });
    }
  };

  const onDragStart = () => {
    document.body.style.overflow = "hidden"; // Disable scrolling
  };

  const onDragEnd = async (event) => {

    document.body.style.overflow = "auto";
    const { active, over } = event;
    
    if (!over) return;

    const fromCategory = active.data.current?.category;
    const toCategory = over.data.current?.category;

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

    // ✅ Call API to persist the update in the backend
    try {

      await updateProductCategory(barcode, toCategory);

    } catch (error) {

      console.error("Failed to update category:", error);
      // Rollback in case of an error
      setCategories((prev) => {
        const product = prev[toCategory]?.find((p) => p.barcode === barcode);
        if (!product) return prev;

        return {
          ...prev,
          [toCategory]: prev[toCategory].filter((p) => p.barcode !== barcode),
          [fromCategory]: [...prev[fromCategory], product],
        };
      });

    }
  };

  const addCategory = async () => {

    const newCategory = prompt("Enter category name:");

    if (newCategory && !categories[newCategory]) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/categories/`,
          {
            category_name: newCategory,
          }
        );

        if (response.data.status) {
          setCategoryNames((prev) => [...prev, newCategory]);

          setCategories((prev) => ({
            ...prev,
            [newCategory]: [],
          }));

          toast.success("Category added successfully!", { autoClose: 2000 });
        } else {
          toast.error("Failed to add category!", { autoClose: 2000 });
        }
      } catch (error) {

        console.error("Error adding category:", error);
        toast.error("Error adding category!", { autoClose: 2000 });

      }
    }
  };
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Kanban Product Manager</h1>
      <BarcodeScannerComponent onScan={handleBarcodeScan} />
      <button
        onClick={addCategory}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Add Category
      </button>
      <DndContext
        collisionDetection={rectIntersection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {/* ✅ Only categories should be in this SortableContext  closestCorners*/}
        <SortableContext items={categoryNames}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryNames.map((category) => (
              <div
                data-category={category}
                key={category}
                id={`category-${category}`}
                className="border p-2 rounded-lg"
              >
                <CategoryColumn
                  category={category}
                  products={categories[category] || []}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
