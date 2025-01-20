import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="register-container">
      <h2>Registro</h2>
      <!-- Aquí irá el formulario de registro -->
    </div>
  `,
  styles: [`
    .register-container {
      padding: 20px;
    }
  `]
})
export class RegisterComponent {
  constructor() {}
}
