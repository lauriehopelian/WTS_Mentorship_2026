import React from 'react';

interface AvatarProps {
  initials?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
}

const sizes = {
  sm: { dim: 32, font: 11 },
  md: { dim: 40, font: 14 },
  lg: { dim: 52, font: 18 },
  xl: { dim: 72, font: 26 },
};

export default function Avatar({ initials, color = '#1a6b6e', size = 'md', name }: AvatarProps) {
  const { dim, font } = sizes[size];
  const display = initials || (name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??');

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold uppercase select-none shrink-0"
      style={{
        width: dim,
        height: dim,
        background: color,
        color: '#fff',
        fontSize: font,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: '0.02em',
      }}
    >
      {display}
    </div>
  );
}
