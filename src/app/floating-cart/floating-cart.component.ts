import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CartService, CartItem } from '../services/cart.service';
import { Product, Sale, SaleItem } from '../models/firestore.models';
import { Observable, first } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { SaleService } from '../services/sale.service';

@Component({
  selector: 'app-floating-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatListModule
  ],
  templateUrl: './floating-cart.component.html',
  styleUrls: ['./floating-cart.component.scss']
})
export class FloatingCartComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  totalPrice$: Observable<number>;
  totalQuantity$: Observable<number>;

  constructor(private cartService: CartService, private saleService: SaleService) {
    this.cartItems$ = this.cartService.getCartItems();
    this.totalPrice$ = this.cartService.getTotalPrice();
    this.totalQuantity$ = this.cartService.getTotalQuantity();
  }

  ngOnInit(): void {}

  async checkout(): Promise<void> {
    const cartItems = await this.cartItems$.pipe(first()).toPromise();
    const totalPrice = await this.totalPrice$.pipe(first()).toPromise();

    if (!cartItems || cartItems.length === 0 || !totalPrice) {
      console.warn('Cannot checkout an empty cart.');
      return;
    }

    const saleItems: SaleItem[] = cartItems.map(item => ({
      productId: item.product.id || '',
      productName: item.product.name,
      quantity: item.quantity,
      priceAtSale: item.product.salePrice
    }));

    const newSale: Sale = {
      saleDate: new Date() as any, // Firestore Timestamp will be set in service
      totalAmount: totalPrice,
      items: saleItems,
    };

    try {
      await this.saleService.saveSale(newSale, cartItems);
      this.cartService.clearCart();
      console.log('Sale completed successfully!');
      // Optionally, show a success message to the user
    } catch (error) {
      console.error('Error completing sale:', error);
      // Optionally, show an error message to the user
    }
  }

  // Opcional: métodos para interactuar con el carrito desde el sidenav
  increaseQuantity(product: Product): void {
    this.cartService.addToCart(product);
  }

  decreaseQuantity(productId: string): void {
    this.cartService.decreaseQuantity(productId);
  }

  removeItem(productId: string): void {
    this.cartService.removeItem(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }
}