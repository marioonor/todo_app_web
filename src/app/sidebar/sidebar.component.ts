import { NgForm, FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { Todo, } from '../models/todo.models';
import { CommonModule } from '@angular/common';
import {
  DragDropModule,
} from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  imageAddTask: string = 'assets/images/addtask.png';
  createProject: string = 'assets/images/createproject.png';
  allTasks: string = 'assets/images/alltask.png';
  allProjects: string = 'assets/images/allprojects.png';

  onAddTodo(addTodoForm?: NgForm): void {
    if (addTodoForm && !addTodoForm.valid) {
      alert('Please fill all required fields correctly.');
      return;
    }
  }

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
}
