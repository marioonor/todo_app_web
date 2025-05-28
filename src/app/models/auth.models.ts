export interface RegistrationPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserResponse {
  id: number; // Or string, depending on your backend ID type
  username: string;
  email: string;
  firstName: string;
  lastName: string;

  token: string;
  // Note: Avoid returning sensitive data like passwords, even hashed, if not needed by the client.
  // The current backend returns the full Users entity, so this matches.
}