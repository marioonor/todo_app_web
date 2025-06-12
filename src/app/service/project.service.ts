import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Project } from '../models/project.models';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private projectApiUrl = `${environment.apiUrl}/api/projects`;

  constructor(private http: HttpClient) {}

  addproject(project: Omit<Project, 'id'>): Observable<Project> {
    return this.http.post<Project>(this.projectApiUrl, project).pipe(
      tap((newProject) => console.log('Added project:', newProject)),
      catchError(this.handleError)
    );
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.projectApiUrl).pipe(
      tap((projects) => console.log('Fetched projects:', projects)),
      catchError(this.handleError)
    );
  }

  updateProject(id: number, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.projectApiUrl}/${id}`, project).pipe(
      tap((updatedProject) => console.log('Updated project:', updatedProject)),
      catchError(this.handleError)
    );
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.projectApiUrl}/${id}`).pipe(
      tap(() => console.log(`Deleted project with id=${id}`)),
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
