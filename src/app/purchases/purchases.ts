import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Purchaseservice, Purchase, CreatePurchasePayload, PurchaseItem } from '../services/purchaseservice';
import { Supplierservice } from '../services/supplierservice';
import { Supplier } from '../supplier/supplier';
import { Productservice } from '../services/productservice';
import { ProductModel } from '../services/productservice';
import { Userservice } from '../services/userservice';
import Swal from 'sweetalert2';

interface PurchaseFormItem {
  productId: string;
  productName: string;
  cost: number;
  quantity: number;
  remarks: string;
  totalCost: number;
}

@Component({
  selector: 'app-purchases',
  imports: [FormsModule, CommonModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
})
export class Purchases implements OnInit {
  purchaseList: Purchase[] = [];
  supplierList: Supplier[] = [];
  productList: ProductModel[] = [];

  showForm = false;
  searchText = '';

  // Form state
  selectedSupplierId = '';
  selectedUserId = 'user-placeholder'; // hardcoded until auth is implemented
  formItems: PurchaseFormItem[] = [];

  private purchaseservice = inject(Purchaseservice);
  private supplierservice = inject(Supplierservice);
  private productservice = inject(Productservice);
  private userservice = inject(Userservice);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.getAll();
    this.loadSuppliers();
    this.loadProducts();
    this.loadUsers();
  }

  loadUsers() {
    this.userservice.getAllUser().subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          this.selectedUserId = res[0]._id;
        }
      },
      error: (err) => console.error('❌ Error loading users:', err),
    });
  }

  getAll() {
    this.purchaseservice.getPurchases().subscribe({
      next: (res) => {
        this.purchaseList = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('❌ Error loading purchases:', err),
    });
  }

  loadSuppliers() {
    this.supplierservice.getSupplier().subscribe({
      next: (res) => (this.supplierList = res),
      error: (err) => console.error('❌ Error loading suppliers:', err),
    });
  }

  loadProducts() {
    this.productservice.getProduct().subscribe({
      next: (res) => (this.productList = res),
      error: (err) => console.error('❌ Error loading products:', err),
    });
  }

  get filteredPurchases(): Purchase[] {
    if (!this.searchText?.trim()) return this.purchaseList;
    const term = this.searchText.toLowerCase().trim();
    return this.purchaseList.filter(
      (p) =>
        p._id?.toLowerCase().includes(term) ||
        this.getSupplierName(p.supplierId).toLowerCase().includes(term)
    );
  }

  get grandTotal(): number {
    return this.formItems.reduce((sum, item) => sum + item.totalCost, 0);
  }

  onOpenForm() {
    this.resetForm();
    this.showForm = true;
    this.addItem();
  }

  addItem() {
    this.formItems.push({
      productId: '',
      productName: '',
      cost: 0,
      quantity: 1,
      remarks: '',
      totalCost: 0,
    });
  }

  removeItem(index: number) {
    if (this.formItems.length === 1) return;
    this.formItems.splice(index, 1);
  }

  onProductChange(index: number) {
    const item = this.formItems[index];
    const product = this.productList.find((p) => p._id === item.productId);
    if (product) {
      item.productName = product.productName;
      item.cost = product.cost;
      item.totalCost = item.cost * item.quantity;
    }
  }

  onQuantityOrCostChange(index: number) {
    const item = this.formItems[index];
    item.totalCost = (item.cost || 0) * (item.quantity || 0);
  }

  getSupplierName(id: any): string {
    if (!id) return 'N/A';
    const sid = typeof id === 'object' ? id._id : id;
    const s = this.supplierList.find((s) => s._id === sid);
    return s ? s.supplierName : 'N/A';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('km-KH', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  formatCurrency(amount?: number): string {
    if (amount == null) return '$0.00';
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  onSavePurchase() {
    if (!this.selectedSupplierId) {
      Swal.fire({ icon: 'warning', title: 'ត្រូវការ', text: 'សូមជ្រើសរើសអ្នកផ្គត់ផ្គង់' });
      return;
    }

    const invalidItem = this.formItems.find((i) => !i.productId || i.quantity < 1 || i.cost < 0);
    if (invalidItem) {
      Swal.fire({ icon: 'warning', title: 'ត្រូវការ', text: 'សូមបំពេញព័ត៌មានផលិតផលទាំងអស់ឱ្យបានត្រឹមត្រូវ' });
      return;
    }

    const payload: CreatePurchasePayload = {
      supplierId: this.selectedSupplierId,
      userId: this.selectedUserId,
      items: this.formItems.map((i) => ({
        productId: i.productId,
        cost: i.cost,
        quantity: i.quantity,
        remarks: i.remarks,
      })),
    };

    this.purchaseservice.createPurchase(payload).subscribe({
      next: () => {
        Swal.fire({ title: '✅ បន្ថែមការទិញបានជោគជ័យ!', icon: 'success', draggable: true });
        this.getAll();
        this.resetForm();
        this.showForm = false;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'មានបញ្ហា',
          text: err.error?.message || 'Something went wrong!',
        });
      },
    });
  }

  cancelForm() {
    this.showForm = false;
    this.resetForm();
  }

  resetForm() {
    this.selectedSupplierId = '';
    this.formItems = [];
  }
}
