import React from "react";
import styles from "./Logo.module.css";

const Logo = ({ size = "medium", showText = true, className = "" }) => {
  const logoSizes = {
    small: "24px",
    medium: "32px",
    large: "48px",
    xlarge: "64px",
  };

  return (
    <div className={`${styles.logo} ${className}`}>
      <svg
        width={logoSizes[size]}
        height={logoSizes[size]}
        viewBox="0 0 100 100"
        className={styles.logoIcon}
      >
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: "#4CAF50", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#2E7D32", stopOpacity: 1 }}
            />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#grad)"
          stroke="#1B5E20"
          strokeWidth="2"
        />
        <text
          x="50"
          y="60"
          fontSize="45"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          N
        </text>
      </svg>
      {showText && <span className={styles.logoText}>NoteSourcing</span>}
    </div>
  );
};

export default Logo;
