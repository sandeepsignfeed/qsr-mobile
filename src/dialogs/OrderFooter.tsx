"use client";
import React from "react";
import { useCart } from "../contexts/CartContext";
import { useOrderType } from "../contexts/OrderTypeContext"; // keep if used
import { useComponentCount } from "@/contexts/ComponentCount";

const OrderFooter = () => {
  const { orderType, orderIcon } = useOrderType() || {};
  const { cart, clearCart } = useCart();
  const { setCurrentComponentCount } = useComponentCount();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <footer className="fixed bottom-0 w-full bg-white border-t z-40">
      {/* Header Bar */}
      <div
        style={{ fontFamily: "CustomFontMP" }}
        className="flex justify-between items-center px-4 md:px-10 py-3 md:py-5 bg-[#EA0000] text-white text-xs md:text-2xl font-normal"
      >
        <span>My Orders - {orderType}</span>
        <button
          onClick={() => {
            if (totalItems > 0) {
              setCurrentComponentCount(5);
            }
          }}
          style={{ fontFamily: "CustomFontP" }}
          className={`${
            totalItems > 0 ? "text-white" : "text-[#F69494]"
          } text-xs md:text-lg font-bold`}
        >
          View My Order
        </button>
      </div>

      {/* Content Section */}
      <div className="flex flex-col px-4 py-6 gap-4">
        {/* Total Price + Icon */}
        <div className="flex gap-4 items-center">
          <div className="relative w-12 h-12">
            <img src={orderIcon} alt="Order" className="w-10 h-12" />
            <span className="absolute -top-2 -right-1 w-5 h-5 flex items-center justify-center">
              <img
                src="./Images/circle.png"
                alt="Badge background"
                className="w-full h-full"
              />
              <span className="absolute flex items-center justify-center text-white text-[10px] font-bold">
                {totalItems}
              </span>
            </span>
          </div>
          <span
            style={{ fontFamily: "CustomFontP" }}
            className="text-xl md:text-4xl font-extrabold text-black"
          >
            ₹ {totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-4 w-full max-w-md">
          <button
            style={{ fontFamily: "CustomFontP" }}
            onClick={clearCart}
            className="bg-black text-white font-medium text-sm md:text-lg rounded-lg hover:opacity-90 w-full h-10"
          >
            Cancel Order
          </button>

          <button
            style={{ fontFamily: "CustomFontP" }}
            onClick={() => {
              if (totalItems > 0) {
                console.log("Proceeding to Order Summary");
                setCurrentComponentCount(5);
              }
            }}
            className={`${
              totalItems > 0
                ? "bg-[#00AB2E] hover:opacity-90 cursor-pointer"
                : "bg-green-300 cursor-not-allowed"
            } text-white font-medium text-sm md:text-lg rounded-lg w-full h-10`}
          >
            Done
          </button>
        </div>
      </div>
    </footer>
  );
};

export default OrderFooter;
