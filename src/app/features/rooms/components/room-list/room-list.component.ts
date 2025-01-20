import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { Room } from '../../../../core/models/room.model';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <div class="rooms-container">
      <div class="header">
        <h2>Mis Salas de Diagramación</h2>
        <button (click)="createRoom()">Nueva Sala</button>
      </div>

      <div class="rooms-grid">
        <!-- Lista de salas -->
        <div *ngFor="let room of rooms" class="room-card" [routerLink]="['/rooms', room.id]">
          <h3>{{ room.name }}</h3>
          <p>{{ room.description }}</p>
          <span class="date">Creada: {{ room.created_at | date }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rooms-container {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .room-card {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .room-card:hover {
      transform: translateY(-2px);
    }
  `]
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.loadRooms();
  }

  async loadRooms() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.rooms = data;
    } catch (error) {
      console.error('Error cargando salas:', error);
    }
  }

  async createRoom() {
    // Implementaremos la lógica para crear una nueva sala
    console.log('Creando nueva sala...');
  }
}
