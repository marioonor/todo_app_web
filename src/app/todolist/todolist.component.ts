import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TodoService } from '../service/todo.service';
import { Todo } from '../models/todo.models';
import { FormsModule, NgForm } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-todolist',
  templateUrl: './todolist.component.html',
  styleUrls: ['./todolist.component.css'],
  imports: [CommonModule, FormsModule], 
})
export class TodolistComponent implements OnInit, OnDestroy {
  imagePath: string = 'assets/images/image.png';

  todos: Todo[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  newTodo: Omit<Todo, 'id'> = {
    title: '',
    description: '',
    status: 'PENDING', 
    remarks: '',
    dateStart: '',
    dateEnd: ''
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
    this.userAuthSubscription = this.authService.currentUser.subscribe(user => {
      if (user && user.firstName) {
        this.userFirstName = user.firstName;
      } else {
        this.userFirstName = 'Guest';
      }
    });
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
      },
      error: (err) => {
        this.errorMessage = err.message || 'Could not load todos.';
        this.isLoading = false;
      }
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
        this.loadTodos(); // Refresh list
        this.newTodo = { title: '', description: '', status: 'PENDING', remarks: '', dateStart: '', dateEnd: '' }; 
        if (addTodoForm) {
            addTodoForm.resetForm({ status: 'PENDING' }); 
        }
        const addModalCloseButton = document.querySelector('#addTodoModal .btn-close') as HTMLElement;
        addModalCloseButton?.click();

      },
      error: (error) => {
        console.error('Failed to add todo:', error);
        alert(`Failed to add todo: ${error.message || 'Server error'}`);
      }
    });
  }

  selectTodoForEdit(todo: Todo): void {
    this.editTodoData = {
        ...todo,
        dateStart: this.formatDateForInput(todo.dateStart),
        dateEnd: this.formatDateForInput(todo.dateEnd)
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

    this.todoService.updateTodo(this.editTodoData.id, this.editTodoData).subscribe({
      next: (updatedTodo) => {
        alert('Todo item updated successfully!');
        this.loadTodos(); 
        this.editTodoData = null; 
        if (editTodoForm) {
            editTodoForm.resetForm();
        }

        const editModalCloseButton = document.querySelector('#editTodoModal .btn-close') as HTMLElement;
        editModalCloseButton?.click();
      },
      error: (error) => {
        console.error('Failed to update todo:', error);
        alert(`Failed to update todo: ${error.message || 'Server error'}`);
      }
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
        }
      });
    }
  }

  signOut(): void {
    this.authService.logout();
  }
}
