import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TodolistComponent } from './todolist.component';
import { TodoService } from '../service/todo.service'; 

describe('TodolistComponent', () => {
  let component: TodolistComponent;
  let fixture: ComponentFixture<TodolistComponent>;
  let mockTodoService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    mockTodoService = jasmine.createSpyObj('TodoService', ['addTodo', 'getTodos']);

    await TestBed.configureTestingModule({
      imports: [
        TodolistComponent, 
        HttpClientTestingModule, 
        RouterTestingModule     
      ],
      providers: [
        { provide: TodoService, useValue: mockTodoService } 
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
