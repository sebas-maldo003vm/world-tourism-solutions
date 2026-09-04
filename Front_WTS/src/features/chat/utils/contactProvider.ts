import type { NavigateFunction } from 'react-router-dom';
import { chatApi } from '@/features/chat/services/chatApi';

/** Inicia chat con un negocio (ProviderProfile.id). */
export async function contactProvider(
  navigate: NavigateFunction,
  providerProfileId: number,
): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }

  try {
    const { data } = await chatApi.startConversation({
      providerProfileId,
    });
    navigate(`/chat?conversation=${data.id}`);
  } catch {
    navigate('/chat');
  }
}
