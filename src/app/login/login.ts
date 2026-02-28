import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Userservice } from '../services/userservice';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    loginData = { userName: '', password: '' };
    errorMessage = '';
    isLoading = false;
    showPassword = false;
    rememberMe = false;

    constructor(private userService: Userservice, private router: Router) {
        if (this.userService.isLoggedIn()) {
            this.router.navigate(['/dashboard']);
        }
    }

    onLogin() {
        this.isLoading = true;
        this.errorMessage = '';

        this.userService.login(this.loginData.userName, this.loginData.password).subscribe({
            next: () => {
                this.isLoading = false;
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Invalid username or password.';
            }
        });
    }
}
