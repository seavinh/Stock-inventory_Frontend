import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Productservice } from '../services/productservice';
import { Categoryservice } from '../services/categoryservice';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';

export interface ProductModel {
  _id?: string;
  productName: string;
  barcode?: string;
  categoryId: any;
  cost: number;
  price: number;
  stockQuantity: number;
  img?: string;
  description?: string;
}

interface CategoryModel {
  _id: string;
  categoryName: string;
}

@Component({
  selector: 'app-product',
  imports: [FormsModule, CommonModule],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class Product implements OnInit {
  productList: ProductModel[] = [];
  categoryList: CategoryModel[] = [];
  searchText: string = '';

  productObj: ProductModel = {
    productName: '',
    categoryId: '',
    cost: 0,
    price: 0,
    stockQuantity: 0,
    barcode: '',
    img: '',
    description: ''
  };

  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isEditMode: boolean = false;
  isSaving: boolean = false;
  isLoading: boolean = false;


  private productservice = inject(Productservice);
  private categoryservice = inject(Categoryservice);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.getAll();
    this.loadCategories();
  }

  getAll() {
    this.productservice.getProduct().subscribe({
      next: (response: ProductModel[]) => {
        this.productList = response;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading products:', err);
      }
    });
  }

  loadCategories() {
    this.categoryservice.getCategories().subscribe({
      next: (response: CategoryModel[]) => {
        this.categoryList = response;
      },
      error: (err) => console.error('❌ Error loading categories:', err)
    });
  }

  onSaveProduct() {
    if (!this.productObj.productName?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'សូមបញ្ចូលឈ្មោះផលិតផល' });
      return;
    }

    if (!this.productObj.categoryId) {
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'សូមជ្រើសរើសប្រភេទ' });
      return;
    }

    const formData = new FormData();
    formData.append('productName', this.productObj.productName);

    // ✅ Handle categoryId whether it's an object or a string ID
    const catId = this.isObject(this.productObj.categoryId)
      ? (this.productObj.categoryId as any)._id
      : this.productObj.categoryId;

    formData.append('categoryId', catId);
    formData.append('cost', this.productObj.cost.toString());
    formData.append('price', this.productObj.price.toString());
    formData.append('stockQuantity', this.productObj.stockQuantity.toString());

    if (this.productObj.barcode) {
      formData.append('barcode', this.productObj.barcode);
    }

    if (this.productObj.description) {
      formData.append('description', this.productObj.description);
    }

    // ✅ Append file if a new image was selected
    if (this.selectedFile) {
      formData.append('img', this.selectedFile);
    }

    if (this.isEditMode) {
      this.updateProduct(formData); // ✅ pass formData
    } else {
      this.createProduct(formData);
    }
  }

  createProduct(formData: FormData) {
    this.isSaving = true;
    Swal.fire({
      title: 'កំពុងរក្សាទុក...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.productservice.createProduct(formData).subscribe({
      next: (response) => {
        this.isSaving = false;
        Swal.fire({
          title: "✅ បន្ថែមផលិតផលបានជោគជ័យ!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        this.getAll();
        this.resetForm();
        this.closeModal();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('❌ Error creating product:', err);
        const msg = err.error?.message || 'មានបញ្ហាក្នុងការបន្ថែមផលិតផល';
        Swal.fire({
          icon: "error",
          title: "❌ មានបញ្ហាក្នុងការបន្ថែមផលិតផល",
          text: msg
        });
      }
    });
  }

  // ✅ FIXED: Now uses formData (not this.productObj) so image is uploaded correctly
  updateProduct(formData: FormData) {
    this.isSaving = true;
    Swal.fire({
      title: 'កំពុងកែប្រែ...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.productservice.updateProduct(this.productObj._id!, formData).subscribe({
      next: (response) => {
        this.isSaving = false;
        Swal.fire({
          title: "✅ កែប្រែផលិតផលបានជោគជ័យ!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        this.getAll();
        this.resetForm();
        this.closeModal();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('❌ Error updating product:', err);
        Swal.fire({
          icon: "error",
          title: "មានបញ្ហាក្នុងការកែប្រែផលិតផល",
          text: err.error?.message || "Something went wrong!",
          footer: '<a href="#">Why do I have this issue?</a>'
        });
      }
    });
  }


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.cdr.detectChanges(); // ✅ Ensure preview updates in Angular
      };
      reader.readAsDataURL(file);
    }
  }

  onEditProduct(product: ProductModel) {
    this.isEditMode = true;
    this.selectedFile = null;    // ✅ Clear any previously selected file
    this.imagePreview = null;    // ✅ Clear old preview so existing image shows

    this.productObj = {
      _id: product._id,
      productName: product.productName,
      barcode: product.barcode || '',
      cost: product.cost,
      price: product.price,
      stockQuantity: product.stockQuantity,
      img: product.img || '',
      description: product.description || '',
      categoryId: this.isObject(product.categoryId)
        ? product.categoryId._id
        : product.categoryId
    };
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      return 'assets/placeholder.png';
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const baseUrl = 'http://localhost:3000';

    if (imagePath.startsWith('/')) {
      return `${baseUrl}${imagePath}`;
    }

    return `${baseUrl}/${imagePath}`;
  }

  onImageError(event: any) {
    console.error('❌ Image failed to load:', event.target.src);
    event.target.src = 'assets/placeholder.png';
    event.target.onerror = null; // ✅ Prevent infinite loop if placeholder also fails
  }

  onDeleteProduct(product: ProductModel) {
    Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: `តើអ្នកប្រាកដថាចង់លុបផលិតផល "${product.productName}" មែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'បាទ, លុបចោល!',
      cancelButtonText: 'បោះបង់',
    }).then((result) => {
      if (result.isConfirmed) {
        if (!product._id) return;
        this.productservice.deleteProduct(product._id).subscribe({
          next: () => {
            Swal.fire({ title: '✅ លុបផលិតផលបានជោគជ័យ!', color: '#d33', icon: 'success', draggable: true });
            this.getAll();
          },
          error: (err) => {
            Swal.fire({
              title: "❌ មានបញ្ហាក្នុងការលុបផលិតផល",
              text: "Something went wrong!",
              icon: "error"
            });
          }
        });
      }
    });
  }

  resetForm() {
    this.productObj = {
      productName: '',
      categoryId: '',
      cost: 0,
      price: 0,
      stockQuantity: 0,
      barcode: '',
      img: '',
      description: ''
    };
    this.selectedFile = null;
    this.imagePreview = null;
    this.isEditMode = false;

    // ✅ Reset the file input element so it clears visually
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onOpenAddModal() {
    this.resetForm();
  }

  closeModal() {
    // Attempt standard Bootstrap hide
    const modalElement = document.getElementById('exampleModal');
    if (modalElement) {
      let modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalElement);
      if (!modalInstance) {
        try {
          modalInstance = new (window as any).bootstrap.Modal(modalElement);
        } catch (e) { }
      }
      if (modalInstance) {
        modalInstance.hide();
      }
    }

    // Simulate close button click just in case
    setTimeout(() => {
      const closeBtn = document.querySelector('#exampleModal .btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();

      // Fallback manual DOM cleanup
      if (modalElement) {
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
      }
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    }, 50);
  }

  get filteredProducts(): ProductModel[] {
    if (!this.searchText?.trim()) return this.productList;
    const searchLower = this.searchText.toLowerCase().trim();
    return this.productList.filter(product => {
      const productName = product.productName?.toLowerCase() || '';
      const barcode = product.barcode?.toLowerCase() || '';
      return productName.includes(searchLower) || barcode.includes(searchLower);
    });
  }

  getCategoryName(categoryId: any): string {
    if (this.isObject(categoryId)) return categoryId.categoryName;
    const category = this.categoryList.find(c => c._id === categoryId);
    return category ? category.categoryName : 'N/A';
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }
}