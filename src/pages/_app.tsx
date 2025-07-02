import type { Metadata } from "next";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { OrderTypeProvider } from "@/contexts/OrderTypeContext";
import { CartProvider } from "@/contexts/CartContext";
import { ComponentCountProvider } from "@/contexts/ComponentCount";

export const metadata: Metadata = {
  title: "SignQSR",
  description: "SignQSR: A kiosk Application",
};




export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <OrderTypeProvider>
        <ComponentCountProvider>
          <Component {...pageProps} />
        </ComponentCountProvider>
      </OrderTypeProvider>
    </CartProvider>
  );
}
