import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subtasks } from '../models/subtasks.model';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SubtasksService {
  private subtasksApiUrl = `${environment.apiUrl}/api/subtasks`;

  constructor(private http: HttpClient) {}

  addSubtask(subtasks: Omit<Subtasks, 'id'>): Observable<Subtasks> {
    return this.http.post<Subtasks>(this.subtasksApiUrl, subtasks).pipe(
      tap((newSubtasks) => console.log('Added subtasks:', newSubtasks)),
      catchError(this.handleError)
    );
  }

  getSubtasks(): Observable<Subtasks[]> {
    return this.http.get<Subtasks[]>(this.subtasksApiUrl).pipe(
      tap((subtasks) => console.log('Fetched subtasks:', subtasks)),
      catchError(this.handleError)
    );
  }

  updateSubtask(id: number, subtasks: Subtasks): Observable<Subtasks> {
    return this.http
      .put<Subtasks>(`${this.subtasksApiUrl}/${id}`, subtasks)
      .pipe(
        tap((updatedSubtasks) =>
          console.log('Updated subtasks:', updatedSubtasks)
        ),
        catchError(this.handleError)
      );
  }

  deleteSubtask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.subtasksApiUrl}/${id}`).pipe(
      tap(() => console.log(`Deleted subtasks with id: id=${id}`)),
      catchError(this.handleError)
    );
  }


  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
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
