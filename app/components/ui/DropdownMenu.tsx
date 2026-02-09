import React, { useState, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DropdownMenuProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: "left" | "right";
    className?: string;
}

export function DropdownMenu({ trigger, children, align = "right", className }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 mt-2 min-w-50 origin-top-right rounded-2xl bg-surface-container border border-outline-variant/30 shadow-2 py-2 focus:outline-none animate-in fade-in zoom-in-95 duration-100",
                        align === "right" ? "right-0" : "left-0",
                        className
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

export function DropdownItem({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
    return (
        <button
            onClick={onClick}
            className={cn("flex w-full items-center px-4 py-3 text-sm text-on-surface hover:bg-on-surface/5 transition-colors text-left", className)}
        >
            {children}
        </button>
    );
}
