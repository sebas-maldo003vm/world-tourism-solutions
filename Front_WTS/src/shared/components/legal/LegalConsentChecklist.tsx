import { ShieldCheck } from 'lucide-react';

export interface LegalConsentValue {
  termsAndDataProcessing: boolean;
  locationAuthorization: boolean;
}

export const INITIAL_LEGAL_CONSENT: LegalConsentValue = {
  termsAndDataProcessing: false,
  locationAuthorization: false,
};

export function isLegalConsentComplete(value: LegalConsentValue): boolean {
  return value.termsAndDataProcessing && value.locationAuthorization;
}

const CONSENT_ITEMS = [
  {
    key: 'termsAndDataProcessing',
    name: 'acceptTermsAndDataProcessing',
    label:
      'Acepto los Términos y Condiciones de la plataforma y el tratamiento de datos personales conforme a la Ley 1581 de 2012.',
  },
  {
    key: 'locationAuthorization',
    name: 'authorizeSessionLocation',
    label:
      'Autorizo el uso temporal de mi ubicación geográfica exclusivamente para el cálculo de proximidad y filtrado del catálogo turístico durante mi sesión activa.',
  },
] as const satisfies ReadonlyArray<{
  key: keyof LegalConsentValue;
  name: string;
  label: string;
}>;

const DATA_RETENTION_DISCLAIMER =
  'Los datos personales y los registros de ubicación se manejarán de forma segura y quedarán programados para su eliminación permanente dentro de los 30 días posteriores a la validación. Únicamente se conservarán métricas agregadas y anonimizadas.';

export interface LegalConsentChecklistProps {
  value: LegalConsentValue;
  onChange: (value: LegalConsentValue) => void;
  disabled?: boolean;
  idPrefix?: string;
}

export function LegalConsentChecklist({
  value,
  onChange,
  disabled = false,
  idPrefix = 'legal-consent',
}: LegalConsentChecklistProps) {
  const disclaimerId = `${idPrefix}-disclaimer`;

  return (
    <fieldset
      disabled={disabled}
      aria-describedby={disclaimerId}
      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <legend className="sr-only">Consentimiento y autorización de datos</legend>

      <p className="text-sm font-semibold text-slate-900" aria-hidden="true">
        Consentimiento y autorización de datos
      </p>

      <p className="text-xs leading-5 text-slate-600">
        Ambas autorizaciones son obligatorias para continuar.
      </p>

      <ul className="space-y-3">
        {CONSENT_ITEMS.map((item) => {
          const inputId = `${idPrefix}-${item.key}`;

          return (
            <li key={item.key}>
              <label
                htmlFor={inputId}
                className="flex items-start gap-3 text-sm leading-5 text-slate-800"
              >
                <input
                  id={inputId}
                  name={item.name}
                  type="checkbox"
                  required
                  checked={value[item.key]}
                  onChange={(event) => {
                    onChange({
                      ...value,
                      [item.key]: event.target.checked,
                    });
                  }}
                  className="mt-0.5 size-4 shrink-0 rounded border-slate-300 accent-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                />
                <span>{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <p
        id={disclaimerId}
        role="note"
        className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-slate-700"
      >
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
        <span>{DATA_RETENTION_DISCLAIMER}</span>
      </p>
    </fieldset>
  );
}
