export const SkeletonCard = () => (
    <div className="h-56 rounded-3xl bg-surface-container-high animate-pulse border border-transparent shadow-sm" />
);

export function NoteListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-4 w-full">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
