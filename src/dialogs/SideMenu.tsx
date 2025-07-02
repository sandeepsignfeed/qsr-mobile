"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useComponentCount } from "@/contexts/ComponentCount";

interface Category {
  id: number;
  category_name: string;
}

type SideMenuProps = {
  setShowSideMenu?: Dispatch<SetStateAction<boolean>>;
};
function SideMenu({setShowSideMenu}:SideMenuProps) {
  const [menu, setMenu] = useState<Category[]>([]);
  const { setCurrentComponentCount, setCategoryId, categoryId } = useComponentCount();

  useEffect(() => {
    const fetchCategories = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      if (!token) {
        console.warn("No access token found.");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category-list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.status === 200) {
          setMenu(data.categoryData);
        } else {
          console.error("Error fetching categories:", data.message);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchCategories();
  }, []);

  const allItemsCategory: Category = { id: 0, category_name: "All Items" };
  const fullMenu = [allItemsCategory, ...menu];

  return (
    <div className="bg-white md:rounded-none w-full md:w-64 h-screen overflow-y-auto z-50 shadow-md">
      {/* Logo */}
      {/* <div className="flex justify-center py-6">
        <Image
          src="/Images/Menu_logo.png"
          width={165}
          height={88}
          alt="Menu Logo"
        />
      </div> */}

      {/* Menu */}
      <nav className="overflow-y-auto flex-1 px-4">
        <h2
          style={{ fontFamily: "CustomFontMP" }}
          className="text-3xl text-center text-[#EA0000] font-bold my-10"
        >
          Our Menu
        </h2>
        <ul
          style={{ fontFamily: "CustomFontP" }}
          className="text-base md:text-lg font-medium divide-y divide-[#CECECE] text-black"
        >
          {fullMenu.map((item) => {
            const isActive = item.id === categoryId;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setCategoryId(item.id);
                    setShowSideMenu?.(false);
                    if (item.id === 0) {
                      setCurrentComponentCount(4);
                    } else {
                      setCurrentComponentCount(9);
                    }
                  }}
                  className={`w-full text-left py-4 px-3 rounded-md transition-colors duration-200 ${
                    isActive ? "bg-[#E3000F] text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {item.category_name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default SideMenu;
