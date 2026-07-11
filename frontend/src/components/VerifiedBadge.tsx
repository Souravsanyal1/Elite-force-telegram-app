import React from 'react';
import { motion } from 'framer-motion';

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 16, className = "" }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.15 }}
      transition={{ type: "spring", stiffness: 350, damping: 15 }}
    >
      <defs>
        <linearGradient id="efBadgeBg" x1="0" y1="0" x2="128" y2="128">
          <stop offset="0%" stop-color="#FFB347"/>
          <stop offset="100%" stop-color="#FF8A00"/>
        </linearGradient>

        <linearGradient id="efBadgeShine" x1="0" y1="0" x2="128" y2="128">
          <stop offset="0%" stop-color="#FFF8E6" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
        </linearGradient>

        <filter id="efBadgeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer Glow Pulse */}
      <motion.circle
        cx="64"
        cy="64"
        r="54"
        fill="url(#efBadgeBg)"
        filter="url(#efBadgeGlow)"
        animate={{
          opacity: [0.2, 0.45, 0.2],
          scale: [0.96, 1.04, 0.96],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main Badge base circle */}
      <circle
        cx="64"
        cy="64"
        r="48"
        fill="url(#efBadgeBg)"
        stroke="#FFD18C"
        strokeWidth="3.5"
      />

      {/* Shine Reflection */}
      <ellipse
        cx="48"
        cy="42"
        rx="28"
        ry="18"
        fill="url(#efBadgeShine)"
        opacity=".55"
      />

      {/* Drawing animated checkmark */}
      <motion.path
        d="M42 66 L57 81 L87 49"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      />
    </motion.svg>
  );
};
