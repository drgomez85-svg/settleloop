import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Color gradient animation
  const colors = [
    '#14B8A6', // Teal
    '#10B981', // Green
    '#F87171', // Coral
    '#60A5FA', // Blue
    '#A78BFA', // Purple
  ];

  const colorIndex = Math.floor((progress / 100) * colors.length);
  const currentColor = colors[colorIndex % colors.length];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: currentColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'background-color 0.3s ease',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-lg)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: `4px solid ${currentColor}`,
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
      <div
        style={{
          color: 'white',
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        Calculating settlements...
      </div>
      <div
        style={{
          width: '200px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: 'white',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
