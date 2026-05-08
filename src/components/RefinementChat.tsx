import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  History,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import type { SiteContent } from "@/types/site";
import { formatDistanceToNow } from "date-fns";

const QUICK_ACTIONS: Array<{ label: string; prompt: string }> = [
  { label: "Change Colors", prompt: "Change the color scheme to " },
  { label: "Update Headline", prompt: "Change the hero headline to something about " },
  { label: "Add Section", prompt: "Add a new section for " },
  { label: "Make More Modern", prompt: "Make the design feel more modern and premium." },
  { label: "Add Booking", prompt: "Add a booking button in the hero linking to a booking flow." },
  { label: "Change Font", prompt: "Change the typography style to feel " },
  { label: "Add Testimonials", prompt: "Add a testimonials section with 3 realistic quotes." },
  { label: "Update Copy", prompt: "Rewrite the copy to be " },
];

type ChatRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  summary: string | null;
  credits_used: number;
  version_id: string | null;
  created_at: string;
};

type VersionRow = {
  id: string;
  version_number: number;
  label: string | null;
  content: SiteContent;
  created_at: string;
};

export function RefinementChat({
  siteId,
  originalPrompt,
  onContentUpdated,
  onTopUp,
}: {
  siteId: string;
  originalPrompt: string;
  onContentUpdated: (c: SiteContent) => void;
  onTopUp?: () => void;
}) {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isUnlimited = profile?.plan === "agency";
  const noCredits = !!profile && !isUnlimited && profile.build_credits <= 0;

  const { data: messages } = useQuery({
    queryKey: ["site-chat", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_chat_messages")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ChatRow[];
    },
  });

  const { data: versions } = useQuery({
    queryKey: ["site-versions", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_versions")
        .select("*")
        .eq("site_id", siteId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as unknown as VersionRow[];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length, sending]);

  // Voice input
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const SR =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const toggleMic = () => {
    if (!SR) return toast.error("Voice input not supported in this browser");
    if (listening) {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setInput((prev) => (prev ? prev.trimEnd() + " " : "") + text);
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    if (noCredits) {
      onTopUp?.();
      return;
    }
    setSending(true);
    setInput("");
    const { data, error } = await supabase.functions.invoke("refine-site", {
      body: { site_id: siteId, message: msg },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      const errMsg = (data as any)?.error || error?.message || "Refinement failed";
      if (errMsg === "no_credits") {
        toast.error("Out of build credits", {
          action: { label: "Buy credits", onClick: () => onTopUp?.() },
        });
      } else {
        toast.error(errMsg);
      }
      setInput(msg);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site-chat", siteId] });
    qc.invalidateQueries({ queryKey: ["site-versions", siteId] });
    qc.invalidateQueries({ queryKey: ["site", siteId] });
    qc.invalidateQueries({ queryKey: ["profile"] });
    if ((data as any)?.content) onContentUpdated((data as any).content as SiteContent);
    toast.success("Site updated");
  };

  const restoreVersion = async (v: VersionRow) => {
    const { error } = await supabase.from("sites").update({ content: v.content }).eq("id", siteId);
    if (error) return toast.error(error.message);
    onContentUpdated(v.content);
    qc.invalidateQueries({ queryKey: ["site", siteId] });
    toast.success(`Restored v${v.version_number}`);
  };

  const handleQuick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
    // Place cursor at end
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Refine with AI</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
              <History className="h-3.5 w-3.5" />
              Versions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 w-72 overflow-y-auto">
            <DropdownMenuLabel className="text-xs">Version history</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!versions || versions.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground">No previous versions yet.</div>
            ) : (
              versions.map((v, idx) => (
                <DropdownMenuItem key={v.id} onClick={() => restoreVersion(v)} className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-semibold">
                    v{v.version_number} {idx === 0 && <span className="text-primary">· current</span>}
                  </span>
                  <span className="line-clamp-1 text-[11px] text-muted-foreground">
                    {v.label || "Snapshot"} · {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Original prompt collapsible */}
      <button
        onClick={() => setPromptOpen((o) => !o)}
        className="flex items-center justify-between border-b px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/50"
      >
        <span className="font-semibold uppercase tracking-wider">Original prompt</span>
        {promptOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {promptOpen && (
        <div className="border-b bg-muted/30 px-3 py-2 text-xs text-foreground">{originalPrompt}</div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-3 p-3">
          {(!messages || messages.length === 0) && (
            <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
              Type a refinement below — e.g. "Make it darker", "Add a FAQ section", "Translate to Spanish".
            </div>
          )}
          {messages?.map((m) => (
            <Message key={m.id} m={m} />
          ))}
          {sending && (
            <div className="flex items-center gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refining your site…
            </div>
          )}
        </div>
      </ScrollArea>

      {/* No credits */}
      {noCredits && (
        <div className="border-t bg-destructive/5 p-3 text-xs">
          <p className="font-medium text-foreground">You've used all your build credits.</p>
          <p className="mt-1 text-muted-foreground">
            Top up instantly to keep refining, or upgrade your plan for more credits monthly.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => onTopUp?.()}>
              <CreditCard className="mr-1 h-3 w-3" /> Buy Credits — from $9
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
              <a href="/app/billing">Upgrade Plan</a>
            </Button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      {!noCredits && (
        <div className="border-t p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => handleQuick(a.prompt)}
                disabled={sending}
                className="rounded border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Tell the AI what to change…"
          disabled={sending || noCredits}
          maxLength={2000}
          className="min-h-[64px] resize-none text-sm"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {input.length}/2000 · {isUnlimited ? "Unlimited" : "1 credit"}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={listening ? "destructive" : "outline"}
              onClick={toggleMic}
              disabled={sending}
              title="Voice input"
            >
              {listening ? <MicOff className="h-3.5 w-3.5 animate-pulse" /> : <Mic className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" onClick={send} disabled={sending || !input.trim() || noCredits}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span className="ml-1">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({ m }: { m: ChatRow }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
          {m.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-lg border bg-muted/40 px-3 py-2 text-sm">
        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> AI
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{m.summary || m.content}</p>
        {m.credits_used > 0 && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">— {m.credits_used} credit used</p>
        )}
      </div>
    </div>
  );
}
