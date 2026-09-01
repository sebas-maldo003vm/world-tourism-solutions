import type { NavigateFunction } from 'react-router-dom';
import { chatApi } from '@/features/chat/services/chatApi';

export async function contactProvider(
  navigate: NavigateFunction,
  providerUserId: number,
  serviceId?: number,
): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }

  try {
    const { data } = await chatApi.startConversation({
      providerId: providerUserId,
      serviceId,
    });
    navigate(`/chat?conversation=${data.id}`);
  } catch {
    navigate('/chat');
  }
}
