import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Order {
  _id: string;
  clientId: string;
  name: string;
  villageName: string;
  address: string;
  phoneNumber: string;
  numberOfBags: number;
  totalAmount: number;
  advanceAmount: number;
  typeOfPaddy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'https://richmill.onrender.com/api';
  public clientId = JSON.parse(sessionStorage.getItem('user') || '');

  constructor(private http: HttpClient) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders?clientId=${this.clientId}`);
  }

  createOrder(order: Omit<Order, '_id' | 'createdAt' | 'updatedAt' | 'clientId'>): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, order);
  }

  updateOrder(id: string, order: Omit<Order, '_id' | 'createdAt' | 'updatedAt' | 'clientId'>): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/orders/${id}`, {
      ...order,
      clientId: this.clientId
    });
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/${id}?clientId=${this.clientId}`);
  }
}
