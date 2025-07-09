import { Routes } from '@angular/router';
import { TestFirebaseComponent } from './test-firebase/test-firebase.component';
import { ProductFormComponent } from './product-form/product-form.component'; // Import the new component
import { ProductListComponent } from './product-list/product-list.component';

export const routes: Routes = [
  { path: 'test-firebase', component: TestFirebaseComponent },
  { path: 'product-form', component: ProductFormComponent },
  { path: 'product-list', component: ProductListComponent}
];
