// src/app/core/services/diagram.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RoomService } from './room.service';
import { BehaviorSubject, Observable } from 'rxjs';

// Interfaces para el manejo de diagramas
export interface Entity {
  id: string;
  name: string;
  attributes: EntityAttribute[];
  position: { x: number; y: number };
}

export interface EntityAttribute {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isRequired: boolean;
}

export interface Relationship {
  id: string;
  fromEntity: string;
  toEntity: string;
  type: '1-1' | '1-N' | 'N-M';
  name?: string;
}

export interface DiagramData {
  entities: Entity[];
  relationships: Relationship[];
  version: number;
  lastModified: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DiagramService {
  private currentDiagram = new BehaviorSubject<DiagramData | null>(null);
  private isEditing = new BehaviorSubject<boolean>(false);

  constructor(
    private supabaseService: SupabaseService,
    private roomService: RoomService
  ) {
    // Suscribirse a cambios en el diagrama en tiempo real
    this.setupRealtimeSubscription();
  }

  // Corrección en el método setupRealtimeSubscription dentro de DiagramService

  private setupRealtimeSubscription() {
    // Nos suscribimos a los cambios en la sala actual
    this.roomService.getCurrentRoom().subscribe(room => {
      if (room) {
        // Primero cargamos el diagrama inicial
        if (room.diagram_data) {
          this.currentDiagram.next(room.diagram_data as DiagramData);
        }

        // Configuramos la suscripción en tiempo real
        this.supabaseService.client
          .channel(`room:${room.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'rooms',
              filter: `id=eq.${room.id}`
            },
            (payload: any) => {
              // Verificamos que payload.new exista y tenga diagram_data
              if (payload.new && typeof payload.new === 'object') {
                // Extraemos diagram_data de manera segura
                const newDiagramData = payload.new.diagram_data;

                // Verificamos que tenga la estructura correcta antes de actualizarla
                if (this.isValidDiagramData(newDiagramData)) {
                  this.currentDiagram.next({
                    entities: newDiagramData.entities || [],
                    relationships: newDiagramData.relationships || [],
                    version: newDiagramData.version || 1,
                    lastModified: new Date(newDiagramData.lastModified || new Date())
                  });
                }
              }
            }
          )
          .subscribe();
      }
    });
  }

// Método auxiliar para validar la estructura de los datos del diagrama
  private isValidDiagramData(data: any): data is DiagramData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.entities) &&
      Array.isArray(data.relationships) &&
      typeof data.version === 'number'
    );
  }

  // Crear una nueva entidad
  async addEntity(entityData: Omit<Entity, 'id'>): Promise<void> {
    const currentData = this.currentDiagram.value;
    if (!currentData) return;

    const newEntity: Entity = {
      ...entityData,
      id: this.generateUniqueId()
    };

    const updatedData = {
      ...currentData,
      entities: [...currentData.entities, newEntity],
      version: currentData.version + 1,
      lastModified: new Date()
    };

    await this.saveDiagramChanges(updatedData);
  }

  // Actualizar una entidad existente
  async updateEntity(entityId: string, updates: Partial<Entity>): Promise<void> {
    const currentData = this.currentDiagram.value;
    if (!currentData) return;

    const updatedEntities = currentData.entities.map(entity =>
      entity.id === entityId ? { ...entity, ...updates } : entity
    );

    const updatedData = {
      ...currentData,
      entities: updatedEntities,
      version: currentData.version + 1,
      lastModified: new Date()
    };

    await this.saveDiagramChanges(updatedData);
  }

  // Crear una nueva relación
  async addRelationship(relationshipData: Omit<Relationship, 'id'>): Promise<void> {
    const currentData = this.currentDiagram.value;
    if (!currentData) return;

    const newRelationship: Relationship = {
      ...relationshipData,
      id: this.generateUniqueId()
    };

    const updatedData = {
      ...currentData,
      relationships: [...currentData.relationships, newRelationship],
      version: currentData.version + 1,
      lastModified: new Date()
    };

    await this.saveDiagramChanges(updatedData);
  }

  // Guardar cambios en el diagrama
  private async saveDiagramChanges(diagramData: DiagramData): Promise<void> {
    const currentRoom = await this.roomService.getCurrentRoom().toPromise();
    if (!currentRoom) throw new Error('No hay una sala activa');

    try {
      const { error } = await this.supabaseService.client
        .from('rooms')
        .update({
          diagram_data: diagramData,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentRoom.id);

      if (error) throw error;

      this.currentDiagram.next(diagramData);
    } catch (error) {
      console.error('Error guardando cambios del diagrama:', error);
      throw error;
    }
  }

  // Exportar el diagrama a código JPA
  generateJpaCode(): string {
    const currentData = this.currentDiagram.value;
    if (!currentData) return '';

    let jpaCode = '';

    // Generamos el código para cada entidad
    currentData.entities.forEach(entity => {
      jpaCode += this.generateEntityClass(entity, currentData.relationships);
      jpaCode += '\n\n';
    });

    return jpaCode;
  }

  // Generar código JPA para una entidad
  private generateEntityClass(entity: Entity, relationships: Relationship[]): string {
    let classCode = `@Entity\n@Table(name = "${this.toSnakeCase(entity.name)}")\npublic class ${entity.name} {\n\n`;

    // Generamos los atributos
    entity.attributes.forEach(attr => {
      if (attr.isPrimaryKey) {
        classCode += '    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n';
      }
      classCode += `    @Column(name = "${this.toSnakeCase(attr.name)}"${attr.isRequired ? ', nullable = false' : ''})\n`;
      classCode += `    private ${attr.type} ${this.toCamelCase(attr.name)};\n\n`;
    });

    // Generamos las relaciones
    relationships
      .filter(rel => rel.fromEntity === entity.id || rel.toEntity === entity.id)
      .forEach(rel => {
        classCode += this.generateRelationshipCode(rel, entity.id);
      });

    // Cerramos la clase
    classCode += '}';

    return classCode;
  }

  // Generar código para una relación
  private generateRelationshipCode(relationship: Relationship, entityId: string): string {
    const isSource = relationship.fromEntity === entityId;
    const otherEntityId = isSource ? relationship.toEntity : relationship.fromEntity;

    switch (relationship.type) {
      case '1-1':
        return `    @OneToOne${!isSource ? '(mappedBy = "' + this.toCamelCase(relationship.name || '') + '")' : ''}\n` +
          `    private ${this.getEntityNameById(otherEntityId)} ${this.toCamelCase(relationship.name || '')};\n\n`;
      case '1-N':
        if (isSource) {
          return `    @OneToMany(mappedBy = "${this.toCamelCase(relationship.name || '')}", cascade = CascadeType.ALL)\n` +
            `    private List<${this.getEntityNameById(otherEntityId)}> ${this.toCamelCase(relationship.name || '')}List = new ArrayList<>();\n\n`;
        } else {
          return `    @ManyToOne\n    @JoinColumn(name = "${this.toSnakeCase(relationship.name || '')}_id")\n` +
            `    private ${this.getEntityNameById(otherEntityId)} ${this.toCamelCase(relationship.name || '')};\n\n`;
        }
      case 'N-M':
        return `    @ManyToMany${!isSource ? '(mappedBy = "' + this.toCamelCase(relationship.name || '') + 'List")' : ''}\n` +
          `    private Set<${this.getEntityNameById(otherEntityId)}> ${this.toCamelCase(relationship.name || '')}Set = new HashSet<>();\n\n`;
      default:
        return '';
    }
  }

  // Utilidades
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private toCamelCase(str: string): string {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toLowerCase();
  }

  private getEntityNameById(entityId: string): string {
    return this.currentDiagram.value?.entities.find(e => e.id === entityId)?.name || '';
  }

  // Observables públicos
  getCurrentDiagram(): Observable<DiagramData | null> {
    return this.currentDiagram.asObservable();
  }

  isEditingDiagram(): Observable<boolean> {
    return this.isEditing.asObservable();
  }
}
