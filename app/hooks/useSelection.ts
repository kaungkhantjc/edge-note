import { useState, useRef, useEffect, useCallback } from "react";

interface Point {
    x: number;
    y: number;
}

interface SelectionBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

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

    // Toggle selection for a single item
    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }

            if (newSet.size === 0) {
                setIsSelectionMode(false);
            }
            return newSet;
        });
    }, []);

    // Enter selection mode with an initial item selected
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


    // Mouse Event Handlers for Drag Selection
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only trigger if clicking on the background (container) directly, not a card or interactive element
        if ((e.target as HTMLElement).closest('.note-card') ||
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('a')) {
            return;
        }

        if (e.button !== 0) return; // Only left click

        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left + containerRef.current.scrollLeft;
        const y = e.clientY - containerRect.top + containerRef.current.scrollTop;

        isDragging.current = true;
        dragStartPoint.current = { x, y };

        // Clear selection if not holding Shift/Ctrl
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            setSelectedIds(new Set());
            previousSelection.current = new Set();
            // Don't exit selection mode immediately if we want to allow "drag to select" to be the mode starter
            // But requirements say "Clicking the background clears selection" (implies exit).
            setIsSelectionMode(false);
        } else {
            previousSelection.current = new Set(selectedIds);
        }

        setSelectionBox({ x, y, width: 0, height: 0 });
        e.preventDefault(); // Prevent text selection
    }, [containerRef, selectedIds]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !dragStartPoint.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - containerRect.left + containerRef.current.scrollLeft;
        const currentY = e.clientY - containerRect.top + containerRef.current.scrollTop;

        // Calculate box
        const startX = Math.min(dragStartPoint.current.x, currentX);
        const startY = Math.min(dragStartPoint.current.y, currentY);
        const width = Math.abs(currentX - dragStartPoint.current.x);
        const height = Math.abs(currentY - dragStartPoint.current.y);

        const newBox = { x: startX, y: startY, width, height };
        setSelectionBox(newBox);

        // Calculate intersections
        // Note: We need screen coordinates for intersection content, but the box is relative to container scroll.
        // Let's rely on standard getBoundingClientRect for both.

        // Box in client coordinates
        const boxClientLeft = containerRect.left + startX - containerRef.current.scrollLeft;
        const boxClientTop = containerRect.top + startY - containerRef.current.scrollTop;

        const boxRect = {
            left: boxClientLeft,
            top: boxClientTop,
            right: boxClientLeft + width,
            bottom: boxClientTop + height
        };

        const newSelectedIds = new Set(previousSelection.current);

        items.forEach((item) => {
            const id = getItemId(item);
            const element = document.getElementById(`note-card-${id}`);
            if (element) {
                const itemRect = element.getBoundingClientRect();

                const isIntersecting = !(
                    boxRect.right < itemRect.left ||
                    boxRect.left > itemRect.right ||
                    boxRect.bottom < itemRect.top ||
                    boxRect.top > itemRect.bottom
                );

                if (isIntersecting) {
                    newSelectedIds.add(id);
                } else if (!previousSelection.current.has(id)) {
                    // If it was not previously selected, remove it (it might have been added in a previous move event)
                    newSelectedIds.delete(id);
                }
            }
        });

        if (newSelectedIds.size > 0 || isSelectionMode) { // Only update if we have selections or were already in mode
            setSelectedIds(newSelectedIds);
            if (newSelectedIds.size > 0) setIsSelectionMode(true);
        }

    }, [items, getItemId, isSelectionMode, previousSelection, containerRef]); // Added containerRef to dependency array

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        dragStartPoint.current = null;
        setSelectionBox(null);
    }, []);

    // Global event listeners
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
