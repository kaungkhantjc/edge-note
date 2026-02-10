import { Trash2, X } from 'lucide-react';
import { useCallback } from 'react';
import { useSubmit } from 'react-router';
import { NoteCard, type Note } from './NoteCard';
import { Button } from './ui/Button'; // Assuming we export Button from ui

interface NoteListProps {
    notes: Note[];
    selection: any;
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
        <div className="flex flex-col h-full w-full bg-background text-on-background relative">

            {/* Selection Toolbar */}
            {isSelectionMode && (
                <div className="sticky top-0 z-50 h-18 md:h-16 bg-surface-container/90 backdrop-blur-md px-4 border-b border-outline-variant/20 shadow-sm flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="icon"
                            onClick={clearSelection}
                            aria-label="Cancel selection"
                            icon={<X className="w-6 h-6" />}
                        />

                        <div className="flex flex-col">
                            <span className="text-lg font-medium text-on-surface">
                                {selectedIds.size} selected
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="text"
                            onClick={selectAll}
                            className="bg-transparent"
                        >
                            Select All
                        </Button>
                        <Button
                            variant="icon"
                            onClick={handleDelete}
                            disabled={selectedIds.size === 0}
                            title="Delete selected"
                            className="text-error hover:bg-error/10"
                            icon={<Trash2 className="w-6 h-6" />}
                        />
                    </div>
                </div>
            )}

            {/* Note Grid */}
            <div
                className="flex-1 overflow-y-auto p-4 md:p-6 select-none relative scroll-smooth"
                ref={containerRef}
                onMouseDown={handleMouseDown}
            >
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-24">
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

                    {notes.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-on-surface-variant/50">
                            <div className="w-24 h-24 rounded-full bg-surface-container-high mb-4 flex items-center justify-center">
                                <span className="text-4xl">
                                    <img src="/favicon.svg" alt="Logo" className="w-12 h-12" />
                                </span>
                            </div>
                            <p className="text-lg">No notes found.</p>
                            <p className="text-sm">Create one to get started!</p>
                        </div>
                    )}
                </div>

                {/* Selection Box */}
                {selectionBox && (
                    <div
                        className="absolute bg-primary/20 border border-primary/50 pointer-events-none z-40 transition-none rounded-sm"
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
