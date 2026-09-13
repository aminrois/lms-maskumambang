import { restClient, functionClient } from '../axios';
import * as Types from '../../../types/database';

// USER (PostgREST)
export const getUsers = async (params?: Record<string, any>): Promise<Types.USER[]> => {
  const response = await restClient.get<Types.USER[]>('/user', { params });
  return response.data;
};

export const getUserById = async (id: string): Promise<Types.USER> => {
  const response = await restClient.get<Types.USER[]>(`/user?user_id=eq.${id}`);
  return response.data[0];
};

export const createUser = async (payload: Types.USER_CREATE): Promise<Types.USER> => {
  const response = await restClient.post<Types.USER[]>('/user', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updateUser = async (id: string, payload: Types.USER_UPDATE): Promise<Types.USER> => {
  const response = await restClient.patch<Types.USER[]>(`/user?user_id=eq.${id}`, payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deleteUser = async (id: string): Promise<void> => {
  await restClient.delete(`/user?user_id=eq.${id}`);
};

// ROLE (Read-Only — swagger hanya mendefinisikan GET)
export const getRoles = async (params?: Record<string, any>): Promise<Types.ROLE[]> => {
  const response = await restClient.get<Types.ROLE[]>('/role', { params });
  return response.data;
};

export const getRoleById = async (id: string | number): Promise<Types.ROLE> => {
  const response = await restClient.get<Types.ROLE[]>(`/role?role_id=eq.${id}`);
  return response.data[0];
};

// USER_ROLE CRUD
export const getUserRoles = async (params?: Record<string, any>): Promise<Types.USER_ROLE[]> => {
  const response = await restClient.get<Types.USER_ROLE[]>('/user_role', { params });
  return response.data;
};

export const getUserRoleById = async (id: string | number): Promise<Types.USER_ROLE> => {
  const response = await restClient.get<Types.USER_ROLE[]>(`/user_role?user_role_id=eq.${id}`);
  return response.data[0];
};

export const createUserRole = async (payload: Types.USER_ROLE_CREATE): Promise<Types.USER_ROLE> => {
  const response = await restClient.post<Types.USER_ROLE[]>('/user_role', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updateUserRole = async (id: string | number, payload: Types.USER_ROLE_UPDATE): Promise<Types.USER_ROLE> => {
  const response = await restClient.patch<Types.USER_ROLE[]>(`/user_role?user_role_id=eq.${id}`, payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deleteUserRole = async (id: string | number): Promise<void> => {
  await restClient.delete(`/user_role?user_role_id=eq.${id}`);
};

// Edge Functions — User Management (via functionClient)
export const createUserAuth = async (payload: { email: string; password: string; username: string }) => {
  const response = await functionClient.post('/create_user', payload);
  return response.data;
};

export const updateUserAuth = async (payload: { user_id: string; email?: string; password?: string; username?: string }) => {
  const response = await functionClient.post('/update_user', payload);
  return response.data;
};

export const deleteUserAuth = async (userId: string) => {
  const response = await functionClient.post('/delete_user', { user_id: userId });
  return response.data;
};
