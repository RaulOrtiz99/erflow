// src/app/core/services/code-generator.service.ts

import { Injectable } from '@angular/core';
import { Entity, EntityAttribute, Relationship } from '../models/diagram.model';

@Injectable({
  providedIn: 'root'
})
export class CodeGeneratorService {
  constructor() {}

  generateJpaEntities(entities: Entity[], relationships: Relationship[]): string {
    // Primero creamos un mapa de relaciones por entidad para facilitar el acceso
    const relationshipMap = this.createRelationshipMap(relationships);

    // Generamos el código para cada entidad
    const entityCodes = entities.map(entity =>
      this.generateEntityCode(entity, relationshipMap[entity.id] || [])
    );

    // Unimos todo el código con separadores apropiados
    return entityCodes.join('\n\n');
  }

  private createRelationshipMap(relationships: Relationship[]): Record<string, Relationship[]> {
    // Agrupamos las relaciones por entidad para facilitar su procesamiento
    const relationshipMap: Record<string, Relationship[]> = {};

    relationships.forEach(rel => {
      // Agregamos la relación a ambas entidades involucradas
      if (!relationshipMap[rel.fromEntity]) {
        relationshipMap[rel.fromEntity] = [];
      }
      if (!relationshipMap[rel.toEntity]) {
        relationshipMap[rel.toEntity] = [];
      }

      relationshipMap[rel.fromEntity].push(rel);
      relationshipMap[rel.toEntity].push(rel);
    });

    return relationshipMap;
  }

  private generateEntityCode(entity: Entity, relationships: Relationship[]): string {
    const imports = this.generateImports();
    const classAnnotations = this.generateClassAnnotations(entity);
    const attributes = this.generateAttributes(entity.attributes);
    const relationshipFields = this.generateRelationshipFields(entity.id, relationships);

    return `
${imports}

${classAnnotations}
public class ${this.formatClassName(entity.name)} {
    ${attributes}

    ${relationshipFields}

    ${this.generateGettersAndSetters(entity, relationships)}
}`;
  }

  private generateImports(): string {
    return `
import javax.persistence.*;
import java.util.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;`;
  }

  private generateClassAnnotations(entity: Entity): string {
    return `
@Entity
@Table(name = "${this.formatTableName(entity.name)}")
@Getter
@Setter`;
  }

  private generateAttributes(attributes: EntityAttribute[]): string {
    return attributes.map(attr => {
      const annotations = [];

      if (attr.isPrimaryKey) {
        annotations.push('@Id');
        annotations.push('@GeneratedValue(strategy = GenerationType.IDENTITY)');
      }

      annotations.push(`@Column(name = "${this.formatColumnName(attr.name)}"${
        attr.isRequired ? ', nullable = false' : ''
      })`);

      return `
    ${annotations.join('\n    ')}
    private ${this.mapAttributeType(attr.type)} ${this.formatAttributeName(attr.name)};`;
    }).join('\n');
  }

  private generateRelationshipFields(entityId: string, relationships: Relationship[]): string {
    return relationships.map(rel => {
      const isSource = rel.fromEntity === entityId;
      const otherEntity = isSource ? rel.toEntity : rel.fromEntity;

      switch (rel.type) {
        case '1-1':
          return this.generateOneToOneRelationship(rel, isSource, otherEntity);
        case '1-N':
          return this.generateOneToManyRelationship(rel, isSource, otherEntity);
        case 'N-M':
          return this.generateManyToManyRelationship(rel, isSource, otherEntity);
        default:
          return '';
      }
    }).join('\n\n');
  }

  private generateOneToOneRelationship(rel: Relationship, isSource: boolean, otherEntityId: string): string {
    const annotation = isSource ? '@OneToOne' : '@OneToOne(mappedBy = "${this.formatAttributeName(rel.name)}")';
    return `
    ${annotation}
    private ${this.formatClassName(rel.name)} ${this.formatAttributeName(rel.name)};`;
  }

  private generateOneToManyRelationship(rel: Relationship, isSource: boolean, otherEntityId: string): string {
    if (isSource) {
      return `
    @OneToMany(mappedBy = "${this.formatAttributeName(rel.name)}", cascade = CascadeType.ALL)
    private List<${this.formatClassName(rel.name)}> ${this.formatAttributeName(rel.name)}List = new ArrayList<>();`;
    } else {
      return `
    @ManyToOne
    @JoinColumn(name = "${this.formatColumnName(rel.name)}_id")
    private ${this.formatClassName(rel.name)} ${this.formatAttributeName(rel.name)};`;
    }
  }

  private generateManyToManyRelationship(rel: Relationship, isSource: boolean, otherEntityId: string): string {
    const annotation = isSource
      ? `@ManyToMany\n    @JoinTable(name = "${this.formatTableName(rel.name)}")`
      : `@ManyToMany(mappedBy = "${this.formatAttributeName(rel.name)}List")`;

    return `
    ${annotation}
    private Set<${this.formatClassName(rel.name)}> ${this.formatAttributeName(rel.name)}Set = new HashSet<>();`;
  }

  private generateGettersAndSetters(entity: Entity, relationships: Relationship[]): string {
    // Como estamos usando Lombok con @Getter y @Setter, no necesitamos generar estos métodos
    return '';
  }

  // Utilidades de formateo
  private formatClassName(name: string): string {
    return this.toPascalCase(name);
  }

  private formatTableName(name: string): string {
    return this.toSnakeCase(name).toLowerCase();
  }

  private formatColumnName(name: string): string {
    return this.toSnakeCase(name).toLowerCase();
  }

  private formatAttributeName(name: string): string {
    return this.toCamelCase(name);
  }

  private mapAttributeType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': 'Long',
      'decimal': 'BigDecimal',
      'date': 'LocalDateTime',
      'boolean': 'Boolean'
    };
    return typeMap[type] || 'String';
  }

  private toPascalCase(str: string): string {
    return str.split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toSnakeCase(str: string): string {
    return str.split(/(?=[A-Z])|[-\s]+/)
      .map(word => word.toLowerCase())
      .join('_');
  }
}
