'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ src, alt = '', name = '', size = 'md', online, className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const px = sizeMap[size];
  const showFallback = !src || imgError;

  return (
    <div className={cn('relative inline-flex shrink-0', className)} style={{ width: px, height: px }}>
      {showFallback ? (
        <div
          className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-semibold"
          style={{ fontSize: px * 0.35 }}
        >
          {getInitials(name)}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={px}
          height={px}
          className="w-full h-full rounded-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#070B14]'
          )}
        />
      )}
    </div>
  );
}

export { Avatar };
