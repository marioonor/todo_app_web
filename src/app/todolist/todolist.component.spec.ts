import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms'; // Import FormsModule

import { TodolistComponent } from './todolist.component';
import { TodoService } from '../service/todo.service'; // Import TodoService

describe('TodolistComponent', () => {
  let component: TodolistComponent;
  let fixture: ComponentFixture<TodolistComponent>;
  let mockTodoService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    // Create a spy object for TodoService
    mockTodoService = jasmine.createSpyObj('TodoService', ['addTodo', 'getTodos']);

    await TestBed.configureTestingModule({
      imports: [
        TodolistComponent, // The component itself is standalone and imports FormsModule
        HttpClientTestingModule, // For dependencies of TodoService if not fully mocked
        RouterTestingModule      // For Router dependency
      ],
      providers: [
        { provide: TodoService, useValue: mockTodoService } // Provide the mock service
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TodolistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
