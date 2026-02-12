import { Globe, LayoutGrid, Lock, LogOut, Pen } from "lucide-react";
import { Form, Link } from "react-router";
import { cn } from "~/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { AppBar } from "./ui/AppBar";
import { Button } from "./ui/Button";
import { SearchBar } from "./ui/Input";
import { SegmentedButton } from "./ui/SegmentedButton";

interface HomeHeaderProps {
    isVisible: boolean;
    totalNotes: number;
    q: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchClear: () => void;
}

export function HomeHeader({
    isVisible,
    totalNotes,
    q,
    onSearchChange,
    onSearchClear
}: HomeHeaderProps) {
    return (
        <div className={cn(
            "absolute inset-0 transition-all duration-300 ease-in-out",
            !isVisible ? "opacity-0 pointer-events-none -translate-y-2" : "opacity-100 translate-y-0"
        )}>
            <AppBar
                className="bg-surface-container/50 backdrop-blur-xl border-b-0 shadow-sm"
                title={
                    <div className="flex gap-3 items-center">
                        <img src="/favicon.svg" alt="Edge Note" className="h-10 w-10" />
                        <div className="flex flex-col">
                            <span className="font-bold text-xl leading-tight tracking-tight text-primary">Edge Note</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-xs font-medium text-on-surface-variant/70 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-primary/40" />
                                    {totalNotes} notes
                                </span>
                            </div>
                        </div>
                    </div>
                }
                endAction={
                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-3 mr-2">
                            <Link to="/new" viewTransition>
                                <Button
                                    variant="tonal"
                                    className="rounded-xl h-11 px-4 flex items-center gap-2 font-medium"
                                    icon={<Pen className="w-5 h-5" />}
                                >
                                    New
                                </Button>
                            </Link>
                            <div className="w-64 lg:w-80">
                                <SearchBar
                                    name="q"
                                    value={q}
                                    placeholder="Search your notes"
                                    onChange={onSearchChange}
                                    onClear={onSearchClear}
                                />
                            </div>
                        </div>
                        <ThemeToggle />
                        <Form action="/logout" method="post">
                            <Button variant="icon" icon={<LogOut className="w-5 h-5" />} title="Logout" />
                        </Form>
                    </div>
                }
            />
        </div>
    );
}

interface FiltersProps {
    q: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchClear: () => void;
    privacy: string;
    onPrivacyChange: (value: string) => void;
}

HomeHeader.Filters = function HomeHeaderFilters({
    q,
    onSearchChange,
    onSearchClear,
    privacy,
    onPrivacyChange
}: FiltersProps) {
    return (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-6 flex flex-col md:flex-row md:items-center md:justify-end gap-4">
            {/* Mobile Search */}
            <div className="md:hidden w-full">
                <Form method="get" action="/">
                    <SearchBar
                        className="h-14"
                        name="q"
                        value={q}
                        placeholder="Search notes"
                        onChange={onSearchChange}
                        onClear={onSearchClear}
                    />
                </Form>
            </div>

            <SegmentedButton
                value={privacy}
                onChange={onPrivacyChange}
                className="w-full md:w-auto"
                options={[
                    { label: "All", value: "all", icon: <LayoutGrid className="w-4 h-4" /> },
                    { label: "Private", value: "private", icon: <Lock className="w-4 h-4" /> },
                    { label: "Public", value: "public", icon: <Globe className="w-4 h-4" /> },
                ]}
            />
        </div>
    );
};
