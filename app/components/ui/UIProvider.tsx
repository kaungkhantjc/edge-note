import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Snackbar } from "./Snackbar";

interface ModalState {
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    isDestructive?: boolean;
    icon?: React.ReactNode;
}

interface SnackbarState {
    isOpen: boolean;
    message: string;
}

interface UIContextType {
    showModal: (config: Omit<ModalState, "isOpen">) => void;
    showSnackbar: (message: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => { },
    });

    const [snackbar, setSnackbar] = useState<SnackbarState>({
        isOpen: false,
        message: "",
    });

    const showModal = useCallback((config: Omit<ModalState, "isOpen">) => {
        setModal({ ...config, isOpen: true });
    }, []);

    const hideModal = useCallback(() => {
        setModal((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const showSnackbar = useCallback((message: string) => {
        setSnackbar({ message, isOpen: true });
    }, []);

    const hideSnackbar = useCallback(() => {
        setSnackbar((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <UIContext.Provider value={{ showModal, showSnackbar }}>
            {children}
            <Modal
                isOpen={modal.isOpen}
                onClose={hideModal}
                onConfirm={modal.onConfirm}
                title={modal.title}
                description={modal.description}
                confirmText={modal.confirmText}
                isDestructive={modal.isDestructive}
                icon={modal.icon}
            />
            <Snackbar
                isOpen={snackbar.isOpen}
                message={snackbar.message}
                onClose={hideSnackbar}
            />
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
}
