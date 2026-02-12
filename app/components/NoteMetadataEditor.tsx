import { Globe, Lock } from "lucide-react";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

interface NoteMetadataEditorProps {
    title: string;
    isPublic: boolean;
    slug: string;
    errors?: {
        title?: string;
        slug?: string;
    };
    onIsPublicChange: (val: boolean) => void;
}

export function NoteMetadataEditor({
    title,
    isPublic,
    slug,
    errors,
    onIsPublicChange
}: NoteMetadataEditorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 pt-4 px-4 md:pt-4 md:px-4">
            <div className="md:col-span-2">
                <Input
                    name="title"
                    label="Title"
                    placeholder="Note Title"
                    defaultValue={title}
                    error={errors?.title}
                />
            </div>
            <div className="md:col-span-1">
                <Select
                    name="isPublic"
                    label="Privacy"
                    value={isPublic ? "true" : "false"}
                    onChange={(val) => onIsPublicChange(val === "true")}
                    icon={isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    options={[
                        { label: "Private", value: "false", icon: <Lock className="w-4 h-4" /> },
                        { label: "Public", value: "true", icon: <Globe className="w-4 h-4" /> },
                    ]}
                />
            </div>
            <div>
                <Input
                    name="slug"
                    label={isPublic ? "Slug (Required)" : "Slug"}
                    placeholder="custom-slug"
                    defaultValue={slug}
                    error={errors?.slug}
                    required={isPublic}
                />
            </div>
        </div>
    );
}
