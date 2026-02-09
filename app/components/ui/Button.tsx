import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "filled" | "tonal" | "outlined" | "text" | "icon";
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
}

export function Button({
    className,
    variant = "filled",
    size = "md",
    icon,
    children,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

    const variants = {
        filled: "bg-primary text-on-primary hover:shadow-md hover:bg-primary/90 rounded-full shadow-sm",
        tonal: "bg-secondary-container text-on-secondary-container hover:shadow-sm hover:bg-secondary-container/80 rounded-full",
        outlined: "border border-outline text-primary hover:bg-primary/10 hover:border-primary rounded-full",
        text: "text-primary hover:bg-primary/10 rounded-full px-3",
        icon: "text-on-surface-variant hover:bg-on-surface-variant/10 rounded-full p-2 aspect-square",
    };

    const sizes = {
        sm: "h-8 px-3 text-sm gap-1.5",
        md: "h-10 px-6 text-sm gap-2",
        lg: "h-12 px-8 text-base gap-2.5",
    };

    // Icon button always has specific padding/size handling if needed, but 'sizes' handles height.
    // We might want to override padding for icon variant if it's not handled.
    const sizeStyles = variant === 'icon' ? (size === 'sm' ? 'h-8 w-8 p-1.5' : size === 'lg' ? 'h-12 w-12 p-3' : 'h-10 w-10 p-2') : sizes[size];

    return (
        <button
            className={cn(baseStyles, variants[variant], sizeStyles, className)}
            {...props}
        >
            {icon && <span className="w-5 h-5 flex items-center justify-center">{icon}</span>}
            {children}
        </button>
    );
}
