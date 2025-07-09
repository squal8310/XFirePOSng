import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { Product } from '../models/firestore.models';
import { MatListModule } from '@angular/material/list'; // Import MatListModule
import { MatCardModule } from '@angular/material/card'; // Keep MatCardModule if you plan to use it elsewhere or for future
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule, // Add MatListModule
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  pageSize: number = 50; // Max 50 products per page as per requirement
  totalProducts: number = 0; // This will be an approximation for Firestore
  lastDoc: DocumentSnapshot | null = null;
  firstDoc: DocumentSnapshot | null = null; // For previous page
  pageIndex: number = 0;
  pageHistory: (DocumentSnapshot | null)[] = [null]; // To keep track of first doc of each page

  constructor(private productService: ProductService, private cartService: CartService) { }

  ngOnInit(): void {
    this.loadProducts();
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

