import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { TodolistComponent } from './todolist/todolist.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/LoginGuard'; 

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent, canActivate: [LoginGuard] },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] }, 
  { path: 'register', component: RegisterComponent },
  {
    path: 'todo-list',
    component: TodolistComponent,
    canActivate: [AuthGuard] 
  },
  { path: '**', redirectTo: '/home' },
];