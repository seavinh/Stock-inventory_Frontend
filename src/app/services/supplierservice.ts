import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { enviroment } from '../../env/enviroment';
import { Supplier } from '../supplier/supplier';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Supplierservice {
  private apiUrl = `${enviroment.apiBase}/suppliers`;
  private http = inject(HttpClient);

  // ✅ READ - Get all suppliers
  getSupplier(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching suppliers:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ SEARCH - Search suppliers by name
  searchSuppliers(searchTerm: string): Observable<Supplier[]> {
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<Supplier[]>(`${this.apiUrl}/search`, { params }).pipe(
      catchError((error) => {
        console.error('Error searching suppliers:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ CREATE - Add new supplier
  createSupplier(data: Supplier): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, data).pipe(
      catchError((error) => {
        console.error('Error creating supplier:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ UPDATE - Edit supplier
  updateSupplier(id: string, data: Supplier): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.apiUrl}/${id}`, data).pipe(
      catchError((error) => {
        console.error('Error updating supplier:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ DELETE - Remove supplier
  deleteSupplier(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Error deleting supplier:', error);
        return throwError(() => error);
      })
    );
  }
}