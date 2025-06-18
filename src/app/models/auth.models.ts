export interface RegistrationPayload {
  id: number; 
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserResponse {
  id: number; 
  username: string;
  // email: string;
  // firstName: string;
  // lastName: string;
  token: string;
  expiresAt?: number; 
  tokenType?: string;
  email?: string;      // Mark as optional or remove
  firstName?: string;  // Mark as optional or remove
  lastName?: string;   // Mark as optional or remove
  role?: string; 
}