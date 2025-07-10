import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/firestore.models';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor() {
    const storedCart = localStorage.getItem('shoppingCart');
    if (storedCart) {
      this.cartItemsSubject.next(JSON.parse(storedCart));
    }
  }

  private saveCart(items: CartItem[]): void {
    this.cartItemsSubject.next(items);
    localStorage.setItem('shoppingCart', JSON.stringify(items));
  }

  addToCart(product: Product): void {
    const currentItems = this.cartItemsSubject.getValue();
    const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      const existingItem = currentItems[existingItemIndex];
      if (existingItem.quantity + 1 > product.currentStock) {
        console.warn(`No hay suficiente stock para añadir más de ${product.name}. Stock disponible: ${product.currentStock}`);
        return; // Prevent adding if stock is insufficient
      }
      existingItem.quantity += 1;
    } else {
      if (1 > product.currentStock) {
        console.warn(`No hay suficiente stock para añadir ${product.name}. Stock disponible: ${product.currentStock}`);
        return; // Prevent adding if stock is insufficient
      }
      currentItems.push({ product, quantity: 1 });
    }
    this.saveCart(currentItems);
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  getCartItemCount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((sum, item) => sum + item.quantity, 0))
    );
  }

  getTotalPrice(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0))
    );
  }

  getTotalQuantity(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((sum, item) => sum + item.quantity, 0))
    );
  }

  decreaseQuantity(productId: string): void {
    const currentItems = this.cartItemsSubject.getValue();
    const itemIndex = currentItems.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
      if (currentItems[itemIndex].quantity > 1) {
        currentItems[itemIndex].quantity -= 1;
        this.saveCart(currentItems);
      } else {
        this.removeItem(productId);
      }
    }
  }

  removeItem(productId: string): void {
    const currentItems = this.cartItemsSubject.getValue();
    const updatedItems = currentItems.filter(item => item.product.id !== productId);
    this.saveCart(updatedItems);
  }

  updateItemQuantity(productId: string, quantity: number): void {
    const currentItems = this.cartItemsSubject.getValue();
    const itemIndex = currentItems.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        currentItems[itemIndex].quantity = quantity;
        this.saveCart(currentItems);
      }
    }
  }

  clearCart(): void {
    this.saveCart([]);
  }
}
