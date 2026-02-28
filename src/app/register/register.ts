import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Userservice } from '../services/userservice';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class Register {
    registerData = {
        userName: '',
        password: '',
        confirmPassword: '',
        phoneNumber: ''
    };
    errorMessage = '';
    isLoading = false;

    constructor(private userService: Userservice, private router: Router) {
        // If already logged in, redirect to dashboard
        if (this.userService.isLoggedIn()) {
            this.router.navigate(['/dashboard']);
        }
    }

    onRegister() {
        if (this.registerData.password !== this.registerData.confirmPassword) {
            this.errorMessage = 'Passwords do not match.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.userService.register(
            this.registerData.userName,
            this.registerData.password,
            'staff', // Or whatever default role is expected
            this.registerData.phoneNumber
        ).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.router.navigate(['/dashboard']); // or to /login depending on flow
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
            }
        });
    }
}
