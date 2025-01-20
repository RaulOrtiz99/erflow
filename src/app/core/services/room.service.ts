// src/app/core/services/room.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Room, RoomParticipant } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  // Observable para mantener la lista de salas actualizada
  private roomsSubject = new BehaviorSubject<Room[]>([]);
  private currentRoomSubject = new BehaviorSubject<Room | null>(null);

  constructor(private supabaseService: SupabaseService) {
    // Nos suscribimos a cambios en tiempo real de las salas
    this.setupRealtimeSubscription();
  }

  // Configurar suscripción en tiempo real
  private setupRealtimeSubscription() {
    this.supabaseService.client
      .channel('rooms_channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          // Actualizamos la lista de salas cuando hay cambios
          this.loadRooms();
        })
      .subscribe();
  }

  // Cargar todas las salas del usuario
  async loadRooms(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('rooms')
        .select(`
          *,
          participants:room_participants(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.roomsSubject.next(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      throw error;
    }
  }

  // Crear una nueva sala
  async createRoom(roomData: Partial<Room>): Promise<Room> {
    const user = await this.supabaseService.getCurrentUserSync();
    if (!user) throw new Error('No user authenticated');

    try {
      const { data, error } = await this.supabaseService.client
        .from('rooms')
        .insert([{
          ...roomData,
          host_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // También añadimos al creador como participante
      await this.addParticipant(data.id, user.id, 'host');

      return data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  // Obtener una sala específica
  async getRoom(roomId: string): Promise<Room> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('rooms')
        .select(`
          *,
          participants:room_participants(*)
        `)
        .eq('id', roomId)
        .single();

      if (error) throw error;
      this.currentRoomSubject.next(data);
      return data;
    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  }

  // Añadir un participante a una sala
  async addParticipant(roomId: string, userId: string, role: 'host' | 'editor' | 'viewer'): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('room_participants')
        .insert([{
          room_id: roomId,
          user_id: userId,
          role: role
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  // Observables para componentes
  getRooms(): Observable<Room[]> {
    return this.roomsSubject.asObservable();
  }

  getCurrentRoom(): Observable<Room | null> {
    return this.currentRoomSubject.asObservable();
  }
}
