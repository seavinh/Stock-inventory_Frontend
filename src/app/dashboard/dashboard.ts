import { Component, OnInit, AfterViewInit, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Productservice, ProductModel } from '../services/productservice';
import { Saleservice } from '../services/saleservice';
import { Purchaseservice, Purchase } from '../services/purchaseservice';
import { Supplierservice } from '../services/supplierservice';
import { Categoryservice } from '../services/categoryservice';
import { Userservice } from '../services/userservice';
import { forkJoin, of, catchError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

declare var ApexCharts: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit {
  private productService = inject(Productservice);
  private saleService = inject(Saleservice);
  private purchaseService = inject(Purchaseservice);
  private supplierService = inject(Supplierservice);
  private categoryService = inject(Categoryservice);
  private userService = inject(Userservice);
  private platformId = inject(PLATFORM_ID);

  // ── Signals (required for zoneless change detection) ──
  isLoading = signal(true);
  totalProducts = signal(0);
  totalCategories = signal(0);
  totalSuppliers = signal(0);
  totalUsers = signal(0);
  totalSalesCount = signal(0);
  totalSalesValue = signal(0);
  totalPurchaseCost = signal(0);
  lowStockCount = signal(0);
  lowStockProducts = signal<ProductModel[]>([]);

  private trendChart: any = null;
  private donutChart: any = null;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDashboardData();
    }
  }

  ngAfterViewInit(): void { }

  loadDashboardData() {
    this.isLoading.set(true);
    forkJoin({
      products: this.productService.getProduct().pipe(catchError(err => { console.error('Products error:', err); return of([]); })),
      sales: this.saleService.getSale().pipe(catchError(err => { console.error('Sales error:', err); return of([]); })),
      purchases: this.purchaseService.getPurchases().pipe(catchError(err => { console.error('Purchases error:', err); return of([]); })),
      suppliers: this.supplierService.getSupplier().pipe(catchError(err => { console.error('Suppliers error:', err); return of([]); })),
      categories: this.categoryService.getCategories().pipe(catchError(err => { console.error('Categories error:', err); return of([]); })),
      users: this.userService.getAllUser().pipe(catchError(err => { console.error('Users error:', err); return of([]); })),
    }).subscribe({
      next: (data) => {
        const products = Array.isArray(data.products) ? data.products : [];
        const sales = Array.isArray(data.sales) ? data.sales : [];
        const purchases = Array.isArray(data.purchases) ? data.purchases : [];
        const suppliers = Array.isArray(data.suppliers) ? data.suppliers : [];
        const categories = Array.isArray(data.categories) ? data.categories : [];
        const users = Array.isArray(data.users) ? data.users : [];

        // ── Update signals ──
        this.totalProducts.set(products.length);
        this.totalCategories.set(categories.length);
        this.totalSuppliers.set(suppliers.length);
        this.totalUsers.set(users.length);
        this.totalSalesCount.set(sales.length);

        const salesValue = sales.reduce((acc: number, s: any) => acc + (s.salePrice || 0), 0);
        const purchaseCost = purchases.reduce((acc: number, p: Purchase) => acc + (p.PurchaseCost || 0), 0);
        this.totalSalesValue.set(salesValue);
        this.totalPurchaseCost.set(purchaseCost);

        const lowStock = products.filter((p: ProductModel) => p.stockQuantity < 10);
        this.lowStockProducts.set(lowStock);
        this.lowStockCount.set(lowStock.length);

        // Render charts after DOM is ready
        setTimeout(() => {
          this.isLoading.set(false);
          // Small delay to ensure the @else block has rendered DOM elements
          setTimeout(() => {
            this.initTrendChart(sales, purchases);
            this.initStockDonutChart(products);
          }, 50);
        }, 800); // Artificial delay to let user see wireframe placeholder
      },
      error: (err) => {
        console.error('Dashboard forkJoin error:', err);
        this.isLoading.set(false);
      },
    });
  }

  // ──────────── Area Chart: Sales vs Purchases trend ────────────
  initTrendChart(sales: any[], purchases: Purchase[]) {
    const salesData = this.formatChartData(sales, 'salePrice');
    const purchaseData = this.formatChartData(purchases, 'PurchaseCost');

    const safeSalesData = salesData.length ? salesData : [{ x: Date.now(), y: 0 }];
    const safePurchaseData = purchaseData.length ? purchaseData : [{ x: Date.now(), y: 0 }];

    const options = {
      series: [
        { name: 'Revenue (Sales)', data: safeSalesData },
        { name: 'Expenditure (Purchases)', data: safePurchaseData },
      ],
      chart: {
        height: 350, type: 'area',
        toolbar: { show: false }, zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 800 },
        fontFamily: 'inherit',
      },
      colors: ['#0d6efd', '#20c997'],
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 100] },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2.5 },
      markers: { size: 4, hover: { size: 7 } },
      xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'dd MMM' } },
      yaxis: { labels: { formatter: (val: number) => '$' + val.toLocaleString() } },
      tooltip: {
        x: { format: 'dd MMM yyyy' },
        y: { formatter: (val: number) => '$' + val.toLocaleString() },
      },
      legend: { position: 'top', horizontalAlign: 'right', markers: { radius: 12 } },
      grid: { borderColor: '#f1f1f1', strokeDashArray: 4 },
      noData: { text: 'No transaction data yet', style: { fontSize: '14px', color: '#aaa' } },
    };

    const el = document.querySelector('#revenue-chart');
    if (el) {
      if (this.trendChart) { try { this.trendChart.destroy(); } catch (_) { } }
      el.innerHTML = ''; // Force clear DOM to prevent duplicates
      this.trendChart = new ApexCharts(el, options);
      this.trendChart.render();
    }
  }

  // ──────────── Donut Chart: Stock breakdown ────────────
  initStockDonutChart(products: ProductModel[]) {
    const inStock = products.filter(p => p.stockQuantity >= 10).length;
    const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;
    const outOfStock = products.filter(p => p.stockQuantity === 0).length;

    const options = {
      series: [inStock, lowStock, outOfStock],
      chart: { type: 'donut', height: 300, animations: { enabled: true, speed: 800 }, fontFamily: 'inherit' },
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      colors: ['#20c997', '#ffc107', '#dc3545'],
      legend: { position: 'bottom' },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: { show: true, label: 'Total Products', formatter: () => String(products.length) },
            },
          },
        },
      },
      dataLabels: { enabled: true, formatter: (val: number) => Math.round(val) + '%' },
      noData: { text: 'No products yet', style: { fontSize: '14px', color: '#aaa' } },
    };

    const el = document.querySelector('#stock-donut-chart');
    if (el) {
      if (this.donutChart) { try { this.donutChart.destroy(); } catch (_) { } }
      el.innerHTML = ''; // Force clear DOM to prevent duplicates
      this.donutChart = new ApexCharts(el, options);
      this.donutChart.render();
    }
  }

  private formatChartData(data: any[], valueField: string): any[] {
    const grouped = data.reduce((acc: any, item: any) => {
      let dateStr: string;
      try {
        dateStr = item.createdAt
          ? new Date(item.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
      } catch {
        dateStr = new Date().toISOString().split('T')[0];
      }
      acc[dateStr] = (acc[dateStr] || 0) + (item[valueField] || 0);
      return acc;
    }, {});

    return Object.keys(grouped)
      .map(date => ({ x: new Date(date).getTime(), y: grouped[date] }))
      .sort((a, b) => a.x - b.x);
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
    event.target.src = 'assets/placeholder.png';
    event.target.onerror = null;
  }
}
