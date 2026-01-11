import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Stock {
  _id?: string;
  itemType: string;
  availableQuantity: number;
  clientId: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = 'https://richmill-git-main-richmill123s-projects.vercel.app/api'
  //private apiUrl = 'http://192.168.1.2:5000/api';

  public clientId = JSON.parse(sessionStorage.getItem('user') || '');
  constructor(private http: HttpClient) {}

  getStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/stock?clientId=${this.clientId}`);
  }

  createStock(stock: Omit<Stock, '_id' | 'createdAt' | 'updatedAt'>): Observable<Stock> {
    return this.http.post<Stock>(`${this.apiUrl}/stock`, stock);
  }

  updateStock(id: string, updateData: { quantity: number; clientId: string }): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/stock/${id}`, updateData);
  }

  deleteStock(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/stock/${id}?clientId=${this.clientId}`);
  }
}
