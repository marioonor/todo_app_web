export interface Todo {
  id?: number; // Make id optional for new todos
  title: string;
  description: string;
  status: TodoStatus;
  remarks?: string;
  dateStart: string | Date;
  dateEnd: string | Date;
  order?: number;
  dueDate: string | Date;
  priority: TodoPriority; // Use the defined TodoPriority type

  // These fields are for data received from the backend (GET responses)
  user?: { id: number; username?: string; role?: string }; // Include username/role for completeness if backend sends it
  project?: { id: number; project?: string }; // Include project name for completeness if backend sends it

  // These fields are for data sent to the backend (POST/PUT requests)
  // They are optional because they might not always be present or required in all contexts
  userId?: number;
  projectId?: number;
}

export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TodoPriority = 'LOW' | 'NORMAL' | 'IMPORTANT' | 'CRITICAL'; // Ensure this matches your backend enum

// This interface defines the structure for data sent to the backend (POST/PUT requests)
// It should directly match your Spring Boot TodoRequest DTO
export interface TodoPayload {
  title: string;
  description: string;
  status: TodoStatus;
  remarks?: string;
  dateStart: string | Date;
  dateEnd: string | Date;
  dueDate?: string | Date;
  priority: TodoPriority;
  order?: number;
  userId: number; // Required for creating/updating a todo
  projectId: number; // Required for creating/updating a todo
}
