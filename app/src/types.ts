export interface Companion {
  name: string;
  essenceId: string;
  hue: number;
  tokenId: bigint;
  owner: string;
  bornAt: string;
}

export interface Msg {
  id: number;
  role: "user" | "assistant";
  content: string;
  time: string;
  tee?: boolean | null;
  attestation?: string;
}

export interface MemoryPoint {
  label: string;
  root: string;
  txHash: string;
  size: string; // e.g. "2.1 KB"
  at: number;
  genesis?: boolean;
}
