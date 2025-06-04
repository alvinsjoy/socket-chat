"use client";

import { RxMoon, RxSun } from "react-icons/rx";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground dark:hover:text-foreground h-8 w-8 rounded-full md:h-10 md:w-10"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <RxSun className="absolute h-4 w-4 scale-100 rotate-0 transition-transform duration-500 ease-in-out md:h-[1.2rem] md:w-[1.2rem] dark:scale-0 dark:-rotate-90" />
      <RxMoon className="h-4 w-4 scale-0 rotate-90 transition-transform duration-500 ease-in-out md:h-[1.2rem] md:w-[1.2rem] dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
