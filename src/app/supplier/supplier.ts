import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Supplierservice } from '../services/supplierservice';
import Swal from 'sweetalert2';

// This interface is also imported by supplierservice.ts — keep the name as 'Supplier'
export interface Supplier {
  _id?: string;
  supplierName: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
}

@Component({
  selector: 'app-supplier',
  imports: [FormsModule, CommonModule],
  templateUrl: './supplier.html',
  styleUrl: './supplier.css',
})
export class SupplierComponent implements OnInit {
  supplierList: Supplier[] = [];
  searchText: string = '';
  isEditMode: boolean = false;
  showForm: boolean = false;

  supplierObj: Supplier = {
    supplierName: '',
    contactEmail: '',
    phoneNumber: '',
    address: '',
  };

  private supplierservice = inject(Supplierservice);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.getAll();
  }

  getAll() {
    this.supplierservice.getSupplier().subscribe({
      next: (response: Supplier[]) => {
        this.supplierList = response;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('❌ Error loading suppliers:', err),
    });
  }

  get filteredSuppliers(): Supplier[] {
    if (!this.searchText?.trim()) return this.supplierList;
    const term = this.searchText.toLowerCase().trim();
    return this.supplierList.filter(
      (s) =>
        s.supplierName?.toLowerCase().includes(term) ||
        s.contactEmail?.toLowerCase().includes(term) ||
        s.phoneNumber?.toLowerCase().includes(term) ||
        s.address?.toLowerCase().includes(term)
    );
  }

  onOpenAddForm() {
    this.resetForm();
    this.showForm = true;
  }

  onEditSupplier(supplier: Supplier) {
    this.isEditMode = true;
    this.showForm = true;
    this.supplierObj = { ...supplier };
  }

  onSaveSupplier() {
    if (!this.supplierObj.supplierName?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'សូមបញ្ចូលឈ្មោះអ្នកផ្គត់ផ្គង់' });
      return;
    }
    if (!this.supplierObj.contactEmail?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'សូមបញ្ចូលអ៊ីម៉ែល' });
      return;
    }
    if (!this.supplierObj.phoneNumber?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'សូមបញ្ចូលលេខទូរស័ព្ទ' });
      return;
    }
    if (!this.supplierObj.address?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'សូមបញ្ចូលអាសយដ្ឋាន' });
      return;
    }

    if (this.isEditMode) {
      this.doUpdate();
    } else {
      this.doCreate();
    }
  }

  doCreate() {
    this.supplierservice.createSupplier(this.supplierObj).subscribe({
      next: () => {
        Swal.fire({ title: '✅ បន្ថែមអ្នកផ្គត់ផ្គង់បានជោគជ័យ!', icon: 'success', draggable: true });
        this.getAll();
        this.resetForm();
        this.showForm = false;
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'មានបញ្ហា', text: err.error?.error || 'Something went wrong!' });
      },
    });
  }

  doUpdate() {
    this.supplierservice.updateSupplier(this.supplierObj._id!, this.supplierObj).subscribe({
      next: () => {
        Swal.fire({ title: '✅ កែប្រែអ្នកផ្គត់ផ្គង់បានជោគជ័យ!', icon: 'success', draggable: true });
        this.getAll();
        this.resetForm();
        this.showForm = false;
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'មានបញ្ហា', text: err.error?.error || 'Something went wrong!' });
      },
    });
  }

  onDeleteSupplier(supplier: Supplier) {
    Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: `លុប "${supplier.supplierName}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'បាទ, លុបចោល!',
      cancelButtonText: 'បោះបង់',
    }).then((result) => {
      if (result.isConfirmed) {
        this.supplierservice.deleteSupplier(supplier._id!).subscribe({
          next: () => {
            Swal.fire({ title: '✅ លុបអ្នកផ្គត់ផ្គង់បានជោគជ័យ!', icon: 'success', draggable: true });
            this.getAll();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'មានបញ្ហា', text: err.error?.error || 'Something went wrong!' });
          },
        });
      }
    });
  }

  cancelForm() {
    this.showForm = false;
    this.resetForm();
  }

  resetForm() {
    this.supplierObj = {
      supplierName: '',
      contactEmail: '',
      phoneNumber: '',
      address: '',
    };
    this.isEditMode = false;
  }
}
