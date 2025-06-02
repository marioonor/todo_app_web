export interface Todo {
  id: number;
  title: string;
  description: string;
  status: TodoStatus;
  remarks?: string;
  dateStart: string | Date;
  dateEnd: string | Date;
  order?: number;  
}

export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
