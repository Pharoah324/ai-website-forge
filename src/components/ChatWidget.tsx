import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;

const GREETINGS: Record<string, string> = {
  en: "Hi! How can we help you today?",
  es: "¡Hola! ¿Cómo podemos ayudarte hoy?",
  pt: "Olá! Como podemos ajudá-lo hoje?",
  ar: "مرحباً! كيف يمكننا مساعدتك اليوم؟",
  zh: "您好！今天我们能为您提供什么帮助？",
  fr: "Bonjour! Comment pouvons-nous vous aider aujourd'hui?",
  de: "Hallo! Wie können wir Ihnen heute helfen?",
  ja: "こんにちは！本日はどのようなご用件でしょうか？",
  hi: "नमस्ते! आज हम आपकी कैसे मदद कर सकते हैं?",
  ko: "안녕하세요! 오늘 어떻게 도와드릴까요?",
  it: "Ciao! Come possiamo aiutarti oggi?",
  ru: "Здравствуйте! Чем мы можем вам помочь сегодня?",
  tr: "Merhaba! Bugün size nasıl yardımcı olabiliriz?",
  vi: "Xin chào! Hôm nay chúng tôi có thể giúp gì cho bạn?",
  th: "สวัสดี! วันนี้เราจะช่วยอะไรคุณได้บ้าง?",
  id: "Halo! Ada yang bisa kami bantu hari ini?",
  he: "שלום! איך נוכל לעזור לך היום?",
  fa: "سلام! امروز چگونه می‌توانیم به شما کمک کنیم؟",
  ur: "ہیلو! آج ہم آپ کی کیسے مدد کر سکتے ہیں؟",
};

export function ChatWidget() {
  const { lang, rtl } = useI18n();
  const greeting = useMemo(
    () => GREETINGS[lang] || GREETINGS[lang.split("-")[0]] || GREETINGS.en,
    [lang],
  );
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update greeting when language changes (only if no real conversation yet)
  useEffect(() => {
    setMessages((prev) => (prev.length <= 1 ? [{ role: "assistant", content: greeting }] : prev));
  }, [greeting]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setStreaming(true);

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content !== greeting) {
          // only replace if it's the in-progress assistant message
          if ((last as Msg & { _pending?: boolean })._pending) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: acc } : m,
            );
          }
        }
        return [...prev, { role: "assistant", content: acc, _pending: true } as Msg];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          language: lang,
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Too many requests. Try again in a moment.");
        if (resp.status === 402) throw new Error("AI credits exhausted.");
        throw new Error("Chat unavailable");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsert(delta);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setMessages((p) => [...p, { role: "assistant", content: msg }]);
    } finally {
      setStreaming(false);
      setMessages((prev) =>
        prev.map((m) => {
          const mm = m as Msg & { _pending?: boolean };
          if (mm._pending) { delete mm._pending; }
          return mm;
        }),
      );
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="animate-fade-in fixed bottom-24 right-6 z-50 flex h-[480px] w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-primary/30 bg-card shadow-elevated">
          <div className="flex items-center justify-between rounded-t-xl bg-gradient-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="text-sm font-semibold">Virtual Engine Builder</p>
              <p className="text-[11px] opacity-80">We typically reply instantly</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
                {streaming && i === messages.length - 1 && m.role === "assistant" && (
                  <span className="ml-1 inline-block h-3 w-1 animate-type-cursor bg-current align-middle" />
                )}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-2 border-t p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={streaming}
            />
            <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
