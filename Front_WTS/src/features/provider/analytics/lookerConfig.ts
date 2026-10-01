/**
 * Configuración del embed maestro de Looker Studio.
 * Filtro por proveedor: Resource → Manage report URL parameters → `id_proveedor`
 * en cada fuente de datos (ds1, ds2, ds3).
 */

/** URL base del reporte corporativo (páginas Rendimiento y Embudo). */
export const DEFAULT_LOOKER_REPORT_URL =
  'https://datastudio.google.com/embed/reporting/3a4fd2fc-b0e2-4d10-95ad-9dcaf8280fd7/page/6fp9F';

/** Nombre del parámetro configurado en Looker Studio. */
export const LOOKER_PROVIDER_PARAM = 'id_proveedor';

/** Fuentes de datos del reporte que deben filtrarse por proveedor. */
export const LOOKER_DATASOURCE_IDS = ['ds1', 'ds2', 'ds3'] as const;

export interface LookerProviderFilter {
  userId: number;
  /** Override opcional de datasource IDs (por defecto ds1/ds2/ds3). */
  datasourceIds?: readonly string[];
}

/** Acepta solo http(s) para evitar esquemas inseguros vía .env. */
export function cleanEmbedUrl(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return undefined;
    }
    return trimmed;
  } catch {
    return undefined;
  }
}

/** Valida un id de datasource Looker (ej. ds0, ds1, ds_abc123). */
export function isValidLookerDatasourceId(value?: string | null): value is string {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return /^ds[\w.-]*$/i.test(trimmed);
}

/**
 * @deprecated Preferir LOOKER_DATASOURCE_IDS / readLookerDatasourceIds.
 * Conservado por compatibilidad con overrides legacy de una sola fuente.
 */
export function readLookerDatasourceId(
  override?: string | null,
): string | undefined {
  const value = (override ?? import.meta.env.VITE_LOOKER_DATASOURCE_ID)?.trim();
  if (!isValidLookerDatasourceId(value)) return undefined;
  return value;
}

/**
 * Lista de datasources a filtrar.
 * Por defecto: ds1, ds2, ds3. Override vía prop o `VITE_LOOKER_DATASOURCE_IDS` (csv).
 */
export function readLookerDatasourceIds(
  override?: readonly string[] | string | null,
): string[] {
  if (Array.isArray(override) && override.length > 0) {
    const cleaned = override.map((id) => id.trim()).filter(isValidLookerDatasourceId);
    if (cleaned.length > 0) return cleaned;
  }

  if (typeof override === 'string' && override.trim()) {
    const cleaned = override
      .split(',')
      .map((id) => id.trim())
      .filter(isValidLookerDatasourceId);
    if (cleaned.length > 0) return cleaned;
  }

  const fromEnv = (import.meta.env.VITE_LOOKER_DATASOURCE_IDS as string | undefined)?.trim();
  if (fromEnv) {
    const cleaned = fromEnv
      .split(',')
      .map((id: string) => id.trim())
      .filter(isValidLookerDatasourceId);
    if (cleaned.length > 0) return cleaned;
  }

  return [...LOOKER_DATASOURCE_IDS];
}

/**
 * URL base del reporte (override de props/.env o constante por defecto).
 */
export function readLookerReportBaseUrl(override?: string | null): string {
  return (
    cleanEmbedUrl(override) ??
    cleanEmbedUrl(import.meta.env.VITE_LOOKER_REPORT_URL) ??
    cleanEmbedUrl(import.meta.env.VITE_LOOKER_EMBED_URL) ??
    DEFAULT_LOOKER_REPORT_URL
  );
}

/**
 * Construye la URL del iframe con el filtro del proveedor en todas las fuentes.
 * Formato Looker:
 * ?params={"ds1.id_proveedor":N,"ds2.id_proveedor":N,"ds3.id_proveedor":N}
 */
export function buildLookerEmbedUrl(
  baseUrl: string | undefined,
  filter?: LookerProviderFilter | null,
): string | undefined {
  const cleaned = cleanEmbedUrl(baseUrl);
  if (!cleaned) return undefined;

  if (!filter) return cleaned;

  const userId = Number(filter.userId);
  if (!Number.isFinite(userId)) return cleaned;

  const datasourceIds = readLookerDatasourceIds(filter.datasourceIds);
  if (datasourceIds.length === 0) return cleaned;

  try {
    const url = new URL(cleaned);
    const paramsPayload: Record<string, number> = {};
    for (const datasourceId of datasourceIds) {
      paramsPayload[`${datasourceId}.${LOOKER_PROVIDER_PARAM}`] = userId;
    }
    // searchParams.set codifica el JSON una sola vez (requisito de Looker Studio).
    url.searchParams.set('params', JSON.stringify(paramsPayload));
    return url.toString();
  } catch {
    return cleaned;
  }
}

/**
 * Resuelve la URL final del reporte maestro filtrada por el proveedor autenticado.
 * Sin `userId` válido devuelve cadena vacía para no embeber el reporte sin filtro.
 */
export function resolveProviderLookerUrl(options?: {
  reportUrl?: string | null;
  datasourceIds?: readonly string[] | string | null;
  /** @deprecated Usar datasourceIds. */
  datasourceId?: string | null;
  userId?: number | null;
}): string {
  const userId =
    options?.userId == null ? NaN : Number(options.userId);

  if (!Number.isFinite(userId)) {
    return '';
  }

  const baseUrl = readLookerReportBaseUrl(options?.reportUrl);
  const datasourceIds = readLookerDatasourceIds(
    options?.datasourceIds ??
      (options?.datasourceId ? [options.datasourceId] : undefined),
  );

  return (
    buildLookerEmbedUrl(baseUrl, {
      userId,
      datasourceIds,
    }) ?? ''
  );
}
