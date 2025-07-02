"use client";

import React, { useEffect, useState } from "react";
import SideMenu from "../../dialogs/SideMenu";
import SearchSection from "../../dialogs/SearchBar";
import OrderFooter from "../../dialogs/OrderFooter";
import Image from "next/image";
import ChoicePopup from "../../dialogs/ChoicePopup";
import { HiMenu } from "react-icons/hi";

interface ProductOption {
  size?: string;
  price: number;
}

interface productData {
  id?: string | number;
  productTitle: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media: any;
  options?: {
    optionDetails: {
      option: { size: string };
      price: string;
      salePrice: string;
      taxType: string;
      taxPercentage: number;
    }[];
  }[];
  taxType?: string;
  taxPercentage?: number;
}

const HomeScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [popularItems, setPopularItems] = useState<productData[]>([]);
  const [showChoicePopup, setShowChoicePopup] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    image: string;
    options?: ProductOption[];
    taxType: string;
    taxPercentage: number;
  } | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    const fetchPopularItems = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/product-list-by-id`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch data");

        const responseJson = await response.json();
        const items: productData[] = responseJson.productData || [];
        setPopularItems(items.slice(0, 10));
      } catch (error) {
        console.error("Error fetching popular items:", error);
      }
    };
    if (token) fetchPopularItems();
  }, [token]);

  const handleItemClick = (item: productData) => {
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
      taxPercentage: firstOption?.taxPercentage ?? item.taxPercentage ?? 0,
      taxType: firstOption?.taxType ?? item.taxType ?? "exclusive",
    });

    setShowChoicePopup(true);
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-white">
      {/* Mobile Header */}
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

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row mb-32">
        {/* Mobile SideMenu */}
        {showSideMenu && (
          <div className="fixed inset-0 z-50 bg-opacity-30">
            <div className="absolute bottom-0 w-full">
              <SideMenu setShowSideMenu={setShowSideMenu}  />
            </div>
            <button
              className="absolute top-4 right-4 text-white text-xl"
              onClick={() => setShowSideMenu(false)}
            >
              ✕
            </button>
          </div>
        )}

        <div className="hidden md:block">
          <SideMenu />
        </div>

        <div className="flex-1 h-full pb-10 px-8 overflow-y-auto">
          <SearchSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          {/* Popular Items Section */}
          <section className="pb-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {popularItems
                .filter((item) =>
                  item.productTitle
                    .toLowerCase()
                    .includes(searchTerm.trim().toLowerCase())
                )
                .map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className="text-center cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="relative w-full h-32">
                      <Image
                        src={
                          item?.media?.[0]?.mediaUrl
                            ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${item.media[0].mediaUrl}`
                            : "./images/rice.png"
                        }
                        alt={item.productTitle}
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    <p
                      style={{ fontFamily: "CustomFontP" }}
                      className="text-sm font-semibold text-black mt-4"
                    >
                      {item.productTitle}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>

      <ChoicePopup
        visible={showChoicePopup}
        onClose={() => setShowChoicePopup(false)}
        item={selectedItem}
      />

      <OrderFooter />
    </div>
  );
};

export default HomeScreen;
