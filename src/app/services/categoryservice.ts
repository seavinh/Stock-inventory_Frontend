import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../env/enviroment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { userInterface } from '../models/userModels';

@Injectable({
  providedIn: 'root',
})
export class Categoryservice {
  private apiUrl = `${enviroment.apiBase}/categories`;
  http = inject(HttpClient)

  getCategories() {
    return this.http.get<any>(this.apiUrl);
  }

  createCategory(category: any) {
    return this.http.post<any>(this.apiUrl, category);
  }

  updateCategory(id: any, category: any) {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<any>(url, category);
  }

  deleteCategory(id: any) {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<any>(url);
  }
}
