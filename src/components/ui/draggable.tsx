import * as React from 'react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@/hooks/use-draggable';

interface Position {
  x: number;
  y: number;
}

interface DraggableProps extends Omit<React.ComponentProps<'div'>, 'onClick'> {
  /** Default position. If not set, defaults to 16px from top-right of parent. */
  defaultPosition?: Position;
  /** Z-index for the draggable wrapper */
  zIndex?: number;
  /** Minimum distance (px) pointer must move to count as a drag (default: 5) */
  dragThreshold?: number;
  /** Whether dragging is disabled */
  disabled?: boolean;
  /** Called on click (only fires if pointer didn't drag beyond threshold) */
  onClick?: () => void;
  /** Called when drag starts */
  onDragStart?: (position: Position) => void;
  /** Called during drag */
  onDragMove?: (position: Position) => void;
  /** Called when drag ends */
  onDragEnd?: (position: Position) => void;
}

function Draggable({
  className,
  children,
  defaultPosition,
  zIndex = 40,
  dragThreshold = 5,
  disabled = false,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  style: styleProp,
  ...props
}: DraggableProps) {
  const { ref, style, isDragging, hasDragged } = useDraggable({
    defaultPosition,
    dragThreshold,
    disabled,
    onDragStart,
    onDragMove,
    onDragEnd,
  });

  const handlePointerUp = React.useCallback(() => {
    if (!hasDragged && onClick) {
      onClick();
    }
  }, [hasDragged, onClick]);

  return (
    <div
      ref={ref}
      data-slot="draggable"
      data-dragging={isDragging || undefined}
      className={cn(
        'absolute top-0 left-0 touch-none select-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        isDragging
          ? '[&>*]:shadow-[0_12px_32px_rgba(0,0,0,0.7)]'
          : '[&:hover>*]:shadow-[0_8px_24px_rgba(0,0,0,0.6)]',
        className
      )}
      style={{ ...style, zIndex, ...styleProp }}
      onMouseUp={handlePointerUp}
      onTouchEnd={handlePointerUp}
      {...props}
    >
      {children}
    </div>
  );
}

export { Draggable };
export type { DraggableProps, Position as DraggablePosition };
