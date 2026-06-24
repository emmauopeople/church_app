export type AuthUser = {
  id: string;
  churchId: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  lastLoginAt?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type CreateUserRequest = {
  fullName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
};

export type CreateUserResponse = {
  message: string;
  user: AuthUser;
};

export type ListUsersResponse = {
  data: AuthUser[];
};
