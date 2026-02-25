import React from 'react';
import { Home, Send, BarChart, Target, Settings } from 'lucide-react';
import TabButton from './TabButton'; // adjust path if needed
import './BottomNavigation.css';

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bottom-navigation">
      <div className="nav-wrapper">
        <TabButton 
          id="home" 
          icon={<Home size={22} />} 
          label="Home"
          isActive={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
        />
        <TabButton 
          id="send" 
          icon={<Send size={22} />} 
          label="Send"
          isActive={activeTab === 'send'} 
          onClick={() => setActiveTab('send')} 
        />
        <TabButton 
          id="analytics" 
          icon={<BarChart size={22} />} 
          label="Analytics"
          isActive={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')} 
        />
        <TabButton 
          id="goals" 
          icon={<Target size={22} />} 
          label="Goals"
          isActive={activeTab === 'goals'} 
          onClick={() => setActiveTab('goals')} 
          badge="3" 
        />
        <TabButton 
          id="settings" 
          icon={<Settings size={22} />} 
          label="Settings"
          isActive={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
        />
      </div>
    </nav>
  );
};

export default BottomNavigation;
