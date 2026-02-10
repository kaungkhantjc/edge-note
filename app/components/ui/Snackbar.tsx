import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SnackbarProps {
    message: string;
    isOpen: boolean;
    onClose: () => void;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function Snackbar({
    message,
    isOpen,
    onClose,
    duration = 5000,
    action,
}: SnackbarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for animation
            }, duration);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen && !isVisible) return null;

    return createPortal(
        <div className={cn(
            "fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:min-w-86 md:max-w-md z-110 transition-all duration-300 transform",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
            <div className="bg-[#313131] dark:bg-[#e3e3e3] text-[#f4f4f4] dark:text-[#1a1c19] px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4">
                <span className="text-sm font-normal">
                    {message}
                </span>

                <div className="flex items-center gap-2">
                    {action && (
                        <button
                            onClick={() => {
                                action.onClick();
                                onClose();
                            }}
                            className="text-primary-container dark:text-primary font-medium text-sm px-2 py-1 hover:bg-white/10 rounded-md transition-colors"
                        >
                            {action.label}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
