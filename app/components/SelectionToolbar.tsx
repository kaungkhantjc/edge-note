import { Trash2, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "./ui/Button";

interface SelectionToolbarProps {
    isVisible: boolean;
    selectedCount: number;
    onClear: () => void;
    onSelectAll: () => void;
    onDelete: () => void;
}

export function SelectionToolbar({
    isVisible,
    selectedCount,
    onClear,
    onSelectAll,
    onDelete
}: SelectionToolbarProps) {
    return (
        <div className={cn(
            "absolute inset-0 transition-all duration-300 ease-in-out z-50",
            !isVisible ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100 translate-y-0"
        )}>
            <div className="h-18 md:h-16 bg-surface-container/90 backdrop-blur-md px-4 border-b border-outline-variant/20 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        tabIndex={isVisible ? 0 : -1}
                        variant="icon"
                        onClick={onClear}
                        aria-label="Cancel selection"
                        icon={<X className="w-6 h-6" />}
                    />

                    <div className="flex flex-col">
                        <span className="text-lg font-medium text-on-surface">
                            {selectedCount} selected
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        tabIndex={isVisible ? 0 : -1}
                        variant="text"
                        onClick={onSelectAll}
                        className="bg-transparent"
                    >
                        Select All
                    </Button>
                    <Button
                        tabIndex={isVisible ? 0 : -1}
                        variant="icon"
                        onClick={onDelete}
                        disabled={selectedCount === 0}
                        title="Delete selected"
                        className="text-error hover:bg-error/10"
                        icon={<Trash2 className="w-6 h-6" />}
                    />
                </div>
            </div>
        </div>
    );
}
