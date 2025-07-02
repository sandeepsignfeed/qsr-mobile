'use client'
import Lottie from "lottie-react";
import animationData from "../../../public/Animation/process.json";

const Processing: React.FC = () => {
  return (
   <div
  className="min-h-screen bg-cover bg-center bg-[#FFFFFF] flex flex-col items-center px-4 bg-blend-difference"
  style={{
    backgroundImage: "url(./Images/background_image.png)",
  }}
>
  {/* Static Haldiram's Logo */}
  <div className="mt-16 md:mt-32 mb-12">
    <img
      src="./Images/Menu_logo.png"
      alt="Haldiram's Logo"
      className="w-40 h-24 md:w-64 md:h-36"
    />
  </div>

  {/* Success Card */}
  <div className="bg-white rounded-3xl w-full max-w-3xl border border-[#454545] text-center px-6 md:px-14 py-8 md:py-12">
    {/* Animated Success Icon */}
    <div className="w-40 h-40 md:w-64 md:h-64 mx-auto mb-8">
      <Lottie animationData={animationData} loop={true} />
    </div>

    <h2
      style={{ fontFamily: "CustomFontP" }}
      className="text-2xl md:text-5xl font-bold text-[#2C2C2C] mb-6"
    >
      Payment Processing
    </h2>

    <p
      style={{ fontFamily: "CustomFontP" }}
      className="text-xs md:text-2xl text-[#3D3D3D] font-normal mx-auto max-w-xl"
    >
      Please wait! Your payment is being processed.
    </p>
  </div>
</div>

  );
};

export default Processing;
