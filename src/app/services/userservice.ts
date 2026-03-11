import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { userInterface } from '../models/userModels';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { enviroment } from '../../env/enviroment';

interface ApiResponse {
  token: string;
  _id?: string;
  role?: string;
  userId?: string;
  user?: any;
  message?: string;
}
@Injectable({
  providedIn: 'root',
})
export class Userservice {
  private apiUrl = enviroment.apiBase; // Change to your backend URL
  private tokenKey = 'userToken';
  private roleKey = 'userRole';
  private userIdKey = 'userId';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(private http: HttpClient) {
    this.loadToken();
  }
  private apiUri = `${enviroment.apiBase}/users`;

  getAllUser() {
    return this.http.get<any>(this.apiUri);
  }

  createdUser(user: any) {
    return this.http.post<any>(this.apiUri, user);
  }

  updateUser(id: any, user: any) {
    const url = `${this.apiUri}/${id}`;
    return this.http.patch<any>(url, user);
  }

  deleteUser(id: any) {
    const url = `${this.apiUri}/${id}`;
    return this.http.delete<any>(url);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUri}/profile/me`);
  }

  updateProfile(data: { userName?: string; phoneNumber?: string; currentPassword?: string; newPassword?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUri}/profile/me`, data);
  }

  updateProfileImage(formData: FormData): Observable<any> {
    return this.http.patch<any>(`${this.apiUri}/profile/me/image`, formData);
  }

  register(userName: string, password: string, role: string, phoneNumber: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/register`, { userName, password, role, phoneNumber })
      .pipe(tap(response => this.saveToken(response)));
  }

  login(userName: string, password: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/login`, { userName, password })
      .pipe(tap(response => this.saveToken(response)));
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.roleKey);
      localStorage.removeItem(this.userIdKey);
    }
    this.currentUserSubject.next(null);
  }

  getUserId(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.userIdKey);
    }
    return null;
  }

  getUserRole(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.roleKey);
    }
    return null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private saveToken(response: ApiResponse): void {
    if (response.token) {
      if (this.isBrowser) {
        localStorage.setItem(this.tokenKey, response.token);
        if (response.role) {
          localStorage.setItem(this.roleKey, response.role);
        }
        if (response._id) {
          localStorage.setItem(this.userIdKey, response._id);
        }
      }
      this.currentUserSubject.next(response);
    }
  }

  private loadToken(): void {
    const token = this.getToken();
    if (token) {
      this.currentUserSubject.next({ token });
    }
  }
}
