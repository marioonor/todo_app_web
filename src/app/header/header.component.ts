import { Component } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { TodoService } from '../service/todo.service';


@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  imagePath: string = 'assets/images/image.png';
  imageIconPath: string = 'assets/images/usericon.png';
  imageLogoutPath: string = 'assets/images/logout.png';
  userFirstName: string = "Angel's Burger Dashboard";

  constructor(
      private router: Router,
      private todoService: TodoService,
      private authService: AuthService
    ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['']);
  }
}
