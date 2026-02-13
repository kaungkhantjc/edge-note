import { useCallback, useEffect, useRef, useState } from "react";
import { type Point, type SelectionBox, calculateBox, isIntersecting } from "./use-selection-utils";

interface UseSelectionModeProps<T> {
    items: T[];
    containerRef: React.RefObject<HTMLDivElement | null>;
    getItemId: (item: T) => string;
}

export function useSelectionMode<T>({ items, containerRef, getItemId }: UseSelectionModeProps<T>) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

    const isDragging = useRef(false);
    const dragStartPoint = useRef<Point | null>(null);
    const previousSelection = useRef<Set<string>>(new Set());

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }

            if (newSet.size === 0) setIsSelectionMode(false);
            return newSet;
        });
    }, []);

    const startSelectionMode = useCallback((id: string) => {
        setIsSelectionMode(true);
        setSelectedIds(new Set([id]));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        setSelectionBox(null);
    }, []);

    const selectAll = useCallback(() => {
        const allIds = new Set(items.map(getItemId));
        setSelectedIds(allIds);
        setIsSelectionMode(true);
    }, [items, getItemId]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.note-card') ||
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input') ||
            (e.target as HTMLElement).closest('textarea') ||
            (e.target as HTMLElement).closest('a')) {
            return;
        }

        if (e.button !== 0) return;
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left + containerRef.current.scrollLeft;
        const y = e.clientY - containerRect.top + containerRef.current.scrollTop;

        isDragging.current = true;
        dragStartPoint.current = { x, y };

        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            setSelectedIds(new Set());
            previousSelection.current = new Set();
            setIsSelectionMode(false);
        } else {
            previousSelection.current = new Set(selectedIds);
        }

        setSelectionBox({ x, y, width: 0, height: 0 });
        e.preventDefault();
    }, [containerRef, selectedIds]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !dragStartPoint.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - containerRect.left + containerRef.current.scrollLeft;
        const currentY = e.clientY - containerRect.top + containerRef.current.scrollTop;

        const box = calculateBox(dragStartPoint.current, { x: currentX, y: currentY });
        setSelectionBox(box);

        const boxClientLeft = containerRect.left + box.x - containerRef.current.scrollLeft;
        const boxClientTop = containerRect.top + box.y - containerRef.current.scrollTop;

        const boxRect = {
            left: boxClientLeft,
            top: boxClientTop,
            right: boxClientLeft + box.width,
            bottom: boxClientTop + box.height
        };

        const newSelectedIds = new Set(previousSelection.current);

        items.forEach((item) => {
            const id = getItemId(item);
            const element = document.getElementById(`note-card-${id}`);
            if (element) {
                const itemRect = element.getBoundingClientRect();
                if (isIntersecting(boxRect, itemRect)) {
                    newSelectedIds.add(id);
                } else if (!previousSelection.current.has(id)) {
                    newSelectedIds.delete(id);
                }
            }
        });

        if (newSelectedIds.size > 0 || isSelectionMode) {
            setSelectedIds(newSelectedIds);
            if (newSelectedIds.size > 0) setIsSelectionMode(true);
        }
    }, [items, getItemId, isSelectionMode, containerRef]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        dragStartPoint.current = null;
        setSelectionBox(null);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return {
        isSelectionMode,
        selectedIds,
        selectionBox,
        toggleSelection,
        startSelectionMode,
        clearSelection,
        selectAll,
        handleMouseDown,
    };
}
