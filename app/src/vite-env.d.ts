/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZG_RPC?: string;
  readonly VITE_ZG_CHAIN_ID?: string;
  readonly VITE_EXPLORER?: string;
  readonly VITE_AEON_CONTRACT?: string;
  readonly VITE_API_BASE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
