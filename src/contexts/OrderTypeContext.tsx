'use client'
import React, { createContext, useContext, useState } from "react";

interface OrderTypeContextProps {
  orderType: string;
  orderIcon: string;
  setOrderType: (type: string, icon: string) => void;
}

const OrderTypeContext = createContext<OrderTypeContextProps | undefined>(undefined);

export const OrderTypeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orderType, setOrderTypeState] = useState("");
  const [orderIcon, setOrderIcon] = useState("");

  const setOrderType = (type: string, icon: string) => {
    setOrderTypeState(type);
    setOrderIcon(icon);
  };

  return (
    <OrderTypeContext.Provider value={{ orderType, orderIcon, setOrderType }}>
      {children}
    </OrderTypeContext.Provider>
  );
};

export const useOrderType = () => {
  const context = useContext(OrderTypeContext);
  console.log("context",context)
  if (!context) throw new Error("useOrderType must be used within OrderTypeProvider");
  return context;
};
