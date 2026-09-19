/**
 * Servicio de perfil (Feature-first).
 * Reexporta la API de perfil y expone changePassword de forma explícita.
 */
import { api } from '@/core/api/client';
import { uploadFile } from '@/core/storage/supabaseStorage.service';
import {
  profileApi,
  type ChangePasswordDTO,
  type ProfilePictureResponse,
  type UpdateProfilePayload,
  type UserProfile,
  type UserRole,
} from './profileApi';

export type {
  ChangePasswordDTO,
  ProfilePictureResponse,
  UpdateProfilePayload,
  UserProfile,
  UserRole,
};

export function changePassword(data: ChangePasswordDTO) {
  return api.put<void>('/users/profile/password', data);
}

export async function uploadProfilePicture(file: File) {
  const profilePictureUrl = await uploadFile(file, 'user-avatars');
  return profileApi.updateProfilePictureUrl(profilePictureUrl);
}

export const profileService = {
  ...profileApi,
  changePassword,
  uploadProfilePicture,
};
