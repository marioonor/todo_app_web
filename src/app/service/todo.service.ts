import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Todo } from '../models/todo.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private todoApiUrl = `${environment.apiUrl}/api/todos`;

  constructor(private http: HttpClient) { }

  getTodos(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.todoApiUrl).pipe(
      tap(todos => console.log('Fetched todos:', todos)),
      catchError(this.handleError)
    );
  }

  addTodo(todo: Omit<Todo, 'id'>): Observable<Todo> {
    return this.http.post<Todo>(this.todoApiUrl, todo).pipe(
      tap(newTodo => console.log('Added todo:', newTodo)),
      catchError(this.handleError)
    );
  }

  // New method to update a todo
  updateTodo(id: number, todo: Todo): Observable<Todo> {
    return this.http.put<Todo>(`${this.todoApiUrl}/${id}`, todo).pipe(
      tap(updatedTodo => console.log('Updated todo:', updatedTodo)),
      catchError(this.handleError)
    );
  }

  // New method to delete a todo
  deleteTodo(id: number): Observable<void> { // Backend might return void or the deleted todo
    return this.http.delete<void>(`${this.todoApiUrl}/${id}`).pipe(
      tap(() => console.log(`Deleted todo with id=${id}`)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      // The response body may contain clues as to what went wrong
      errorMessage = `Server returned code ${error.status}, error message is: ${error.message}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage += ` - ${error.error}`;
      } else if (error.error && error.error.message) {
        errorMessage += ` - ${error.error.message}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
