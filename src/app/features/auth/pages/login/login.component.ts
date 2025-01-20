import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="login-container">
      <h2>Iniciar Sesión</h2>
      <!-- Aquí irá el formulario de login -->
    </div>
  `,
  styles: [`
    .login-container {
      padding: 20px;
    }
  `]
})
export class LoginComponent {
  constructor() {}
}
