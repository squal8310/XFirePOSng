import { Injectable } from '@angular/core';
import { Firestore, collection, doc, writeBatch, Timestamp } from '@angular/fire/firestore';
import { Sale, SaleItem, Product } from '../models/firestore.models';

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  constructor(private firestore: Firestore) { }

  async saveSale(sale: Sale, cartItems: { product: Product, quantity: number }[]): Promise<void> {
    const batch = writeBatch(this.firestore);

    // 1. Add the sale document
    const salesCollectionRef = collection(this.firestore, 'sales');
    const newSaleRef = doc(salesCollectionRef);
    batch.set(newSaleRef, { ...sale, id: newSaleRef.id, saleDate: Timestamp.now() });

    // 2. Update product stock for each item in the sale
    for (const item of cartItems) {
      const productRef = doc(this.firestore, `products/${item.product.id}`);
      // Decrement stock. Firestore transactions are crucial here for atomicity.
      // For simplicity, we're directly decrementing. In a real app, you'd read the current stock
      // within the transaction to prevent race conditions if multiple sales happen simultaneously.
      // However, writeBatch itself provides some atomicity for the writes within it.
      batch.update(productRef, { currentStock: item.product.currentStock - item.quantity });
    }

    // Commit the batch
    await batch.commit();
  }
}
