import { ProjectService } from './../service/project.service';
import { NgForm, FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Project } from '../models/project.models';

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

  constructor(private projectService: ProjectService) {}

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
    if (addProjectForm && !addProjectForm.valid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    this.projectService.addproject(this.newProject).subscribe({
      next: (addedProject) => {
        alert('Project added successfully!');
        this.loadProjects();
        this.newProject = {
          project: '',
          // task_id: 0,
        };
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

  newProject: Omit<Project, 'id'> = {
    project: '',
    // task_id: 0,
  };

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
      }
    });
  }
}
