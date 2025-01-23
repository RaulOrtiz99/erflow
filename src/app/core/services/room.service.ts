// src/app/core/services/room.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

// Definimos las interfaces necesarias
export interface Room {
  id: string;
  name: string;
  description?: string;
  host_id: string;
  created_at: Date;
  updated_at: Date;
  diagram_data?: any;
}

export interface RoomCreationData {
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private currentRoom = new BehaviorSubject<Room | null>(null);
  private rooms = new BehaviorSubject<Room[]>([]);

  constructor(private supabaseService: SupabaseService) {
    // Suscribirse a cambios en tiempo real de las salas
    this.setupRealtimeSubscription();
  }

  private setupRealtimeSubscription() {
    // Configuramos la suscripción a cambios en tiempo real
    this.supabaseService.client
      .channel('public:rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms'
        },
        (payload) => {
          // Actualizamos la lista de salas cuando hay cambios
          this.loadRooms();
        }
      )
      .subscribe();
  }

  // Cargar todas las salas disponibles para el usuario
  async loadRooms(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('rooms')
        .select(`
          *,
          host:host_id(id, email, full_name),
          participants:room_participants(user_id, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.rooms.next(data || []);
    } catch (error) {
      console.error('Error cargando salas:', error);
      throw error;
    }
  }

  // Crear una nueva sala
  async createRoom(roomData: RoomCreationData): Promise<Room> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('rooms')
        .insert([
          {
            name: roomData.name,
            description: roomData.description,
            host_id: this.supabaseService.getCurrentUserSync()?.id,
            diagram_data: { entities: [], relationships: [] }
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Añadimos al creador como participante con rol de host
      await this.addParticipant(data.id, data.host_id, 'host');

      return data;
    } catch (error) {
      console.error('Error creando sala:', error);
      throw error;
    }
  }

  // Unirse a una sala existente
  async joinRoom(roomId: string): Promise<void> {
    try {
      const userId = this.supabaseService.getCurrentUserSync()?.id;
      if (!userId) throw new Error('Usuario no autenticado');

      // Verificamos si el usuario ya es participante
      const { data: existingParticipant } = await this.supabaseService.client
        .from('room_participants')
        .select()
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single();

      if (!existingParticipant) {
        // Si no es participante, lo añadimos
        await this.addParticipant(roomId, userId, 'editor');
      }

      // Cargamos los datos de la sala
      const { data: room, error } = await this.supabaseService.client
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;

      this.currentRoom.next(room);
    } catch (error) {
      console.error('Error uniéndose a la sala:', error);
      throw error;
    }
  }

  // Añadir un participante a una sala
  private async addParticipant(roomId: string, userId: string, role: 'host' | 'editor' | 'viewer'): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('room_participants')
        .insert([{ room_id: roomId, user_id: userId, role }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error añadiendo participante:', error);
      throw error;
    }
  }

  // Obtener la sala actual
  getCurrentRoom(): Observable<Room | null> {
    return this.currentRoom.asObservable();
  }

  // Obtener todas las salas
  getRooms(): Observable<Room[]> {
    return this.rooms.asObservable();
  }
}
