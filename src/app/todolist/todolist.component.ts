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

@Component({
  selector: 'app-todolist',
  templateUrl: './todolist.component.html',
  styleUrls: ['./todolist.component.css'],
  imports: [CommonModule, FormsModule, DragDropModule],
})
export class TodolistComponent implements OnInit, OnDestroy {
  imagePath: string = 'assets/images/image.png';
  connectedLists: TodoStatus[] = [
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ];
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
  };

  todosByStatus: { [key in TodoStatus]: Todo[] } = {
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    CANCELLED: [],
  };

  editTodoData: Todo | null = null;

  userFirstName: string = 'Guest';
  private userAuthSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private todoService: TodoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTodos();
    this.userAuthSubscription = this.authService.currentUser.subscribe(
      (user) => {
        if (user && user.firstName) {
          this.userFirstName = user.firstName;
        } else {
          this.userFirstName = 'Guest';
        }
      }
    );

    this.organizeTodos();
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
        this.todos = data;
        this.isLoading = false;
        this.organizeTodos();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Could not load todos.';
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

  selectTodoForEdit(todo: Todo): void {
    this.editTodoData = {
      ...todo,
      dateStart: this.formatDateForInput(todo.dateStart),
      dateEnd: this.formatDateForInput(todo.dateEnd),
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
    return (
      {
        PENDING: 'bg-warning text-dark',
        IN_PROGRESS: 'bg-info text-white',
        COMPLETED: 'bg-success text-white',
        CANCELLED: 'bg-secondary text-white',
      }[status] || 'bg-light text-dark'
    );
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
