import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, inject, signal, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { Userservice } from './services/userservice';
import { filter } from 'rxjs/operators';
import { enviroment } from '../env/enviroment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, DatePipe, TranslateModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Inventory Management System');
  public today: Date = new Date();
  public isLoginPage = false;
  public profileImage: string = '';

  private router = inject(Router);
  public userService = inject(Userservice);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private translateService = inject(TranslateService);

  // ── Theme State ──
  isDarkMode = signal(false);
  isSwitchingTheme = signal(false);

  // ── Language State ──
  currentLang = signal('en');

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
    this.initTranslate();
  }

  private initTranslate() {
    this.translateService.addLangs(['en', 'km']);
    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('lang') || 'en';
      this.translateService.setDefaultLang(savedLang);
      this.translateService.use(savedLang);
      this.currentLang.set(savedLang);
    } else {
      this.translateService.setDefaultLang('en');
      this.translateService.use('en');
      this.currentLang.set('en');
    }
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'en' ? 'km' : 'en';
    this.currentLang.set(newLang);
    this.translateService.use(newLang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lang', newLang);
    }
  }

  ngOnInit() {
    // Reactively load user profile whenever login context changes
    this.userService.currentUser$.subscribe(userContext => {
      // If user logs out (userContext is null), clear image.
      if (!userContext) {
        this.profileImage = '';
        return;
      }

      // If they logged in or already have a token, fetch their profile image
      this.loadUserProfile();
    });
  }

  loadUserProfile() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        if (user && user.profileImage) {
          // Add a cache buster so that if it updates or we log in, it doesn't use a stale cached version.
          this.profileImage = `${enviroment.apiBase.replace('/api', '')}/uploads/${user.profileImage}?t=${Date.now()}`;
        } else {
          this.profileImage = '';
        }
        this.cdr.detectChanges(); // Force angular to update layout UI immediately 
      },
      error: () => {
        // Ignore errors (user might be logged out)
      }
    });
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
