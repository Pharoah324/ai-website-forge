import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LANGUAGES, useI18n, getLanguageEntry, type LanguageEntry } from "@/lib/i18n";

const REGION_ORDER: LanguageEntry["region"][] = [
  "Europe",
  "Middle East",
  "Asia",
  "Africa",
  "Americas",
  "Pacific",
];

export function LanguageSelector({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { lang, setLang } = useI18n();
  const [showAll, setShowAll] = useState(false);
  const current =
    getLanguageEntry(lang) ?? { code: lang, label: lang.toUpperCase(), flag: "🌐", name: lang } as LanguageEntry;

  const primary = LANGUAGES.filter((l) => l.primary);
  const grouped: Record<string, LanguageEntry[]> = {};
  for (const l of LANGUAGES.filter((l) => !l.primary)) {
    (grouped[l.region] ||= []).push(l);
  }

  return (
    <DropdownMenu onOpenChange={(o) => !o && setShowAll(false)}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1.5 px-2" aria-label="Select language">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] min-w-[240px] overflow-y-auto">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Most spoken
        </DropdownMenuLabel>
        {primary.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={l.code === lang ? "bg-accent" : ""}
          >
            <span className="mr-2">{l.flag}</span>
            <span className="flex-1">{l.name}</span>
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {!showAll ? (
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setShowAll(true); }}
            className="text-primary"
          >
            <ChevronDown className="mr-2 h-4 w-4" />
            <span className="flex-1">+ More languages</span>
          </DropdownMenuItem>
        ) : (
          REGION_ORDER.flatMap((region) => {
            const items = grouped[region];
            if (!items?.length) return [];
            return [
              <DropdownMenuLabel
                key={`label-${region}`}
                className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {region}
              </DropdownMenuLabel>,
              ...items.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={l.code === lang ? "bg-accent" : ""}
                >
                  <span className="mr-2">{l.flag}</span>
                  <span className="flex-1">{l.name}</span>
                  {l.rtl && (
                    <span className="ml-1 rounded bg-muted px-1 text-[9px] font-semibold text-muted-foreground">
                      RTL
                    </span>
                  )}
                </DropdownMenuItem>
              )),
            ];
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
