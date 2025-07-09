import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { Product } from '../models/firestore.models';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent {
  product: Product = {
    name: '',
    salePrice: 0,
    purchasePrice: 0,
    currentStock: 0,
    isActive: true,
    categoryId: '',
    categoryName: '',
    supplierId: '',
    supplierName: ''
  };
  quantity: number = 0;
  selectedImageFile: File | null = null;
  currentProductStock: number | null = null; // New property for read-only current stock

  // Placeholder data for categories and suppliers (you'll fetch these from Firestore later)
  categories = [
    { id: 'cat1', name: 'Bebidas' },
    { id: 'cat2', name: 'Alimentos' }
  ];
  suppliers = [
    { id: 'sup1', name: 'Proveedor A' },
    { id: 'sup2', name: 'Proveedor B' }
  ];

  constructor(private productService: ProductService) { }

  async onBarcodeChange() {
    if (this.product.barcode) {
      const foundProduct = await this.productService.getProductByBarcode(this.product.barcode);
      if (foundProduct) {
        // Populate form fields with found product data
        this.product = { ...foundProduct };
        this.currentProductStock = foundProduct.currentStock; // Set read-only stock
        this.quantity = 0; // Reset quantity to add
      } else {
        // Clear product-specific fields if no product found, but keep barcode
        this.product.name = '';
        this.product.description = undefined;
        this.product.salePrice = 0;
        this.product.purchasePrice = 0;
        this.product.minStock = undefined;
        this.product.unitOfMeasure = undefined;
        this.product.isActive = true;
        this.product.categoryId = '';
        this.product.categoryName = '';
        this.product.supplierId = '';
        this.product.supplierName = '';
        this.product.imageUrl = undefined;
        this.currentProductStock = null; // Clear read-only stock
        this.quantity = 0; // Reset quantity to add
      }
    } else {
      // If barcode is cleared, reset the form completely
      this.resetForm();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImageFile = input.files[0];
    } else {
      this.selectedImageFile = null;
    }
  }

  async onSubmit() {
    try {
      // Find category and supplier names based on selected IDs
      this.product.categoryName = this.categories.find(c => c.id === this.product.categoryId)?.name || '';
      this.product.supplierName = this.suppliers.find(s => s.id === this.product.supplierId)?.name || '';

      const productId = await this.productService.addOrUpdateProduct(this.product, this.quantity, this.selectedImageFile || undefined);
      alert(`Operación exitosa! ID: ${productId}`);
      this.resetForm();
    } catch (error) {
      console.error('Error al realizar la operación:', error);
      alert('Error al realizar la operación. Consulta la consola para más detalles.');
    }
  }

  resetForm() {
    this.product = {
      name: '',
      salePrice: 0,
      purchasePrice: 0,
      currentStock: 0,
      isActive: true,
      categoryId: '',
      categoryName: '',
      supplierId: '',
      supplierName: ''
    };
    this.quantity = 0;
    this.selectedImageFile = null;
    this.currentProductStock = null; // Reset read-only stock
    // Reset file input manually if needed (e.g., by using a ViewChild)
  }
}