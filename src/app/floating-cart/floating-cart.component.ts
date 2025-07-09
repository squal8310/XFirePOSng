import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CartService, CartItem } from '../services/cart.service';
import { Product } from '../models/firestore.models';
import { Observable } from 'rxjs';
import { MatListModule } from '@angular/material/list';

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

  constructor(private cartService: CartService) {
    this.cartItems$ = this.cartService.getCartItems();
    this.totalPrice$ = this.cartService.getTotalPrice();
    this.totalQuantity$ = this.cartService.getTotalQuantity();
  }

  ngOnInit(): void {}

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