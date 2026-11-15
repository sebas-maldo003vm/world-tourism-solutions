import { useState, type ReactNode } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Info, X } from 'lucide-react';

export const LEGAL_TEXT_VERSION = '1.0';

export type LegalUserRole = 'USER' | 'PROVIDER';

export interface LegalConsentValue {
  // Compatibilidad con el registro anterior
  termsAndDataProcessing: boolean;
  locationAuthorization: boolean;

  // Nuevas autorizaciones independientes
  termsAccepted?: boolean;
  dataProcessingAccepted?: boolean;
  adultConfirmed?: boolean;
  studyParticipationAccepted?: boolean;
  locationNoticeAcknowledged?: boolean;
}

export const INITIAL_LEGAL_CONSENT: LegalConsentValue = {
  termsAndDataProcessing: false,
  locationAuthorization: false,
  termsAccepted: false,
  dataProcessingAccepted: false,
  adultConfirmed: false,
  studyParticipationAccepted: false,
  locationNoticeAcknowledged: false,
};

export interface LegalAcceptanceEvidence {
  role: LegalUserRole;
  documentVersion: string;
  acceptedAt: string;
  checkbox: string;
  accepted: boolean;
}

export interface LegalConsentChecklistProps {
  value: LegalConsentValue;
  onChange: (value: LegalConsentValue) => void;
  disabled?: boolean;
  idPrefix?: string;

  // USER = turista, PROVIDER = proveedor
  role?: LegalUserRole;

  // Preparado para guardar evidencia en backend
  onEvidence?: (evidence: LegalAcceptanceEvidence) => void;
}

export function isLegalConsentComplete(
  value: LegalConsentValue,
  role: LegalUserRole = 'USER'
): boolean {
  return (
    value.termsAccepted === true &&
    value.dataProcessingAccepted === true &&
    value.adultConfirmed === true
  );
}

export function LegalConsentChecklist({
  value,
  onChange,
  disabled = false,
  idPrefix = 'legal-consent',
  role = 'USER',
  onEvidence,
}: LegalConsentChecklistProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const isProvider = role === 'PROVIDER';

  const recordChange = (
    key: keyof LegalConsentValue,
    checked: boolean
  ) => {
    const nextValue: LegalConsentValue = {
      ...value,
      [key]: checked,
    };

    // Mantener compatibilidad con la propiedad antigua.
    nextValue.termsAndDataProcessing =
      nextValue.termsAccepted === true &&
      nextValue.dataProcessingAccepted === true;

    // La ubicación ya no es una autorización obligatoria.
    nextValue.locationAuthorization = false;

    onChange(nextValue);

    // Evidencia preparada para persistencia en backend.
    onEvidence?.({
      role,
      documentVersion: LEGAL_TEXT_VERSION,
      acceptedAt: new Date().toISOString(),
      checkbox: key,
      accepted: checked,
    });
  };

  const Checkbox = ({
    id,
    name,
    checked,
    children,
    required = false,
  }: {
    id: string;
    name: keyof LegalConsentValue;
    checked: boolean;
    children: ReactNode;
    required?: boolean;
  }) => (
    <label
      htmlFor={id}
      className="flex items-start gap-3 text-sm leading-6 text-slate-800 cursor-pointer"
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        required={required}
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          recordChange(name, event.target.checked)
        }
        className="mt-1 size-4 shrink-0 accent-blue-600"
      />
      <span>{children}</span>
    </label>
  );

  return (
    <fieldset
      disabled={disabled}
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 relative"
    >
      <legend className="sr-only">
        Autorizaciones y consentimiento legal
      </legend>

      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">
            Autorizaciones y consentimiento
          </h3>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Versión del documento: {LEGAL_TEXT_VERSION}
        </p>
      </div>

      {/* A1 / A2: TÉRMINOS Y CONDICIONES */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">
          1. Términos y condiciones
        </h4>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <Checkbox
            id={`${idPrefix}-terms`}
            name="termsAccepted"
            checked={value.termsAccepted === true}
            required
          >
            He leído y acepto los Términos y Condiciones de la plataforma.
          </Checkbox>

          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="text-xs font-medium text-blue-600 hover:underline ml-7"
          >
            Ver términos completos
          </button>
        </div>
      </section>

      {/* MODAL DE TÉRMINOS Y CONDICIONES */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Términos y Condiciones de la Plataforma
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-6">
              <p>
                <strong>1. Objeto y Alcance.</strong> Esta plataforma web turística es un desarrollo de carácter académico enfocado en la validación de soluciones tecnológicas para el sector turismo en Colombia.
              </p>
              <p>
                <strong>2. Uso Adecuado.</strong> Los usuarios (tanto turistas como proveedores de servicios turísticos) se comprometen a utilizar la plataforma de manera lícita, respetuosa y conforme a las funcionalidades previstas, evitando cualquier uso fraudulento o malintencionado.
              </p>
              <p>
                <strong>3. Cuentas y Credenciales.</strong> El usuario es responsable de mantener la confidencialidad de su contraseña y de la información proporcionada durante su registro.
              </p>
              <p>
                <strong>4. Contenido de Proveedores.</strong> Los proveedores son responsables exclusivos de la veracidad, legalidad y actualización de la información comercial, tarifas y descripciones de los servicios que publican.
              </p>
              <p>
                <strong>5. Propiedad Intelectual.</strong> La estructura, diseño, código fuente y marca del sistema pertenecen al equipo de desarrollo del proyecto académico.
              </p>
            </div>

            <div className="border-t pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A1 / A2 / A3: TRATAMIENTO DE DATOS */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">
          2. Tratamiento de datos personales
        </h4>

        <Checkbox
          id={`${idPrefix}-data`}
          name="dataProcessingAccepted"
          checked={value.dataProcessingAccepted === true}
          required
        >
          Autorizo el tratamiento de mis datos personales conforme
          al aviso de privacidad y a la Ley 1581 de 2012.
        </Checkbox>

        <button
          type="button"
          onClick={() => setShowPrivacy(!showPrivacy)}
          aria-expanded={showPrivacy}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          Consultar aviso de privacidad
          {showPrivacy ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>

        {showPrivacy && (
          <div
            id={`${idPrefix}-privacy-notice`}
            className="max-h-[450px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 space-y-4"
          >
            <h4 className="font-bold text-slate-900">
              AVISO DE PRIVACIDAD Y PROTOCOLO DE TRATAMIENTO DE DATOS PERSONALES
            </h4>

            <p>
              <strong>1. Responsable del tratamiento.</strong> El tratamiento de la información se realiza en el marco de un proyecto académico desarrollado por los estudiantes bajo la orientación de la Fundación Universitaria Compensar.
            </p>

            <p>
              <strong>2. Finalidad del tratamiento.</strong> Los datos serán utilizados exclusivamente para actividades de validación académica, evaluación funcional y análisis del comportamiento de uso de la plataforma dentro del estudio.
            </p>

            <p>
              <strong>3. Datos recolectados.</strong> Se podrán recolectar datos de registro, nombre, correo electrónico, información del perfil, rol, eventos de búsqueda y reservas simuladas.
            </p>

            {isProvider ? (
              <p>
                <strong>4. Información de proveedores.</strong> El proveedor comprende que la información comercial que publique será visible públicamente en el catálogo de la plataforma.
              </p>
            ) : (
              <p>
                <strong>4. Información de turistas y ubicación.</strong> La ubicación del turista se utiliza únicamente para calcular proximidad y filtrar resultados cuando este concede permiso desde el navegador. Las coordenadas no se almacenan permanentemente en la plataforma.
              </p>
            )}

            <p>
              <strong>5. Derechos del titular.</strong> El titular podrá solicitar acceso, actualización, rectificación y supresión de sus datos personales conforme al procedimiento del proyecto.
            </p>

            <p className="text-xs text-slate-500">
              Documento: {LEGAL_TEXT_VERSION}.
            </p>
          </div>
        )}
      </section>

      {/* MAYORÍA DE EDAD */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">
          3. Declaración de mayoría de edad
        </h4>

        <Checkbox
          id={`${idPrefix}-adult`}
          name="adultConfirmed"
          checked={value.adultConfirmed === true}
          required
        >
          Declaro que soy mayor de 18 años y que cumplo
          el criterio de edad establecido para utilizar
          la plataforma y participar en el estudio.
        </Checkbox>
      </section>

      {/* A4: CONSENTIMIENTO INFORMADO */}
      <section className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-slate-900">
          4. Consentimiento informado para participar en el estudio académico
        </h4>

        <p className="text-sm leading-6 text-slate-700">
          Se le invita a participar voluntariamente en un estudio académico cuyo propósito es validar y evaluar el funcionamiento de la plataforma.
        </p>

        <Checkbox
          id={`${idPrefix}-study`}
          name="studyParticipationAccepted"
          checked={value.studyParticipationAccepted === true}
        >
          He leído la información anterior y acepto voluntariamente participar en el estudio académico.
        </Checkbox>
      </section>

      {/* UBICACIÓN */}
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">
              5. Información sobre ubicación
            </h4>
            <p className="text-sm leading-6 text-slate-700">
              {isProvider
                ? 'La plataforma no requiere acceso a la ubicación del proveedor mediante el navegador para completar el registro.'
                : 'La plataforma puede solicitar permiso de ubicación al navegador para calcular proximidad y filtrar el catálogo turístico. Este permiso es opcional.'}
            </p>
          </div>
        </div>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Las autorizaciones obligatorias son necesarias para completar el registro. La participación en el estudio y el acceso a la ubicación son independientes y voluntarios.
      </p>
    </fieldset>
  );
}