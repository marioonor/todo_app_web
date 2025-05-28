export interface Todo {
  id?: number; // Optional: will be assigned by the backend
  title: string;
  description: string;
  status: string; // e.g., 'PENDING', 'IN_PROGRESS', 'COMPLETED'
  remarks?: string; // Optional
  dateStart: string; // Consider using Date type if you handle conversion
  dateEnd: string;   // Consider using Date type if you handle conversion
  // If your backend expects a user association, you might add userId here
}