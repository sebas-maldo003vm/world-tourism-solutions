/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_LOOKER_EMBED_URL?: string;
  readonly VITE_LOOKER_PERFORMANCE_URL?: string;
  readonly VITE_LOOKER_TOP_SERVICES_URL?: string;
  readonly VITE_LOOKER_BEHAVIOR_URL?: string;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.css';

declare module 'react-dom' {
  import type { ReactNode } from 'react';

  export function createPortal(
    children: ReactNode,
    container: Element | DocumentFragment,
  ): ReactNode;
}
