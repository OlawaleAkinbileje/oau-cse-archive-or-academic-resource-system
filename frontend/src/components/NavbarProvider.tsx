"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type NavbarSlotContent = React.ReactNode;

interface NavbarContextValue {
  centerSlot: NavbarSlotContent;
  rightSlot: NavbarSlotContent;
  showBrand: boolean;
  showPrimaryNav: boolean;
  showAuthActions: boolean;
  setCenterSlot: (node: NavbarSlotContent) => void;
  setRightSlot: (node: NavbarSlotContent) => void;
  setShowBrand: (v: boolean) => void;
  setShowPrimaryNav: (v: boolean) => void;
  setShowAuthActions: (v: boolean) => void;
}

const NavbarContext = createContext<NavbarContextValue | null>(null);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [centerSlot, setCenterSlot] = useState<NavbarSlotContent>(null);
  const [rightSlot, setRightSlot] = useState<NavbarSlotContent>(null);
  const [showBrand, setShowBrand] = useState<boolean>(true);
  const [showPrimaryNav, setShowPrimaryNav] = useState<boolean>(true);
  const [showAuthActions, setShowAuthActions] = useState<boolean>(true);

  const value = useMemo<NavbarContextValue>(
    () => ({
      centerSlot,
      rightSlot,
      showBrand,
      showPrimaryNav,
      showAuthActions,
      setCenterSlot,
      setRightSlot,
      setShowBrand,
      setShowPrimaryNav,
      setShowAuthActions,
    }),
    [centerSlot, rightSlot, showBrand, showPrimaryNav, showAuthActions],
  );

  return <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>;
}

export function useNavbar() {
  const ctx = useContext(NavbarContext);
  if (!ctx) {
    throw new Error("useNavbar must be used within NavbarProvider");
  }
  return ctx;
}

export function useNavbarSlot(
  part: "center" | "right",
  node: React.ReactNode,
  deps: React.DependencyList = [],
) {
  const { setCenterSlot, setRightSlot } = useNavbar();
  const set = part === "center" ? setCenterSlot : setRightSlot;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setter = useCallback(set, [part]);
  React.useEffect(() => {
    setter(node);
    return () => setter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setter, ...deps]);
}

export function useNavbarFlags(flags: {
  showBrand?: boolean;
  showPrimaryNav?: boolean;
  showAuthActions?: boolean;
}) {
  const { setShowBrand, setShowPrimaryNav, setShowAuthActions } = useNavbar();
  React.useEffect(() => {
    if (typeof flags.showBrand === "boolean") setShowBrand(flags.showBrand);
    if (typeof flags.showPrimaryNav === "boolean") setShowPrimaryNav(flags.showPrimaryNav);
    if (typeof flags.showAuthActions === "boolean") setShowAuthActions(flags.showAuthActions);
    return () => {
      setShowBrand(true);
      setShowPrimaryNav(true);
      setShowAuthActions(true);
    };
  }, [
    flags.showBrand,
    flags.showPrimaryNav,
    flags.showAuthActions,
    setShowBrand,
    setShowPrimaryNav,
    setShowAuthActions,
  ]);
}
