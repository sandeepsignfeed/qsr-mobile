"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "../../contexts/CartContext";
import type { CartItem } from "../../contexts/CartContext";
import { useComponentCount } from "@/contexts/ComponentCount";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const PhoneNumberForm: React.FC = () => {
  const { cart } = useCart();
  const { setCurrentComponentCount } = useComponentCount();

  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState<string | null>(null);
  const [serviceTax, setServiceTax] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalGST, setTotalGST] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOrderType(localStorage.getItem("OrderType"));
    setServiceTax(Number(localStorage.getItem("serviceTax") || 0));
    setTotalPrice(Number(localStorage.getItem("totalPrice") || 0));
    setTotalGST(Number(localStorage.getItem("totalGST") || 0));
  }, []);

  const generateBillNumber = (): string => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const datePart = `${now.getFullYear().toString().slice(2)}${pad(
      now.getMonth() + 1
    )}${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(
      now.getSeconds()
    )}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `BILL-${datePart}-${timePart}-${randomPart}`;
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!/^\d{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);

      if (!(await loadRazorpayScript())) {
        throw new Error("Razorpay SDK failed to load.");
      }

      const username = "User";
      const billNumber = generateBillNumber();

      const orderItems = cart.map((item: CartItem) => ({
        name: item.name,
        quantity: item.quantity,
        pricePerUnit: item.price,
        taxPercentage: item.taxPercentage,
        totalPrice: item.price * item.quantity,
      }));

      const registerRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            phone,
            orderType,
            totalAmount: Math.round(totalPrice),
            serviceTax,
            billNumber,
            items: orderItems,
          }),
        }
      );

      if (!registerRes.ok) throw new Error("Order registration failed");

      const initiateRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/initiate-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(totalPrice),
            phone,
            name: username,
            billNumber,
          }),
        }
      );

      if (!initiateRes.ok) throw new Error("Payment initiation failed");

      const initiateData = await initiateRes.json();

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: initiateData.id,
        amount: Math.round(totalPrice * 100),
        currency: "INR",
        name: "Haldiram's",
        description: "Order Payment",
        handler: async (resp: RazorpayResponse) => {
          setCurrentComponentCount(7);

          try {
            const verifyRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/verify-payment`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resp),
              }
            );

            const verifyData = await verifyRes.json();
            if (verifyData.status !== 200) {
              throw new Error("Payment verification failed");
            }

            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/update-payment-status`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: initiateData.id }),
              }
            );

            const location = JSON.parse(
              localStorage.getItem("location") || "{}"
            );
            const companyInfo = {
              name: location.locationName || "Haldiram’s",
              address: `${location.addressLine1 || ""}, ${
                location.addressLine2 || ""
              }`,
              city: location.city || "",
              state: location.state || "",
              serviceTax: location.serviceTax || 0,
            };

            const generateRes = await fetch("/api/generate-invoice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderDetails: {
                  orderId: initiateData.id,
                  customerName: username,
                  totalAmount: Math.round(totalPrice),
                  totalGST: Math.round(totalGST),
                  serviceTax,
                  phone,
                  orderType,
                  amountPaid: totalPrice,
                  billNumber,
                  items: orderItems,
                },
                companyInfo,
              }),
            });

            const genData = await generateRes.json();
            console.log("✅ Invoice Response:", genData);

            if (!genData.success) {
              throw new Error("Invoice generation failed");
            }

            setCurrentComponentCount(8); // Success screen
          } catch (err: unknown) {
            console.error("❌ Error after payment:", err);
            alert(
              "Payment succeeded, but there was a problem generating the receipt."
            );
          }
        },
        prefill: {
          name: username,
          contact: phone,
        },
      });

      rzp.open();
    } catch (err: unknown) {
      console.error("❌ Payment Error:", err);
      alert("Something went wrong during payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-cover bg-center bg-[#FFFFFF] bg-blend-difference ${
        loading ? "backdrop-blur-lg" : ""
      }`}
      style={{ backgroundImage: "url(./Images/background_image.png)" }}
    >
      <div className="mt-16 md:mt-24">
        <img
          src="./Images/Menu_logo.png"
          alt="Haldiram's Logo"
          className="w-48 h-24 md:w-64 md:h-36 mx-auto"
        />
      </div>

      <div className="text-center mb-8 px-5">
        <h2
          style={{ fontFamily: "CustomFontP" }}
          className="text-lg md:text-5xl font-semibold text-[#171717] my-4"
        >
          Please Enter Your Phone Number
        </h2>
        <p
          style={{ fontFamily: "CustomFontP" }}
          className="text-xs md:text-2xl text-[#545454]"
        >
          {` Once you enter your phone number, we'll send you an E-Receipt.`}
        </p>
      </div>

      <div className="flex items-center justify-center mt-12 px-4">
        <div className="bg-white rounded-xl border border-[#454545] w-full max-w-md md:max-w-3xl px-6 md:px-14 py-10 md:py-14">
          <label
            style={{ fontFamily: "CustomFontP" }}
            htmlFor="phone"
            className="block text-lg md:text-2xl text-gray-700 mb-3"
          >
            Phone number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => {
              const rawValue = e.target.value;
              const onlyNumbers = rawValue.replace(/\D/g, ""); // Remove non-digits
              if (onlyNumbers.length <= 12) {
                setPhone(onlyNumbers);
              }
            }}
            inputMode="numeric" // Better mobile keyboard
            pattern="\d*" // Hints for numeric input
            maxLength={12}
            className="w-full border-2 border-[#DAD9F4] rounded-lg px-4 h-12 md:h-24 text-2xl md:text-3xl focus:outline-none focus:ring-2 focus:ring-[#00AB2E] mb-10 text-black"
          />

          <div className="flex gap-6">
            <button
              style={{ fontFamily: "CustomFontP" }}
              onClick={handlePayment}
              className="w-full bg-[#00AB2E] text-white h-12 md:h-24 rounded-lg text-sm md:text-3xl font-medium"
            >
              Pay Now
            </button>
            <button
              style={{ fontFamily: "CustomFontP" }}
              onClick={() => setCurrentComponentCount(4)}
              className="w-full border-2 border-[#141414] text-[#000000EB] h-12 md:h-24 rounded-lg text-sm md:text-3xl font-medium"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberForm;
