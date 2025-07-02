"use client";

import Image from "next/image";
import { useCart } from "../../contexts/CartContext";
import { useOrderType } from "../../contexts/OrderTypeContext";
import { useEffect, useMemo, useState } from "react";
import { useComponentCount } from "@/contexts/ComponentCount";

export default function OrderScreen() {
  const { orderType, orderIcon } = useOrderType();
  const { cart, updateQuantity, removeFromCart, getCartBreakdown } = useCart();

  const [includeServiceTax, setIncludeServiceTax] = useState(true);
  const [serviceTax, setServiceTax] = useState(0);
  const [valuesLoaded, setValuesLoaded] = useState(false);

  const { setCurrentComponentCount, setCategoryId } = useComponentCount();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedOrderType = localStorage.getItem("OrderType")?.toLowerCase();
      const storedServiceTax = parseFloat(
        localStorage.getItem("serviceTax") || "0"
      );
      const isDineIn = storedOrderType === "dine-in";

      setIncludeServiceTax(isDineIn);
      setServiceTax(isDineIn ? storedServiceTax : 0);
      setValuesLoaded(true);
    }
  }, []);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const breakdown = useMemo(() => {
    if (!valuesLoaded) {
      return {
        subtotal: 0,
        totalGST: 0,
        serviceTax: 0,
        grandTotal: 0,
      };
    }

    return getCartBreakdown(includeServiceTax, serviceTax);
  }, [cart, includeServiceTax, serviceTax, valuesLoaded]);

  useEffect(() => {
    if (valuesLoaded) {
      localStorage.setItem("totalPrice", JSON.stringify(breakdown.grandTotal));
      localStorage.setItem("totalGST", JSON.stringify(breakdown.totalGST));
    }
  }, [breakdown.grandTotal, valuesLoaded]);

  const handleCheckout = () => {
    if (cart.length > 0) {
      setCurrentComponentCount(6);
    } else {
      alert("Your cart is empty. Please add items to proceed.");
    }
  };

  if (!valuesLoaded) {
    return (
      <div className="p-10 text-center text-xl">Loading your order...</div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-[#FFFFFF] bg-center bg-blend-difference"
      style={{ backgroundImage: "url(./Images/background_image.png)" }}
    >
      {/* Logo */}
      {/* <div className="flex justify-center py-6 md:py-10">
        <img
          src="./Images/Menu_logo.png"
          alt="Haldiram's Logo"
          className="w-40 md:w-[250px] h-auto"
        />
      </div> */}

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 md:px-10 mt-10 pb-60">
        <div className="flex flex-col gap-6">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl w-full max-w-4xl mx-auto border border-[#949494]"
            >
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start p-2 gap-2">
                <div className="flex flex-col sm:flex-row items-center md:items-start gap-2">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={130}
                    height={130}
                    className="rounded"
                  />
                  <div className="px-4 md:px-10 text-center sm:text-left">
                    <h3
                      style={{ fontFamily: "CustomFontM" }}
                      className="text-base md:text-2xl font-bold text-black"
                    >
                      {item.name}
                    </h3>
                  </div>
                </div>

                <p
                  style={{ fontFamily: "CustomFontM" }}
                  className="text-red-600 font-bold text-xl md:text-3xl px-4 md:px-10"
                >
                  ₹ {item.price.toFixed(2)}
                </p>
              </div>

              <hr className="my-4 border-dashed border-[#949494]" />

              <div className="flex flex-row justify-between items-center py-3 px-4 md:px-10 gap-2">
                <button
                  style={{ fontFamily: "CustomFontP" }}
                  onClick={() => removeFromCart(item.id)}
                  className="bg-black text-white rounded-lg text-sm md:text-xl font-medium w-24 sm:w-40 h-10"
                >
                  Remove
                </button>

                <div className="flex items-center space-x-4 md:space-x-10">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, Math.max(item.quantity - 1, 1))
                    }
                    className="px-2 md:px-4 py-1 bg-yellow-500 text-white font-bold text-base rounded-lg"
                  >
                    −
                  </button>

                  <div
                    style={{ fontFamily: "CustomFontP" }}
                    className="text-lg md:text-xl font-semibold w-[40px] text-center text-black"
                  >
                    {item.quantity.toString().padStart(2, "0")}
                  </div>

                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2 md:px-4 py-1 bg-yellow-500 text-white font-bold text-base rounded-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div
          style={{ fontFamily: "CustomFontP" }}
          className="text-left w-full max-w-4xl mx-auto text-base md:text-xl px-4 md:px-6 py-4 mt-5 bg-white rounded-2xl border border-[#949494]"
        >
          <div className="flex justify-between py-2 text-black">
            <span>Subtotal</span>
            <span>₹ {breakdown.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 text-black">
            <span>GST</span>
            <span>₹ {breakdown.totalGST.toFixed(2)}</span>
          </div>
          {includeServiceTax && (
            <div className="flex justify-between py-2 text-black">
              <span>Service Tax</span>
              <span>₹ {breakdown.serviceTax.toFixed(2)}</span>
            </div>
          )}
          <hr className="my-4 border-dashed border-gray-400" />
          <div className="flex justify-between py-2 font-bold text-lg md:text-2xl text-black">
            <span>Total</span>
            <span>₹ {breakdown.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-white border-t z-40">
        <div
          style={{ fontFamily: "CustomFontMP" }}
          className="flex items-center px-4 md:px-10 py-3 bg-[#EA0000] text-white text-xs md:text-2xl font-normal"
        >
          <span>My Orders - {orderType}</span>
        </div>

        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="w-full max-w-4xl">
            <div className="flex flex-row items-center gap-4 mb-6">
              <div className="relative w-12 h-12">
                <Image
                  src={orderIcon}
                  alt="Order icon"
                  width={56}
                  height={56}
                  className="w-10 h-12"
                />
                <span className="absolute -top-2 -right-1 w-6 h-6 flex items-center justify-center">
                  <Image
                    src="./Images/circle.png"
                    alt="Quantity badge background"
                    fill
                    className="object-contain"
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
                ₹ {breakdown.grandTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-row gap-4 justify-center sm:justify-between">
              <button
                style={{ fontFamily: "CustomFontP" }}
                onClick={() => {
                  setCurrentComponentCount(10);
                  setCategoryId(0);
                }}
                className="bg-black text-white font-medium text-sm md:text-lg rounded-lg w-full sm:w-1/2 h-10"
              >
                Pay Later
              </button>

              <button
                style={{ fontFamily: "CustomFontP" }}
                className="bg-[#00AB2E] text-white font-medium text-sm md:text-lg rounded-lg w-full sm:w-1/2 h-10"
                onClick={handleCheckout}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
