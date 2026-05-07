import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";

export function LanguageSelector({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { lang, setLang } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1.5 px-2" aria-label="Select language">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code as Lang)}
            className={l.code === lang ? "bg-accent" : ""}
          >
            <span className="mr-2">{l.flag}</span>
            <span className="flex-1">{l.name}</span>
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
