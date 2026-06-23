import { useEffect, useRef } from "react";
import { Orb } from "./Orb";
import { TEEBadge } from "./TEEBadge";
import type { Companion, Msg } from "../types";

export function Chat({
  companion,
  messages,
  typing,
  input,
  onInput,
  onSend,
}: {
  companion: Companion;
  messages: Msg[];
  typing: boolean;
  input: string;
  onInput: (v: string) => void;
  onSend: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-6 pb-2 pt-6">
        {messages.map((m) =>
          m.role === "assistant" ? (
            <div key={m.id} className="flex max-w-[680px] animate-fadeUp gap-3">
              <div className="mt-0.5 flex-none">
                <Orb hue={companion.hue} size={34} small breathe={false} />
              </div>
              <div>
                <div
                  className="border px-4 py-[13px] text-[15px] leading-[1.55]"
                  style={{ background: "var(--panel)", borderColor: "var(--line)", borderRadius: "4px 16px 16px 16px", boxShadow: "var(--shadow)" }}
                >
                  {m.content}
                </div>
                <TEEBadge verified={m.tee ?? null} attestation={m.attestation} time={m.time} />
              </div>
            </div>
          ) : (
            <div key={m.id} className="animate-fadeUp self-end" style={{ maxWidth: 560 }}>
              <div
                className="px-4 py-[13px] text-[15px] leading-[1.5] text-white"
                style={{ background: "var(--accent)", borderRadius: "16px 4px 16px 16px" }}
              >
                {m.content}
              </div>
              <div className="mt-1.5 text-right font-mono text-[11px] text-muted">{m.time}</div>
            </div>
          )
        )}
        {typing && (
          <div className="flex items-center gap-3">
            <Orb hue={companion.hue} size={34} small breathe={false} />
            <div className="flex gap-[5px] border px-4 py-3.5" style={{ background: "var(--panel)", borderColor: "var(--line)", borderRadius: 16 }}>
              <Dot /> <Dot delay=".2s" /> <Dot delay=".4s" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-none border-t px-6 pb-[22px] pt-3.5" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
        <div className="mx-auto flex max-w-[840px] gap-2.5">
          <input
            className="field flex-1 rounded-full px-5 py-3.5 text-[15px]"
            type="text"
            placeholder={`Tell ${companion.name} something to remember…`}
            value={input}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <button className="btn flex-none px-6" onClick={onSend}>
            Send
          </button>
        </div>
        <div className="mt-[9px] text-center font-mono text-[11px] text-muted">
          Every turn runs inside a 0G Compute TEE · the provider can't read it
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="h-[7px] w-[7px] rounded-full animate-blink"
      style={{ background: "var(--muted)", animationDelay: delay }}
    />
  );
}
