import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { Userservice } from './services/userservice';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Inventory Management System');
  public today: Date = new Date();
  public isLoginPage = false;

  private router = inject(Router);
  public userService = inject(Userservice);
  private platformId = inject(PLATFORM_ID);

  // ── Theme State ──
  isDarkMode = signal(false);
  isSwitchingTheme = signal(false);

  // ── Sidebar collapse states (true = open) ──
  mgmtOpen = signal(true);
  txnOpen = signal(true);
  systemOpen = signal(true);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.url || event.urlAfterRedirects;
      this.isLoginPage = url === '/login' || url === '/register';
    });

    this.initDarkMode();
  }

  // ── Dark Mode Logic ──
  private initDarkMode() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.isDarkMode.set(true);
        document.body.classList.add('dark-mode');
      }
    }
  }

  toggleDarkMode() {
    this.isSwitchingTheme.set(true);

    // Quick 300ms delay for a smooth transition feel
    setTimeout(() => {
      this.isDarkMode.update(v => !v);
      if (isPlatformBrowser(this.platformId)) {
        if (this.isDarkMode()) {
          document.body.classList.add('dark-mode');
          localStorage.setItem('theme', 'dark');
        } else {
          document.body.classList.remove('dark-mode');
          localStorage.setItem('theme', 'light');
        }
      }

      // Hide the loader quickly after applying classes
      setTimeout(() => {
        this.isSwitchingTheme.set(false);
      }, 150);
    }, 300);
  }

  toggle(section: 'mgmt' | 'txn' | 'system') {
    if (section === 'mgmt') this.mgmtOpen.update(v => !v);
    if (section === 'txn') this.txnOpen.update(v => !v);
    if (section === 'system') this.systemOpen.update(v => !v);
  }

  isAdmin(): boolean {
    return this.userService.isAdmin();
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
