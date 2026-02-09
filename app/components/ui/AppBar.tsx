import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AppBarProps {
    title: string | React.ReactNode;
    startAction?: React.ReactNode; // e.g., Back button or Menu button
    endAction?: React.ReactNode; // e.g., Edit, Search buttons
    className?: string; // For scroll behavior or colors
}

export function AppBar({ title, startAction, endAction, className }: AppBarProps) {
    return (
        <header className={cn(
            "sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-md transition-shadow duration-200 border-b border-transparent scroll-scrolled:border-outline-variant/20 scroll-scrolled:shadow-sm",
            className
        )}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {startAction && (
                    <div className="text-on-surface-variant">
                        {startAction}
                    </div>
                )}
                <div className="text-xl font-normal text-on-surface truncate">
                    {title}
                </div>
            </div>

            {endAction && (
                <div className="flex items-center gap-1 text-on-surface-variant">
                    {endAction}
                </div>
            )}
        </header>
    );
}
