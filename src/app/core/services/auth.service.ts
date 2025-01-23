// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import {
  LoginCredentials,
  RegisterCredentials,
  User,
  AuthResponse
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<User | null>(null);
  private loading = new BehaviorSubject<boolean>(false);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const { data: { session } } = await this.supabaseService.client.auth.getSession();

      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.["full_name"] || '',
          created_at: new Date(session.user.created_at),
          avatar_url: session.user.user_metadata?.["avatar_url"]
        };
        this.currentUser.next(user);
      }

      // Escuchamos cambios en la autenticación
      this.supabaseService.client.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.["full_name"] || '',
            created_at: new Date(session.user.created_at),
            last_sign_in: new Date()
          };
          this.currentUser.next(user);
        } else {
          this.currentUser.next(null);
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.loading.next(true);

    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword(credentials);

      if (error) throw error;

      await this.router.navigate(['/dashboard']);
      return {
        success: true,
        message: '¡Bienvenido de vuelta!',
        user: data.user ? {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.["full_name"] || '',
          created_at: new Date(data.user.created_at)
        } : undefined
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error al iniciar sesión'
      };
    } finally {
      this.loading.next(false);
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    this.loading.next(true);

    try {
      const { data, error } = await this.supabaseService.client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        await this.router.navigate(['/dashboard']);
        return {
          success: true,
          message: '¡Registro exitoso! Bienvenido.',
          user: {
            id: data.user.id,
            email: data.user.email!,
            full_name: credentials.full_name,
            created_at: new Date(data.user.created_at)
          }
        };
      }

      return {
        success: false,
        message: 'Error durante el registro'
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error durante el registro'
      };
    } finally {
      this.loading.next(false);
    }
  }

  // Método de logout
  async logout(): Promise<{ success: boolean; message?: string }> {
    this.loading.next(true);

    try {
      // Cerramos la sesión en Supabase
      const { error } = await this.supabaseService.client.auth.signOut();

      if (error) throw error;

      // Limpiamos el estado del usuario
      this.currentUser.next(null);

      // Redirigimos al login
      await this.router.navigate(['/auth/login']);

      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };
    } catch (error: any) {
      console.error('Error durante el logout:', error);
      return {
        success: false,
        message: error.message || 'Error al cerrar sesión'
      };
    } finally {
      this.loading.next(false);
    }
  }
  // Obtener el usuario actual como Observable
  getCurrentUser(): Observable<any> {
    return this.currentUser.asObservable();
  }

  // Verificar si hay un usuario autenticado
  isAuthenticated(): boolean {
    return this.currentUser.value !== null;
  }

  // Obtener el estado de carga
  isLoading(): Observable<boolean> {
    return this.loading.asObservable();
  }

  // isAuthenticated(): boolean {
  //   return this.currentUser.value !== null;
  // }
  //
  // getCurrentUser(): Observable<User | null> {
  //   return this.currentUser.asObservable();
  // }

  // ... resto de métodos del servicio ...
}
