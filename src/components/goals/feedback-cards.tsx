import { Heart, Info, Sparkles } from "lucide-react";
import type { FeedbackMessage } from "@/lib/metrics";
import { cn } from "@/lib/utils";

const TONE = {
  celebrate: { box: "bg-primary-soft", icon: Heart, iconClass: "fill-primary text-primary" },
  nudge: { box: "bg-accent-soft", icon: Sparkles, iconClass: "text-accent" },
  info: { box: "bg-surface-alt", icon: Info, iconClass: "text-text-muted" },
} as const;

/** Up to 3 rule-based messages. Never red. */
export function FeedbackCards({ messages }: { messages: FeedbackMessage[] }) {
  if (messages.length === 0) return null;
  return (
    <section aria-labelledby="recados-title" className="flex flex-col gap-2">
      <h2 id="recados-title" className="text-xl">
        Recados
      </h2>
      <ul className="flex flex-col gap-2">
        {messages.map((m) => {
          const t = TONE[m.tone];
          const Icon = t.icon;
          return (
            <li key={m.id} className={cn("flex gap-3 rounded-md px-4 py-3 text-text", t.box)}>
              <Icon aria-hidden className={cn("mt-0.5 size-5 shrink-0", t.iconClass)} />
              <p className="min-w-0 [overflow-wrap:anywhere]">{m.text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
