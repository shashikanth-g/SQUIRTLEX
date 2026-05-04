// NeuralBackground.jsx — Subtle animated background for the AI Engine
import React from 'react';

export default function NeuralBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
      <svg className="w-full h-full" viewBox="0 0 1000 1000">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Animated tentacles/nodes */}
        {[...Array(6)].map((_, i) => (
          <path
            key={i}
            d={`M${500 + Math.sin(i) * 100},500 Q${500 + Math.cos(i) * 300},${300 + i * 50} ${200 + i * 150},${100 + i * 100}`}
            fill="none"
            stroke="#00D4FF"
            strokeWidth="2"
            strokeDasharray="10 20"
            filter="url(#glow)"
          >
            <animate
              attributeName="d"
              values={`M${500},500 Q${500 + Math.cos(i) * 300},${300 + i * 50} ${200 + i * 150},${100 + i * 100};
                       M${500},500 Q${500 + Math.sin(i) * 400},${400 + i * 60} ${300 + i * 100},${200 + i * 120};
                       M${500},500 Q${500 + Math.cos(i) * 300},${300 + i * 50} ${200 + i * 150},${100 + i * 100}`}
              dur={`${8 + i * 2}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}
        
        {/* Pulsing core */}
        <circle cx="500" cy="500" r="150" fill="url(#grad)" opacity="0.5">
          <animate attributeName="r" values="140;160;140" dur="4s" repeatCount="indefinite" />
        </circle>
        
        <radialGradient id="grad">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </svg>
    </div>
  );
}
