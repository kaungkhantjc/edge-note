import { Moon, Sun, Laptop, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useState, useRef, useEffect } from "react";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelect = (newTheme: "light" | "dark" | "system") => {
        setTheme(newTheme);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <button
                    onClick={toggleDropdown}
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                    id="theme-menu-button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    {theme === "light" && <Sun className="h-5 w-5" />}
                    {theme === "dark" && <Moon className="h-5 w-5" />}
                    {theme === "system" && <Laptop className="h-5 w-5" />}
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 dark:bg-gray-800 dark:ring-gray-600"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="theme-menu-button"
                >
                    <div className="py-1" role="none">
                        <button
                            onClick={() => handleSelect("light")}
                            className={`flex items-center w-full px-4 py-2 text-sm ${theme === "light"
                                    ? "bg-gray-100 text-gray-900 font-bold dark:bg-gray-700 dark:text-white"
                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                            role="menuitem"
                        >
                            <Sun className="mr-3 h-4 w-4" />
                            Light
                        </button>
                        <button
                            onClick={() => handleSelect("dark")}
                            className={`flex items-center w-full px-4 py-2 text-sm ${theme === "dark"
                                    ? "bg-gray-100 text-gray-900 font-bold dark:bg-gray-700 dark:text-white"
                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                            role="menuitem"
                        >
                            <Moon className="mr-3 h-4 w-4" />
                            Dark
                        </button>
                        <button
                            onClick={() => handleSelect("system")}
                            className={`flex items-center w-full px-4 py-2 text-sm ${theme === "system"
                                    ? "bg-gray-100 text-gray-900 font-bold dark:bg-gray-700 dark:text-white"
                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                            role="menuitem"
                        >
                            <Laptop className="mr-3 h-4 w-4" />
                            System
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
