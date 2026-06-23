import { Sidebar } from "../components/Sidebar";
import { Chat } from "../components/Chat";
import { MemoryView } from "../components/MemoryView";
import { TransferView } from "../components/TransferView";
import { Sealed } from "./Sealed";
import { essenceById } from "../data/essences";
import type { Companion, Msg, MemoryPoint } from "../types";

type Tab = "chat" | "memory" | "transfer";

const TABS: { id: Tab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "memory", label: "Memory" },
  { id: "transfer", label: "Transfer" },
];

export function CompanionApp(props: {
  companion: Companion;
  owned: boolean;
  tab: Tab;
  onTab: (t: Tab) => void;
  messages: Msg[];
  typing: boolean;
  input: string;
  onInput: (v: string) => void;
  onSend: () => void;
  memory: MemoryPoint[];
  sizeKB: number;
  sealing: boolean;
  onTransfer: (to: string) => void;
  transferTx: string;
  onMintNew: () => void;
}) {
  const { companion, owned, tab } = props;
  const essenceTag = essenceById(companion.essenceId).tag;
  const sealedRoot = props.memory.length ? props.memory[props.memory.length - 1].root : "";

  return (
    <main className="flex min-h-0 flex-1 items-stretch overflow-hidden">
      <Sidebar
        companion={companion}
        essenceTag={essenceTag}
        owned={owned}
        memory={props.memory}
        sizeKB={props.sizeKB}
      />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {owned ? (
          <>
            <div className="flex flex-none gap-1 border-b px-6 pt-3.5" style={{ borderColor: "var(--line)" }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => props.onTab(t.id)}
                  className="-mb-px border-b-2 px-4 py-[11px] text-sm font-semibold transition"
                  style={{
                    color: tab === t.id ? "var(--ink)" : "var(--muted)",
                    borderColor: tab === t.id ? "var(--accent)" : "transparent",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "chat" && (
              <Chat
                companion={companion}
                messages={props.messages}
                typing={props.typing}
                input={props.input}
                onInput={props.onInput}
                onSend={props.onSend}
              />
            )}
            {tab === "memory" && <MemoryView memory={props.memory} />}
            {tab === "transfer" && (
              <TransferView companion={companion} sealing={props.sealing} onTransfer={props.onTransfer} />
            )}
          </>
        ) : (
          <Sealed
            companion={companion}
            memoryCount={props.memory.length}
            sealedRoot={sealedRoot}
            transferTx={props.transferTx}
            onMintNew={props.onMintNew}
          />
        )}
      </section>
    </main>
  );
}
