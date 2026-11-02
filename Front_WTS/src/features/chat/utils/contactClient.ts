import type { NavigateFunction } from 'react-router-dom';
import { chatApi } from '@/features/chat/services/chatApi';

/** Inicia o recupera chat con un cliente (AppUser.id) desde el panel del proveedor. */
export async function contactClient(
  navigate: NavigateFunction,
  clientUserId: number,
  providerProfileId?: number | null,
): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }

  try {
    const { data } = await chatApi.startClientConversation({
      clientUserId,
      providerProfileId: providerProfileId ?? undefined,
    });
    navigate(`/chat?conversation=${data.id}`, { state: { conversation: data } });
  } catch {
    navigate('/chat');
  }
}
