// src/app/core/services/supabase.service.ts

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import {environment} from '../../../enviroments/enviroments';


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  // Tipamos específicamente el cliente de Supabase
  private supabase: SupabaseClient;

  // Mejoramos el tipado del BehaviorSubject
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    // Inicializamos el cliente con la configuración del environment
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key,
      {
        auth: {
          persistSession: true,  // Mantener la sesión entre recargas
          autoRefreshToken: true // Refrescar automáticamente el token
        },
        realtime: {
          params: {
            eventsPerSecond: 10  // Límite de eventos por segundo para realtime
          }
        }
      }
    );

    // Inicializamos la sesión
    this.initializeSession();
  }

  // Método privado para inicializar la sesión y manejar cambios de auth
  private async initializeSession(): Promise<void> {
    // Cargamos la sesión inicial
    await this.loadUser();

    // Nos suscribimos a cambios en el estado de autenticación
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const user = await this.createUserFromSession(session.user);
        this.currentUser.next(user);
      } else {
        this.currentUser.next(null);
      }
    });
  }

  // Método privado para cargar el usuario inicial
  private async loadUser(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();

    if (session?.user) {
      const user = await this.createUserFromSession(session.user);
      this.currentUser.next(user);
    }
  }

  // Método privado para crear un objeto User desde los datos de Supabase
  private async createUserFromSession(supabaseUser: SupabaseUser): Promise<User> {
    // Obtenemos datos adicionales del usuario desde nuestra tabla de perfiles si existe
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      full_name: profile?.full_name || '',
      created_at: new Date(supabaseUser.created_at),
      last_sign_in: new Date(),
      avatar_url: profile?.avatar_url
    };
  }

  // Obtener el cliente de Supabase
  get client(): SupabaseClient {
    return this.supabase;
  }

  // Observable del usuario actual
  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  // Obtener usuario actual de forma síncrona
  getCurrentUserSync(): User | null {
    return this.currentUser.value;
  }

  // Verificar autenticación
  isAuthenticated(): boolean {
    return this.currentUser.value !== null;
  }

  // Método para actualizar el perfil del usuario
  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', this.getCurrentUserSync()?.id);

      if (error) throw error;

      // Actualizamos el usuario en el BehaviorSubject
      const currentUser = this.getCurrentUserSync();
      if (currentUser) {
        this.currentUser.next({ ...currentUser, ...updates });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
