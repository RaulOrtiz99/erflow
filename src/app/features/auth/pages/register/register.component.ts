// src/app/features/auth/pages/register/register.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear una cuenta
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            ¿Ya tienes una cuenta?
            <a routerLink="/auth/login" class="font-medium text-blue-600 hover:text-blue-500">
              Inicia sesión
            </a>
          </p>
        </div>

        <form class="mt-8 space-y-6" [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <!-- Nombre completo -->
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <input
              type="text"
              formControlName="full_name"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              [class.border-red-500]="showErrors('full_name')"
            >
            <div *ngIf="showErrors('full_name')" class="text-red-500 text-sm mt-1">
              El nombre es requerido
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              formControlName="email"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              [class.border-red-500]="showErrors('email')"
            >
            <div *ngIf="showErrors('email')" class="text-red-500 text-sm mt-1">
              Ingresa un correo electrónico válido
            </div>
          </div>

          <!-- Contraseña -->
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              formControlName="password"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              [class.border-red-500]="showErrors('password')"
            >
            <div *ngIf="showErrors('password')" class="text-red-500 text-sm mt-1">
              La contraseña debe tener al menos 6 caracteres
            </div>
          </div>

          <!-- Mensaje de error -->
          <div *ngIf="errorMessage" class="text-red-500 text-sm text-center">
            {{ errorMessage }}
          </div>

          <!-- Mensaje de éxito -->
          <div *ngIf="successMessage" class="text-green-500 text-sm text-center">
            {{ successMessage }}
          </div>

          <!-- Botón de registro -->
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            [disabled]="registerForm.invalid || loading"
          >
            <span *ngIf="!loading">Registrarse</span>
            <span *ngIf="loading" class="flex items-center">
              <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <!-- Ícono de carga -->
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Procesando...
            </span>
          </button>
        </form>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        const result = await this.authService.register(this.registerForm.value);

        if (result.success) {
          this.successMessage = result.message || '¡Registro exitoso!';
        } else {
          this.errorMessage = result.message || 'Error durante el registro';
        }
      } catch (error) {
        this.errorMessage = 'Error al conectar con el servidor';
      } finally {
        this.loading = false;
      }
    }
  }

  showErrors(field: string): boolean {
    const control = this.registerForm.get(field);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }
}
