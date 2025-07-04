import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { MatInputModule } from '@angular/material/input'; // Import MatInputModule
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule
import { MatFormFieldModule } from '@angular/material/form-field'; // Import MatFormFieldModule

@Component({
  selector: 'app-test-firebase',
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule
  ],
  templateUrl: './test-firebase.component.html',
  styleUrl: './test-firebase.component.scss'
})
export class TestFirebaseComponent {
  name: string = '';
  email: string = '';

  constructor(private firestore: Firestore) {}

  async registerUser() {
    try {
      const docRef = await addDoc(collection(this.firestore, 'users'), {
        name: this.name,
        email: this.email
      });
      console.log('Document written with ID: ', docRef.id);
      alert('Usuario registrado con éxito!');
      this.name = '';
      this.email = '';
    } catch (e) {
      console.error('Error adding document: ', e);
      alert('Error al registrar usuario.');
    }
  }
}
