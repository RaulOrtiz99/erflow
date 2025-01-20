// src/app/core/services/realtime.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { DiagramService } from './diagram.service';

// Esta interfaz define los tipos de cambios que podemos tener en el diagrama
interface DiagramChange {
  type: 'entity_moved' | 'entity_updated' | 'relationship_created' | 'relationship_updated';
  data: any;
  userId: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  // Usamos un BehaviorSubject para manejar los usuarios activos en la sala
  private activeUsersSubject = new BehaviorSubject<string[]>([]);

  // Este objeto almacenará nuestras suscripciones a los canales de Supabase
  private channelSubscriptions: Record<string, any> = {};

  constructor(
    private supabaseService: SupabaseService,
    private diagramService: DiagramService
  ) {}

  // Este método inicia la conexión en tiempo real para una sala específica
  async joinRoom(roomId: string): Promise<void> {
    const currentUser = this.supabaseService.getCurrentUserSync();
    if (!currentUser) return;

    // Creamos un canal específico para la sala
    const channel = this.supabaseService.client.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: false }
      }
    });

    // Nos suscribimos a los cambios en el diagrama
    channel
      .on('broadcast', { event: 'diagram_change' }, ({ payload }) => {
        this.handleDiagramChange(payload as DiagramChange);
      })
      .on('presence', { event: 'sync' }, () => {
        // Actualizamos la lista de usuarios activos
        const presentUsers = channel.presenceState();
        this.updateActiveUsers(presentUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Enviamos nuestra presencia al canal
          await channel.track({
            user_id: currentUser.id,
            online_at: new Date().toISOString()
          });
        }
      });

    // Guardamos la referencia al canal
    this.channelSubscriptions[roomId] = channel;
  }

  // Este método maneja los diferentes tipos de cambios que pueden ocurrir en el diagrama
  private handleDiagramChange(change: DiagramChange): void {
    switch (change.type) {
      case 'entity_moved':
        // Actualizamos la posición de la entidad en el diagrama
        this.diagramService.updateEntityPosition(change.data);
        break;
      case 'entity_updated':
        // Actualizamos los datos de la entidad
        this.diagramService.updateEntity(change.data);
        break;
      case 'relationship_created':
      case 'relationship_updated':
        // Actualizamos las relaciones
        this.diagramService.updateRelationship(change.data);
        break;
    }
  }

  // Este método emite cambios al canal de tiempo real
  async broadcastChange(roomId: string, change: DiagramChange): Promise<void> {
    const channel = this.channelSubscriptions[roomId];
    if (!channel) return;

    await channel.send({
      type: 'broadcast',
      event: 'diagram_change',
      payload: change
    });
  }

  // Este método actualiza la lista de usuarios activos
  private updateActiveUsers(presenceState: Record<string, any>): void {
    const activeUsers = Object.values(presenceState)
      .flat()
      .map((presence: any) => presence.user_id);

    this.activeUsersSubject.next(activeUsers);
  }

  // Este método nos permite observar los usuarios activos
  getActiveUsers(): Observable<string[]> {
    return this.activeUsersSubject.asObservable();
  }

  // Este método limpia las suscripciones cuando salimos de una sala
  async leaveRoom(roomId: string): Promise<void> {
    const channel = this.channelSubscriptions[roomId];
    if (channel) {
      await channel.unsubscribe();
      delete this.channelSubscriptions[roomId];
    }
  }
}
