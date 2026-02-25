// models/Goal.ts
import mongoose, { Schema, model, models } from 'mongoose';

export interface IGoal {
  _id: string;
  name: string;
  description: string;
  current: number;
  target: number;
  deadline: Date;
  category: 'emergency' | 'travel' | 'transportation' | 'housing' | 'education' | 'health' | 'business' | 'tech';
  icon: 'shield' | 'plane' | 'car' | 'home' | 'education' | 'health' | 'business' | 'tech' | 'target';
  priority: 'high' | 'medium' | 'low';
  monthlyContribution: number;
  userId?: string; // Optional: if you want to associate goals with users
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    current: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Current amount cannot be negative']
    },
    target: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target must be greater than 0']
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required']
    },
    category: {
      type: String,
      required: true,
      enum: ['emergency', 'travel', 'transportation', 'housing', 'education', 'health', 'business', 'tech'],
      default: 'emergency'
    },
    icon: {
      type: String,
      required: true,
      enum: ['shield', 'plane', 'car', 'home', 'education', 'health', 'business', 'tech', 'target'],
      default: 'shield'
    },
    priority: {
      type: String,
      required: true,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    monthlyContribution: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly contribution cannot be negative']
    },
    userId: {
      type: String,
      // Uncomment if you want to make it required
      // required: [true, 'User ID is required']
    }
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
goalSchema.index({ userId: 1, createdAt: -1 });
goalSchema.index({ category: 1 });
goalSchema.index({ deadline: 1 });

// Virtual field to calculate progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  return this.target > 0 ? Math.min((this.current / this.target) * 100, 100) : 0;
});

// Virtual field to calculate remaining amount
goalSchema.virtual('remaining').get(function() {
  return Math.max(this.target - this.current, 0);
});

// Instance method to check if goal is on track
goalSchema.methods.isOnTrack = function(): boolean {
  const today = new Date();
  const deadline = new Date(this.deadline);
  const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const monthsRemaining = daysRemaining / 30;
  
  if (this.monthlyContribution <= 0) return false;
  
  const monthsNeeded = Math.ceil((this.target - this.current) / this.monthlyContribution);
  return monthsNeeded <= monthsRemaining;
};

// Static method to find goals by user
goalSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};
// Pre-save middleware to validate deadline is in the future
// Pre-save middleware to validate deadline is in the future

const Goal = models.Goal || model<IGoal>('Goal', goalSchema);

export default Goal;