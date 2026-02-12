export function NoteListEmptyState() {
    return (
        <div className="col-span-full flex flex-col items-center justify-center p-12 text-on-surface-variant/50">
            <div className="w-24 h-24 rounded-full bg-surface-container-high mb-4 flex items-center justify-center">
                <span className="text-4xl">
                    <img src="/favicon.svg" alt="Logo" className="w-12 h-12" />
                </span>
            </div>
            <p className="text-lg">No notes found.</p>
            <p className="text-sm">Create one to get started!</p>
        </div>
    );
}
