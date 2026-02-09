import { ArrowLeft, Save } from "lucide-react";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { useEffect, useState } from "react";
import { Form, Link } from "react-router";
import { AppBar } from "./ui/AppBar";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useResolvedTheme } from "../hooks/useResolvedTheme";

interface NoteEditorLayoutProps {
    title: string;
    backLink: string;
    formId: string;
    isSubmitting: boolean;
    initialTitle?: string;
    initialSlug?: string;
    initialContent?: string;
}

export function NoteEditorLayout({
    title,
    backLink,
    formId,
    isSubmitting,
    initialTitle = "",
    initialSlug = "",
    initialContent = "",
}: NoteEditorLayoutProps) {
    const [content, setContent] = useState(initialContent);
    const [isPreviewEnabled, setIsPreviewEnabled] = useState(true);
    const resolvedTheme = useResolvedTheme();

    useEffect(() => {
        const checkMobile = () => {
            setIsPreviewEnabled(window.innerWidth >= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-background">
            <AppBar
                className="bg-background/80 backdrop-blur-md"
                title={title}
                startAction={
                    <Link to={backLink}>
                        <Button variant="icon" icon={<ArrowLeft className="w-6 h-6" />} />
                    </Link>
                }
                endAction={
                    <div className="flex items-center gap-2">
                        <Link to={backLink} className="hidden md:block">
                            <Button variant="text">Cancel</Button>
                        </Link>
                        <Button
                            form={formId}
                            type="submit"
                            disabled={isSubmitting}
                            variant="filled"
                            icon={<Save className="w-4 h-4" />}
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                }
            />

            <main className="flex-1 w-full pb-4 md:pb-6 max-w-7xl mx-auto overflow-hidden flex flex-col">
                <Form method="post" id={formId} className="flex flex-col gap-6 h-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 pt-4 px-4 md:pt-4 md:px-4">
                        <div className="md:col-span-2">
                            <Input
                                name="title"
                                label="Title"
                                required
                                placeholder="Note Title"
                                defaultValue={initialTitle}
                            />
                        </div>
                        <div>
                            <Input
                                name="slug"
                                label="Slug"
                                placeholder="custom-slug"
                                defaultValue={initialSlug}
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden p-2 mx-2">
                        <input type="hidden" name="content" value={content} />
                        <MdEditor
                            key={`editor-${resolvedTheme}-${isPreviewEnabled}`}
                            value={content}
                            onChange={setContent}
                            theme={resolvedTheme}
                            language="en-US"
                            className="h-full! rounded-2xl bg-background! ring-1 ring-outline"
                            preview={isPreviewEnabled}
                            noPrettier={false}
                            noUploadImg={true}
                            inputBoxWidth="60%"
                            toolbarsExclude={['github']}
                        />
                    </div>
                </Form>
            </main>
        </div>
    );
}
