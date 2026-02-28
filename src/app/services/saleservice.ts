import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../env/enviroment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SaleItem {
  productId: string | any;
  categoryId?: string;
  quantity: number;
  price?: number;
  totalPrice?: number;
  remarks?: string;
}

export interface Sale {
  _id?: string;
  userId: string;
  paymentType: 'cash' | 'qr';
  salePrice?: number;
  remark?: string;
  saleItemId?: SaleItem[];
  createdAt?: string;
}

export interface CreateSalePayload {
  userId: string;
  paymentType: 'cash' | 'qr';
  remark?: string;
  items: { productId: string; categoryId?: string; quantity: number; remarks?: string; }[];
}

@Injectable({
  providedIn: 'root',
})
export class Saleservice {
  private apiUrl = `${enviroment.apiBase}/sales`;
  private http = inject(HttpClient);

  getSale(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  getSaleById(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  createSale(payload: CreateSalePayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  deleteSale(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
