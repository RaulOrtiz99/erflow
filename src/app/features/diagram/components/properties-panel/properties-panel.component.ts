// src/app/features/diagram/components/properties-panel/properties-panel.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Entity, EntityAttribute } from '../../../../core/models/diagram.model';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="properties-panel" *ngIf="entityForm">
      <div class="panel-header">
        <h3>Propiedades de la Entidad</h3>
        <button class="close-btn" (click)="closePanel()">×</button>
      </div>

      <form [formGroup]="entityForm" (ngSubmit)="saveChanges()">
        <!-- Nombre de la entidad -->
        <div class="form-group">
          <label>Nombre de la Entidad:</label>
          <input type="text" formControlName="name" class="form-control">
        </div>

        <!-- Lista de atributos -->
        <div class="attributes-section">
          <h4>Atributos</h4>
          <div formArrayName="attributes">
            <div *ngFor="let attribute of attributes.controls; let i=index"
                 [formGroupName]="i"
                 class="attribute-item">

              <input type="text" formControlName="name" placeholder="Nombre">

              <select formControlName="type">
                <option value="string">Texto</option>
                <option value="number">Número</option>
                <option value="date">Fecha</option>
                <option value="boolean">Booleano</option>
              </select>

              <div class="attribute-options">
                <label>
                  <input type="checkbox" formControlName="isPrimaryKey">
                  PK
                </label>
                <label>
                  <input type="checkbox" formControlName="isRequired">
                  Requerido
                </label>
              </div>

              <button type="button" (click)="removeAttribute(i)" class="remove-btn">
                ×
              </button>
            </div>
          </div>

          <button type="button" (click)="addAttribute()" class="add-btn">
            + Añadir Atributo
          </button>
        </div>

        <div class="panel-footer">
          <button type="submit" class="save-btn">Guardar Cambios</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .properties-panel {
      padding: 1rem;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .attribute-item {
      display: grid;
      grid-template-columns: 1fr 1fr auto auto;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      align-items: center;
    }

    .attribute-options {
      display: flex;
      gap: 0.5rem;
    }

    .add-btn, .save-btn {
      width: 100%;
      padding: 0.5rem;
      margin-top: 1rem;
      background-color: #1565C0;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .remove-btn {
      padding: 0.25rem 0.5rem;
      background-color: #ff4444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class PropertiesPanelComponent {
  @Input() set entity(value: Entity | null) {
    if (value) {
      this.initializeForm(value);
    }
  }

  @Output() saveEntity = new EventEmitter<Entity>();
  @Output() close = new EventEmitter<void>();

  entityForm: FormGroup | null = null;

  constructor(private fb: FormBuilder) {}

  private initializeForm(entity: Entity) {
    this.entityForm = this.fb.group({
      id: [entity.id],
      name: [entity.name],
      attributes: this.fb.array(
        entity.attributes.map(attr => this.createAttributeGroup(attr))
      )
    });
  }

  private createAttributeGroup(attribute?: EntityAttribute) {
    return this.fb.group({
      id: [attribute?.id || this.generateId()],
      name: [attribute?.name || ''],
      type: [attribute?.type || 'string'],
      isPrimaryKey: [attribute?.isPrimaryKey || false],
      isRequired: [attribute?.isRequired || false]
    });
  }

  get attributes() {
    return this.entityForm?.get('attributes') as FormArray;
  }

  addAttribute() {
    this.attributes.push(this.createAttributeGroup());
  }

  removeAttribute(index: number) {
    this.attributes.removeAt(index);
  }

  saveChanges() {
    if (this.entityForm?.valid) {
      this.saveEntity.emit(this.entityForm.value);
    }
  }

  closePanel() {
    this.close.emit();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
