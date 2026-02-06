// Centralized type definitions

// For Tab Button
export interface TabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: string | number;
}

// For Balance Card
export interface BalanceCardProps {
  balance: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
  monthlyChange: number;
}

// For Goal
export type GoalType =
  | 'emergency'
  | 'travel'
  | 'transportation'
  | 'housing'
  | 'education'
  | 'health'
  | 'business'
  | 'tech';

export type GoalPriority = 'high' | 'medium' | 'low';

export interface Goal {
  id: number;
  name: string;
  description: string;
  target: number;
  current: number;
  deadline: string;
  category: "emergency" | "travel" | "transportation" | "housing" | "education" | "health" | "business" | "tech";
  icon: string;
  priority: string;
  monthlyContribution: number;
  title?: string; // optional if used elsewhere
  type?: string;  // optional if used elsewhere
}


// Props for a single Goal Card
export interface GoalCardProps {
  goal: Goal;
}

// For Spending Chart
export interface SpendingChartProps {
  data: { name: string; amount: number }[];
}

// Metric Card
export interface MetricCardProps {
  title: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

// For Recent Activity
export interface Activity {
  id: number;
  description: string;
  amount: number;
  date: string;
}

export interface RecentActivityProps {
  activities: Activity[];
}

import React from "react";

// Props for text input setting
export interface SettingInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  type?: string;
  placeholder?: string;
}


// Props for toggle switch setting
export interface SettingToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

// Option for select setting
export interface SelectOption {
  value: string | number;
  label: string;
}
export interface SelectProps {
  value: string;       // expects string
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  description?: string;
}

// Props for select setting
export interface SettingSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  label: string;
  description?: string;
}

// Generic SettingProps if needed for abstraction
export type SettingProps = SettingInputProps | SettingToggleProps | SettingSelectProps;
