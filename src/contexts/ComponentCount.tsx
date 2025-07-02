'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

type ComponentCountContextType = {
  currentComponentCount: number;
  setCurrentComponentCount: Dispatch<SetStateAction<number>>;
  // incrementCount: () => void;
  resetCount: () => void;
  categoryId: number | undefined;
  setCategoryId: Dispatch<SetStateAction<number>>;
};

const ComponentCountContext = createContext<ComponentCountContextType | undefined>(undefined);

export function ComponentCountProvider({ children }: { children: ReactNode }) {
  const [currentComponentCount, setCurrentComponentCount] = useState(1);
  const [categoryId, setCategoryId] = useState(0)

  // const incrementCount = () => setCurrentComponentCount((prev) => prev + 1);
  const resetCount = () => setCurrentComponentCount(0);

  return (
    <ComponentCountContext.Provider
      value={{ currentComponentCount, setCurrentComponentCount, resetCount ,categoryId, setCategoryId }}
    >
      {children}
    </ComponentCountContext.Provider>
  );
}

export function useComponentCount(): ComponentCountContextType {
  const context = useContext(ComponentCountContext);
  if (!context) {
    throw new Error('useComponentCount must be used within a ComponentCountProvider');
  }
  return context;
}
