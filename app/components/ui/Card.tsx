import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface NoteCardProps {
    title: string;
    excerpt: string;
    date: string;
    selected?: boolean;
    onClick?: () => void;
    onLongPress?: () => void;
    className?: string; // Allow extending styles
}

export function NoteCard({
    title,
    excerpt,
    date,
    selected,
    onClick,
    onLongPress,
    className,
}: NoteCardProps) {
    // Long press logic
    const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressing = React.useRef(false);

    const handleTouchStart = React.useCallback(() => {
        isLongPressing.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPressing.current = true;
            if (onLongPress) onLongPress();
        }, 500);
    }, [onLongPress]);

    const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (isLongPressing.current) {
            e.preventDefault();
        }
    }, []);

    const handleTouchMove = React.useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    return (
        <div
            className={cn(
                "group relative flex flex-col p-5 transition-all duration-300 rounded-3xl cursor-pointer overflow-hidden border border-transparent",
                selected
                    ? "bg-secondary-container text-on-secondary-container ring-2 ring-primary border-primary"
                    : "bg-surface-container-high hover:bg-surface-container hover:shadow-md text-on-surface border-none",
                className
            )}
            onClick={onClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
        >
            <div className="flex justify-between items-start mb-3">
                <h3 className={cn("font-bold text-lg leading-snug line-clamp-2 transition-colors", selected ? "text-on-secondary-container" : "text-on-surface")}>
                    {title}
                </h3>
                {selected && (
                    <div className="bg-primary text-on-primary rounded-full p-1 shrink-0 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            <p className={cn("text-sm line-clamp-4 flex-grow mb-4 font-normal", selected ? "text-on-secondary-container/80" : "text-on-surface-variant")}>
                {excerpt || "No content"}
            </p>

            <div className="mt-auto flex items-center justify-between">
                <span className={cn("text-xs font-medium px-2 py-1 rounded-lg", selected ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant/80")}>
                    {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
            </div>

            {/* State Layer (Overlay on hover) */}
            {!selected && <div className="absolute inset-0 bg-on-surface opacity-0 group-hover:opacity-[0.08] pointer-events-none transition-opacity duration-200" />}
        </div>
    );
}
