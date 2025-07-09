import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
  CollectionReference,
  doc,
  setDoc,
  updateDoc,
  runTransaction,
  query,
  where,
  getDocs,
  orderBy, // Import orderBy
  limit, // Import limit
  startAfter, // Import startAfter
  DocumentSnapshot, // Import DocumentSnapshot
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Product, KardexEntry } from '../models/firestore.models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private productsCollection: CollectionReference;
  private kardexCollection: CollectionReference;

  constructor(private firestore: Firestore, private storage: Storage) {
    this.productsCollection = collection(this.firestore, 'products');
    this.kardexCollection = collection(this.firestore, 'kardex');
  }

  /**
   * Searches for an existing product by barcode.
   * @param barcode The barcode of the product.
   * @returns A Promise that resolves with the existing Product document (including its ID) or null if not found.
   */
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    if (!barcode) return null;

    const q = query(this.productsCollection, where('barcode', '==', barcode));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() as Product };
    }
    return null;
  }

  /**
   * Updates the details of an existing product in Firestore.
   * @param productId The ID of the product to update.
   * @param productData The new product data.
   * @param imageFile Optional new image file to upload.
   * @returns A Promise that resolves when the product details are updated.
   */
  async updateProductDetails(productId: string, productData: Partial<Product>, imageFile?: File): Promise<void> {
    try {
      const productRef = doc(this.firestore, 'products', productId);
      const now = Timestamp.now();
      productData.updatedAt = now;

      // Upload new image if provided
      if (imageFile) {
        const filePath = `product_images/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(this.storage, filePath);
        const uploadTask = await uploadBytes(storageRef, imageFile);
        productData.imageUrl = await getDownloadURL(uploadTask.ref);
      }

      await updateDoc(productRef, productData);
      console.log(`Product details updated for ID: ${productId}`);
    } catch (error) {
      console.error(`Error updating product details for ID ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Adds a new product to Firestore or updates its details and stock if it already exists (by barcode).
   * Optionally uploads an image to Storage.
   * @param product The product data to save.
   * @param quantity The quantity to add (initial stock for new product, or increment for existing).
   * @param imageFile Optional image file to upload.
   * @returns A Promise that resolves with the ID of the product (new or existing).
   */
  async addOrUpdateProduct(product: Product, quantity: number, imageFile?: File): Promise<string> {
    try {
      const now = Timestamp.now();

      if (product.barcode) {
        const existingProduct = await this.getProductByBarcode(product.barcode);

        if (existingProduct && existingProduct.id) {
          // Product exists, update its details and then its stock
          await this.updateProductDetails(existingProduct.id, product, imageFile);
          await this.updateProductStock(existingProduct.id, quantity, 'entrada', existingProduct.name); // Log as 'entrada'
          console.log(`Product updated and stock incremented for existing product: ${existingProduct.name}`);
          return existingProduct.id;
        }
      }

      // If no barcode or product not found by barcode, create new one
      product.createdAt = now;
      product.updatedAt = now;
      product.currentStock = quantity; // Initialize currentStock directly in product
      product.imageUrl = ''; // Initialize imageUrl to empty string if no image is provided
      // Upload image if provided (only for new product creation here)
      if (imageFile) {
        const filePath = `product_images/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(this.storage, filePath);
        const uploadTask = await uploadBytes(storageRef, imageFile);
        product.imageUrl = await getDownloadURL(uploadTask.ref);
      }

      // Add new product to Firestore
      const docRef = await addDoc(this.productsCollection, product);
      const productId = docRef.id;

      // Register initial stock movement in Kardex
      const kardexEntry: KardexEntry = {
        productId: productId,
        productName: product.name,
        movementDate: now,
        movementType: 'entrada',
        quantityIn: quantity,
        balanceQuantity: quantity,
        balanceWeightedAvgCost: product.purchasePrice, // Assuming initial purchase price is the weighted average
        balanceTotalValue: quantity * product.purchasePrice
      };
      await addDoc(this.kardexCollection, kardexEntry);

      console.log(`New product added with ID: ${productId}`);
      return productId;

    } catch (error) {
      console.error('Error in addOrUpdateProduct:', error);
      throw error;
    }
  }

  /**
   * Updates the stock of a product in the 'products' collection using a transaction
   * and logs the movement in the 'kardex' collection.
   * @param productId The ID of the product whose stock to update.
   * @param quantityChange The amount to add (positive) or subtract (negative) from the stock.
   * @param movementType The type of movement ('entrada', 'salida', 'ajuste', 'devolucion').
   * @param productName The name of the product (for Kardex denormalization).
   * @returns A Promise that resolves when the stock is updated and Kardex entry is logged.
   */
  async updateProductStock(productId: string, quantityChange: number, movementType: KardexEntry['movementType'], productName: string): Promise<void> {
    const productRef = doc(this.firestore, 'products', productId);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error('Product document does not exist!');
        }

        const currentStock = productDoc.data()!['currentStock'] as number;
        const purchasePrice = productDoc.data()!['purchasePrice'] as number; // Get purchase price for Kardex
        const newStock = currentStock + quantityChange;

        if (newStock < 0) {
          throw new Error('Cannot reduce stock below zero.');
        }

        // Update product's currentStock
        transaction.update(productRef, {
          currentStock: newStock,
          updatedAt: Timestamp.now()
        });

        // Log movement in Kardex
        const now = Timestamp.now();
        const kardexEntry: KardexEntry = {
          productId: productId,
          productName: productName,
          movementDate: now,
          movementType: movementType,
          balanceQuantity: newStock,
          balanceWeightedAvgCost: purchasePrice,
          balanceTotalValue: newStock * purchasePrice
        };

        // Conditionally add quantityIn/Out and costIn/Out to avoid undefined
        if (quantityChange > 0) {
          kardexEntry.quantityIn = quantityChange;
          kardexEntry.costIn = purchasePrice;
        } else if (quantityChange < 0) {
          kardexEntry.quantityOut = Math.abs(quantityChange);
          kardexEntry.costOut = purchasePrice;
        }

        transaction.set(doc(this.kardexCollection), kardexEntry); // Use addDoc for new Kardex entry
      });
      console.log(`Stock for product ${productId} updated by ${quantityChange} and Kardex logged.`);
    } catch (error) {
      console.error(`Error updating stock for product ${productId} with transaction:`, error);
      throw error;
    }
  }

  /**
   * Gets a paginated list of products. (Max 50 products per page)
   * @param pageSize The number of products per page. (Max 50)
   * @param lastDoc The last document from the previous page for pagination.
   * @returns A Promise that resolves with an array of products and the last document snapshot.
   */
  async getProductsPaginated(pageSize: number, lastDoc?: DocumentSnapshot): Promise<{ products: Product[], lastDoc: DocumentSnapshot | null }> {
    // Ensure pageSize does not exceed 50
    const effectivePageSize = Math.min(pageSize, 50);

    let q;
    if (lastDoc) {
      q = query(this.productsCollection, orderBy('name'), limit(effectivePageSize), startAfter(lastDoc));
    } else {
      q = query(this.productsCollection, orderBy('name'), limit(effectivePageSize));
    }

    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() as Product });
    });

    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return { products, lastDoc: newLastDoc };
  }
}