'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Target, Plus, Calendar, DollarSign, TrendingUp,
  Edit3, Trash2, CheckCircle, Clock,
  Car, Home, Plane, GraduationCap, Heart,
  Building, Smartphone, Shield, RefreshCw,
} from 'lucide-react';
import AddMoney from '../components/AddMoney';
import './Goals.css';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Constants (module-level, never re-created)
// ─────────────────────────────────────────────
const GOAL_ICONS: Record<string, React.ReactNode> = {
  shield:    <Shield     className="icon" />,
  plane:     <Plane      className="icon" />,
  car:       <Car        className="icon" />,
  home:      <Home       className="icon" />,
  education: <GraduationCap className="icon" />,
  health:    <Heart      className="icon" />,
  business:  <Building   className="icon" />,
  tech:      <Smartphone className="icon" />,
  target:    <Target     className="icon" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  emergency:      'bg-red-500',
  travel:         'bg-blue-500',
  transportation: 'bg-green-500',
  housing:        'bg-purple-500',
  education:      'bg-yellow-500',
  health:         'bg-pink-500',
  business:       'bg-indigo-500',
  tech:           'bg-cyan-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   'text-red-600 bg-red-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low:    'text-green-600 bg-green-100',
};

const VALID_PRIORITIES = ['high', 'medium', 'low'] as const;

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const DEFAULT_FORM: NewGoalForm = {
  name: '', description: '',
  target: '', deadline: '',
  category: 'emergency', icon: 'shield',
  priority: 'medium', monthlyContribution: '',
};

// ─────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────
function getProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
}

function getDaysLeft(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function getMonthsNeeded(current: number, target: number, monthly: number): number {
  if (monthly <= 0 || target <= current) return 0;
  return Math.ceil((target - current) / monthly);
}

function normalizeGoal(g: any): Goal {
  return {
    _id:                g._id        || '',
    name:               g.name       || 'Untitled Goal',
    description:        g.description || '',
    current:            Number(g.current)             || 0,
    target:             Number(g.target)              || 0,
    deadline:           g.deadline   || new Date().toISOString(),
    category:           CATEGORY_COLORS[g.category]  ? g.category  : 'emergency',
    icon:               GOAL_ICONS[g.icon]            ? g.icon      : 'shield',
    priority:           VALID_PRIORITIES.includes(g.priority) ? g.priority : 'medium',
    monthlyContribution:Number(g.monthlyContribution) || 0,
  };
}

// ─────────────────────────────────────────────
// GoalCard sub-component
// ─────────────────────────────────────────────
interface GoalCardProps {
  goal: Goal;
  isAddMoneyOpen: boolean;
  onDelete: (id: string) => void;
  onEdit:   (goal: Goal) => void;
  onOpenAddMoney:  (id: string) => void;
  onCloseAddMoney: () => void;
  onContribute: (goalId: string, amount: number) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal, isAddMoneyOpen, onDelete, onEdit,
  onOpenAddMoney, onCloseAddMoney, onContribute,
}) => {
  const progress   = getProgress(goal.current, goal.target);
  const daysLeft   = getDaysLeft(goal.deadline);
  const months     = getMonthsNeeded(goal.current, goal.target, goal.monthlyContribution);
  const isOnTrack  = months <= daysLeft / 30 || goal.current >= goal.target;

  return (
    <article
      className="goal-card"
      data-category={goal.category}
      aria-label={`Goal: ${goal.name}`}
    >
      {/* Header row */}
      <div className="goal-header">
        <div className="goal-icon-container">
          <div className={`goal-icon ${CATEGORY_COLORS[goal.category] || 'bg-gray-500'}`}>
            {GOAL_ICONS[goal.icon] || GOAL_ICONS.shield}
          </div>
        </div>

        <div className="goal-info">
          <div className="goal-title-row">
            <h3 className="goal-name" title={goal.name}>{goal.name}</h3>
            <span
              className={`priority-badge ${PRIORITY_COLORS[goal.priority] || PRIORITY_COLORS.medium}`}
              aria-label={`Priority: ${goal.priority}`}
            >
              {goal.priority}
            </span>
          </div>
          {goal.description && (
            <p className="goal-description">{goal.description}</p>
          )}
        </div>

        <div className="goal-actions">
          <button
            className="action-btn edit"
            onClick={() => onEdit(goal)}
            aria-label={`Edit ${goal.name}`}
          >
            <Edit3 className="small-icon" />
          </button>
          <button
            className="action-btn delete"
            onClick={() => onDelete(goal._id)}
            aria-label={`Delete ${goal.name}`}
          >
            <Trash2 className="small-icon" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="goal-progress-section">
        <div className="progress-info">
          <div className="amount-info">
            <span className="current-amount">${goal.current.toLocaleString()}</span>
            <span className="target-amount">of ${goal.target.toLocaleString()}</span>
          </div>
          <div className="percentage">{progress.toFixed(0)}%</div>
        </div>

        <div className="progress-bar" role="progressbar"
          aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Metrics */}
        <div className="goal-metrics">
          <div className="metric">
            <Calendar className="metric-icon" />
            <div className="metric-content">
              <span className="metric-value">{daysLeft}</span>
              <span className="metric-label">days left</span>
            </div>
          </div>

          <div className="metric">
            <DollarSign className="metric-icon" />
            <div className="metric-content">
              <span className="metric-value">${goal.monthlyContribution.toLocaleString()}</span>
              <span className="metric-label">per month</span>
            </div>
          </div>

          <div className="metric">
            {isOnTrack
              ? <CheckCircle className="metric-icon text-green-500" />
              : <Clock       className="metric-icon text-red-500"   />
            }
            <div className="metric-content">
              <span className={`metric-value ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                {isOnTrack ? 'On Track' : 'Behind'}
              </span>
              <span className="metric-label">{months} months</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="goal-actions-row">
        <button
          className="contribute-btn"
          onClick={() => onOpenAddMoney(goal._id)}
          aria-label={`Add money to ${goal.name}`}
        >
          <Plus className="small-icon" /> Add Money
        </button>
      </div>

      {/* Inline AddMoney panel */}
      {isAddMoneyOpen && (
        <AddMoney
          goalId={goal._id}
          onClose={onCloseAddMoney}
          onContribute={onContribute}
        />
      )}
    </article>
  );
};

// ─────────────────────────────────────────────
// AddGoalModal sub-component
// ─────────────────────────────────────────────
interface AddGoalModalProps {
  onClose:    () => void;
  onCreated:  (goal: Goal) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState<NewGoalForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const patch = (field: keyof NewGoalForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim())          { setError('Please enter a goal name.');         return; }
    if (Number(form.target) <= 0)   { setError('Target amount must be greater than 0.'); return; }
    if (!form.deadline)             { setError('Please pick a deadline.');            return; }

    const payload = {
      name:                form.name.trim(),
      description:         form.description.trim(),
      target:              Number(form.target),
      monthlyContribution: Number(form.monthlyContribution) || 0,
      deadline:            form.deadline,
      category:            form.category,
      icon:                form.icon,
      priority:            form.priority,
      current:             0,
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.details || err.error || 'Failed to create goal.');
        return;
      }

      const saved = await res.json();
      onCreated(saved);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick} role="dialog"
      aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        <div className="modal-header">
          <h3 id="modal-title">Create New Goal</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {/* Error banner */}
          {error && (
            <div style={{
              padding: '0.625rem 0.875rem',
              background: 'var(--negative-bg)',
              border: '1px solid var(--negative-border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--negative)',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="goal-name">Goal Name *</label>
            <input id="goal-name" type="text" placeholder="e.g., Emergency Fund"
              value={form.name} required
              onChange={(e) => patch('name', e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="goal-desc">Description</label>
            <textarea id="goal-desc" placeholder="Describe your goal…"
              value={form.description} rows={3}
              onChange={(e) => patch('description', e.target.value)} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="goal-target">Target Amount *</label>
              <input id="goal-target" type="number" placeholder="10000"
                value={form.target} required min="1" step="0.01"
                onChange={(e) => patch('target', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="goal-monthly">Monthly Contribution</label>
              <input id="goal-monthly" type="number" placeholder="500"
                value={form.monthlyContribution} min="0" step="0.01"
                onChange={(e) => patch('monthlyContribution', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="goal-deadline">Deadline *</label>
            <input id="goal-deadline" type="date"
              value={form.deadline} required min={todayStr}
              onChange={(e) => patch('deadline', e.target.value)} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="goal-category">Category</label>
              <select id="goal-category" value={form.category}
                onChange={(e) => patch('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="goal-icon">Icon</label>
              <select id="goal-icon" value={form.icon}
                onChange={(e) => patch('icon', e.target.value)}>
                {Object.keys(GOAL_ICONS).filter((k) => k !== 'target').map((k) => (
                  <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="goal-priority">Priority</label>
            <select id="goal-priority" value={form.priority}
              onChange={(e) => patch('priority', e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Goal'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const GoalsManagement: React.FC = () => {
  const [goals, setGoals]             = useState<Goal[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

  // ── Fetch ──
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/goals');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || 'Failed to load goals');
      }
      const data = await res.json();
      setGoals(data.map(normalizeGoal));
    } catch (e: any) {
      setError(e.message || 'Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  // ── Delete ──
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this goal? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setGoals((prev) => prev.filter((g) => g._id !== id));
      if (activeGoalId === id) setActiveGoalId(null);
    } catch {
      alert('Failed to delete goal. Please try again.');
    }
  }, [activeGoalId]);

  // ── Edit (placeholder — wire up your own edit modal here) ──
  const handleEdit = useCallback((goal: Goal) => {
    console.log('Edit goal:', goal);
  }, []);

  // ── Contribute ──
  const handleContribute = useCallback((goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => g._id === goalId ? { ...g, current: g.current + amount } : g)
    );
  }, []);

  // ── Derived ──
  const filteredGoals = selectedCategory === 'all'
    ? goals
    : goals.filter((g) => g.category === selectedCategory);

  const goalWord = goals.length === 1 ? 'goal' : 'goals';

  // ── Loading ──
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading goals…</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchGoals}>
          <RefreshCw style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />
          Retry
        </button>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="goals-management">

      {/* Header */}
      <header className="goals-header">
        <div className="header-content">
          <h2>Your Financial Goals</h2>
          <p className="subtitle">{goals.length} {goalWord} in progress</p>
        </div>
        <button className="add-goal-btn" onClick={() => setShowAddModal(true)}
          aria-label="Add new goal">
          <Plus className="small-icon" /> Add New Goal
        </button>
      </header>

      {/* Category filter */}
      <nav className="filter-section" role="group" aria-label="Filter by category">
        <button
          className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
          aria-pressed={selectedCategory === 'all'}
        >
          All Goals
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
            aria-pressed={selectedCategory === cat}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </nav>

      {/* Goals grid */}
      <main className="goals-grid">
        {filteredGoals.length === 0 ? (
          <div className="no-goals">
            <Target size={48} className="no-goals-icon" aria-hidden />
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
              isAddMoneyOpen={activeGoalId === goal._id}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onOpenAddMoney={setActiveGoalId}
              onCloseAddMoney={() => setActiveGoalId(null)}
              onContribute={handleContribute}
            />
          ))
        )}
      </main>

      {/* Add Goal Modal */}
      {showAddModal && (
        <AddGoalModal
          onClose={() => setShowAddModal(false)}
          onCreated={(saved) => {
            setGoals((prev) => [normalizeGoal(saved), ...prev]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default GoalsManagement;
