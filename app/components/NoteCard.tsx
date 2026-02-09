
import { useRef, useCallback } from 'react';

export interface Note {
    id: string | number;
    title: string;
    excerpt: string;
    date: string;
}

interface NoteCardProps {
    note: Note;
    selected: boolean;
    isSelectionMode: boolean;
    onClick: (note: Note) => void;
    onLongPress: (note: Note) => void;
}

export function NoteCard({ note, selected, isSelectionMode, onClick, onLongPress }: NoteCardProps) {
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressing = useRef(false);

    const handleTouchStart = useCallback(() => {
        isLongPressing.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPressing.current = true;
            onLongPress(note);
        }, 500);
    }, [note, onLongPress]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        // Prevent default click if we just long-pressed
        if (isLongPressing.current) {
            e.preventDefault();
        }
    }, []);

    const handleTouchMove = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // For desktop, right click could also select? Or just drag?
    // User spec only mentions drag.
    // We'll stick to basic click handling.

    return (
        <div
            id={`note-card-${note.id}`}
            className={`note-card group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer 
        ${selected
                    ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]'
                    : 'bg-white p-4 rounded-xl border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
select-none touch-manipulation
    `}
            onClick={() => onClick(note)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className={`font-semibold text-lg line-clamp-1 ${selected ? 'text-blue-700' : 'text-gray-900'} `}>
                    {note.title}
                </h3>
                {selected && (
                    <div className="bg-blue-500 text-white rounded-full p-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>
            <p className="text-gray-500 text-sm line-clamp-3 mb-3">
                {note.excerpt}
            </p>
            <div className="text-xs text-gray-400 font-medium">
                {new Date(note.date).toLocaleDateString()}
            </div>

            {/* Overlay for selection effect */}
            <div className={`absolute inset-0 rounded-xl transition-colors pointer-events-none 
         ${selected ? 'bg-blue-500/5' : 'group-hover:bg-gray-50/50'}
`} />
        </div>
    );
}
