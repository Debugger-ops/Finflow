import React from "react";

// TabButton
export interface TabButtonProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: string | number;  // ✅ optional now
}

// BalanceCard
export interface BalanceCardProps {
  balance: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
  monthlyChange: number;
}

// SpendingChart
export interface SpendingData {
  name: string;
  value: number;
}
export interface SpendingChartProps {
  data: SpendingData[];
}

// Goal
export interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
}
export interface GoalCardProps {
  goal: Goal;
}

// QuickStats
export interface QuickStatsCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

// Notifications
export type NotificationType = "success" | "error" | "warning" | "alert";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
}
export interface NotificationCardProps {
  notifications: Notification[];
}
