// "use client";
// import React from "react";
// import { useComponentCount } from "@/contexts/ComponentCount";

// function Welcome() {
//   const { setCurrentComponentCount } = useComponentCount();

//   return (
//     <div
//       className="min-h-screen flex flex-col justify-between bg-cover bg-[#FFFFFF] bg-center bg-blend-difference"
//       style={{
//         backgroundImage: "url(./Images/background_image.png)",
//       }}
//     >
//       {/* Logo */}
//       <div className="flex justify-center mt-6 md:mt-10">
//         <img
//           src="./Images/Menu_logo.png"
//           alt="Description"
//           className="w-40 md:w-64 h-auto max-w-full"
//         />
//       </div>

//       {/* Heading */}
//       <h1 className="text-xl md:text-4xl text-[#FF0000] text-center font-bold mt-5 px-2 leading-tight">
//         Welcome{" "}
//         <span className="text-xl md:text-4xl text-black font-semibold">
//           {`to Haldiram's!`}
//         </span>
//       </h1>

//       {/* Subtext */}
//       <p className="text-center text-xs md:text-lg text-[#545454] px-4 mt-2">
//         We are delighted to serve you the best of Indian <br />
//         snacks, sweets, and meals.
//       </p>

//       {/* Hero Image */}
//       <div className="flex justify-center mt-8 px-4">
//         <img
//           src="./Images/hero.png"
//           alt="hero_images"
//           className="w-full max-w-xs md:max-w-md h-auto"
//         />
//       </div>

//       {/* Front Image */}
//       <div className="flex justify-center mt-8">
//         <img
//           src="./Images/front_page_image.png"
//           alt="front_image"
//           className="mt-8 mb-[-36px] bg-cover bg-center w-full max-w-sm md:max-w-lg h-auto"
//         />
//       </div>

//       {/* Bottom CTA */}
//       <button onClick={() => setCurrentComponentCount(3)} className="w-full">
//         <div className="relative flex justify-center items-center">
//           <img
//             src="./Images/background_bottom.png"
//             alt="background_bottom"
//             className="z-0 w-full h-auto max-w-sm md:max-w-lg"
//           />
//           <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
//             <h1
//               style={{ fontFamily: "CustomFontM" }}
//               className="text-xl md:text-3xl font-extrabold text-white"
//             >
//               Touch to Begin
//             </h1>
//             <p
//               style={{ fontFamily: "CustomFontM" }}
//               className="text-xs md:text-base font-medium text-white"
//             >
//               UPI & Card Payment Acceptable
//             </p>
//           </div>
//         </div>
//       </button>
//     </div>
//   );
// }

// export default Welcome;





"use client";
import React from "react";
import { useComponentCount } from "@/contexts/ComponentCount";

function Welcome() {
  const { setCurrentComponentCount } = useComponentCount();

  const handleBeginClick = async () => {
    const username = "admi-12";
    const password = "admin@123";

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("userType", data.userType);
      localStorage.setItem("serviceTypes", JSON.stringify(data.serviceTypes));
      localStorage.setItem("serviceTax", data.serviceTax?.toString() ?? "0");

      localStorage.setItem("location", JSON.stringify(data.location));
      localStorage.setItem("locationId", data.location.id.toString());
      localStorage.setItem("locationName", data.location.locationName);
      localStorage.setItem("locationUrlString", data.location.locationUrlString);

      setCurrentComponentCount(3);
    } catch (error) {
      console.error("Auto-login failed:", error);
      alert("Login failed. Please check your credentials or server.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-cover bg-[#FFFFFF] bg-center bg-blend-difference"
      style={{
        backgroundImage: "url(./Images/background_image.png)",
      }}
    >
      {/* Logo */}
      <div className="flex justify-center mt-6 md:mt-10">
        <img
          src="./Images/Menu_logo.png"
          alt="Description"
          className="w-40 md:w-64 h-auto max-w-full"
        />
      </div>

      {/* Heading */}
      <h1 className="text-xl md:text-4xl text-[#FF0000] text-center font-bold mt-5 px-2 leading-tight">
        Welcome{" "}
        <span className="text-xl md:text-4xl text-black font-semibold">
          {`to Haldiram's!`}
        </span>
      </h1>

      {/* Subtext */}
      <p className="text-center text-xs md:text-lg text-[#545454] px-4 mt-2">
        We are delighted to serve you the best of Indian <br />
        snacks, sweets, and meals.
      </p>

      {/* Hero Image */}
      <div className="flex justify-center mt-8 px-4">
        <img
          src="./Images/hero.png"
          alt="hero_images"
          className="w-full max-w-xs md:max-w-md h-auto"
        />
      </div>

      {/* Front Image */}
      <div className="flex justify-center mt-8">
        <img
          src="./Images/front_page_image.png"
          alt="front_image"
          className="mt-8 mb-[-36px] bg-cover bg-center w-full max-w-sm md:max-w-lg h-auto"
        />
      </div>

      {/* Bottom CTA */}
      <button onClick={handleBeginClick} className="w-full">
        <div className="relative flex justify-center items-center">
          <img
            src="./Images/background_bottom.png"
            alt="background_bottom"
            className="z-0 w-full h-auto max-w-sm md:max-w-lg"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1
              style={{ fontFamily: "CustomFontM" }}
              className="text-xl md:text-3xl font-extrabold text-white"
            >
              Touch to Begin
            </h1>
            <p
              style={{ fontFamily: "CustomFontM" }}
              className="text-xs md:text-base font-medium text-white"
            >
              UPI & Card Payment Acceptable
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

export default Welcome;
