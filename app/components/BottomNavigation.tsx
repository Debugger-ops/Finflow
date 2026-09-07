"use client";

/**
 * @deprecated Superseded by <AppNav />, which is mounted once in the root
 * layout and navigates by route instead of local `activeTab` state.
 * Kept only so any stray import keeps compiling; it renders nothing.
 */
import React from "react";

interface BottomNavigationProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = () => null;

export default BottomNavigation;
