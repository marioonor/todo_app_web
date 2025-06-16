import { SubtasksService } from './../service/subtasks.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TodoService } from '../service/todo.service';
import { Todo, TodoStatus } from '../models/todo.models';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth.service';
import { Subscription, forkJoin, of, Observable, concat } from 'rxjs';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { catchError } from 'rxjs/operators';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Project } from '../models/project.models';
import { ProjectService } from '../service/project.service';
import { Subtasks } from '../models/subtasks.model';

@Component({
  selector: 'app-todolist',
  templateUrl: './todolist.component.html',
  styleUrls: ['./todolist.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    HeaderComponent,
    SidebarComponent,
  ],
})
export class TodolistComponent implements OnInit, OnDestroy {
  imagePath: string = 'assets/images/image.png';
  imageAddTask: string = 'assets/images/addtask.png';
  edit: string = 'assets/images/edit.png';
  delete: string = 'assets/images/delete.png';
  add: string = 'assets/images/add.png';

  projects: Project[] = [];

  connectedLists: TodoStatus[] = [
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ];

  isCollapsed = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  currentView: 'kanban' | 'simpleList' = 'kanban';

  todos: Todo[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  newTodo: Omit<Todo, 'id'> = {
    title: '',
    description: '',
    status: 'PENDING',
    remarks: '',
    dateStart: '',
    dateEnd: '',
    dueDate: '',
    priority: 'LOW',
  };

  currentYear: number = new Date().getFullYear();

  todosByStatus: { [key in TodoStatus]: Todo[] } = {
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    CANCELLED: [],
  };

  editTodoData: Todo | null = null;
  addTodoData: Todo | null = null;

  userFirstName: string = 'Admin';
  private userAuthSubscription: Subscription | undefined;

  searchText: string = '';

  constructor(
    private router: Router,
    private todoService: TodoService,
    private authService: AuthService,
    private projectService: ProjectService,
    private subtasksService: SubtasksService
  ) {}

  ngOnInit(): void {
    this.loadTodos();
    this.loadProjects();
    this.loadSubtasks();

    this.userAuthSubscription = this.authService.currentUser.subscribe(
      (user) => {
        if (user && user.firstName) {
          this.userFirstName = user.firstName;
        } else {
          this.userFirstName = 'Admin';
        }
      }
    );
  }

  filteredItems(status: string): Todo[] {
    return this.todos.filter((todo) => {
      const matchesStatus = status === 'ALL' || todo.status === status;
      const search = this.searchText.trim().toLowerCase();
      const matchesSearch =
        todo.title.toLowerCase().includes(search) ||
        todo.description.toLowerCase().includes(search) ||
        todo.priority.toLowerCase().includes(search) ||
        todo.status.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }

  setView(view: 'kanban' | 'simpleList'): void {
    this.currentView = view;
  }

  ngOnDestroy(): void {
    if (this.userAuthSubscription) {
      this.userAuthSubscription.unsubscribe();
    }
  }

  loadTodos(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.todoService.getTodos().subscribe({
      next: (data) => {
        this.todos = this.deduplicateTodos(data);
        this.isLoading = false;
        this.organizeTodos();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Could not load todos.';
        this.isLoading = false;
      },
    });
  }

  deduplicateTodos(todos: Todo[]): Todo[] {
    return Array.from(new Map(todos.map((todo) => [todo.id, todo])).values());
  }

  loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Could not load projects.';
        this.isLoading = false;
      },
    });
  }

  loadSubtasks(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.subtasksService.getSubtasks().subscribe({
      next: (data) => {
        this.subtasks = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Could not load projects.';
        this.isLoading = false;
      },
    });
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  onAddTodo(addTodoForm?: NgForm): void {
    if (addTodoForm && !addTodoForm.valid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    this.todoService.addTodo(this.newTodo).subscribe({
      next: (addedTodo) => {
        alert('Todo item added successfully!');
        this.loadTodos();
        this.newTodo = {
          title: '',
          description: '',
          status: 'PENDING',
          remarks: '',
          dateStart: '',
          dateEnd: '',
          dueDate: '',
          priority: 'LOW',
        };
        if (addTodoForm) {
          addTodoForm.resetForm({ status: 'PENDING' });
        }
        const addModalCloseButton = document.querySelector(
          '#addTodoModal .btn-close'
        ) as HTMLElement;
        addModalCloseButton?.click();
      },
      error: (error) => {
        console.error('Failed to add todo:', error);
        alert(`Failed to add todo: ${error.message || 'Server error'}`);
      },
    });
  }

  newTask: string = '';
  subtasks: Subtasks[] = [];

  addTaskOnEnter() {
    const trimmedTask = this.newTask.trim();
    console.log('Attempting to add:', trimmedTask);

    if (trimmedTask) {
      const newSubtask: Omit<Subtasks, 'id'> = {
        subtasks: trimmedTask,
        completed: false,
      };

      this.subtasksService.addSubtask(newSubtask).subscribe({
        next: (response) => {
          console.log('Task saved:', response);
          this.subtasks.push(response);
          this.newTask = '';
        },
        error: (err) => console.error('Failed to add task:', err),
      });
    } else {
      console.warn('Task is empty!');
    }
  }

  toggleComplete(subtask: Subtasks) {
    const updatedSubtask = { ...subtask, completed: !subtask.completed };
    this.subtasksService.updateSubtask(subtask.id, updatedSubtask).subscribe({
      next: () => (subtask.completed = !subtask.completed),
      error: (err) => console.error('Failed to update task:', err),
    });
  }

  selectTodoForEdit(todo: Todo): void {
    this.editTodoData = {
      ...todo,
      dateStart: this.formatDateForInput(todo.dateStart),
      dateEnd: this.formatDateForInput(todo.dateEnd),
      dueDate: this.formatDateForInput(todo.dueDate),
    };
  }

  private formatDateForInput(dateStr: string | Date): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  onUpdateTodo(editTodoForm?: NgForm): void {
    if (!this.editTodoData || (editTodoForm && !editTodoForm.valid)) {
      alert('Please ensure all fields are correctly filled.');
      return;
    }

    if (!this.editTodoData.id) {
      alert('Cannot update todo without an ID.');
      return;
    }

    this.todoService
      .updateTodo(this.editTodoData.id, this.editTodoData)
      .subscribe({
        next: (updatedTodo) => {
          alert('Todo item updated successfully!');
          this.loadTodos();
          this.editTodoData = null;
          if (editTodoForm) {
            editTodoForm.resetForm();
          }

          const editModalCloseButton = document.querySelector(
            '#editTodoModal .btn-close'
          ) as HTMLElement;
          editModalCloseButton?.click();
        },
        error: (error) => {
          console.error('Failed to update todo:', error);
          alert(`Failed to update todo: ${error.message || 'Server error'}`);
        },
      });
  }

  deleteTodo(id: number): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this todo?')) {
      this.todoService.deleteTodo(id).subscribe({
        next: () => {
          alert('Todo deleted successfully!');
          this.loadTodos();
        },
        error: (err) => {
          console.error('Error deleting todo:', err);
          alert(`Failed to delete todo: ${err.message || 'Server error'}`);
        },
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['']);
  }

  onDrop(event: CdkDragDrop<Todo[]>): void {
    const previousContainerData = event.previousContainer.data;
    const currentContainerData = event.container.data;

    if (event.previousContainer === event.container) {
      moveItemInArray(
        currentContainerData,
        event.previousIndex,
        event.currentIndex
      );
      this.updateAndPersistOrder(currentContainerData).subscribe({
        next: () => console.log('Order updated for the list.'),
        error: (err) => {
          console.error('Failed to update list order:', err);
          this.loadTodos();
          alert('Failed to save new order. Please refresh and try again.');
        },
      });
    } else {
      const movedItem = previousContainerData[event.previousIndex];
      const newStatus = event.container.id as TodoStatus;

      transferArrayItem(
        previousContainerData,
        currentContainerData,
        event.previousIndex,
        event.currentIndex
      );

      movedItem.status = newStatus;

      const operations: Observable<any>[] = [
        this.updateAndPersistOrder(previousContainerData),
        this.updateAndPersistOrder(currentContainerData),
      ];

      forkJoin(operations).subscribe({
        next: () => {
          console.log(
            'Todo moved, and orders for both lists updated successfully.'
          );
        },
        error: (err) => {
          console.error('Failed to update todo or list orders:', err);
          this.loadTodos();
          alert('Failed to move task. Please refresh and try again.');
        },
      });
    }
  }

  private updateAndPersistOrder(list: Todo[]): Observable<any> {
    const updateObservables: Observable<Todo | null>[] = [];

    list.forEach((todo, index) => {
      if (todo.id !== undefined) {
        const updatedTodoPayload: Todo = {
          ...todo,
          order: index,
        };

        if (todo.order !== index) {
          todo.order = index;
        }
        updateObservables.push(
          this.todoService.updateTodo(todo.id, updatedTodoPayload).pipe(
            catchError((err) => {
              console.error(
                `Failed to update todo ${todo.id} with payload ${JSON.stringify(
                  updatedTodoPayload
                )}:`,
                err
              );
              throw err;
            })
          )
        );
      }
    });

    if (updateObservables.length === 0) {
      return of(null);
    }

    return forkJoin(updateObservables);
  }

  organizeTodos(): void {
    const newTodosByStatus: { [key in TodoStatus]: Todo[] } = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    for (const statusKey of this.connectedLists as TodoStatus[]) {
      if (newTodosByStatus.hasOwnProperty(statusKey)) {
        newTodosByStatus[statusKey] = this.todos
          .filter((todo) => todo.status === statusKey)
          .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
      }
    }
    this.todosByStatus = newTodosByStatus;
  }

  getTodosByStatus(status: TodoStatus): Todo[] {
    return this.todosByStatus[status] || [];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-warning text-dark';
      case 'IN_PROGRESS':
        return 'bg-info text-white';
      case 'COMPLETED':
        return 'bg-success text-white';
      case 'CANCELLED':
        return 'bg-secondary text-white';
      default:
        return 'bg-light text-dark';
    }
  }

  getPriorityClass(
    priority: 'LOW' | 'NORMAL' | 'IMPORTANT' | 'CRITICAL'
  ): string {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-danger text-white';
      case 'IMPORTANT':
        return 'bg-warning text-dark';
      case 'NORMAL':
        return 'bg-info text-dark';
      case 'LOW':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
