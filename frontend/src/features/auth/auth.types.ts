export type AuthUser = {
  id: string;
  churchId: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
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
