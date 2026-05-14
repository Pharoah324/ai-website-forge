import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Handshake, Newspaper, Clock, Calendar, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const subjects = [
  "Technical Support",
  "Billing Question",
  "Agency / Partnership",
  "GoHighLevel Integration",
  "Feature Request",
  "Other",
];

const methods = [
  {
    icon: Mail,
    title: "General Support",
    email: "support@virtualengine.ai",
    sub: "For account, billing, and technical help",
  },
  {
    icon: Handshake,
    title: "Partnerships & Agencies",
    email: "partners@virtualengine.ai",
    sub: "White-label, reseller, and agency inquiries",
  },
  {
    icon: Newspaper,
    title: "Press & Media",
    email: "press@virtualengine.ai",
    sub: "Media kit, interviews, and press inquiries",
  },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Technical Support");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `From: ${name} <${email}>\n\n${message}`;
    window.location.href = `mailto:support@virtualengine.ai?subject=${encodeURIComponent(
      `[${subject}] ${name}`,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-card/40 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/VEB_Navbar_Logo.png" alt="Virtual Engine Builder" className="h-8 w-auto" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-glow">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="container max-w-6xl py-16">
        <p className="mb-2 text-sm uppercase tracking-wider text-primary-glow">Contact</p>
        <h1 className="mb-3 text-4xl font-bold md:text-5xl">Get in Touch</h1>
        <p className="mb-12 max-w-2xl text-muted-foreground">
          Have a question, idea, or issue? We're here to help. Our team typically responds within 24 hours on business
          days.
        </p>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            {methods.map(({ icon: Icon, title, email, sub }) => (
              <div
                key={email}
                className="rounded-xl border border-border/60 bg-card/40 p-5 transition hover:border-primary/40"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary-glow">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <a href={`mailto:${email}`} className="text-primary-glow hover:underline">
                  {email}
                </a>
                <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-border/60 bg-card/40 p-6 space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
        </div>

        <div className="mt-12 grid gap-4 rounded-xl border border-border/60 bg-card/40 p-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary-glow" />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Response time</p>
              <p className="font-medium">Under 24 hours</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary-glow" />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Support hours</p>
              <p className="font-medium">Mon–Fri, 9am–6pm EST</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary-glow" />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Languages</p>
              <p className="font-medium">50+ supported</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <p>
          A{" "}
          <a href="https://virtualengine.ai" className="text-primary-glow hover:underline">
            Virtual Engine
          </a>{" "}
          product · © {new Date().getFullYear()} Virtual Engine Builder
        </p>
      </footer>
    </div>
  );
}
