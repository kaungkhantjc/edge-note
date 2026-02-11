import React, { useState, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "lucide-react";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface SelectOption {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

interface SelectProps {
    options: SelectOption[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    name?: string;
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    className?: string;
}

export function Select({
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    name,
    label,
    error,
    icon: prefixIcon,
    className,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(controlledValue || defaultValue || options[0]?.value);
    const containerRef = useRef<HTMLDivElement>(null);

    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        if (controlledValue !== undefined) {
            setInternalValue(controlledValue);
        }
    }, [controlledValue]);

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

    const handleSelect = (val: string) => {
        setInternalValue(val);
        setIsOpen(false);
        onChange?.(val);
    };

    return (
        <div className={cn("relative group w-full", className)} ref={containerRef}>
            {/* Hidden input for form integration */}
            {name && <input type="hidden" name={name} value={value} />}

            <div className="relative flex items-center">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center w-full h-14 rounded-xl outline-none ring-1 ring-outline text-on-surface bg-background px-4 py-2.5 transition-all text-left group",
                        isOpen ? "ring-2 ring-primary" : "hover:ring-on-surface/20",
                        prefixIcon ? "pl-11" : "",
                        error ? "ring-error focus:ring-error" : ""
                    )}
                >
                    {prefixIcon && (
                        <div className="absolute left-4 text-on-surface-variant group-focus:text-primary transition-colors">
                            {prefixIcon}
                        </div>
                    )}

                    <span className="flex-1 truncate">
                        {selectedOption?.label}
                    </span>

                    <ChevronDown className={cn(
                        "size-5 text-on-surface-variant transition-transform duration-200",
                        isOpen ? "rotate-180 text-primary" : ""
                    )} />
                </button>

                {/* Floating Label */}
                {label && (
                    <label
                        className={cn(
                            "absolute left-4 -top-2.5 bg-background px-1 text-xs font-medium text-on-surface-variant transition-all pointer-events-none z-10",
                            isOpen ? "text-primary" : "",
                            prefixIcon ? "left-4" : "",
                            error ? "text-error" : ""
                        )}
                    >
                        {label}
                    </label>
                )}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full origin-top rounded-2xl bg-surface-container border border-outline-variant/30 shadow-lg py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors text-left",
                                    isSelected
                                        ? "bg-primary-container text-on-primary-container font-semibold"
                                        : "text-on-surface hover:bg-on-surface/5"
                                )}
                            >
                                {option.icon && <span className="size-5">{option.icon}</span>}
                                <span className="flex-1">{option.label}</span>
                                {isSelected && (
                                    <div className="size-2 rounded-full bg-primary animate-in zoom-in duration-300" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {error && <p className="mt-1 text-xs text-error ml-4">{error}</p>}
        </div>
    );
}
