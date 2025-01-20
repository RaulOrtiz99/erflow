import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {environment} from '../../../enviroments/enviroments';


@Injectable({
  providedIn: 'root'
})
export class SupabaseInitService {
  private _client: SupabaseClient;

  constructor() {
    this._client = createClient(
      environment.supabase.url,
      environment.supabase.key,
      environment.supabase.options
    );
  }

  get client(): SupabaseClient {
    return this._client;
  }

  // Método para verificar la conexión
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this._client.from('rooms').select('count').limit(1);
      return !error;
    } catch (error) {
      console.error('Error conectando con Supabase:', error);
      return false;
    }
  }
}
