export interface Subtasks {
  id: number;
  subtasks: string;
  completed: boolean;
  todo?: { id: number }; 
}
