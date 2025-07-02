"use client";
import Lottie from "lottie-react";
import successAnimation from "../../../public/Animation/success.json";
import { useComponentCount } from "@/contexts/ComponentCount";
import { useCart } from "@/contexts/CartContext";
import { useEffect } from "react";

const PayLater = () => {
  const { setCurrentComponentCount, setCategoryId } = useComponentCount();
  const { setCart } = useCart();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCart([]);
      setCategoryId(0);
      setCurrentComponentCount(1);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-[#FFFFFF] flex flex-col items-center px-4 bg-blend-difference"
      style={{
        backgroundImage: "url(./Images/background_image.png)",
      }}
    >
      {/* Logo */}
      <div className="mt-16 md:mt-32 mb-8">
        <img
          src="./Images/Menu_logo.png"
          alt="Haldiram's Logo"
          className="w-40 h-24 md:w-64 md:h-36"
        />
      </div>

      {/* Order Success Card */}
      <div className="bg-white rounded-3xl w-full max-w-3xl text-center border border-[#454545] px-6 md:px-14 py-10 md:py-14 mb-10">
        <div className="w-40 h-40 md:w-64 md:h-64 mx-auto mb-8">
          <Lottie animationData={successAnimation} loop={false} />
        </div>

        <h2
          style={{ fontFamily: "CustomFontP" }}
          className="text-3xl md:text-5xl font-bold text-[#2C2C2C] mb-6"
        >
          Order Successful
        </h2>

        <p
          style={{ fontFamily: "CustomFontP" }}
          className="text-lg md:text-2xl text-[#3D3D3D] font-normal max-w-xl mx-auto"
        >
          Your order has been placed. Please pay at the counter.
        </p>
      </div>

      {/* Done Button */}
      <button
        style={{ fontFamily: "CustomFontP" }}
        onClick={() => {
          setCart([]);
          setCategoryId(0);
          setCurrentComponentCount(1);
        }}
        className="mb-16 w-full max-w-[90%] md:max-w-xl h-12 md:h-24 bg-black text-white font-normal text-xl md:text-4xl rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        Done
      </button>
    </div>
  );
};

export default  PayLater;
