import { Button } from "./ui/Button";

interface NoteListErrorStateProps {
    onRetry: () => void;
}

export function NoteListErrorState({ onRetry }: NoteListErrorStateProps) {
    return (
        <div className="mt-2 w-full flex flex-col items-center gap-3 p-8 bg-surface-container rounded-3xl border border-outline-variant/20 shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <div className="text-error mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <p className="text-on-surface font-semibold">Connection failed</p>
            <p className="text-sm text-on-surface-variant max-w-50 text-center">Couldn't load more notes. Please check your network.</p>
            <Button
                variant="tonal"
                onClick={onRetry}
                className="mt-2 min-w-30"
            >
                Retry
            </Button>
        </div>
    );
}
