import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { Room } from '../../../../core/models/room.model';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <div class="room-detail" *ngIf="room">
      <div class="header">
        <h2>{{ room.name }}</h2>
        <div class="actions">
          <button (click)="openDiagram()">Abrir Diagrama</button>
          <button (click)="inviteUsers()">Invitar Usuarios</button>
        </div>
      </div>

      <div class="content">
        <div class="info-section">
          <h3>Detalles</h3>
          <p>{{ room.description }}</p>
          <p>Creada: {{ room.created_at | date }}</p>
        </div>

        <div class="participants-section">
          <h3>Participantes</h3>
          <!-- Lista de participantes irá aquí -->
        </div>
      </div>
    </div>
  `,
  styles: [`
    .room-detail {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    .content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }
  `]
})
export class RoomDetailComponent implements OnInit {
  room: Room | null = null;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const roomId = params.get('id');
      if (roomId) {
        this.loadRoom(roomId);
      }
    });
  }

  async loadRoom(roomId: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      this.room = data;
    } catch (error) {
      console.error('Error cargando sala:', error);
    }
  }

  openDiagram() {
    // Implementaremos la navegación al diagrama
  }

  inviteUsers() {
    // Implementaremos la lógica para invitar usuarios
  }
}
