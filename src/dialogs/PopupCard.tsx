"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useOrderType } from "../contexts/OrderTypeContext";
import { useComponentCount } from "@/contexts/ComponentCount";

const PopupCard: React.FC = () => {
  const { setOrderType } = useOrderType();
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const { setCurrentComponentCount, setCategoryId } = useComponentCount();

  useEffect(() => {
    const types = localStorage.getItem("serviceTypes");
    if (types) {
      setServiceTypes(JSON.parse(types));
    }
  }, []);

  const handleSelection = (type: string, icon: string) => {
    setOrderType(type, icon);
    localStorage.setItem("OrderType", type);
    setCategoryId(0); // select "All Items"
    setCurrentComponentCount(4);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-end z-50">
      <div className="bg-white w-screen text-center relative pb-10">
        <hr className="border-t-[5px] border-[#E9AA00]" />

        <h1
          style={{ fontFamily: "CustomFontP" }}
          className="text-sm sm:text-2xl text-black font-semibold pt-8 px-4"
        >
          How can we serve you today?
        </h1>

        {/* Dine-in Button */}
        {serviceTypes.includes("dine-in") && (
          <button
            style={{ fontFamily: "CustomFontP" }}
            onClick={() => handleSelection("Dine-in", "./Images/Eat_in.png")}
            className="flex justify-center items-center p-3 mt-8 mx-auto w-full max-w-[80%] h-12 bg-[#EA0000] text-white rounded-lg text-sm sm:text-2xl font-medium gap-3"
          >
            <Image
              src="./Images/DineIn.png"
              alt="Dine-In"
              width={32}
              height={32}
            />
            Dine-in
          </button>
        )}

        {/* Take-away Button */}
        {serviceTypes.includes("take-away") && (
          <button
            style={{ fontFamily: "CustomFontP" }}
            onClick={() =>
              handleSelection("Take-away", "./Images/Take_Away.png")
            }
            className="flex justify-center items-center p-3 mt-6 mx-auto w-full max-w-[80%] h-12 bg-white border-2 border-[#EA0000] text-[#EA0000] rounded-lg text-sm sm:text-2xl font-medium gap-3"
          >
            <Image
              src="./Images/Grap.png"
              alt="Take-away"
              width={32}
              height={32}
            />
            Take-away
          </button>
        )}

        {/* Payment Icons */}
        <div className="flex flex-wrap justify-center items-center gap-3 mt-10 px-4">
          <Image
            src="./Images/GooglePay.png"
            width={30}
            height={20}
            alt="Google Pay"
          />
          <Image
            src="./Images/AmazonPay.png"
            width={30}
            height={20}
            alt="Amazon Pay"
          />
          <Image src="./Images/Visa.png" width={30} height={20} alt="Visa" />
          <Image
            src="./Images/PayPal.png"
            width={30}
            height={20}
            alt="PayPal"
          />
          <Image src="./Images/Amex.png" width={30} height={20} alt="Amex" />
          <Image
            src="./Images/Mastercard.png"
            width={30}
            height={20}
            alt="Mastercard"
          />
        </div>
      </div>
    </div>
  );
};

export default PopupCard;
