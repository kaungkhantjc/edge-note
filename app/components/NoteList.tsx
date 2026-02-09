import { useCallback } from 'react';
import { useSubmit } from 'react-router';
import { NoteCard } from './NoteCard';

// Make Note type match Drizzle schema (partially, for UI)
export interface Note {
    id: number; // Changed from string to number to match DB
    title: string;
    excerpt: string;
    date: string;
    slug: string | null;
}

interface NoteListProps {
    notes: Note[];
    selection: any; // Explicitly passed from parent
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export function NoteList({ notes, selection, containerRef }: NoteListProps) {
    const submit = useSubmit();

    const {
        isSelectionMode,
        selectedIds,
        selectionBox,
        handleMouseDown,
        toggleSelection,
        startSelectionMode,
        clearSelection,
        selectAll,
    } = selection;

    const handleNoteClick = useCallback((note: Note) => {
        if (isSelectionMode) {
            toggleSelection(note.id.toString());
        } else {
            // Navigate to note detail
            window.location.href = `/${note.id}`;
        }
    }, [isSelectionMode, toggleSelection]);

    const handleNoteLongPress = useCallback((note: Note) => {
        if (!isSelectionMode) {
            startSelectionMode(note.id.toString());
        } else {
            toggleSelection(note.id.toString());
        }
    }, [isSelectionMode, startSelectionMode, toggleSelection]);

    const handleDelete = () => {
        if (confirm(`Delete ${selectedIds.size} notes?`)) {
            const formData = new FormData();
            formData.append("intent", "delete_batch");
            formData.append("ids", JSON.stringify(Array.from(selectedIds)));
            submit(formData, { method: "post" });
            clearSelection();
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-gray-50">

            {/* Toolbar - Only visible in Selection Mode */}
            {isSelectionMode && (
                <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={clearSelection}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                            aria-label="Cancel selection"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <span className="font-medium text-gray-900 border-l border-gray-300 pl-4">
                            {selectedIds.size} selected
                        </span>
                        <button
                            onClick={selectAll}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 bg-blue-50 rounded"
                        >
                            Select All
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={selectedIds.size === 0}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete selected"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Note Grid - Scrollable Container */}
            <div
                className="flex-1 overflow-y-auto p-4 md:p-6 select-none relative"
                ref={containerRef}
                onMouseDown={handleMouseDown}
            >
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {notes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            isSelectionMode={isSelectionMode}
                            onClick={() => handleNoteClick(note)}
                            onLongPress={() => handleNoteLongPress(note)}
                            selected={selectedIds.has(note.id.toString())}
                        />
                    ))}
                </div>

                {/* Selection Box Overlay */}
                {selectionBox && (
                    <div
                        className="absolute bg-slate-500/20 border border-slate-500/50 pointer-events-none z-40 transition-none rounded-sm"
                        style={{
                            left: selectionBox.x,
                            top: selectionBox.y,
                            width: selectionBox.width,
                            height: selectionBox.height,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
