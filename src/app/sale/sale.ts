import { Component, inject, OnInit, signal, computed, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Saleservice, Sale as SaleRecord, CreateSalePayload } from '../services/saleservice';
import { Productservice, ProductModel } from '../services/productservice';
import { Userservice } from '../services/userservice';
import { Bakongservice } from '../services/bakongservice';
import Swal from 'sweetalert2';

interface CartItem {
  product: ProductModel;
  quantity: number;
  totalPrice: number;
}

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [FormsModule, CommonModule, CurrencyPipe, DatePipe, RouterModule],
  templateUrl: './sale.html',
  styleUrl: './sale.css',
})
export class Sale implements OnInit {
  private saleService = inject(Saleservice);
  private productService = inject(Productservice);
  private userService = inject(Userservice);
  private bakongService = inject(Bakongservice);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('qrCanvas') qrCanvasRef!: ElementRef<HTMLCanvasElement>;

  // ── Data lists ──
  saleList = signal<any[]>([]);
  productList = signal<ProductModel[]>([]);
  filteredProducts = signal<ProductModel[]>([]);

  // ── UI State ──
  showPOS = signal(false);
  isLoading = signal(false);
  activeView = signal<'list' | 'pos'>('list');

  // ── POS Cart ──
  cart = signal<CartItem[]>([]);
  paymentType = signal<'cash' | 'qr'>('cash');
  remark = signal('');
  productSearch = signal('');
  amountPaid = signal(0);

  // ── QR Payment Modal ──
  showQRModal = signal(false);
  qrSessionId = signal('');
  qrString = signal('');
  qrAmount = signal(0);
  qrChecking = signal(false);
  qrPollingHandle: any = null;

  // ── Computed ──
  cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.totalPrice, 0)
  );
  cartCount = computed(() =>
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );
  change = computed(() => this.amountPaid() - this.cartTotal());

  // ── Search ──
  saleSearch = signal('');
  filteredSales = computed(() => {
    const q = this.saleSearch().toLowerCase();
    if (!q) return this.saleList();
    return this.saleList().filter((s: any) =>
      (s._id || '').toLowerCase().includes(q) ||
      (s.paymentType || '').toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadSales();
    this.loadProducts();
  }

  // ════════════ DATA LOADING ════════════

  loadSales() {
    this.isLoading.set(true);
    this.saleService.getSale().subscribe({
      next: (data) => { this.saleList.set(data); this.isLoading.set(false); },
      error: (err) => { console.error('Error loading sales:', err); this.isLoading.set(false); }
    });
  }

  loadProducts() {
    this.productService.getProduct().subscribe({
      next: (data) => { this.productList.set(data); this.filteredProducts.set(data); },
      error: (err) => console.error('Error loading products:', err)
    });
  }

  // ════════════ POS PRODUCT SEARCH ════════════

  searchProducts(event: Event) {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.productSearch.set(q);
    this.filteredProducts.set(
      !q ? this.productList()
        : this.productList().filter(p => p.productName.toLowerCase().includes(q))
    );
  }

  // ════════════ CART OPERATIONS ════════════

  addToCart(product: ProductModel) {
    if (product.stockQuantity <= 0) {
      Swal.fire({ icon: 'warning', title: 'Out of Stock', text: `"${product.productName}" is out of stock!`, timer: 1500, showConfirmButton: false });
      return;
    }
    const current = this.cart();
    const idx = current.findIndex(i => i.product._id === product._id);
    if (idx >= 0) {
      const item = current[idx];
      const newQty = item.quantity + 1;
      if (newQty > product.stockQuantity) {
        Swal.fire({ icon: 'warning', title: 'Stock Limit', text: `Only ${product.stockQuantity} units available!`, timer: 1500, showConfirmButton: false });
        return;
      }
      const updated = [...current];
      updated[idx] = { ...item, quantity: newQty, totalPrice: product.price * newQty };
      this.cart.set(updated);
    } else {
      this.cart.set([...current, { product, quantity: 1, totalPrice: product.price }]);
    }
  }

  updateQty(index: number, qty: number) {
    const current = [...this.cart()];
    const item = current[index];
    if (qty <= 0) { this.removeFromCart(index); return; }
    if (qty > item.product.stockQuantity) {
      Swal.fire({ icon: 'warning', title: 'Stock Limit', text: `Only ${item.product.stockQuantity} units available!`, timer: 1500, showConfirmButton: false });
      return;
    }
    current[index] = { ...item, quantity: qty, totalPrice: item.product.price * qty };
    this.cart.set(current);
  }

  removeFromCart(index: number) {
    const current = [...this.cart()];
    current.splice(index, 1);
    this.cart.set(current);
  }

  clearCart() {
    this.cart.set([]);
    this.amountPaid.set(0);
    this.remark.set('');
  }

  // ════════════ CHECKOUT ════════════

  checkout() {
    if (this.cart().length === 0) {
      Swal.fire({ icon: 'warning', title: 'Empty Cart', text: 'Please add at least one product to the cart.' });
      return;
    }

    if (this.paymentType() === 'qr') {
      this.checkoutQR();
    } else {
      this.checkoutCash();
    }
  }

  // ─── Cash checkout ────────────────────────────────────────────────────────────
  private checkoutCash() {
    const userId = localStorage.getItem('userId') || '';
    const payload: CreateSalePayload = {
      userId,
      paymentType: 'cash',
      remark: this.remark(),
      items: this.cart().map(item => ({
        productId: item.product._id!,
        categoryId: item.product.categoryId,
        quantity: item.quantity,
      })),
    };

    Swal.fire({
      title: 'Confirm Sale?',
      html: `<b>Total: $${this.cartTotal().toFixed(2)}</b><br>Payment: Cash`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Confirm Sale',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);
        this.saleService.createSale(payload).subscribe({
          next: () => {
            this.isLoading.set(false);
            Swal.fire({ title: '✅ ការលក់បានជោគជ័យ!', html: `<b>Total: $${this.cartTotal().toFixed(2)}</b>`, icon: 'success', timer: 2000, showConfirmButton: false });
            this.clearCart();
            this.activeView.set('list');
            this.loadSales();
            this.loadProducts();
          },
          error: (err) => {
            this.isLoading.set(false);
            Swal.fire({ icon: 'error', title: 'Sale Failed', text: err.error?.message || 'Failed to create sale.' });
          }
        });
      }
    });
  }

  // ─── QR checkout ─────────────────────────────────────────────────────────────
  private checkoutQR() {
    const userId = localStorage.getItem('userId') || '';
    const amount = this.cartTotal();

    this.isLoading.set(true);

    this.bakongService.generateQR({
      userId,
      amount,
      currency: 'usd',
      remark: this.remark(),
      items: this.cart().map(item => ({
        productId: item.product._id!,
        categoryId: item.product.categoryId,
        quantity: item.quantity,
      })),
    }).subscribe({
      next: (resp) => {
        this.isLoading.set(false);
        this.qrSessionId.set(resp.md5);
        this.qrString.set(resp.qrString);
        this.qrAmount.set(resp.amount);
        this.showQRModal.set(true);
        // Render QR after modal is in DOM
        setTimeout(() => this.renderQRCode(resp.qrString), 100);
        // Start auto-polling every 5 seconds
        this.startPolling();
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'QR Generation Failed', text: err.error?.message || 'Could not generate QR code.' });
      }
    });
  }

  // ─── Render QR via canvas ─────────────────────────────────────────────────────
  private async renderQRCode(text: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = document.getElementById('bakong-qr-canvas') as HTMLCanvasElement;
      if (canvas) {
        await QRCode.toCanvas(canvas, text, { width: 240, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
      }
    } catch (e) {
      console.error('QR render error:', e);
    }
  }

  // ─── Polling ─────────────────────────────────────────────────────────────────
  private startPolling() {
    this.stopPolling();
    this.qrPollingHandle = setInterval(() => {
      this.verifyQRPayment(false);
    }, 5000); // 5 seconds interval
  }

  private stopPolling() {
    if (this.qrPollingHandle) {
      clearInterval(this.qrPollingHandle);
      this.qrPollingHandle = null;
    }
  }

  verifyQRPayment(manual = true) {
    if (manual) this.qrChecking.set(true);
    this.bakongService.checkPayment(this.qrSessionId()).subscribe({
      next: (resp) => {
        if (manual) this.qrChecking.set(false);
        if (resp.isPaid) {
          this.stopPolling();
          this.closeQRModal();
          Swal.fire({
            title: '✅ ការទូទាត់បានជោគជ័យ!',
            html: `<b>$${this.qrAmount().toFixed(2)}</b> received via Bakong QR.<br>Sale recorded successfully.`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
          });
          this.clearCart();
          this.activeView.set('list');
          this.loadSales();
          this.loadProducts();
        }
      },
      error: (err) => {
        if (manual) this.qrChecking.set(false);
        console.error('Payment check error:', err);
      }
    });
  }

  closeQRModal() {
    this.stopPolling();
    this.showQRModal.set(false);
    this.qrSessionId.set('');
    this.qrString.set('');
  }

  // ════════════ DELETE SALE ════════════

  deleteSale(sale: any) {
    Swal.fire({
      title: 'Delete Sale?',
      text: 'Stock will be restored. This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'បាទ, លុបចោល!',
      cancelButtonText: 'បោះបង់',
    }).then((result) => {
      if (result.isConfirmed) {
        this.saleService.deleteSale(sale._id).subscribe({
          next: () => {
            Swal.fire({ title: '✅ លុបបានជោគជ័យ!', icon: 'success', timer: 1500, showConfirmButton: false });
            this.loadSales();
            this.loadProducts();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.error?.message || 'Failed to delete sale.' });
          }
        });
      }
    });
  }

  // ════════════ VIEW SALE DETAILS ════════════

  viewSaleDetails(sale: any) {
    const items = (sale.saleItemId || []).map((item: any) => {
      const name = item.productId?.productName || 'Unknown';
      return `<tr>
        <td>${name}</td>
        <td>${item.quantity}</td>
        <td>$${(item.price || 0).toFixed(2)}</td>
        <td>$${(item.totalPrice || 0).toFixed(2)}</td>
      </tr>`;
    }).join('');

    Swal.fire({
      title: `Sale Details`,
      html: `
        <div style="text-align:left">
          <p><b>Date:</b> ${new Date(sale.createdAt).toLocaleString()}</p>
          <p><b>Payment:</b> ${sale.paymentType?.toUpperCase()}</p>
          ${sale.remark ? `<p><b>Remark:</b> ${sale.remark}</p>` : ''}
          <table class="table table-sm table-bordered mt-2">
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>${items}</tbody>
          </table>
          <p class="text-end fw-bold">Grand Total: $${(sale.salePrice || 0).toFixed(2)}</p>
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Close',
    });
  }

  // ════════════ HELPERS ════════════

  switchView(view: 'list' | 'pos') {
    this.activeView.set(view);
    if (view === 'pos') {
      this.clearCart();
      this.filteredProducts.set(this.productList());
    }
  }

  getProductImage(product: ProductModel): string {
    return product.img ? `http://localhost:3000/uploads/${product.img}` : '/assets/assets/img/default-product.png';
  }
}
