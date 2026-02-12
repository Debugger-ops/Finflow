'use client';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
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
  Smartphone,
  Shield
} from 'lucide-react';
import AddMoney from '../components/AddMoney';

import './Goals.css';

// Types
interface Goal {
  _id: string;
  name: string;
  description: string;
  current: number;
  target: number;
  deadline: string;
  category: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  monthlyContribution: number;
}

interface GoalCardProps {
  goal: Goal;
  onDelete: (id: string) => void;
  onEdit: (goal: Goal) => void;
  onContribute: () => void;
}

interface NewGoalForm {
  name: string;
  description: string;
  target: string;
  deadline: string;
  category: string;
  icon: string;
  priority: string;
  monthlyContribution: string;
}

const GoalsManagement: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);
const [activeGoalId, setActiveGoalId] = useState<string | null>(null);


  // Icon mapping
  const goalIcons: Record<string, React.ReactNode> = {
    shield: <Shield className="icon" />,
    plane: <Plane className="icon" />,
    car: <Car className="icon" />,
    home: <Home className="icon" />,
    education: <GraduationCap className="icon" />,
    health: <Heart className="icon" />,
    business: <Building className="icon" />,
    tech: <Smartphone className="icon" />,
    target: <Target className="icon" />
  };

  // Category colors
  const categoryColors: Record<string, string> = {
    emergency: 'bg-red-500',
    travel: 'bg-blue-500',
    transportation: 'bg-green-500',
    housing: 'bg-purple-500',
    education: 'bg-yellow-500',
    health: 'bg-pink-500',
    business: 'bg-indigo-500',
    tech: 'bg-cyan-500'
  };

  // Priority colors
  const priorityColors: Record<string, string> = {
    high: 'text-red-600 bg-red-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-green-600 bg-green-100'
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/goals");
      
      if (!res.ok) {
  const err = await res.json();
  alert(`Failed to create goal: ${err.details || err.error}`);
  return;
}

      
      const data = await res.json();

      // Normalize data with safe defaults
      const normalized: Goal[] = data.map((g: any) => ({
        _id: g._id || '',
        name: g.name || 'Untitled Goal',
        description: g.description || '',
        current: Number(g.current) || 0,
        target: Number(g.target) || 0,
        deadline: g.deadline || new Date().toISOString(),
        category: categoryColors[g.category] ? g.category : 'emergency',
        icon: goalIcons[g.icon] ? g.icon : 'shield',
        priority: ['high', 'medium', 'low'].includes(g.priority) ? g.priority : 'medium',
        monthlyContribution: Number(g.monthlyContribution) || 0,
      }));

      setGoals(normalized);
    } catch (error) {
      console.error("Error fetching goals:", error);
      setError("Failed to load goals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      
      if (!res.ok) {
        throw new Error('Failed to delete goal');
      }
      
      setGoals((prev) => prev.filter((g) => g._id !== id));
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("Failed to delete goal. Please try again.");
    }
  };

  const handleEdit = (goal: Goal) => {
    // Implement edit functionality
    console.log('Edit goal:', goal);
    // You can set up an edit modal similar to add modal
  };

  const getProgressPercentage = (current: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getDaysToDeadline = (deadline: string): number => {
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
    if (monthlyContribution <= 0 || target <= current) return 0;
    return Math.ceil((target - current) / monthlyContribution);
  };

  const filteredGoals = selectedCategory === 'all'
    ? goals
    : goals.filter(goal => goal.category === selectedCategory);

  // Goal Card Component
  const GoalCard: React.FC<GoalCardProps> = ({ goal, onDelete, onEdit }) => {
    const progressPercentage = getProgressPercentage(goal.current, goal.target);
    const daysToDeadline = getDaysToDeadline(goal.deadline);
    const monthsToGoal = getMonthsToGoal(goal.current, goal.target, goal.monthlyContribution);
    const isOnTrack = monthsToGoal <= (daysToDeadline / 30) || goal.current >= goal.target;

    return (
      <div className="goal-card">
        <div className="goal-header">
          <div className="goal-icon-container">
            <div className={`goal-icon ${categoryColors[goal.category] || 'bg-gray-500'}`}>
              {goalIcons[goal.icon] || goalIcons.shield}
            </div>
          </div>
          <div className="goal-info">
            <div className="goal-title-row">
              <h3 className="goal-name">{goal.name}</h3>
              <span className={`priority-badge ${priorityColors[goal.priority] || priorityColors.medium}`}>
                {goal.priority}
              </span>
            </div>
            <p className="goal-description">{goal.description}</p>
          </div>
          <div className="goal-actions">
            <button 
              className="action-btn edit" 
              onClick={() => onEdit(goal)}
              aria-label="Edit goal"
            >
              <Edit3 className="small-icon" />
            </button>
            <button 
              className="action-btn delete" 
              onClick={() => onDelete(goal._id)}
              aria-label="Delete goal"
            >
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
              {isOnTrack ? (
                <CheckCircle className="metric-icon text-green-500" />
              ) : (
                <Clock className="metric-icon text-red-500" />
              )}
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
  <button
  className="contribute-btn"
  onClick={() => setActiveGoalId(goal._id)}
>
  <Plus className="small-icon" /> Add Money
</button>

</div>
        {activeGoalId === goal._id && (
          <AddMoney 
            goalId={goal._id}
            onClose={() => setActiveGoalId(null)}
            onContribute={(goalId, amount) => {
      setGoals(prevGoals =>
        prevGoals.map(g =>
          g._id === goalId ? { ...g, current: g.current + amount } : g
        )
      );
    }}
          />
        )}

      </div>
    );
  };

  // Add Goal Modal Component
  const AddGoalModal: React.FC = () => {
    const [newGoal, setNewGoal] = useState<NewGoalForm>({
      name: '',
      description: '',
      target: '',
      deadline: '',
      category: 'emergency',
      icon: 'shield',
      priority: 'medium',
      monthlyContribution: ''
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validation
      if (!newGoal.name.trim()) {
        alert('Please enter a goal name');
        return;
      }

      if (Number(newGoal.target) <= 0) {
        alert('Target amount must be greater than 0');
        return;
      }

      const payload = {
        name: newGoal.name.trim(),
        description: newGoal.description.trim(),
        target: Number(newGoal.target),
        monthlyContribution: Number(newGoal.monthlyContribution) || 0,
        deadline: newGoal.deadline,
        category: newGoal.category,
        icon: newGoal.icon,
        priority: newGoal.priority,
        current: 0,
      };

      try {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
  const err = await res.json();
  alert(`Failed to create goal: ${err.details || err.error}`);
  return;
}


        const savedGoal = await res.json();
        setGoals((prev) => [savedGoal, ...prev]);
        setShowAddModal(false);

        // Reset form
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
      } catch (error) {
        console.error("Error creating goal:", error);
        alert("Failed to create goal. Please try again.");
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Create New Goal</h3>
            <button onClick={() => setShowAddModal(false)} className="close-btn">×</button>
          </div>
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Goal Name *</label>
              <input
                type="text"
                placeholder="e.g., Emergency Fund"
                value={newGoal.name}
                required
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Describe your goal..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Target Amount *</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={newGoal.target}
                  required
                  min="1"
                  step="0.01"
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Monthly Contribution</label>
                <input
                  type="number"
                  placeholder="500"
                  value={newGoal.monthlyContribution}
                  min="0"
                  step="0.01"
                  onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Deadline *</label>
              <input
                type="date"
                value={newGoal.deadline}
                required
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
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
              </div>

              <div className="form-group">
                <label>Icon</label>
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
              </div>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                value={newGoal.priority}
                onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <button type="submit" className="submit-btn">Create Goal</button>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading goals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchGoals}>Retry</button>
      </div>
    );
  }

  return (
    <div className="goals-management">
      <div className="goals-header">
        <div className="header-content">
          <h2>Your Financial Goals</h2>
          <p className="subtitle">{goals.length} {goals.length === 1 ? 'goal' : 'goals'} in progress</p>
        </div>
        <button className="add-goal-btn" onClick={() => setShowAddModal(true)}>
          <Plus className="small-icon" /> Add New Goal
        </button>
      </div>

      <div className="filter-section">
        <button 
          className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Goals
        </button>
        {Object.keys(categoryColors).map(category => (
          <button
            key={category}
            className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      <div className="goals-grid">
  {filteredGoals.length === 0 ? (
    <div className="no-goals">
      <Target size={48} className="no-goals-icon" />
      <h3>No goals yet</h3>
      <p>Create your first financial goal to get started!</p>
      <button className="add-goal-btn" onClick={() => setShowAddModal(true)}>
        <Plus className="small-icon" /> Create Your First Goal
      </button>
    </div>
  ) : (
    filteredGoals.map((goal) => (
      <GoalCard 
        key={goal._id} 
        goal={goal} 
        onDelete={handleDelete}
        onEdit={handleEdit}
        onContribute={() => setActiveGoalId(goal._id)} // pass handler
      />
    ))
  )}
</div>

{/* AddMoney modal rendered once at parent */}
{activeGoalId && (
  <AddMoney 
    goalId={activeGoalId}
    onClose={() => setActiveGoalId(null)}
    onContribute={(goalId: string, amount: number) => {
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal._id === goalId
            ? { ...goal, current: goal.current + amount } 
            : goal
        )
      );
    }}
  />
)}


      {showAddModal && <AddGoalModal />}
    </div>
  );
};

export default GoalsManagement;