import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { UserResponse } from '../models/auth.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  imagePath: string = 'assets/images/image.png';
  imageIconPath: string = 'assets/images/usericon.png';
  imageLogoutPath: string = 'assets/images/logout.png';
  userFirstName: string = 'User';
  private userAuthSubscription: Subscription | undefined;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.userAuthSubscription = this.authService.currentUser.subscribe(
      (user: UserResponse | null) => {
        if (user && user.username) {
          this.userFirstName = user.username;
        } else {
          this.userFirstName = 'User';
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.userAuthSubscription) {
      this.userAuthSubscription.unsubscribe();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['']);
  }
}
