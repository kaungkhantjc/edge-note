import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", label, error, icon, ...props }, ref) => {
        return (
            <div className="relative group w-full">
                <div className="relative flex items-center">
                    {icon && (
                        <div className="absolute left-4 text-on-surface-variant pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "peer w-full h-14 rounded-xl border-none outline-none ring-1 ring-outline text-on-surface bg-transparent px-4 py-2.5 transition-all focus:ring-2 focus:ring-primary focus:bg-surface-container placeholder:text-transparent",
                            icon ? "pl-11" : "",
                            error ? "ring-error focus:ring-error" : "",
                            className
                        )}
                        placeholder={label || "Input"}
                        ref={ref}
                        {...props}
                    />
                    {/* Label floating effect */}
                    {label && (
                        <label
                            className={cn(
                                "absolute left-4 -top-2.5 bg-background px-1 text-xs font-medium text-on-surface-variant transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-on-surface-variant/70 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary pointer-events-none",
                                icon ? "peer-placeholder-shown:left-11 peer-focus:left-4" : "", // Adjust for icon
                                error ? "text-error peer-focus:text-error" : ""
                            )}
                        >
                            {label}
                        </label>
                    )}
                </div>

                {error && <p className="mt-1 text-xs text-error ml-4">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
}

// Search bar distinct M3 style (Filled, rounded-full)
export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
    ({ className, onClear, value, ...props }, ref) => {
        return (
            <div className={cn("relative flex items-center w-full h-12 rounded-full bg-surface-container-high hover:bg-surface-container-high/80 transition-colors cursor-text group focus-within:bg-surface-container-high focus-within:shadow-md ring-1 ring-transparent focus-within:ring-primary/50", className)}>
                <div className="pl-4 pr-3 text-on-surface-variant">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant h-full"
                    ref={ref}
                    {...props}
                    value={value}
                />
                {value && onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="p-2 mr-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        )
    }
);
SearchBar.displayName = "SearchBar";
