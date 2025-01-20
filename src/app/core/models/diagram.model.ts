// src/app/core/models/diagram.model.ts

// Define los tipos de relaciones posibles entre entidades
export type RelationType = '1-1' | '1-N' | 'N-M';

// Define la estructura de un atributo de entidad
export interface EntityAttribute {
  id: string;
  name: string;           // Nombre del atributo
  type: string;           // Tipo de dato (string, number, etc.)
  isPrimaryKey: boolean;  // Si es llave primaria
  isForeignKey: boolean; // Si es llave foránea
  isRequired: boolean;   // Si es requerido
  defaultValue?: any;    // Valor por defecto
}

// Define la estructura de una entidad
export interface Entity {
  id: string;
  name: string;           // Nombre de la entidad
  attributes: EntityAttribute[]; // Lista de atributos
  position: {             // Posición en el diagrama
    x: number;
    y: number;
  };
}

// Define la estructura de una relación entre entidades
export interface Relationship {
  id: string;
  fromEntity: string;     // ID de la entidad origen
  toEntity: string;       // ID de la entidad destino
  type: RelationType;     // Tipo de relación
  name?: string;          // Nombre descriptivo de la relación
}

// Define la estructura completa de los datos del diagrama
export interface DiagramData {
  entities: Entity[];
  relationships: Relationship[];
  version: number;        // Para control de versiones
  last_modified: Date;
  last_modified_by: string; // ID del último usuario que modificó
}
