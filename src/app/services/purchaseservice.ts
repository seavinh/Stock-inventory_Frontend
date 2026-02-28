import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { enviroment } from '../../env/enviroment';
import { Observable } from 'rxjs';

export interface PurchaseItem {
    productId: string;
    cost: number;
    quantity: number;
    remarks?: string;
    totalCost?: number;
}

export interface Purchase {
    _id?: string;
    supplierId: string;
    userId: string;
    PurchaseCost?: number;
    purchaseItemId?: PurchaseItem[];
    createdAt?: string;
}

export interface CreatePurchasePayload {
    supplierId: string;
    userId: string;
    items: PurchaseItem[];
}

@Injectable({
    providedIn: 'root',
})
export class Purchaseservice {
    private apiUrl = `${enviroment.apiBase}/purchases`;
    private http = inject(HttpClient);

    getPurchases(): Observable<Purchase[]> {
        return this.http.get<Purchase[]>(this.apiUrl);
    }

    createPurchase(payload: CreatePurchasePayload): Observable<any> {
        return this.http.post<any>(this.apiUrl, payload);
    }
}
