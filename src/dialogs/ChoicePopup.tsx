"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import QuantityPopup from "./QuantityPopup";

interface ProductOption {
  size?: string;
  price: number;
  salePrice?: number;
  taxType: string;
  taxPercentage?: number;
  taxAmount?: number;
  taxableAmount?: number;
}

interface MenuItem {
  name: string;
  image: string;
  options?: ProductOption[];
  price?: number;
  salePrice?: number;
  taxType: string;
  taxPercentage?: number;
  taxAmount?: number;
  taxableAmount?: number;
}

interface PopupCardProps {
  visible: boolean;
  onClose?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: MenuItem | any;
  onConfirm?: (selection: {
    name: string;
    size?: string;
    price: number;
    image: string;
    quantity: number;
    taxType: string;
    taxPercentage?: number;
    taxAmount?: number;
    taxableAmount?: number;
  }) => void;
}

const ChoicePopup: React.FC<PopupCardProps> = ({
  visible,
  onClose,
  item,
  onConfirm,
}) => {
  const [showQuantityPopup, setShowQuantityPopup] = useState(false);
  const [selectedOption, setSelectedOption] = useState<{
    name: string;
    size?: string;
    price: number;
    image: string;
    taxType: string;
    taxPercentage?: number;
    taxAmount?: number;
    taxableAmount?: number;
  } | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedOption(null);
      setShowQuantityPopup(false);
    }
  }, [visible]);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible || !item) return null;

  const validOptions: ProductOption[] = (item.options || []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (opt: any) => typeof opt.price === "number"
  );
  const hasOptions = validOptions.length > 0;

  const handleOptionClick = (option: ProductOption) => {
    const priceToUse = option.salePrice ?? option.price;
    setSelectedOption({
      name: item.name,
      size: option.size,
      price: priceToUse,
      image: item.image,
      taxType: item.taxType,
      taxPercentage: item.taxPercentage,
    });
    setShowQuantityPopup(true);
  };

  const handleSingleItemClick = () => {
    const priceToUse = item.salePrice ?? item.price ?? 0;
    setSelectedOption({
      name: item.name,
      price: priceToUse,
      image: item.image,
      taxType: item.taxType,
      taxPercentage: item.taxPercentage ?? 0,
      taxAmount: item.taxAmount,
      taxableAmount: item.taxableAmount,
    });
    setShowQuantityPopup(true);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-opacity-40 z-40" onClick={onClose} />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center mb-48">
        <div className="bg-white w-full max-w-7xl max-h-[90vh] overflow-y-auto sm:rounded-2xl mx-auto z-50">
          <hr className="border-t-4 border-[#E9AA00]" />

          {/* Header */}
          <div className="flex flex-row sm:flex-row justify-between items-center gap-4 mt-4 px-4 md:px-10">
            <h2
              style={{ fontFamily: "CustomFontMP" }}
              className="text-sm md:text-3xl font-normal text-[#E3000F]"
            >
              Make your choice
            </h2>
            <button
              onClick={onClose}
              style={{ fontFamily: "CustomFontP" }}
              className="bg-black text-white text-sm md:text-xl font-medium rounded-full w-24 sm:w-52 h-10 md:h-16"
            >
              Cancel
            </button>
          </div>

          {/* Options */}
          <div className="w-full md:px-10">
            {!hasOptions ? (
              <div className="flex justify-center">
                <div
                  className="bg-white rounded-xl p-4 w-[260px] flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
                  onClick={handleSingleItemClick}
                >
                  <div className="w-full h-40 relative rounded-xl overflow-hidden bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  </div>
                  <p className="mt-2 text-red-600 font-bold text-lg">
                    ₹ {(item.salePrice ?? item.price ?? 0).toFixed(2)}
                  </p>
                  <button className="bg-black text-white text-sm px-4 py-1 rounded-md mt-1">
                    {item.name}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto no-scrollbar px-1 sm:justify-center sm:flex-wrap">
                {validOptions.map((option, idx) => {
                  const price = option.salePrice ?? option.price;
                  return (
                    <div
                      key={option.size ?? `option-${idx}`}
                      className="bg-white rounded-xl p-4 w-[180px] flex-shrink-0 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => handleOptionClick(option)}
                    >
                      <div className="w-full h-32 relative rounded-xl overflow-hidden bg-white">
                        <Image
                          src={item.image}
                          alt={`${option.size || ""} ${item.name}`}
                          fill
                          className="object-contain p-2"
                          priority
                        />
                      </div>
                      <p className="mt-2 text-red-600 font-bold text-base">
                        ₹ {price.toFixed(2)}
                      </p>
                      <button className="bg-black text-white text-sm px-4 py-1 rounded-md mt-1">
                        {option.size}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quantity Popup */}
      <QuantityPopup
        visible={showQuantityPopup}
        onClose={() => setShowQuantityPopup(false)}
        selectedOption={selectedOption}
        onConfirm={(selection) => {
          onConfirm?.(selection);
          setShowQuantityPopup(false);
          onClose?.();
        }}
      />
    </>
  );
};

export default ChoicePopup;
