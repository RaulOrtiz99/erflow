// src/app/core/models/diagram.model.ts

export type RelationType = '1-1' | '1-N' | 'N-M';

export interface EntityAttribute {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isRequired: boolean;
  defaultValue?: any;
}

export interface Entity {
  id: string;
  name: string;
  attributes: EntityAttribute[];
  position: {
    x: number;
    y: number;
  };
}

export interface Relationship {
  id: string;
  fromEntity: string;
  toEntity: string;
  type: RelationType;
  name?: string;
}

export interface DiagramData {
  entities: Entity[];
  relationships: Relationship[];
  version: number;
  lastModified: Date;  // Cambié last_modified a lastModified
  lastModifiedBy: string;  // Cambié last_modified_by a lastModifiedBy
}

// Interfaces para GoJS
export interface GoJSNodeData {
  key: string;
  text: string;
  attributes?: EntityAttribute[];
  loc?: string;
}

export interface GoJSLinkData {
  key: string;
  from: string;
  to: string;
  text?: string;
}
