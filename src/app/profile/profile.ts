import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Userservice } from '../services/userservice';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css',
})
export class Profile implements OnInit {
    private userService = inject(Userservice);

    // User data
    user = signal<any>(null);
    isLoading = signal(true);
    isSaving = signal(false);

    // Edit form models
    form = {
        userName: '',
        phoneNumber: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    };

    // UI state
    showCurrentPw = false;
    showNewPw = false;
    showConfirmPw = false;
    activeTab = signal<'info' | 'password'>('info');

    ngOnInit(): void {
        this.loadProfile();
    }

    loadProfile() {
        this.isLoading.set(true);
        this.userService.getProfile().subscribe({
            next: (data) => {
                this.user.set(data);
                this.form.userName = data.userName;
                this.form.phoneNumber = data.phoneNumber;
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading profile:', err);
                this.isLoading.set(false);
                Swal.fire({ icon: 'error', title: 'Failed to load profile', text: err.error?.message || 'Could not load profile data.' });
            }
        });
    }

    saveInfo() {
        if (!this.form.userName.trim() || !this.form.phoneNumber.trim()) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Username and phone number are required.' });
            return;
        }

        this.isSaving.set(true);
        this.userService.updateProfile({
            userName: this.form.userName,
            phoneNumber: this.form.phoneNumber,
        }).subscribe({
            next: (res) => {
                this.user.set(res.user);
                this.isSaving.set(false);
                Swal.fire({ icon: 'success', title: 'Profile Updated!', timer: 1500, showConfirmButton: false });
            },
            error: (err) => {
                this.isSaving.set(false);
                Swal.fire({ icon: 'error', title: 'Update Failed', text: err.error?.message || 'Failed to update profile.' });
            }
        });
    }

    changePassword() {
        if (!this.form.currentPassword) {
            Swal.fire({ icon: 'warning', title: 'Required', text: 'Please enter your current password.' });
            return;
        }
        if (!this.form.newPassword || this.form.newPassword.length < 6) {
            Swal.fire({ icon: 'warning', title: 'Too Short', text: 'New password must be at least 6 characters.' });
            return;
        }
        if (this.form.newPassword !== this.form.confirmPassword) {
            Swal.fire({ icon: 'warning', title: 'Mismatch', text: 'New passwords do not match.' });
            return;
        }

        this.isSaving.set(true);
        this.userService.updateProfile({
            currentPassword: this.form.currentPassword,
            newPassword: this.form.newPassword,
        }).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.form.currentPassword = '';
                this.form.newPassword = '';
                this.form.confirmPassword = '';
                Swal.fire({ icon: 'success', title: 'Password Changed!', text: 'Your password has been updated successfully.', timer: 2000, showConfirmButton: false });
            },
            error: (err) => {
                this.isSaving.set(false);
                Swal.fire({ icon: 'error', title: 'Failed', text: err.error?.message || 'Could not change password.' });
            }
        });
    }

    getInitials(): string {
        const name = this.user()?.userName || '??';
        return name.slice(0, 2).toUpperCase();
    }

    getRoleBadgeClass(): string {
        return this.user()?.role === 'admin' ? 'badge-admin' : 'badge-staff';
    }
}
