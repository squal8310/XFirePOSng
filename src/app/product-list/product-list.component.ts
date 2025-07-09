import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { Product } from '../models/firestore.models';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { CartService } from '../services/cart.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FloatingCartComponent } from '../floating-cart/floating-cart.component';
import { Observable, Subscription } from 'rxjs';
import { SaleService } from '../services/sale.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSidenavModule,
    FloatingCartComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  pageSize: number = 50;
  totalProducts: number = 0;
  lastDoc: DocumentSnapshot | null = null;
  firstDoc: DocumentSnapshot | null = null;
  pageIndex: number = 0;
  pageHistory: (DocumentSnapshot | null)[] = [null];
  cartItemCount$: Observable<number>;
  @ViewChild('cartSidenav') cartSidenav!: MatSidenav;
  private saleSubscription: Subscription;

  constructor(private productService: ProductService, private cartService: CartService, private saleService: SaleService) {
    this.cartItemCount$ = this.cartService.getCartItemCount();
    this.saleSubscription = this.saleService.saleCompleted$.subscribe(() => {
      this.loadProducts(); // Reload products after a sale
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.saleSubscription.unsubscribe();
  }

  async loadProducts(): Promise<void> {
    try {
      const { products, lastDoc } = await this.productService.getProductsPaginated(this.pageSize, this.pageHistory[this.pageIndex] || undefined);
      this.products = products;
      this.lastDoc = lastDoc;
      // For totalProducts, in Firestore you typically don't get a total count easily.
      // You might need a separate cloud function or a counter document if exact count is critical.
      // For now, we'll just assume we have more if lastDoc is not null.
      // Or, if you want a rough estimate, you can fetch all IDs once.
      // For this example, we'll just enable next/prev based on lastDoc.
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async onPageChange(event: PageEvent): Promise<void> {
    if (event.pageIndex > this.pageIndex) {
      // Next page
      this.pageIndex++;
      this.pageHistory.push(this.lastDoc); // Save current lastDoc for next page's startAfter
    } else if (event.pageIndex < this.pageIndex) {
      // Previous page
      this.pageIndex--;
      this.pageHistory.pop(); // Remove current page's lastDoc
    }
    await this.loadProducts();
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }
}

