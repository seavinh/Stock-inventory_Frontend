import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Productservice, ProductModel } from '../services/productservice';
import { Purchaseservice, Purchase } from '../services/purchaseservice';
import { Saleservice } from '../services/saleservice';
import { Categoryservice } from '../services/categoryservice';
import { forkJoin } from 'rxjs';

interface CategoryStat {
  name: string;
  count: number;
}

@Component({
  selector: 'app-report',
  imports: [CommonModule],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report implements OnInit {
  // Services
  private productservice = inject(Productservice);
  private purchaseservice = inject(Purchaseservice);
  private saleservice = inject(Saleservice);
  private categoryservice = inject(Categoryservice);

  // Raw Data Storage
  private allProducts: ProductModel[] = [];
  private allPurchases: Purchase[] = [];
  private allSales: any[] = [];
  private allCategories: any[] = [];

  // State
  selectedPeriod: 'today' | 'week' | 'month' | 'all' = 'all';
  isLoading = false;

  // Summary Metrics
  totalInventoryValue = 0;
  potentialRevenue = 0;
  totalSalesValue = 0;
  totalPurchaseValue = 0;
  totalProducts = 0;

  // Stock Status
  lowStockCount = 0;
  outOfStockCount = 0;
  inStockCount = 0;

  // Category Distribution
  categoryStats: CategoryStat[] = [];

  // Lists for reference
  lowStockProducts: ProductModel[] = [];

  // Date reference
  today = new Date();

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData() {
    this.isLoading = true;
    forkJoin({
      products: this.productservice.getProduct(),
      purchases: this.purchaseservice.getPurchases(),
      sales: this.saleservice.getSale(),
      categories: this.categoryservice.getCategories()
    }).subscribe({
      next: (data) => {
        this.allProducts = data.products;
        this.allPurchases = data.purchases;
        this.allSales = data.sales;
        this.allCategories = data.categories;

        this.filterAndCalculate();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error loading report data:', err);
        this.isLoading = false;
      }
    });
  }

  onPeriodChange(period: 'today' | 'week' | 'month' | 'all') {
    this.selectedPeriod = period;
    this.filterAndCalculate();
  }

  filterAndCalculate() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter Purchases & Sales based on period
    const filteredPurchases = this.allPurchases.filter(p => {
      if (this.selectedPeriod === 'all') return true;
      const date = new Date(p.createdAt || '');
      if (this.selectedPeriod === 'today') return date >= startOfToday;
      if (this.selectedPeriod === 'week') return date >= startOfWeek;
      if (this.selectedPeriod === 'month') return date >= startOfMonth;
      return true;
    });

    const filteredSales = this.allSales.filter(s => {
      if (this.selectedPeriod === 'all') return true;
      const date = new Date(s.createdAt || '');
      if (this.selectedPeriod === 'today') return date >= startOfToday;
      if (this.selectedPeriod === 'week') return date >= startOfWeek;
      if (this.selectedPeriod === 'month') return date >= startOfMonth;
      return true;
    });

    // Note: Inventory Valuation (Products) is always CUMULATIVE
    this.calculateMetrics(this.allProducts, filteredPurchases, filteredSales, this.allCategories);
  }

  calculateMetrics(products: ProductModel[], purchases: Purchase[], sales: any[], categories: any[]) {
    // Basic Counts
    this.totalProducts = products.length;

    // Reset Metrics
    this.totalInventoryValue = 0;
    this.potentialRevenue = 0;
    this.lowStockCount = 0;
    this.outOfStockCount = 0;
    this.inStockCount = 0;
    this.lowStockProducts = [];

    // Product Metrics (Aggregate across all stock)
    products.forEach(p => {
      this.totalInventoryValue += (p.cost || 0) * (p.stockQuantity || 0);
      this.potentialRevenue += (p.price || 0) * (p.stockQuantity || 0);

      // Stock Status logic
      if ((p.stockQuantity || 0) <= 0) {
        this.outOfStockCount++;
      } else if ((p.stockQuantity || 0) < 10) {
        this.lowStockCount++;
        this.lowStockProducts.push(p);
      } else {
        this.inStockCount++;
      }
    });

    // Purchase Metrics (Filtered by period)
    this.totalPurchaseValue = purchases.reduce((sum, p) => sum + (p.PurchaseCost || 0), 0);

    // Sales Metrics (Filtered by period)
    this.totalSalesValue = sales.reduce((sum, s) => sum + (s.salePrice || 0), 0);

    // Category Stats
    this.categoryStats = categories.map(cat => {
      const count = products.filter(p => {
        const pCatId = (typeof p.categoryId === 'object' && p.categoryId !== null)
          ? (p.categoryId as any)._id
          : p.categoryId;
        return pCatId === cat._id;
      }).length;

      return { name: cat.categoryName, count };
    }).sort((a, b) => b.count - a.count); // Sort highest to lowest
  }

  formatCurrency(value: number): string {
    return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
