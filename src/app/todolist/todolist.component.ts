import { SubtasksService } from './../service/subtasks.service';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core'; // Added HostListener
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
  CdkDragEnd,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { catchError, tap } from 'rxjs/operators'; // Added tap
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Project } from '../models/project.models';
import { ProjectService } from '../service/project.service';
import { Subtasks } from '../models/subtasks.model';

interface DraggableTodo extends Todo {
  isDraggable?: boolean;
}

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
  pendingSubtasksForNewTodo: { subtasks: string; completed: boolean }[] = [];

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  currentView: 'kanban' | 'simpleList' = 'kanban';

  todos: DraggableTodo[] = [];
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

  selectedProjectIdForNewTodo: number | null = null;

  currentYear: number = new Date().getFullYear();

  todosByStatus: { [key in TodoStatus]: DraggableTodo[] } = {
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    CANCELLED: [],
  };

  editTodoData: DraggableTodo | null = null;
  addTodoData: DraggableTodo | null = null;

  userFirstName: string = 'Admin';
  private userAuthSubscription: Subscription | undefined;

  searchText: string = '';

  quickStatusPopover = {
    visible: false,
    top: '0px',
    left: '0px',
    todoId: null as number | null, // To track which todo's popover is open
  };
  quickStatusPopoverHideTimer: any = null;

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

  @HostListener('document:click', ['$event'])
  onDocumentClickForQuickStatus(event: MouseEvent): void {
    if (this.quickStatusPopover.visible) {
      const popoverElement = document.querySelector('.status-options-popover');
      // Check if the click target is part of any move-status-handle
      const clickedOnAHandle = Array.from(
        document.querySelectorAll('.move-status-handle')
      ).some((handle) => handle.contains(event.target as Node));

      if (
        !clickedOnAHandle &&
        popoverElement &&
        !popoverElement.contains(event.target as Node)
      ) {
        this.closeQuickStatusPopover();
      }
    }
  }

  showQuickStatusOptions(todo: DraggableTodo, event: MouseEvent): void {
    event.stopPropagation(); // Prevent document click from closing immediately

    this.cancelHideQuickStatusPopoverTimer();

    // If already visible for this exact todo, do nothing further (it's already positioned)
    if (
      this.quickStatusPopover.todoId === todo.id &&
      this.quickStatusPopover.visible
    ) {
      return;
    }
    this.quickStatusPopover.todoId = todo.id!; // Assert todo.id is not null

    const handleElement = event.currentTarget as HTMLElement;
    const rect = handleElement.getBoundingClientRect();

    let topPosition = rect.bottom + window.scrollY + 2; // 2px gap below handle
    let leftPosition = rect.left + window.scrollX;

    this.quickStatusPopover.top = `${topPosition}px`;
    this.quickStatusPopover.left = `${leftPosition}px`;
    this.quickStatusPopover.visible = true;

    // Optional: Add boundary checks here after a brief timeout to allow rendering
    // This is a simplified version. For robust boundary checks, consider a library or more complex logic.
    setTimeout(() => {
      const popoverEl = document.querySelector('.status-options-popover');
      if (popoverEl) {
        const popoverRect = popoverEl.getBoundingClientRect();
        if (popoverRect.right > window.innerWidth) {
          this.quickStatusPopover.left = `${
            window.innerWidth - popoverRect.width - 10 + window.scrollX
          }px`;
        }
        if (
          popoverRect.bottom > window.innerHeight &&
          rect.top > popoverRect.height
        ) {
          // If not enough space below, and enough space above, show above
          this.quickStatusPopover.top = `${
            rect.top + window.scrollY - popoverRect.height - 2
          }px`;
        }
      }
    }, 0);
  }

  updateTodoStatusQuick(todo: DraggableTodo, newStatus: TodoStatus): void {
    if (!todo || todo.id === undefined) {
      // Check for undefined id as well
      console.error('Todo or Todo ID is undefined in updateTodoStatusQuick');
      this.closeQuickStatusPopover();
      return;
    }

    const originalStatus = todo.status;
    // Optimistically update UI
    // todo.status = newStatus; // This mutates the original object directly
    // this.organizeTodos(); // Re-organize immediately

    const todoToUpdate = { ...todo, status: newStatus };
    // Exclude isDraggable if it's only a UI property and not part of your backend Todo model
    const { isDraggable, ...todoDataForBackend } = todoToUpdate;
    const updatePayload: Todo = todoDataForBackend;

    this.todoService.updateTodo(todo.id, updatePayload).subscribe({
      next: () => {
        console.log('Todo status updated successfully via quick change');
        // Find the todo in the main list and update its status
        const indexInAllTodos = this.todos.findIndex((t) => t.id === todo.id);
        if (indexInAllTodos !== -1) {
          this.todos[indexInAllTodos].status = newStatus;
        }
        this.organizeTodos(); // Re-organize into status columns
        this.closeQuickStatusPopover();
      },
      error: (err) => {
        console.error('Failed to update todo status via quick change:', err);
        // Revert optimistic update on error
        const indexInAllTodos = this.todos.findIndex((t) => t.id === todo.id);
        if (indexInAllTodos !== -1) {
          this.todos[indexInAllTodos].status = originalStatus; // Revert
        }
        this.organizeTodos();
        alert(`Failed to update status: ${err.message || 'Server error'}`);
        this.closeQuickStatusPopover();
      },
    });
  }

  closeQuickStatusPopover(): void {
    this.quickStatusPopover.visible = false;
    this.quickStatusPopover.todoId = null;
    this.cancelHideQuickStatusPopoverTimer(); // Ensure timer is cleared
  }

  startHideQuickStatusPopoverTimer(todoIdToHide: number): void {
    this.cancelHideQuickStatusPopoverTimer(); // Clear any existing timer
    this.quickStatusPopoverHideTimer = setTimeout(() => {
      // Only hide if the popover for *this* item is still the one supposed to be visible
      if (this.quickStatusPopover.todoId === todoIdToHide) {
        this.closeQuickStatusPopover();
      }
    }, 300); // 300ms delay to allow moving mouse into popover
  }

  cancelHideQuickStatusPopoverTimer(): void {
    if (this.quickStatusPopoverHideTimer) {
      clearTimeout(this.quickStatusPopoverHideTimer);
      this.quickStatusPopoverHideTimer = null;
    }
  }

  filteredItems(status: string): DraggableTodo[] {
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
        this.todos = this.deduplicateTodos(data).map((t) => ({
          ...t,
          isDraggable: false,
        }));
        this.isLoading = false;
        this.organizeTodos();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Could not load todos.';
        this.isLoading = false;
      },
    });
  }

  deduplicateTodos(todos: Todo[]): DraggableTodo[] {
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
        this.errorMessage = err.message || 'Could not load subtasks.';
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
    console.log(
      'Selected Project ID at start of onAddTodo:',
      this.selectedProjectIdForNewTodo
    );
    if (addTodoForm && !addTodoForm.valid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser || !currentUser.id) {
      alert('User not authenticated or user ID is missing. Cannot add todo.');
      console.error(
        'User not authenticated or user ID is missing for adding todo.'
      );
      return;
    }

    if (this.selectedProjectIdForNewTodo === null) {
      alert('Please select a project for the new todo.');
      return;
    }

    const todoPayload: Omit<Todo, 'id'> = {
      ...this.newTodo,
      user: { id: currentUser.id },
      project: { id: this.selectedProjectIdForNewTodo },
    };

    this.todoService.addTodo(todoPayload).subscribe({
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
        this.selectedProjectIdForNewTodo = null;
        if (addTodoForm) {
          addTodoForm.resetForm({ status: 'PENDING' });
        }
        const addModalCloseButton = document.querySelector(
          '#addTodoModal .btn-close'
        ) as HTMLElement;
        if (this.pendingSubtasksForNewTodo.length > 0 && addedTodo.id) {
          this.savePendingSubtasks(addedTodo.id);
        } else {
          this.pendingSubtasksForNewTodo = []; // Clear if no subtasks or no ID
        }
        addModalCloseButton?.click();
      },
      error: (error) => {
        console.error('Failed to add todo:', error);
        alert(`Failed to add todo: ${error.message || 'Server error'}`);
        this.pendingSubtasksForNewTodo = [];
      },
    });
  }

  // newTask: string = '';
  newTaskForAddModal: string = '';
  newTaskForEditModal: string = '';
  subtasks: Subtasks[] = [];

  addTaskOnEnter(parentTodoId?: number, context: 'add' | 'edit' = 'edit') {
    const taskInput =
      context === 'add' ? this.newTaskForAddModal : this.newTaskForEditModal;
    const trimmedTask = taskInput.trim();
    console.log(
      'Attempting to add subtask:',
      trimmedTask,
      'for parentTodoId:',
      parentTodoId
    );

    if (context === 'add') {
      if (trimmedTask) {
        this.pendingSubtasksForNewTodo.push({
          subtasks: trimmedTask,
          completed: false,
        });
        this.newTaskForAddModal = '';
      } else {
        console.warn('Subtask for new Todo is empty!');
      }
      return; // Do not proceed to save to backend yet for 'add' context
    }

    // Logic for 'edit' context (parentTodoId should be present)
    if (!parentTodoId && context === 'edit') {
      console.error(
        'Cannot add subtask to existing Todo: Parent Todo ID is missing.'
      );
      return;
    }

    if (trimmedTask) {
      const newSubtask: Omit<Subtasks, 'id'> = {
        subtasks: trimmedTask,
        completed: false,
        todo: { id: parentTodoId! },
      };

      this.subtasksService.addSubtask(newSubtask).subscribe({
        next: (response) => {
          console.log('Task saved:', response);
          this.subtasks.push(response); // Consider refreshing subtasks for the specific todo
          if (context === 'edit') {
            this.newTaskForEditModal = '';
          }
        },
        error: (err) => console.error('Failed to add task:', err),
      });
    } else {
      console.warn('Task is empty!');
    }
  }

  private savePendingSubtasks(parentTodoId: number): void {
    const subtaskObservables = this.pendingSubtasksForNewTodo.map(
      (pendingSubtask: { subtasks: any; completed: any }) => {
        const newSubtaskPayload: Omit<Subtasks, 'id'> = {
          subtasks: pendingSubtask.subtasks,
          completed: pendingSubtask.completed,
          todo: { id: parentTodoId },
        };
        return this.subtasksService.addSubtask(newSubtaskPayload);
      }
    );

    forkJoin(subtaskObservables).subscribe({
      next: (savedSubtasks) => {
        console.log('All pending subtasks saved:', savedSubtasks);
        this.loadSubtasks(); // Or update local subtasks array more selectively
        this.pendingSubtasksForNewTodo = [];
      },
      error: (err) =>
        console.error('Failed to save one or more pending subtasks:', err),
    });
  }

  toggleComplete(subtask: Subtasks) {
    const updatedSubtask = { ...subtask, completed: !subtask.completed };
    this.subtasksService.updateSubtask(subtask.id, updatedSubtask).subscribe({
      next: () => (subtask.completed = !subtask.completed),
      error: (err) => console.error('Failed to update task:', err),
    });
  }

  togglePendingSubtaskComplete(subtask: {
    subtasks: string;
    completed: boolean;
  }): void {
    subtask.completed = !subtask.completed;
  }

  openAddTodoModal(): void {
    this.pendingSubtasksForNewTodo = []; // Clear pending subtasks when modal is opened
    this.newTaskForAddModal = '';
    this.selectedProjectIdForNewTodo = null;
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
  }

  selectTodoForEdit(todo: DraggableTodo): void {
    this.editTodoData = {
      ...todo,
      dateStart: this.formatDateForInput(todo.dateStart),
      dateEnd: this.formatDateForInput(todo.dateEnd),
      dueDate: this.formatDateForInput(todo.dueDate),
    };
    this.newTaskForEditModal = '';
  }

  getFilteredSubtasksForEdit(todoId: number | undefined): Subtasks[] {
    if (!todoId) {
      return [];
    }
    return this.subtasks.filter((s) => s.todo?.id === todoId);
  }

  private formatDateForInput(dateStr: string | Date | undefined): string {
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

    const { isDraggable, ...todoDataForBackend } = this.editTodoData;
    const updatePayload: Todo = todoDataForBackend;

    this.todoService.updateTodo(this.editTodoData.id, updatePayload).subscribe({
      next: () => {
        // updatedTodo parameter removed as it's not used
        alert('Todo item updated successfully!');
        if (editTodoForm) {
          editTodoForm.resetForm();
        }
        this.editTodoData = null;
        this.loadTodos();
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
        // The service now returns Observable<{ message: string }>
        next: (response) => {
          // response is { message: "..." }
          alert(response.message || 'Todo deleted successfully!');
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

  onDrop(event: CdkDragDrop<DraggableTodo[]>): void {
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
          this.organizeTodos(); // Re-organize after successful drop
        },
        error: (err) => {
          console.error('Failed to update todo or list orders:', err);
          this.loadTodos();
          alert('Failed to move task. Please refresh and try again.');
        },
      });
    }
  }

  private updateAndPersistOrder(list: DraggableTodo[]): Observable<any> {
    const updateObservables: Observable<DraggableTodo | null>[] = [];

    list.forEach((todo: DraggableTodo, index: number) => {
      if (todo.id !== undefined) {
        const { isDraggable, ...todoDataForBackend } = todo;
        const updatedTodoPayload: Todo = {
          ...todoDataForBackend,
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
    const newTodosByStatus: { [key in TodoStatus]: DraggableTodo[] } = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    // Ensure all connectedLists statuses are initialized in newTodosByStatus
    for (const statusKey of this.connectedLists) {
      if (!newTodosByStatus[statusKey]) {
        // This check might be redundant if all are pre-initialized
        newTodosByStatus[statusKey] = [];
      }
    }

    for (const todo of this.todos) {
      if (newTodosByStatus[todo.status]) {
        // Check if todo.status is a valid key
        newTodosByStatus[todo.status].push(todo);
      } else {
        console.warn(
          `Todo with id ${todo.id} has an unexpected status: ${todo.status}`
        );
      }
    }

    this.todosByStatus = newTodosByStatus;
  }

  getTodosByStatus(status: TodoStatus): DraggableTodo[] {
    return this.todosByStatus[status] || [];
  }

  editSubtask(subtask: Subtasks): void {
    const newSubtaskText = prompt(
      'Enter new text for the subtask:',
      subtask.subtasks
    );
    if (newSubtaskText !== null) {
      const trimmedText = newSubtaskText.trim();
      if (trimmedText && trimmedText !== subtask.subtasks) {
        const updatedSubtaskPayload: Subtasks = {
          ...subtask,
          subtasks: trimmedText,
        };
        this.subtasksService
          .updateSubtask(subtask.id, updatedSubtaskPayload)
          .subscribe({
            next: (updatedSubtaskFromServer) => {
              const index = this.subtasks.findIndex((s) => s.id === subtask.id);
              if (index !== -1) {
                this.subtasks[index] = updatedSubtaskFromServer;
              }
              alert('Subtask updated successfully!');
            },
            error: (err) => {
              console.error('Failed to update subtask:', err);
              alert(
                `Failed to update subtask: ${err.message || 'Server error'}`
              );
            },
          });
      }
    }
  }

  removePendingSubtask(index: number): void {
    if (confirm('Are you sure you want to remove this subtask?')) {
      if (index > -1 && index < this.pendingSubtasksForNewTodo.length) {
        this.pendingSubtasksForNewTodo.splice(index, 1);
      }
    }
  }

  editPendingSubtask(index: number): void {
    if (index > -1 && index < this.pendingSubtasksForNewTodo.length) {
      const currentSubtask = this.pendingSubtasksForNewTodo[index];
      const newSubtaskText = prompt('Edit subtask:', currentSubtask.subtasks);
      if (newSubtaskText !== null) {
        const trimmedText = newSubtaskText.trim();
        if (trimmedText) {
          this.pendingSubtasksForNewTodo[index].subtasks = trimmedText;
        }
      }
    }
  }

  deleteSubtask(subtaskId: number): void {
    if (confirm('Are you sure you want to delete this subtask?')) {
      this.subtasksService.deleteSubtask(subtaskId).subscribe({
        next: () => {
          this.subtasks = this.subtasks.filter((s) => s.id !== subtaskId);
        },
        error: (err) => {
          console.error('Failed to delete subtask:', err);
          alert(`Failed to delete subtask: ${err.message || 'Server error'}`);
        },
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-warning text-dark';
      case 'IN_PROGRESS':
        return 'bg-info text-dark'; // Changed text to dark for better contrast on info
      case 'COMPLETED':
        return 'bg-success text-white';
      case 'CANCELLED':
        return 'bg-secondary text-white';
      default:
        return 'bg-light text-dark';
    }
  }

  getPriorityClass(
    priority: 'LOW' | 'NORMAL' | 'IMPORTANT' | 'CRITICAL' | string
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

  Pending: string = 'assets/images/pending.png';
  InProgress: string = 'assets/images/inprogress.png';
  Completed: string = 'assets/images/completed.png';
  Cancelled: string = 'assets/images/cancelled.png';

  getStatusImages(status: string): string {
    switch (status) {
      case 'PENDING':
        return this.Pending;
      case 'IN_PROGRESS':
        return this.InProgress;
      case 'COMPLETED':
        return this.Completed;
      case 'CANCELLED':
        return this.Cancelled;
      default:
        return status
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
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
        return status
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  getStatusAccentColor(status: TodoStatus): string {
    switch (status) {
      case 'PENDING':
        return '#ffc107'; 
      case 'IN_PROGRESS':
        return '#0dcaf0'; 
      case 'COMPLETED':
        return '#198754'; 
      case 'CANCELLED':
        return '#6c757d';
      default:
        return '#6c757d'; 
    }
  }

  getStatusContrastColorForAccent(status: TodoStatus): string {
    switch (status) {
      case 'PENDING': 
      case 'IN_PROGRESS':
        return '#000'; 
      case 'COMPLETED': 
      case 'CANCELLED': 
        return '#fff'; 
      default:
        return '#fff';
    }
  }

  enableDrag(clickedTodo: DraggableTodo): void {
    this.todos.forEach((todo) => {
      if (todo !== clickedTodo) {
        todo.isDraggable = false;
      }
    });
    clickedTodo.isDraggable = true;
  }

  disableDragOnEnd(event: CdkDragEnd<DraggableTodo>): void {
    if (event.source.data) {
      event.source.data.isDraggable = false;
    }
  }
}
