import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Userservice } from '../services/userservice';
import Swal from 'sweetalert2';

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
    isLoading = signal(false);
    showPassword = false;
    rememberMe = false;

    constructor(private userService: Userservice, private router: Router) {
        if (this.userService.isLoggedIn()) {
            this.router.navigate(['/dashboard']);
        }
    }

    onLogin() {
        this.isLoading.set(true);
        this.errorMessage = '';

        this.userService.login(this.loginData.userName, this.loginData.password).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.router.navigate(['/dashboard']);
                setTimeout(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Login success',
                        text: 'Welcome to the inventory management system',
                        confirmButtonColor: '#22c55e'
                    });
                }, 1000);
            },
            error: (err) => {
                this.isLoading.set(false);
                console.log("Error")
                this.errorMessage = err.error?.message || 'Invalid username or password.';
            }
        });
    }
}
