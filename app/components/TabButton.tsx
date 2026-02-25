import React, { ReactNode, MouseEventHandler } from "react";
import "./tabbutton.css";

type TabButtonProps = {
  id?: string;
  label: string;   
  isActive?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  icon?: ReactNode;
  badge?: ReactNode | string | number;
  variant?: "default" | "primary" | "secondary";
};

const TabButton: React.FC<TabButtonProps> = ({
  label,
  isActive = false,
  onClick,
  disabled = false,
  icon,
  badge,
  variant = "default",
}) => {
  return (
    <button
      className={`tab-button ${isActive ? "tab-button--active" : ""} ${
        disabled ? "tab-button--disabled" : ""
      } tab-button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {icon && <span className="tab-button__icon">{icon}</span>}
      <span className="tab-button__text">{label}</span>
      {badge && <span className="tab-button__badge">{badge}</span>}
    </button>
  );
};

export default TabButton;
