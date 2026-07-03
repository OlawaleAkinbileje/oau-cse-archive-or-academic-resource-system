"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type UploadModalContextType = {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
};

const UploadModalContext = createContext<UploadModalContextType | undefined>(undefined);

export function UploadModalProvider({ children }: { children: ReactNode }) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <UploadModalContext.Provider value={{ showUploadModal, setShowUploadModal }}>
      {children}
    </UploadModalContext.Provider>
  );
}

export function useUploadModal() {
  const context = useContext(UploadModalContext);
  if (!context) {
    throw new Error("useUploadModal must be used within an UploadModalProvider");
  }
  return context;
}
