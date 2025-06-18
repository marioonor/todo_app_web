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

  // addproject(project: Omit<Project, 'id'>): Observable<Project> {
  //   return this.http.post<Project>(this.projectApiUrl, project).pipe(
  addProject(project: Omit<Project, 'id'>): Observable<Project> {
    return this.http.post<Project>(this.projectApiUrl, project).pipe(
      tap((newProject) => console.log('Added project:', newProject)),
      catchError(this.handleError)
    );
  }

  // getProjects(): Observable<Project[]> {
  //   return this.http.get<Project[]>(this.projectApiUrl).pipe(
  //     tap((projects) => console.log('Fetched projects:', projects)),
  //     catchError(this.handleError)
  //   );
  // }

  getProjects(): Observable<Project[]> {
    return this.http
      .get<Project[]>(this.projectApiUrl)
      .pipe(catchError(this.handleError));
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
    const errorMessageDetail =
      error.error?.message || error.message || 'Server error';
    console.error(
      `Backend returned code ${error.status}, body was: ${JSON.stringify(
        error.error
      )}, message: ${errorMessageDetail}`
    );
    return throwError(
      () =>
        new Error(
          `Server returned code ${error.status}, error message is: ${errorMessageDetail}`
        )
    );
  }
}
