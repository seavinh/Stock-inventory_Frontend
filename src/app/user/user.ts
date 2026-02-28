import { Component, inject, OnInit, signal } from '@angular/core';
import { Userservice } from '../services/userservice';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface UserData {
  _id?: string;
  userName: string;
  password?: string;
  phoneNumber: string;
  role: string;
}

@Component({
  selector: 'app-user',
  imports: [RouterModule, FormsModule],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User implements OnInit {
  userservice = inject(Userservice);
  userList = signal<UserData[]>([]);
  filteredUsers = signal<UserData[]>([]);

  // Form signals
  showAddForm = signal<boolean>(false);
  newUserName = signal<string>('');
  newPassword = signal<string>('');
  newPhoneNumber = signal<string>('');
  newRole = signal<string>('staff');

  // Edit mode signals
  editMode = signal<boolean>(false);
  editingUserId = signal<string | null>(null);

  ngOnInit(): void {
    this.getAllUsers();
  }

  getAllUsers() {
    this.userservice.getAllUser().subscribe({
      next: (response: UserData[]) => {
        this.userList.set(response);
        this.filteredUsers.set(response);
        console.log('Users loaded:', response);
      },
      error: (err: any) => {
        console.error('Error fetching users:', err);
        Swal.fire({
          icon: 'error',
          title: 'Connection Failed',
          text: 'Failed to load users. Please make sure the backend server is running.',
        });
      }
    });
  }

  // Toggle add form visibility
  toggleAddForm() {
    this.showAddForm.set(!this.showAddForm());
    if (!this.showAddForm()) {
      this.resetForm();
    }
  }

  // Search functionality
  searchUsers(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    const filtered = this.userList().filter(user =>
      user.userName.toLowerCase().includes(searchTerm) ||
      user.phoneNumber.toLowerCase().includes(searchTerm) ||
      user.role.toLowerCase().includes(searchTerm)
    );
    this.filteredUsers.set(filtered);
  }

  // Create or update user
  saveUser() {
    const userName = this.newUserName().trim();
    const password = this.newPassword().trim();
    const phoneNumber = this.newPhoneNumber().trim();
    const role = this.newRole();

    if (!userName) {
      Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter a username' });
      return;
    }

    if (!this.editMode() && !password) {
      Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter a password' });
      return;
    }

    if (!phoneNumber) {
      Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter a phone number' });
      return;
    }

    const userData: any = {
      userName,
      phoneNumber,
      role,
    };

    // Only include password if provided
    if (password) {
      userData.password = password;
    }

    if (this.editMode() && this.editingUserId()) {
      this.updateUser(userData);
    } else {
      this.createUser(userData);
    }
  }

  // Create new user
  createUser(user: UserData) {
    this.userservice.createdUser(user).subscribe({
      next: (response: any) => {
        console.log('User created:', response);
        Swal.fire({
          title: '✅ បន្ថែមអ្នកប្រើប្រាស់បានជោគជ័យ!',
          icon: 'success',
          draggable: true
        });
        this.resetForm();
        this.showAddForm.set(false);
        this.getAllUsers();
      },
      error: (err: any) => {
        console.error('Error creating user:', err);
        Swal.fire({
          icon: 'error',
          title: 'មានបញ្ហាក្នុងការបន្ថែមអ្នកប្រើប្រាស់',
          text: err.error?.message || 'Failed to create user. Please try again.',
        });
      }
    });
  }

  // Edit user - populate form with existing data
  editUser(index: number) {
    const user = this.filteredUsers()[index];

    if (!user._id) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Cannot edit: User ID is missing' });
      return;
    }

    this.newUserName.set(user.userName);
    this.newPassword.set(''); // Don't populate password for security
    this.newPhoneNumber.set(user.phoneNumber);
    this.newRole.set(user.role);
    this.editMode.set(true);
    this.editingUserId.set(user._id);
    this.showAddForm.set(true);
  }

  // Update user
  updateUser(user: UserData) {
    const id = this.editingUserId();

    if (!id) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No user selected for update' });
      return;
    }

    this.userservice.updateUser(id, user).subscribe({
      next: (response: any) => {
        console.log('User updated:', response);
        Swal.fire({
          title: '✅ កែប្រែអ្នកប្រើប្រាស់បានជោគជ័យ!',
          icon: 'success',
          draggable: true
        });
        this.resetForm();
        this.showAddForm.set(false);
        this.getAllUsers();
      },
      error: (err: any) => {
        console.error('Error updating user:', err);
        Swal.fire({
          icon: 'error',
          title: 'មានបញ្ហាក្នុងការកែប្រែអ្នកប្រើប្រាស់',
          text: err.error?.message || 'Failed to update user. Please try again.',
        });
      }
    });
  }

  // Delete user
  deleteUser(index: number) {
    const user = this.filteredUsers()[index];

    if (!user._id) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Cannot delete: User ID is missing' });
      return;
    }

    Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: `លុប "${user.userName}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'បាទ, លុបចោល!',
      cancelButtonText: 'បោះបង់'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userservice.deleteUser(user._id!).subscribe({
          next: (response: any) => {
            console.log('User deleted:', response);
            Swal.fire({
              title: '✅ លុបអ្នកប្រើប្រាស់បានជោគជ័យ!',
              icon: 'success',
              draggable: true
            });
            this.getAllUsers();
          },
          error: (err: any) => {
            console.error('Error deleting user:', err);
            Swal.fire({
              icon: 'error',
              title: 'មានបញ្ហាក្នុងការលុបអ្នកប្រើប្រាស់',
              text: err.error?.message || 'Failed to delete user. Please try again.',
            });
          }
        });
      }
    });
  }

  // Cancel and reset form
  cancelForm() {
    this.showAddForm.set(false);
    this.resetForm();
  }

  // Reset form fields
  resetForm() {
    this.newUserName.set('');
    this.newPassword.set('');
    this.newPhoneNumber.set('');
    this.newRole.set('staff');
    this.editMode.set(false);
    this.editingUserId.set(null);
  }
}
