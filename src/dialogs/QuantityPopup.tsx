"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "../contexts/CartContext";
import { useOrderType } from "../contexts/OrderTypeContext";

interface QuantityPopupProps {
  visible: boolean;
  onClose: () => void;
  selectedOption: {
    name: string;
    size?: string;
    price: number;
    image: string;
    taxType: string;
    taxPercentage?: number;
  } | null;
  onConfirm?: (selection: {
    name: string;
    size?: string;
    price: number;
    image: string;
    taxType: string;
    taxPercentage?: number;
    quantity: number;
  }) => void;
}

const QuantityPopup: React.FC<QuantityPopupProps> = ({
  visible,
  onClose,
  selectedOption,
  onConfirm,
}) => {
  const { addToCart } = useCart();
  const { orderType, orderIcon } = useOrderType();

  const [quantity, setQuantity] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    if (selectedOption) {
      setQuantity(1);
      setTotalPrice(selectedOption.price);
    }
  }, [selectedOption]);

  useEffect(() => {
    if (selectedOption) {
      setTotalPrice(quantity * selectedOption.price);
    }
  }, [quantity, selectedOption]);

  if (!visible || !selectedOption) return null;

  const handleAddToCart = () => {
    addToCart(
      {
        id: `${selectedOption.name}-${selectedOption.size || "default"}`,
        name: `${selectedOption.name}${
          selectedOption.size ? ` (${selectedOption.size})` : ""
        }`,
        price: selectedOption.price,
        image: selectedOption.image,
        taxPercentage: selectedOption.taxPercentage ?? 0,
        taxType: selectedOption.taxType,
      },
      quantity
    );

    onConfirm?.({
      ...selectedOption,
      quantity,
      price: selectedOption.price * quantity,
      taxPercentage: selectedOption.taxPercentage ?? 0,
    });

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-opacity-30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center">
        <div className="bg-white w-full max-w-4xl sm:rounded-2xl shadow-lg flex flex-col max-h-[90vh]">
          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-grow">
            {/* Header */}
            <hr className="border-t-4 border-[#E9AA00]" />
            <div className="flex flex-row justify-between items-center gap-4 px-4 sm:px-10 py-6">
              <h2
                style={{ fontFamily: "CustomFontMP" }}
                className="text-sm md:text-3xl font-normal text-[#E3000F]"
              >
                Select order quantity
              </h2>
              <button
                onClick={onClose}
                className="bg-black text-white text-sm md:text-xl font-medium rounded-full w-24 sm:w-52 h-10 md:h-16"
                style={{ fontFamily: "CustomFontP" }}
              >
                Back
              </button>
            </div>

            {/* Image */}
            <div className="w-full h-24 sm:h-52 relative">
              <Image
                src={selectedOption.image}
                alt={selectedOption.name}
                fill
                className="object-contain p-2"
                priority
              />
            </div>

            {/* Details */}
            <div className="text-center mt-2 px-4">
              <p
                style={{ fontFamily: "CustomFontM" }}
                className="text-base sm:text-xl font-semibold text-black"
              >
                {selectedOption.size || "No size"}
              </p>
              <p
                style={{ fontFamily: "CustomFontM" }}
                className="text-xl sm:text-3xl font-bold mt-1 text-black"
              >
                {selectedOption.name}
              </p>
              <p
                style={{ fontFamily: "CustomFontM" }}
                className="text-[#E3000F] text-xl sm:text-4xl font-bold mt-2 "
              >
                ₹ {selectedOption.price.toFixed(2)}
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex justify-center items-center space-x-6 sm:space-x-16 my-5">
              <button
                aria-label="Decrease quantity"
                className="bg-yellow-500 text-white w-8 sm:w-16 h-8 sm:h-16 rounded text-xl sm:text-4xl"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                -
              </button>
              <span
                style={{ fontFamily: "CustomFontP" }}
                className="text-xl sm:text-3xl font-semibold text-black"
              >
                {quantity.toString().padStart(2, "0")}
              </span>
              <button
                aria-label="Increase quantity"
                className="bg-yellow-500 text-white w-8 sm:w-16 h-8 sm:h-16 rounded text-xl sm:text-4xl"
                onClick={() => setQuantity((prev) => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Fixed Footer */}
          <footer className="bg-white border-t Z-50">
            <div
              className="flex justify-between items-center px-4 sm:px-10 py-3 bg-[#EA0000] text-white text-xs sm:text-xl"
              style={{ fontFamily: "CustomFontMP" }}
            >
              <span>My Orders - {orderType}</span>
              <button
                className="text-xs sm:text-base text-[#F69494] font-bold"
                style={{ fontFamily: "CustomFontM" }}
              >
                View My Order
              </button>
            </div>

            <div className="flex flex-col px-4 py-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12">
                  <img src={orderIcon} alt="Order Icon" className="w-10 h-12" />
                  <span className="absolute -top-2 -right-1 w-5 h-5">
                    <img src="./Images/circle.png" className="w-full h-full" />
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                      {quantity}
                    </span>
                  </span>
                </div>
                <span
                  style={{ fontFamily: "CustomFontP" }}
                  className="text-xl sm:text-3xl font-extrabold text-black"
                >
                  ₹ {totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-row gap-4 w-full">
                <button
                  onClick={onClose}
                  className="bg-black text-white text-sm sm:text-lg rounded-lg w-full sm:w-80 h-10"
                  style={{ fontFamily: "CustomFontP" }}
                >
                  Cancel Order
                </button>
                <button
                  onClick={handleAddToCart}
                  className="bg-[#00AB2E] text-white text-sm sm:text-lg rounded-lg w-full sm:w-80 h-10"
                  style={{ fontFamily: "CustomFontP" }}
                >
                  Add to Order
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default QuantityPopup;
