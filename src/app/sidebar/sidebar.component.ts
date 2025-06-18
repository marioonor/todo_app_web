import { ProjectService } from './../service/project.service';
import { NgForm, FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Project } from '../models/project.models';
import { AuthService } from '../service/auth.service';

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

  projects: Project[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  newProjectName: string = '';

  constructor(
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  isCollapsed = false;
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  selectedProject: string | null = null;
  selectProject(project: string) {
    this.selectedProject = project;
  }

  onAddProject(addProjectForm?: NgForm): void {
    const trimmedProjectName = this.newProjectName.trim();

    if (!trimmedProjectName) {
      alert('Project name cannot be empty.');
      return;
    }

    if (addProjectForm && addProjectForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser || !currentUser.id) {
      alert(
        'User not authenticated or user ID is missing. Cannot add project.'
      );
      console.error('User not authenticated or user ID is missing.');
      return;
    }

    const projectPayload: Omit<Project, 'id'> = {
      project: trimmedProjectName,
      user: { id: currentUser.id },
    };

    this.projectService.addProject(projectPayload).subscribe({
      next: (addedProject) => {
        alert('Project added successfully!');
        this.loadProjects();
        this.newProjectName = ''; // Reset form field
        if (addProjectForm) {
          addProjectForm.resetForm();
        }
        const addModalCloseButton = document.querySelector(
          '#addProjectModal .btn-close'
        ) as HTMLElement;
        addModalCloseButton?.click();
      },
      error: (error) => {
        console.error('Failed to add project:', error);
        alert(`Failed to add project: ${error.message || 'Server error'}`);
      },
    });
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
        this.errorMessage = err.message || 'Could not load projects.';
        this.isLoading = false;
      },
    });
  }
}
