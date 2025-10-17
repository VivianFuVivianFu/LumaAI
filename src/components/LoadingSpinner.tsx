import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

/**
 * LoadingSpinner Component
 *
 * Displays an animated loading spinner with optional text.
 * Can be used inline or as a full-screen overlay.
 *
 * @example
 * <LoadingSpinner size="md" text="Loading..." />
 * <LoadingSpinner fullScreen text="Please wait..." />
 */
export function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600`} />
      {text && (
        <p className="text-gray-600 font-medium text-sm animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

/**
 * Card skeleton for list items
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonLoader className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonLoader className="h-20 w-full" />
      <div className="flex gap-2">
        <SkeletonLoader className="h-8 w-20" />
        <SkeletonLoader className="h-8 w-20" />
      </div>
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <span className="flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      {text}
    </span>
  );
}
