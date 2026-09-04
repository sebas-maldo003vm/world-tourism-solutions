import { api } from '@/core/api/client';

export type UserRole = 'USER' | 'PROVIDER' | 'ADMIN' | 'SUPPORT' | 'BOT';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  profilePictureUrl?: string | null;
}

export interface UpdateProfilePayload {
  name: string;
  phoneNumber: string;
}

export interface ProfilePictureResponse {
  profilePictureUrl: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  getMyProfile: () => api.get<UserProfile>('/users/profile/me'),

  updateProfile: (payload: UpdateProfilePayload) =>
    api.put<UserProfile>('/users/profile', payload),

  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ProfilePictureResponse>('/users/profile/picture', formData);
  },

  changePassword: (data: ChangePasswordDTO) =>
    api.put<void>('/users/profile/password', data),
};
