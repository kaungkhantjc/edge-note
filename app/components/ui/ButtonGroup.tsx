import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonGroupProps {
    children: React.ReactNode;
    className?: string;
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
    return (
        <div className={cn(
            "inline-flex items-stretch rounded-full overflow-hidden ring-1 ring-outline-variant/30 bg-surface-container-low",
            className
        )}>
            {React.Children.map(children, (child, index) => {
                if (!React.isValidElement(child)) return child;

                const element = child as React.ReactElement<any>;
                return React.cloneElement(element, {
                    className: cn(
                        element.props.className,
                        "rounded-none h-10 px-3", // Normalizing size for group
                        "border-r border-outline-variant/30 last:border-r-0",
                        "hover:bg-on-surface/5 active:bg-on-surface/10 transition-colors"
                    )
                });
            })}
        </div>
    );
}
