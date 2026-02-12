import React from "react";
import { MdCatalog, MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/preview.css";
import { useResolvedTheme } from "../hooks/useResolvedTheme";

interface NotePublicViewerProps {
    title: string;
    content: string;
}

export function NotePublicViewer({ title, content }: NotePublicViewerProps) {
    const resolvedTheme = useResolvedTheme();
    const scrollElement = typeof document !== 'undefined' ? document.documentElement : 'html';

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 p-6 md:p-8 animate-in fade-in duration-500 delay-100">
            <article className="flex-1 min-w-0 prose prose-lg dark:prose-invert max-w-none prose-headings:font-sans prose-p:text-on-surface-variant prose-headings:text-on-surface">
                {/* Header for Public View (just the title since AppBar is separate) */}
                <h1 className="mb-8 text-4xl font-extrabold tracking-tight text-on-surface">{title}</h1>

                <MdPreview
                    key={resolvedTheme}
                    id="preview-only"
                    value={content}
                    theme={resolvedTheme}
                    className="bg-transparent"
                    language="en-US"
                    codeTheme="github"
                    previewTheme="github"
                />
            </article>

            <aside className="hidden lg:block items-center w-72 shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-4 px-2">Table of Contents</div>
                <div className="rounded-2xl p-4 w-full">
                    <MdCatalog editorId="preview-only" scrollElement={scrollElement} theme={resolvedTheme} />
                </div>
            </aside>
        </div>
    );
}
