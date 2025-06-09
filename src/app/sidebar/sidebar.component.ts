import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  imageAddTask: string = 'assets/images/addtask.png';
  createProject: string = 'assets/images/createproject.png';
  allTasks: string = 'assets/images/alltask.png';
  allProjects: string = 'assets/images/allprojects.png';
}
