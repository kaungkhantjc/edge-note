import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    icon?: React.ReactNode;
}

export function Modal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false,
    icon,
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-surface-container-high rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="p-6 flex flex-col items-center sm:items-start text-center sm:text-left">
                    {icon && (
                        <div className={cn(
                            "mb-4 p-3 rounded-2xl",
                            isDestructive ? "bg-error-container text-on-error-container" : "bg-primary-container text-on-primary-container"
                        )}>
                            {icon}
                        </div>
                    )}
                    <h3 className="text-2xl font-semibold text-on-surface mb-3 tracking-tight">
                        {title}
                    </h3>
                    <p className="text-on-surface-variant text-base leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-2 p-4 pt-2">
                    <Button
                        variant="text"
                        onClick={onClose}
                        className="px-4 py-2 text-primary font-medium"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={isDestructive ? "filled" : "filled"}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "px-6 py-2 font-medium rounded-full",
                            isDestructive ? "bg-error text-on-error hover:bg-error/90" : "bg-primary text-on-primary hover:bg-primary/90"
                        )}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
