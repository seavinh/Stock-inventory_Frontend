import { Component, inject, OnInit, signal } from '@angular/core';
import { Categoryservice } from '../services/categoryservice';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';


interface data {
  _id?: string;
  categoryName: string;
  description?: string;
}

@Component({
  selector: 'app-category',
  imports: [RouterModule, FormsModule],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category implements OnInit {
  categoryservice = inject(Categoryservice);
  categoryList = signal<data[]>([]);
  filteredCategories = signal<data[]>([]);

  // Form signals
  showAddForm = signal<boolean>(false);
  newCategoryName = signal<string>('');
  newCategoryDescription = signal<string>('');

  // Edit mode signals
  editMode = signal<boolean>(false);
  editingCategoryId = signal<string | null>(null);

  ngOnInit(): void {
    this.getAllCategories();
  }

  getAllCategories() {
    this.categoryservice.getCategories().subscribe({
      next: (response: data[]) => {
        this.categoryList.set(response);
        this.filteredCategories.set(response);
        console.log('Categories loaded:', response);
      },
      error: (err: any) => {
        console.error('Error fetching categories:', err);
        Swal.fire({
          icon: 'error',
          title: 'Connection Failed',
          text: 'Failed to load categories. Please make sure the backend server is running.',
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
  searchCategories(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    const filtered = this.categoryList().filter(category =>
      category.categoryName.toLowerCase().includes(searchTerm)
    );
    this.filteredCategories.set(filtered);
  }

  // Create or update category
  saveCategory() {
    const categoryName = this.newCategoryName().trim();

    if (!categoryName) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please enter a category name',
      });
      return;
    }

    const categoryData: data = {
      categoryName: categoryName,
      description: this.newCategoryDescription().trim(),
    };

    if (this.editMode() && this.editingCategoryId()) {
      this.updateCategory(categoryData);
    } else {
      this.createCategory(categoryData);
    }
  }

  // Create new category
  createCategory(category: data) {
    this.categoryservice.createCategory(category).subscribe({
      next: (response: any) => {
        console.log('Category created:', response);
        Swal.fire({
          title: '✅ បន្ថែមប្រភេទបានជោគជ័យ!',
          icon: 'success',
          draggable: true
        });
        this.resetForm();
        this.showAddForm.set(false);
        this.getAllCategories();
      },
      error: (err: any) => {
        console.error('Error creating category:', err);
        Swal.fire({
          icon: 'error',
          title: 'មានបញ្ហាក្នុងការបន្ថែមប្រភេទ',
          text: err.error?.message || 'Failed to create category. Please try again.',
        });
      }
    });
  }

  // Edit category - populate form with existing data
  editCategory(index: number) {
    const category = this.filteredCategories()[index];

    if (!category._id) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Cannot edit: Category ID is missing' });
      return;
    }

    this.newCategoryName.set(category.categoryName);
    this.newCategoryDescription.set(category.description || '');
    this.editMode.set(true);
    this.editingCategoryId.set(category._id);
    this.showAddForm.set(true);
  }

  // Update category
  updateCategory(category: data) {
    const id = this.editingCategoryId();

    if (!id) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No category selected for update' });
      return;
    }

    this.categoryservice.updateCategory(id, category).subscribe({
      next: (response: any) => {
        console.log('Category updated:', response);
        Swal.fire({
          title: '✅ កែប្រែប្រភេទបានជោគជ័យ!',
          icon: 'success',
          draggable: true
        });
        this.resetForm();
        this.showAddForm.set(false);
        this.getAllCategories();
      },
      error: (err: any) => {
        console.error('Error updating category:', err);
        Swal.fire({
          icon: 'error',
          title: 'មានបញ្ហាក្នុងការកែប្រែប្រភេទ',
          text: err.error?.message || 'Failed to update category. Please try again.',
        });
      }
    });
  }

  // Delete category
  deleteCategory(index: number) {
    const category = this.filteredCategories()[index];

    if (!category._id) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Cannot delete: Category ID is missing' });
      return;
    }

    Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: `លុប "${category.categoryName}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'បាទ, លុបចោល!',
      cancelButtonText: 'បោះបង់'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryservice.deleteCategory(category._id!).subscribe({
          next: (response: any) => {
            console.log('Category deleted:', response);
            Swal.fire({
              title: '✅ លុបប្រភេទបានជោគជ័យ!',
              icon: 'success',
              draggable: true
            });
            this.getAllCategories();
          },
          error: (err: any) => {
            console.error('Error deleting category:', err);
            Swal.fire({
              icon: 'error',
              title: 'មានបញ្ហាក្នុងការលុបប្រភេទ',
              text: err.error?.message || 'Failed to delete category. Please try again.',
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
    this.newCategoryName.set('');
    this.newCategoryDescription.set('');
    this.editMode.set(false);
    this.editingCategoryId.set(null);
  }
}
