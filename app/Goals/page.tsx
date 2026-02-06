'use client';
import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  Car,
  Home,
  Plane,
  GraduationCap,
  Heart,
  Building,
  Smartphone
} from 'lucide-react';
import { GoalCardProps, Goal } from "../models/props";
import './Goals.css';

const GoalsManagement: React.FC = () => {
  const [Goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      name: 'Emergency Fund',
      description: 'Build 6 months of expenses',
      target: 15000,
      current: 8500,
      deadline: '2025-12-31',
      category: 'emergency',
      icon: 'shield',
      priority: 'high',
      monthlyContribution: 500
    },
    {
      id: 2,
      name: 'Dream Vacation',
      description: 'Trip to Japan',
      target: 5000,
      current: 2800,
      deadline: '2025-06-15',
      category: 'travel',
      icon: 'plane',
      priority: 'medium',
      monthlyContribution: 400
    },
    {
      id: 3,
      name: 'New Car',
      description: 'Down payment for Tesla Model 3',
      target: 25000,
      current: 8900,
      deadline: '2026-03-01',
      category: 'transportation',
      icon: 'car',
      priority: 'low',
      monthlyContribution: 800
    },
    {
      id: 4,
      name: 'House Down Payment',
      description: '20% down payment for first home',
      target: 50000,
      current: 12000,
      deadline: '2027-01-01',
      category: 'housing',
      icon: 'home',
      priority: 'high',
      monthlyContribution: 1200
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const goalIcons = {
    shield: <Target className="icon" />,
    plane: <Plane className="icon" />,
    car: <Car className="icon" />,
    home: <Home className="icon" />,
    education: <GraduationCap className="icon" />,
    health: <Heart className="icon" />,
    business: <Building className="icon" />,
    tech: <Smartphone className="icon" />
  };

  const categoryColors = {
    emergency: 'bg-red-500',
    travel: 'bg-blue-500',
    transportation: 'bg-green-500',
    housing: 'bg-purple-500',
    education: 'bg-yellow-500',
    health: 'bg-pink-500',
    business: 'bg-indigo-500',
    tech: 'bg-cyan-500'
  } as const;

  type Priority = 'high' | 'medium' | 'low';
  const priorityColors: Record<Priority | 'default', string> = {
    high: 'text-red-600 bg-red-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-green-600 bg-green-100',
    default: 'text-gray-600 bg-gray-100',
  };

  const getPriorityColor = (priority?: Priority): string => {
    return priorityColors[priority || 'default'];
  };

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysToDeadline = (deadline: string | Date): number => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getMonthsToGoal = (
    current: number,
    target: number,
    monthlyContribution: number
  ): number => {
    if (monthlyContribution <= 0) return Infinity;
    return Math.ceil((target - current) / monthlyContribution);
  };

  const filteredGoals = selectedCategory === 'all'
    ? Goals
    : Goals.filter(goal => goal.category === selectedCategory);

  // ----------------- Goal Card Component -----------------
  const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
    const progressPercentage = getProgressPercentage(goal.current, goal.target);
    const daysToDeadline = getDaysToDeadline(goal.deadline);
    const monthsToGoal = getMonthsToGoal(goal.current, goal.target, goal.monthlyContribution);
    const isOnTrack = monthsToGoal <= (daysToDeadline / 30);

    return (
      <div className="goal-card">
        <div className="goal-header">
          <div className="goal-icon-container">
            <div className={`goal-icon ${categoryColors[goal.category as keyof typeof categoryColors]}`}>
              {goalIcons[goal.icon as keyof typeof goalIcons]}
            </div>
          </div>
          <div className="goal-info">
            <div className="goal-title-row">
              <h3 className="goal-name">{goal.name}</h3>
              <span className={`priority-badge ${getPriorityColor(goal.priority as Priority)}`}>
                {goal.priority}
              </span>
            </div>
            <p className="goal-description">{goal.description}</p>
          </div>
          <div className="goal-actions">
            <button className="action-btn edit">
              <Edit3 className="small-icon" />
            </button>
            <button className="action-btn delete">
              <Trash2 className="small-icon" />
            </button>
          </div>
        </div>

        <div className="goal-progress-section">
          <div className="progress-info">
            <div className="amount-info">
              <span className="current-amount">${goal.current.toLocaleString()}</span>
              <span className="target-amount">of ${goal.target.toLocaleString()}</span>
            </div>
            <div className="percentage">
              {progressPercentage.toFixed(0)}%
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="goal-metrics">
            <div className="metric">
              <Calendar className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">{daysToDeadline}</span>
                <span className="metric-label">days left</span>
              </div>
            </div>

            <div className="metric">
              <DollarSign className="metric-icon" />
              <div className="metric-content">
                <span className="metric-value">${goal.monthlyContribution}</span>
                <span className="metric-label">per month</span>
              </div>
            </div>

            <div className="metric">
              {isOnTrack ? <CheckCircle className="metric-icon text-green-500" /> : <Clock className="metric-icon text-red-500" />}
              <div className="metric-content">
                <span className={`metric-value ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnTrack ? 'On Track' : 'Behind'}
                </span>
                <span className="metric-label">{monthsToGoal} months</span>
              </div>
            </div>
          </div>
        </div>

        <div className="goal-actions-row">
          <button className="contribute-btn">
            <Plus className="small-icon" />
            Add Money
          </button>
          <button className="auto-save-btn">
            <TrendingUp className="small-icon" />
            Auto-Save
          </button>
        </div>
      </div>
    );
  };

  // ----------------- Add Goal Modal -----------------
  const AddGoalModal: React.FC = () => {
    const [newGoal, setNewGoal] = useState({
      name: '',
      description: '',
      target: '',
      deadline: '',
      category: 'emergency',
      icon: 'shield',
      priority: 'medium',
      monthlyContribution: ''
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const goal: Goal = {
        ...newGoal,
        id: Goals.length + 1,
        current: 0,
        target: parseFloat(newGoal.target),
        monthlyContribution: parseFloat(newGoal.monthlyContribution),
        category: newGoal.category as Goal['category'],
        priority: newGoal.priority as Goal['priority'],
      };
      setGoals([...Goals, goal]);
      setShowAddModal(false);
      setNewGoal({
        name: '',
        description: '',
        target: '',
        deadline: '',
        category: 'emergency',
        icon: 'shield',
        priority: 'medium',
        monthlyContribution: ''
      });
    };

    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h3>Create New Goal</h3>
            <button onClick={() => setShowAddModal(false)} className="close-btn">×</button>
          </div>
          <form onSubmit={handleSubmit} className="modal-form">
            <input
              type="text"
              placeholder="Goal Name"
              value={newGoal.name}
              required
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newGoal.description}
              required
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Target Amount"
              value={newGoal.target}
              required
              onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
            />
            <input
              type="number"
              placeholder="Monthly Contribution"
              value={newGoal.monthlyContribution}
              required
              onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: e.target.value })}
            />
            <input
              type="date"
              placeholder="Deadline"
              value={newGoal.deadline}
              required
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
            />
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
            >
              <option value="emergency">Emergency</option>
              <option value="travel">Travel</option>
              <option value="transportation">Transportation</option>
              <option value="housing">Housing</option>
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="business">Business</option>
              <option value="tech">Tech</option>
            </select>
            <select
              value={newGoal.icon}
              onChange={(e) => setNewGoal({ ...newGoal, icon: e.target.value })}
            >
              <option value="shield">Shield</option>
              <option value="plane">Plane</option>
              <option value="car">Car</option>
              <option value="home">Home</option>
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="business">Business</option>
              <option value="tech">Tech</option>
            </select>
            <select
              value={newGoal.priority}
              onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button type="submit" className="submit-btn">Add Goal</button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="goals-management">
      {/* Header with Add Goal Button */}
      <div className="goals-header">
        <h2>Your Goals</h2>
        <button className="add-goal-btn" onClick={() => setShowAddModal(true)}>
          <Plus className="small-icon" /> Add New Goal
        </button>
      </div>

      {/* Filter tabs (if any) */}

      <div className="goals-grid">
        {filteredGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      {showAddModal && <AddGoalModal />}
    </div>
  );
};

export default GoalsManagement;
