import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

export interface SupportTicketForm {
  subject: string;
  initialMessage: string;
}

interface SupportTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: SupportTicketForm) => Promise<void>;
  submitting?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  defaultSubject?: string;
  defaultMessage?: string;
}

export function SupportTicketModal({
  open,
  onOpenChange,
  onSubmit,
  submitting = false,
  title = 'Soporte',
  description = 'Describe tu solicitud y el equipo de soporte te responderá lo antes posible. Para dudas rápidas usa el asistente virtual (widget).',
  submitLabel = 'Enviar',
  defaultSubject = '',
  defaultMessage = '',
}: SupportTicketModalProps) {
  const [subject, setSubject] = useState(defaultSubject);
  const [initialMessage, setInitialMessage] = useState(defaultMessage);

  useEffect(() => {
    if (!open) return;
    setSubject(defaultSubject);
    setInitialMessage(defaultMessage);
  }, [open, defaultSubject, defaultMessage]);

  const canSubmit = subject.trim().length > 0 && initialMessage.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      subject: subject.trim(),
      initialMessage: initialMessage.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center sm:text-center">{title}</DialogTitle>
          <DialogDescription className="text-center sm:text-center">{description}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="support-subject">Asunto</Label>
            <Input
              id="support-subject"
              required
              maxLength={200}
              placeholder="Asunto del ticket"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-message">Descripción</Label>
            <Textarea
              id="support-message"
              required
              maxLength={2000}
              rows={5}
              placeholder="Describe tu solicitud..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              disabled={submitting}
              className="min-h-28"
            />
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600"
              disabled={!canSubmit}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
