export interface RegistrationPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserResponse {
  id: number; 
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  expiresAt?: number; 
  tokenType?: string;
}