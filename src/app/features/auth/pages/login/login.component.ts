// src/app/features/auth/pages/login/login.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Añadimos Router para la redirección
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <!-- Fondo principal con patrón de gradiente moderno -->
    <div class="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-6">
      <div class="w-full max-w-md space-y-8">
        <!-- Sección del logo con animación sutil -->
        <div class="text-center transform hover:scale-105 transition-all duration-300">
          <div class="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center transform -rotate-6 hover:rotate-0 transition-transform">
            <span class="text-white text-2xl font-bold">ER</span>
          </div>
          <h1 class="mt-6 text-3xl font-bold text-gray-900">ERFlow</h1>
          <p class="mt-2 text-gray-600">Diseño colaborativo de diagramas ER</p>
        </div>

        <!-- Card principal con efecto de vidrio mejorado -->
        <div class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-8 border border-gray-200/50">
          <div class="text-center">
            <h2 class="text-2xl font-semibold text-gray-900">Bienvenido</h2>
            <p class="text-gray-600 mt-2">Ingresa tus credenciales para continuar</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Campo de Email mejorado -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div class="relative group">
                <input
                  type="email"
                  formControlName="email"
                  class="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                  [class.border-red-500]="showErrors('email')"
                  placeholder="ejemplo@correo.com"
                >
                <span class="absolute right-3 top-3 text-gray-400 group-hover:text-blue-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </span>
              </div>
              <div *ngIf="showErrors('email')" class="text-red-500 text-sm ml-1 animate-fade-in">
                Por favor, ingresa un correo electrónico válido
              </div>
            </div>

            <!-- Campo de Contraseña mejorado -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div class="relative group">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  class="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                  [class.border-red-500]="showErrors('password')"
                  placeholder="••••••••"
                >
                <button
                  type="button"
                  (click)="togglePassword()"
                  class="absolute right-3 top-3 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path *ngIf="!showPassword" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    <path *ngIf="showPassword" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                </button>
              </div>
              <div *ngIf="showErrors('password')" class="text-red-500 text-sm ml-1 animate-fade-in">
                La contraseña es requerida
              </div>
            </div>

            <!-- Opciones adicionales con mejor estilo -->
            <div class="flex items-center justify-between">
              <label class="flex items-center group cursor-pointer">
                <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition duration-150 ease-in-out">
                <span class="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Recordarme</span>
              </label>
              <a href="#" class="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <!-- Mensaje de error mejorado -->
            <div *ngIf="errorMessage"
                 class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-fade-in">
              {{ errorMessage }}
            </div>

            <!-- Botón de inicio de sesión mejorado -->
            <button
              type="submit"
              [disabled]="loginForm.invalid || loading"
              class="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium
                     hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              <div class="flex items-center justify-center">
                <svg *ngIf="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
              </div>
            </button>

            <!-- Link de registro mejorado -->
            <div class="text-center">
              <p class="text-gray-600">
                ¿No tienes una cuenta?
                <a routerLink="/auth/register"
                   class="text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline">
                  Regístrate aquí
                </a>
              </p>
            </div>
          </form>
        </div>

        <!-- Footer mejorado -->
        <div class="text-center text-gray-500 text-sm">
          © 2024 ERFlow. Todos los derechos reservados.
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router  // Añadimos el router para la redirección
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      try {
        const result = await this.authService.login(this.loginForm.value);

        if (result.success) {
          // Si el login es exitoso, redirigimos al dashboard/vista principal
          await this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = result.message || 'Error al iniciar sesión';
        }
      } catch (error) {
        this.errorMessage = 'Error al conectar con el servidor';
      } finally {
        this.loading = false;
      }
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  showErrors(field: string): boolean {
    const control = this.loginForm.get(field);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }
}
