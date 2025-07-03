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

      // Step 1: Register Order
      console.log("🔄 Registering order...");
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

      if (!registerRes.ok) {
        const errorText = await registerRes.text();
        console.error("❌ Order registration failed:", errorText);
        throw new Error("Order registration failed");
      }

      // Step 2: Initiate Payment
      console.log("🔄 Initiating payment...");
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

      if (!initiateRes.ok) {
        const errorText = await initiateRes.text();
        console.error("❌ Payment initiation failed:", errorText);
        throw new Error("Payment initiation failed");
      }

      const initiateData = await initiateRes.json();
      console.log("✅ Payment initiated:", initiateData);

      // Step 3: Open Razorpay
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: initiateData.id,
        amount: Math.round(totalPrice * 100),
        currency: "INR",
        name: "Haldiram's",
        description: "Order Payment",
        handler: async (resp: RazorpayResponse) => {
          console.log("💳 Payment successful:", resp);
          setCurrentComponentCount(7); // Loading screen

          try {
            // Step 4: Verify Payment
            console.log("🔄 Verifying payment...");
            const verifyRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/verify-payment`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resp),
              }
            );

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed");
            }

            const verifyData = await verifyRes.json();
            if (verifyData.status !== 200) {
              throw new Error("Payment verification failed");
            }

            console.log("✅ Payment verified");

            // Step 5: Update Payment Status
            console.log("🔄 Updating payment status...");
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/update-payment-status`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: initiateData.id }),
              }
            );

            // Step 6: Prepare Invoice Data
            const location = JSON.parse(
              localStorage.getItem("location") || "{}"
            );
            
            const companyInfo = {
              name: location.locationName || "Haldiram's",
              address: `${location.addressLine1 || ""}, ${location.addressLine2 || ""}`.trim(),
              city: location.city || "Delhi",
              state: location.state || "India",
              serviceTax: location.serviceTax || 0,
            };

            const orderDetails = {
              orderId: initiateData.id,
              customerName: username,
              totalAmount: Math.round(totalPrice),
              totalGST: Math.round(totalGST),
              serviceTax,
              phone,
              orderType: orderType || "takeaway",
              amountPaid: Math.round(totalPrice),
              billNumber,
              items: orderItems,
            };

            console.log("📄 Generating invoice...");
            console.log("Order Details:", orderDetails);
            console.log("Company Info:", companyInfo);

            // Step 7: Generate Invoice
            const generateRes = await fetch("/api/generate-invoice", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                orderDetails,
                companyInfo,
              }),
            });

            console.log("📊 Invoice API Response Status:", generateRes.status);

            if (!generateRes.ok) {
              const errorText = await generateRes.text();
              console.error("❌ Invoice generation failed:");
              console.error("Status:", generateRes.status);
              console.error("Response:", errorText);
              
              // Still show success screen even if invoice fails
              alert("Payment successful! Invoice generation failed, but your order is confirmed.");
              setCurrentComponentCount(8);
              return;
            }

            let genData;
            try {
              genData = await generateRes.json();
              console.log("✅ Invoice Response:", genData);
            } catch (jsonErr) {
              console.error("❌ Failed to parse invoice response:", jsonErr);
              alert("Payment successful! Invoice may have issues, but your order is confirmed.");
              setCurrentComponentCount(8);
              return;
            }

            if (!genData.success) {
              console.error("❌ Invoice generation reported failure:", genData);
              alert(`Payment successful! Invoice issue: ${genData.message || "Unknown error"}`);
              setCurrentComponentCount(8);
              return;
            }

            console.log("✅ Everything completed successfully!");
            console.log("📄 Invoice URL:", genData.invoiceUrl);
            
            // Show success screen
            setCurrentComponentCount(8);

          } catch (err: unknown) {
            console.error("❌ Error after payment:", err);
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            alert(
              `Payment succeeded, but there was a problem: ${errorMessage}. Your order is confirmed.`
            );
            // Still show success since payment went through
            setCurrentComponentCount(8);
          }
        },
        modal: {
          ondismiss: () => {
            console.log("💳 Payment cancelled by user");
            setLoading(false);
          }
        },
        prefill: {
          name: username,
          contact: phone,
        },
        theme: {
          color: "#00AB2E"
        }
      });

      rzp.open();
    } catch (err: unknown) {
      console.error("❌ Payment Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(`Something went wrong: ${errorMessage}`);
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
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AB2E] mx-auto mb-4"></div>
            <p className="text-gray-700">Processing payment...</p>
          </div>
        </div>
      )}

      <div className="mt-16 md:mt-24">
        <img
          src="./Images/Menu_logo.png"
          alt="Haldiram's Logo"
          className="w-48 h-24 md:w-64 md:h-36 mx-auto"
        />
      </div>

      <div className="text-center mb-8 px-5">
        <h2
          className="text-lg md:text-5xl font-semibold text-[#171717] my-4"
          style={{ fontFamily: "CustomFontP" }}
        >
          Please Enter Your Phone Number
        </h2>
        <p
          className="text-xs md:text-2xl text-[#545454]"
          style={{ fontFamily: "CustomFontP" }}
        >
          {`Once you enter your phone number, we'll send you an E-Receipt.`}
        </p>
      </div>

      <div className="flex items-center justify-center mt-12 px-4">
        <div className="bg-white rounded-xl border border-[#454545] w-full max-w-md md:max-w-3xl px-6 md:px-14 py-10 md:py-14">
          <label
            htmlFor="phone"
            className="block text-lg md:text-2xl text-gray-700 mb-3"
            style={{ fontFamily: "CustomFontP" }}
          >
            Phone number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\D/g, "");
              if (rawValue.length <= 12) setPhone(rawValue);
            }}
            inputMode="numeric"
            pattern="\d*"
            maxLength={12}
            className="w-full border-2 border-[#DAD9F4] rounded-lg px-4 h-12 md:h-24 text-2xl md:text-3xl focus:outline-none focus:ring-2 focus:ring-[#00AB2E] mb-10 text-black"
            placeholder="Enter 10-digit number"
          />

          <div className="flex gap-6">
            <button
              onClick={() => setCurrentComponentCount(4)}
              disabled={loading}
              className="w-full border-2 border-[#141414] text-[#000000EB] h-12 md:h-24 rounded-lg text-sm md:text-3xl font-medium disabled:opacity-50"
              style={{ fontFamily: "CustomFontP" }}
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              disabled={loading || !phone || phone.length !== 10}
              className="w-full bg-[#00AB2E] text-white h-12 md:h-24 rounded-lg text-sm md:text-3xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "CustomFontP" }}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberForm;