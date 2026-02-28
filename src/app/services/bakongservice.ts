import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { enviroment } from '../../env/enviroment';

export interface BakongGeneratePayload {
    userId: string;
    items: { productId: string; categoryId?: string; quantity: number; remarks?: string }[];
    remark?: string;
    amount: number;
    currency?: 'usd' | 'khr';
}

export interface BakongGenerateResponse {
    sessionId: string;
    qrString: string;
    md5: string;
    amount: number;
    currency: string;
}

export interface BakongCheckResponse {
    isPaid: boolean;
    message: string;
    sale?: any;
}

@Injectable({ providedIn: 'root' })
export class Bakongservice {
    private apiUrl = `${enviroment.apiBase}/bakong`;
    private http = inject(HttpClient);

    generateQR(payload: BakongGeneratePayload): Observable<BakongGenerateResponse> {
        return this.http.post<BakongGenerateResponse>(`${this.apiUrl}/generate`, payload);
    }

    checkPayment(sessionId: string): Observable<BakongCheckResponse> {
        return this.http.post<BakongCheckResponse>(`${this.apiUrl}/check`, { sessionId });
    }
}
