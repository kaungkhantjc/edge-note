import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SearchIcon, XIcon } from "lucide-react";

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
                            "peer w-full h-14 rounded-xl border-none outline-none ring-1 ring-outline text-on-surface bg-transparent px-4 py-2.5 transition-all focus:ring-2 focus:ring-primary focus:bg-background placeholder:text-transparent",
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
        const internalRef = React.useRef<HTMLInputElement>(null);
        
        // Merge refs: use the passed ref if it's a function or object, 
        // and also use our internalRef for focusing.
        React.useImperativeHandle(ref, () => internalRef.current!);

        const handleContainerClick = () => {
            internalRef.current?.focus();
        };

        return (
            <div 
                className={cn("relative flex items-center w-full h-12 rounded-full bg-surface-container-high hover:bg-surface-container-high/80 transition-colors cursor-text group focus-within:bg-surface-container-high ring-[1.5px] ring-transparent focus-within:ring-primary", className)}
                onClick={handleContainerClick}
            >
                <div className="pl-4 pr-3 text-on-surface-variant">
                    <SearchIcon className="size-6" />
                </div>
                <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant h-full"
                    ref={internalRef}
                    {...props}
                    value={value}
                />
                {value && onClear && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                        }}
                        className="p-2 mr-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors"
                    >
                        <XIcon className="size-6" />
                    </button>
                )}
            </div>
        )
    }
);
SearchBar.displayName = "SearchBar";
