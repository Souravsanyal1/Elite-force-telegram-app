import React from 'react';
import { motion } from 'framer-motion';

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 16, className = "" }) => {
  const id = React.useId().replace(/:/g, '');

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.2, rotate: 5 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFB347"/>
          <stop offset="100%" stopColor="#FF8A00"/>
        </linearGradient>

        <linearGradient id={`shine-${id}`} x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
        </linearGradient>

        <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD700"/>
          <stop offset="50%" stopColor="#FF8A00" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#FFD700"/>
        </linearGradient>

        <filter id={`glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer pulsing glow aura */}
      <motion.circle
        cx="64" cy="64" r="58"
        fill="url(#bg-${id})"
        filter={`url(#glow-${id})`}
        animate={{ opacity: [0.15, 0.40, 0.15], scale: [0.94, 1.06, 0.94] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rotating dashed orbit ring */}
      <motion.circle
        cx="64" cy="64" r="52"
        stroke={`url(#ring-${id})`}
        strokeWidth="2"
        strokeDasharray="8 6"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '64px 64px' }}
      />

      {/* Main badge circle */}
      <circle
        cx="64" cy="64" r="46"
        fill={`url(#bg-${id})`}
        stroke="#FFD18C"
        strokeWidth="3"
      />

      {/* Shine sweep overlay */}
      <motion.ellipse
        cx="45" cy="40" rx="26" ry="16"
        fill={`url(#shine-${id})`}
        animate={{ opacity: [0.3, 0.7, 0.3], x: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Animated checkmark draw */}
      <motion.path
        d="M40 66 L56 82 L88 47"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
      />

      {/* Sparkle — top right */}
      <motion.circle
        cx="96" cy="30" r="3"
        fill="#FFD700"
        animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
      />

      {/* Sparkle — bottom left */}
      <motion.circle
        cx="28" cy="98" r="2.5"
        fill="#FF8A00"
        animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.9, ease: "easeInOut" }}
      />

      {/* Sparkle — top left */}
      <motion.circle
        cx="26" cy="34" r="2"
        fill="#FFD700"
        animate={{ scale: [0, 1.3, 0], opacity: [0, 0.9, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 1.4, ease: "easeInOut" }}
      />
    </motion.svg>
  );
};
