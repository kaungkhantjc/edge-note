import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "./theme-provider";
import { DropdownMenu, DropdownItem } from "./ui/DropdownMenu";
import { Button } from "./ui/Button";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    const renderTrigger = () => {
        return (
            <Button variant="icon" title="Theme">
                {theme === "light" && <Sun className="h-5 w-5" />}
                {theme === "dark" && <Moon className="h-5 w-5" />}
                {theme === "system" && <Laptop className="h-5 w-5" />}
            </Button>
        );
    }

    return (
        <DropdownMenu trigger={renderTrigger()}>
            <DropdownItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-primary-container hover:bg-primary-container/80 text-primary" : ""}>
                <Sun className="mr-3 h-4 w-4" /> Light
            </DropdownItem>
            <DropdownItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-primary-container hover:bg-primary-container/80 text-primary" : ""}>
                <Moon className="mr-3 h-4 w-4" /> Dark
            </DropdownItem>
            <DropdownItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-primary-container hover:bg-primary-container/80 text-primary" : ""}>
                <Laptop className="mr-3 h-4 w-4" /> System
            </DropdownItem>
        </DropdownMenu>
    );
}
