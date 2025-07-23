export interface Todo {
  id?: number; 
  title: string;
  description: string;
  status: TodoStatus;
  remarks?: string;
  dateStart: string | Date;
  dateEnd: string | Date;
  order?: number;
  dueDate: string | Date;
  priority: TodoPriority; 


  user?: { id: number; username?: string; role?: string }; 
  project?: { id: number; project?: string }; 

  userId?: number;
  projectId?: number;
}

export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TodoPriority = 'LOW' | 'NORMAL' | 'IMPORTANT' | 'CRITICAL'; 

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
  userId: number; 
  projectId: number; 
}
