// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User, UserCredentials } from '../models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Observable para el estado de carga
  private loading = new BehaviorSubject<boolean>(false);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  // Método para iniciar sesión
  async signIn(credentials: UserCredentials): Promise<{ success: boolean; message?: string }> {
    try {
      this.loading.next(true);
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword(credentials);

      if (error) throw error;

      // Si el inicio de sesión es exitoso, redirigimos al dashboard
      await this.router.navigate(['/dashboard']);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      this.loading.next(false);
    }
  }

  // Método para registrar un nuevo usuario
  async signUp(credentials: UserCredentials): Promise<{ success: boolean; message?: string }> {
    try {
      this.loading.next(true);
      const { data, error } = await this.supabaseService.client.auth.signUp(credentials);

      if (error) throw error;

      return { success: true, message: 'Por favor verifica tu correo electrónico.' };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      this.loading.next(false);
    }
  }

  // Método para cerrar sesión
  async signOut(): Promise<void> {
    await this.supabaseService.client.auth.signOut();
    await this.router.navigate(['/login']);
  }

  // Observable para el estado de carga
  isLoading(): Observable<boolean> {
    return this.loading.asObservable();
  }
}
