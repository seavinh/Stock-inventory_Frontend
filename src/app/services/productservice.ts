import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../env/enviroment';
import { Observable } from 'rxjs';

export interface ProductModel {
  _id?: string;
  productName: string;
  barcode?: string;
  categoryId: string;
  cost: number;
  price: number;
  stockQuantity: number;
  img?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Productservice {
  private apiUrl = `${enviroment.apiBase}/products`;
  http = inject(HttpClient);

  getProduct(): Observable<ProductModel[]> {
    return this.http.get<ProductModel[]>(this.apiUrl);
  }

  createProduct(data: FormData): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getProductById(id: string): Observable<ProductModel> {
    return this.http.get<ProductModel>(`${this.apiUrl}/${id}`);
  }

  // ✅ FIXED: Changed ProductModel to FormData so image file is sent correctly
  updateProduct(id: string, data: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}