// models/props.ts
export interface Goal {
  _id: string;
  name: string;
  description: string;
  current: number;
  target: number;
  deadline: string;
  category: 'emergency' | 'travel' | 'transportation' | 'housing' | 'education' | 'health' | 'business' | 'tech';
  icon: 'shield' | 'plane' | 'car' | 'home' | 'education' | 'health' | 'business' | 'tech' | 'target';
  priority: 'high' | 'medium' | 'low';
  monthlyContribution: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalCardProps {
  goal: Goal;
  onDelete: (id: string) => void;
  onEdit: (goal: Goal) => void;
}

export interface NewGoalInput {
  name: string;
  description: string;
  target: number;
  deadline: string;
  category: Goal['category'];
  icon: Goal['icon'];
  priority: Goal['priority'];
  monthlyContribution: number;
  current: number;
}

export interface GoalUpdateInput extends Partial<NewGoalInput> {
  _id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}