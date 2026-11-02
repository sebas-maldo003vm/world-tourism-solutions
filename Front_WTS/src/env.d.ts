/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** URL del reporte maestro de Looker Studio. */
  readonly VITE_LOOKER_REPORT_URL?: string;
  /** Alias legacy de VITE_LOOKER_REPORT_URL. */
  readonly VITE_LOOKER_EMBED_URL?: string;
  /**
   * IDs de datasource Looker a filtrar por id_proveedor (CSV).
   * Por defecto en código: ds1,ds2,ds3.
   */
  readonly VITE_LOOKER_DATASOURCE_IDS?: string;
  /** @deprecated Preferir VITE_LOOKER_DATASOURCE_IDS. */
  readonly VITE_LOOKER_DATASOURCE_ID?: string;
  /** URL pública del formulario de experiencia (Google Forms). */
  readonly VITE_FEEDBACK_FORM_URL?: string;
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
