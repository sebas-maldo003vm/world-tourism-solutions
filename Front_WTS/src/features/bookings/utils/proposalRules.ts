export const PROPOSAL_QUOTAS = [
  { category: 'HOSPEDAJE', required: 1, label: 'Hospedaje' },
  { category: 'RESTAURANTE', required: 2, label: 'Restaurante' },
  { category: 'ACTIVIDAD', required: 2, label: 'Actividad' },
] as const;

export type ProposalBucket = (typeof PROPOSAL_QUOTAS)[number]['category'];

export function canonicalProposalCategory(category?: string | null): ProposalBucket | null {
  const value = (category ?? '').trim().toUpperCase();
  if (value === 'HOSPEDAJE' || value === 'ALOJAMIENTO') return 'HOSPEDAJE';
  if (value === 'RESTAURANTE' || value === 'RESTAURANTES') return 'RESTAURANTE';
  if (value === 'ACTIVIDAD' || value === 'ACTIVIDADES') return 'ACTIVIDAD';
  return null;
}

export function proposalShortageMessage(counts: Record<ProposalBucket, number>): string | null {
  const parts: string[] = [];
  for (const quota of PROPOSAL_QUOTAS) {
    const available = counts[quota.category] ?? 0;
    if (available < quota.required) {
      parts.push(
        `Falta la categoría ${quota.category}: se requieren ${quota.required} y hay ${available}.`,
      );
    }
  }
  if (parts.length === 0) return null;
  return `No se puede generar la propuesta. ${parts.join(' ')}`;
}
