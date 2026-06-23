/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZG_RPC?: string;
  readonly VITE_ZG_CHAIN_ID?: string;
  readonly VITE_INDEXER_RPC?: string;
  readonly VITE_AEON_CONTRACT?: string;
  readonly VITE_COMPUTE_PROVIDER?: string;
  readonly VITE_DEFAULT_MODEL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
