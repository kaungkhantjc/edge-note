import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface SegmentedButtonOption {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

interface SegmentedButtonProps {
    options: SegmentedButtonOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function SegmentedButton({
    options,
    value,
    onChange,
    className,
}: SegmentedButtonProps) {
    return (
        <div className={cn(
            "inline-flex p-1.5 bg-surface-container rounded-3xl border border-outline-variant/20 shadow-sm",
            className
        )}>
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all duration-300 relative rounded-[20px] flex-1 md:flex-initial",
                            isSelected
                                ? "bg-primary text-on-primary scale-[1.02] z-10"
                                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:scale-95"
                        )}
                    >
                        {option.icon && (
                            <span className={cn(
                                "transition-transform duration-300",
                                isSelected ? "scale-110" : "scale-100"
                            )}>
                                {option.icon}
                            </span>
                        )}
                        <span>{option.label}</span>

                        {/* Subtle indicator for selected state if needed, but bg color is enough for Expressive */}
                    </button>
                );
            })}
        </div>
    );
}
