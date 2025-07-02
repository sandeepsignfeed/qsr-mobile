"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import SideMenu from "../../dialogs/SideMenu";
import SearchBar from "../../dialogs/SearchBar";
import OrderFooter from "../../dialogs/OrderFooter";
import ChoicePopup from "../../dialogs/ChoicePopup";
import { HiMenu } from "react-icons/hi";
// import { useParams } from "next/navigation";

// Interfaces for product structure
interface ProductOption {
  size?: string;
  price: number;
}

interface ProductItem {
  taxType: string;
  productTitle: string;
  media: { mediaUrl: string }[];
  options: {
    optionDetails: {
      option: { size: string };
      price: string;
      salePrice: string;
      taxType: string;
      taxPercentage: number;
    }[];
  }[];
  taxPercentage: number;
}

function MenuItem({ categoryId }: { categoryId: number | undefined }) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showChoicePopup, setShowChoicePopup] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    image: string;
    options?: ProductOption[];
    taxType: string;
    taxPercentage: number;
  } | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;

    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/product-list-by-id?categoryId=${categoryId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setProducts(data.productData || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  const handleItemClick = (item: ProductItem) => {
    const imageUrl = item.media?.[0]?.mediaUrl
      ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${item.media[0].mediaUrl}`
      : "/images/rice.png";

    const optionDetails = item.options?.[0]?.optionDetails || [];
    const extractedOptions: ProductOption[] = optionDetails.map((detail) => ({
      size: detail.option?.size || undefined,
      price: parseFloat(detail.salePrice || detail.price || "0"),
    }));

    const firstOption = optionDetails.length > 0 ? optionDetails[0] : null;

    setSelectedItem({
      name: item.productTitle,
      image: imageUrl,
      options: extractedOptions,
      taxPercentage: firstOption?.taxPercentage ?? item.taxPercentage,
      taxType: firstOption?.taxType ?? item.taxType,
    });

    setShowChoicePopup(true);
  };

  // Filter products by searchTerm
  const filteredProducts = products.filter((item) =>
    item.productTitle.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-white">
      <div className="md:hidden bg-[#E3000F] py-4 px-4 flex items-center">
        <button onClick={() => setShowSideMenu(true)}>
          <HiMenu className="text-white text-3xl" />
        </button>
        {/* <Image
          src="/Images/Menu_logo.png"
          alt="logo"
          width={120}
          height={60}
          className="mx-auto"
        /> */}
      </div>
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row mb-40">
        {showSideMenu && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-30">
            <div className="absolute bottom-0 w-full">
              <SideMenu setShowSideMenu={setShowSideMenu} />
            </div>
            <button
              className="absolute top-4 right-4 text-white text-xl"
              onClick={() => setShowSideMenu(false)}
            >
              ✕
            </button>
          </div>
        )}
        {/* <SideMenu /> */}
        <div className="flex-1 h-full px-4 sm:px-8 overflow-y-auto">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {loading ? (
            <p className="text-center py-16 text-lg font-semibold text-gray-600">
              Loading Products...
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center py-16 text-lg font-semibold text-gray-600">
              No items match your search.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">
              {filteredProducts.map((item, index) => (
                <div
                  key={index}
                  className="text-center cursor-pointer transition-transform hover:scale-105"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="w-full h-32 flex items-center justify-center relative">
                    <Image
                      src={
                        item.media?.[0]?.mediaUrl
                          ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${item.media[0].mediaUrl}`
                          : "/images/rice.png"
                      }
                      alt={item.productTitle}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <p
                    style={{ fontFamily: "CustomFontP" }}
                    className="text-base font-semibold text-[#000000] mt-4"
                  >
                    {item.productTitle}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Choice popup */}
      <ChoicePopup
        visible={showChoicePopup}
        onClose={() => setShowChoicePopup(false)}
        item={selectedItem}
      />
      <OrderFooter />
    </div>
  );
}

export default MenuItem;
