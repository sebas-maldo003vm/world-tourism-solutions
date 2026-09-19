import { useState } from 'react';
import { User } from 'lucide-react';
import { API_ORIGIN } from '@/core/api/client';
import { cn } from '@/shared/components/ui/utils';

export type UserAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: UserAvatarSize;
  className?: string;
}

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
};

const iconClasses: Record<UserAvatarSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

function resolveAvatarSrc(src?: string | null) {
  if (!src?.trim()) {
    return null;
  }

  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('blob:') ||
    src.startsWith('data:')
  ) {
    return src;
  }

  return `${API_ORIGIN}${src.startsWith('/') ? src : `/${src}`}`;
}

function getInitial(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.charAt(0).toUpperCase();
}

export function UserAvatar({
  src,
  name,
  size = 'md',
  className,
}: UserAvatarProps) {
  const resolvedSrc = resolveAvatarSrc(src);
  const initial = getInitial(name);
  const [imageError, setImageError] = useState(false);
  const [trackedSrc, setTrackedSrc] = useState(resolvedSrc);

  if (trackedSrc !== resolvedSrc) {
    setTrackedSrc(resolvedSrc);
    setImageError(false);
  }

  const showImage = Boolean(resolvedSrc) && !imageError;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-700 font-semibold text-white',
        sizeClasses[size],
        className,
      )}
      aria-hidden={showImage ? undefined : true}
    >
      {showImage ? (
        <img
          src={resolvedSrc ?? undefined}
          alt={name?.trim() || 'Foto de perfil'}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : initial ? (
        initial
      ) : (
        <User className={iconClasses[size]} />
      )}
    </span>
  );
}
