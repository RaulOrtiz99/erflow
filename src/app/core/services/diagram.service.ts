import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ErrorHandlerService } from './error-handler.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { DiagramData, Entity, Relationship, RelationType, EntityAttribute } from '../models/diagram.model';
import * as go from 'gojs';

@Injectable({
  providedIn: 'root'
})
export class DiagramService {
  private diagram: go.Diagram | null = null;
  private currentDiagramSubject = new BehaviorSubject<DiagramData | null>(null);
  private selectedEntitySubject = new BehaviorSubject<Entity | null>(null);

  constructor(
    private supabaseService: SupabaseService,
    private errorHandler: ErrorHandlerService
  ) {}

  initializeDiagram(divId: string): void {
    try {
      const $ = go.GraphObject.make;
      this.diagram = $(go.Diagram, divId, {
        // Configuraciones básicas mejoradas
        "undoManager.isEnabled": true,
        "draggingTool.dragsLink": true,
        "draggingTool.isGridSnapped": true,
        "grid.visible": true,
        "grid.gridCellSize": new go.Size(10, 10),
        "resizingTool.isGridSnapped": true,
        "linkingTool.direction": go.LinkingTool.ForwardsOnly,
        "linkingTool.portGravity": 20,
        "relinkingTool.fromHandleArchetype": $(go.Shape, "Diamond", { width: 8, height: 8, fill: "darkred" }),
        "rotatingTool.handleAngle": 270,
        "clickCreatingTool.archetypeNodeData": {
          category: "entity",
          key: this.createUniqueId(),
          name: "Nueva Entidad",
          attributes: [],
          loc: "0 0"
        },
        model: $(go.GraphLinksModel, {
          nodeKeyProperty: "key",
          linkKeyProperty: "key",
          linkFromPortIdProperty: "fromPort",
          linkToPortIdProperty: "toPort",
          modelData: { position: new go.Point(0, 0) }
        })
      });

      this.configureEntityTemplate();
      this.configureRelationshipTemplate();
      this.setupDiagramListeners();
      this.setupContextMenu();

    } catch (error) {
      if (error instanceof Error) {
        this.errorHandler.addError(`Error al inicializar el diagrama: ${error.message}`);
      } else {
        this.errorHandler.addError('Error al inicializar el diagrama');
      }
    }
  }
  private handleDiagramChanges(): void {
    if (!this.diagram) return;

    try {
      const model = this.diagram.model as go.GraphLinksModel;

      const diagramData: DiagramData = {
        entities: this.convertNodesToEntities(model.nodeDataArray),
        relationships: this.convertLinksToRelationships(model.linkDataArray),
        version: 1,
        last_modified: new Date(),
        last_modified_by: this.supabaseService.getCurrentUserSync()?.id || ''
      };

      this.currentDiagramSubject.next(diagramData);
    } catch (error) {
      this.handleError(error);
    }
  }

// Métodos auxiliares para la conversión de datos
  private convertNodesToEntities(nodeDataArray: any[]): Entity[] {
    return nodeDataArray.map(node => ({
      id: node.key,
      name: node.name || '',
      attributes: node.attributes || [],
      position: {
        x: node.loc ? parseFloat(node.loc.split(' ')[0]) : 0,
        y: node.loc ? parseFloat(node.loc.split(' ')[1]) : 0
      }
    }));
  }

  private convertLinksToRelationships(linkDataArray: any[]): Relationship[] {
    return linkDataArray.map(link => ({
      id: link.key,
      fromEntity: link.from,
      toEntity: link.to,
      type: this.validateRelationType(link.type || '1-1'),
      name: link.text || ''
    }));
  }
  //todo: metodos nuevos//
  // Agregar el método configureRelationshipTemplate
  private configureRelationshipTemplate(): void {
    if (!this.diagram) return;

    const $ = go.GraphObject.make;
    this.diagram.linkTemplate = $(go.Link,
      {
        routing: go.Link.AvoidsNodes,
        curve: go.Link.JumpOver,
        corner: 10,
        reshapable: true,
        relinkableFrom: true,
        relinkableTo: true,
        selectionAdormentTemplate:
          $(go.Adornment,
            $(go.Shape, { isPanelMain: true, stroke: "#1565C0", strokeWidth: 2 }),
            $(go.Shape, { toArrow: "Standard", stroke: "#1565C0", fill: "#1565C0" })
          )
      },
      $(go.Shape, { strokeWidth: 1.5, stroke: "#1565C0" }),
      $(go.Shape, { toArrow: "Standard", stroke: "#1565C0", fill: "#1565C0" }),
      $(go.Panel, "Auto",
        {
          segmentOffset: new go.Point(0, -10),
          segmentOrientation: go.Link.OrientUpright
        },
        $(go.Shape, "Rectangle", {
          fill: "white",
          stroke: "#1565C0",
          strokeWidth: 1
        }),
        $(go.TextBlock, {
            margin: 5,
            editable: true,
            font: "bold 10px sans-serif",
            stroke: "#1565C0"
          },
          new go.Binding("text", "type").makeTwoWay())
      )
    );
  }

// Agregar el método setupDiagramListeners
  private setupDiagramListeners(): void {
    if (!this.diagram) return;

    // Escuchamos cambios en el modelo
    this.diagram.addModelChangedListener(e => {
      if (e.isTransactionFinished) {
        this.handleDiagramChanges();
      }
    });

    // Manejamos selección de entidades
    // @ts-ignore
    this.diagram.addDiagramListener("SelectionChanged", e => {
      const node = this.diagram?.selection.first();
      if (node instanceof go.Node) {
        this.selectedEntitySubject.next({
          id: node.data.key,
          name: node.data.name,
          attributes: node.data.attributes || [],
          position: {
            x: node.location.x,
            y: node.location.y
          }
        });
      } else {
        this.selectedEntitySubject.next(null);
      }
    });
  }

// Agregar el método setupContextMenu
  private setupContextMenu(): void {
    if (!this.diagram) return;

    const $ = go.GraphObject.make;

    // Creamos un menú contextual más robusto
    const contextMenu = $(go.Adornment, "Vertical",
      {
        background: "whitesmoke"
      },
      $(go.Panel, "Horizontal",
        {
          stretch: go.GraphObject.Horizontal,
          background: "#1565C0",
          height: 30
        },
        $(go.TextBlock, "Opciones del Diagrama", {
          alignment: go.Spot.Center,
          stroke: "white",
          font: "12px sans-serif",
          margin: 5
        })
      ),
      $(go.Panel, "Vertical",
        {
          defaultStretch: go.GraphObject.Horizontal,
          margin: 5
        },
        $("ContextMenuButton",
          $(go.Panel, "Horizontal",
            {
              alignment: go.Spot.Left,
              alignmentFocus: go.Spot.Left
            },
            $(go.TextBlock, "Nueva Entidad", {
              margin: 5,
              font: "11px sans-serif"
            })
          ),
          {
            click: (e: go.InputEvent, obj: go.GraphObject) => {
              const diagram = obj.part?.diagram;
              if (diagram) {
                const pt = diagram.lastInput.documentPoint;
                this.addEntityAtPoint(pt);
              }
            }
          }
        ),
        $("ContextMenuButton",
          $(go.Panel, "Horizontal",
            {
              alignment: go.Spot.Left,
              alignmentFocus: go.Spot.Left
            },
            $(go.TextBlock, "Limpiar Diagrama", {
              margin: 5,
              font: "11px sans-serif"
            })
          ),
          { click: () => this.clearDiagram() }
        )
      )
    );

    this.diagram.contextMenu = contextMenu;
  }

// Agregar el método addAttributeToEntity
  private addAttributeToEntity(nodeData: any): void {
    if (!this.diagram) return;

    const model = this.diagram.model as go.GraphLinksModel;
    const attributes = [...(nodeData.attributes || [])];

    attributes.push({
      id: this.createUniqueId(),
      name: "Nuevo Atributo",
      type: "string",
      isPrimaryKey: false,
      isRequired: false
    });

    model.startTransaction('add attribute');
    model.setDataProperty(nodeData, "attributes", attributes);
    model.commitTransaction('add attribute');
  }

// Agregar el método removeEntity
  private removeEntity(nodeData: any): void {
    if (!this.diagram || !nodeData) return;

    const model = this.diagram.model as go.GraphLinksModel;
    model.startTransaction('remove entity');
    model.removeNodeData(nodeData);
    model.commitTransaction('remove entity');
  }

// Actualizar el método createUniqueId
  private createUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

// Agregar método para manejar errores tipo-seguro
  private handleError(error: Error | unknown): void {
    if (error instanceof Error) {
      this.errorHandler.addError(error.message);
    } else {
      this.errorHandler.addError('Ha ocurrido un error desconocido');
    }
  }

// Agregar método para limpiar el diagrama
  public clearDiagram(): void {
    if (!this.diagram) return;

    const model = this.diagram.model as go.GraphLinksModel;
    model.startTransaction('clear diagram');
    model.nodeDataArray = [];
    model.linkDataArray = [];
    model.commitTransaction('clear diagram');
  }

  private validateRelationType(type: string): RelationType {
    const validTypes: RelationType[] = ['1-1', '1-N', 'N-M'];
    return validTypes.includes(type as RelationType) ? type as RelationType : '1-1';
  }
// Método auxiliar para añadir entidad en una posición específica
  private addEntityAtPoint(point: go.Point): void {
    if (!this.diagram || !point) return;

    // Convertimos el punto de documento a coordenadas del diagrama
    const documentPoint = this.diagram.transformDocToView(point);

    const entity: Entity = {
      id: this.createUniqueId(),
      name: "Nueva Entidad",
      attributes: [],
      position: {
        x: documentPoint.x,
        y: documentPoint.y
      }
    };

    const model = this.diagram.model as go.GraphLinksModel;
    model.startTransaction('add entity');
    try {
      model.addNodeData({
        key: entity.id,
        name: entity.name,
        attributes: entity.attributes,
        loc: `${documentPoint.x} ${documentPoint.y}`,
        category: "entity"
      });
      model.commitTransaction('add entity');
    } catch (error) {
      model.rollbackTransaction();
      this.handleError(error);
    }
  }

  private configureEntityTemplate(): void {
    if (!this.diagram) return;

    const $ = go.GraphObject.make;
    this.diagram.nodeTemplate = $(go.Node, "Auto",
      {
        locationSpot: go.Spot.Center,
        resizable: true,
        resizeObjectName: "SHAPE",
        locationObjectName: "SHAPE",
        desiredSize: new go.Size(160, 100),
        minSize: new go.Size(100, 50),
        selectionAdornmentTemplate: this.createSelectionAdornment($)
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      $(go.Shape, "Rectangle",
        {
          name: "SHAPE",
          fill: "white",
          strokeWidth: 2,
          stroke: "#1565C0",
          portId: "",
          cursor: "pointer"
        }),
      $(go.Panel, "Vertical",
        { margin: 8 },
        // Título de la entidad
        $(go.TextBlock,
          {
            margin: new go.Margin(4, 4, 0, 4),
            font: "bold 14px sans-serif",
            editable: true,
            stroke: "#1565C0"
          },
          new go.Binding("text", "name").makeTwoWay()),
        // Panel de atributos
        $(go.Panel, "Vertical",
          {
            itemTemplate: this.createAttributeTemplate($),
            margin: new go.Margin(4, 0)
          },
          new go.Binding("itemArray", "attributes"))
      )
    );
  }

  private createAttributeTemplate($: any): go.Panel {
    return $(go.Panel, "Horizontal",
      { margin: new go.Margin(4, 0) },
      $(go.TextBlock,
        { stroke: "#424242" },
        new go.Binding("text", "name")),
      $(go.TextBlock,
        { margin: new go.Margin(0, 0, 0, 5), stroke: "#757575" },
        new go.Binding("text", "type")),
      $(go.TextBlock,
        { stroke: "#1565C0", visible: false },
        new go.Binding("visible", "isPrimaryKey"),
        " 🔑")
    );
  }

  private createSelectionAdornment($: any): go.Adornment {
    // Creamos un adorner más robusto con mejor manejo de tipos
    const adorner = $(go.Adornment, "Spot",
      $(go.Panel, "Auto",
        $(go.Shape, {
          fill: null,
          stroke: "#1565C0",
          strokeWidth: 2
        }),
        $(go.Placeholder)  // Este es crucial para mostrar el contenido seleccionado
      ),
      // Botón para añadir atributo
      $(go.Panel, "Auto",
        {
          alignment: go.Spot.Top,
          alignmentFocus: go.Spot.Bottom,
          cursor: "pointer",
          click: (e: go.InputEvent, obj: go.GraphObject) => {
            // Accedemos al nodo de manera segura
            const adornment = obj.part as go.Adornment;
            if (adornment && adornment.adornedPart) {
              const node = adornment.adornedPart as go.Node;
              if (node.data) {
                this.addAttributeToEntity(node.data);
              }
            }
          }
        },
        $(go.Shape, "RoundedRectangle", {
          fill: "#1565C0",
          stroke: null
        }),
        $(go.TextBlock, "Añadir Atributo", {
          margin: 3,
          stroke: "white",
          font: "10px sans-serif"
        })
      ),
      // Botón para eliminar entidad
      $(go.Panel, "Auto",
        {
          alignment: go.Spot.Bottom,
          alignmentFocus: go.Spot.Top,
          cursor: "pointer",
          click: (e: go.InputEvent, obj: go.GraphObject) => {
            const adornment = obj.part as go.Adornment;
            if (adornment && adornment.adornedPart) {
              const node = adornment.adornedPart as go.Node;
              if (node.data) {
                this.removeEntity(node.data);
              }
            }
          }
        },
        $(go.Shape, "RoundedRectangle", {
          fill: "#1565C0",
          stroke: null
        }),
        $(go.TextBlock, "Eliminar", {
          margin: 3,
          stroke: "white",
          font: "10px sans-serif"
        })
      )
    );

    return adorner;
  }


  private makeButton($: any, text: string, props: object, action: (e: go.InputEvent, obj: go.GraphObject) => void): go.Panel {
    return $(go.Panel, "Auto",
      Object.assign({
        margin: 3,
        cursor: "pointer"
      }, props),
      $(go.Shape, "RoundedRectangle",
        { fill: "#1565C0", stroke: null }),
      $(go.TextBlock, text,
        {
          margin: 3,
          stroke: "white",
          font: "10px sans-serif"
        }),
      { click: action }
    );
  }

  // Métodos públicos para manipular el diagrama

  addEntity(position?: go.Point): void {
    if (!this.diagram) return;

    const entity: Entity = {
      id: this.createUniqueId(),
      name: "Nueva Entidad",
      attributes: [],
      position: position ? { x: position.x, y: position.y } : { x: 0, y: 0 }
    };

    const model = this.diagram.model as go.GraphLinksModel;
    model.addNodeData({
      key: entity.id,
      name: entity.name,
      attributes: entity.attributes,
      loc: `${entity.position.x} ${entity.position.y}`
    });
  }

  updateEntity(entityData: Entity): void {
    if (!this.diagram) return;

    try {
      const model = this.diagram.model as go.GraphLinksModel;
      const nodeData = model.findNodeDataForKey(entityData.id);

      if (nodeData) {
        model.startTransaction('update entity');
        model.setDataProperty(nodeData, "name", entityData.name);
        model.setDataProperty(nodeData, "attributes", entityData.attributes);
        model.commitTransaction('update entity');
      }
    } catch (error) {
      if (error instanceof Error) {
        this.errorHandler.addError('Error al actualizar la entidad: ' + error.message);
      } else {
        this.errorHandler.addError('Error al actualizar la entidad');
      }
    }
  }

  async saveDiagramChanges(roomId: string): Promise<void> {
    try {
      const currentData = this.currentDiagramSubject.value;
      if (!currentData) throw new Error('No hay datos del diagrama para guardar');

      const { error } = await this.supabaseService.client
        .from('rooms')
        .update({
          diagram_data: currentData,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        this.errorHandler.addError('Error al guardar el diagrama: ' + error.message);
      } else {
        this.errorHandler.addError('Error al guardar el diagrama');
      }
      throw error;
    }
  }

  // Getters y observables
  getCurrentDiagram(): Observable<DiagramData | null> {
    return this.currentDiagramSubject.asObservable();
  }

  getSelectedEntity(): Observable<Entity | null> {
    return this.selectedEntitySubject.asObservable();
  }

  // Método para exportar el diagrama actual
  exportDiagram(format: 'svg' | 'png' | 'json'): Promise<string | Blob> | string {
    if (!this.diagram) throw new Error('El diagrama no está inicializado');

    switch (format) {
      case 'svg': {
        const svg = this.diagram.makeSvg({ scale: 1 });
        if (!svg) throw new Error('No se pudo generar el SVG');
        return svg.outerHTML;
      }
      case 'png': {
        return new Promise((resolve, reject) => {
          this.diagram?.makeImageData({
            background: "white",
            returnType: "blob",
            callback: (blob: Blob) => resolve(blob)
          });
        });
      }
      case 'json':
        return JSON.stringify(this.currentDiagramSubject.value, null, 2);
      default:
        throw new Error('Formato no soportado');
    }
  }

  updateEntityPosition(entityData: { id: string, position: { x: number, y: number } }): void {
    if (!this.diagram) return;

    const model = this.diagram.model as go.GraphLinksModel;
    const nodeData = model.findNodeDataForKey(entityData.id);
    
    if (nodeData) {
      model.setDataProperty(nodeData, "loc", `${entityData.position.x} ${entityData.position.y}`);
    }
  }

  updateRelationship(relationshipData: Relationship): void {
    if (!this.diagram) return;

    const model = this.diagram.model as go.GraphLinksModel;
    const linkData = model.findLinkDataForKey(relationshipData.id);
    
    if (linkData) {
      model.startTransaction('update relationship');
      model.setDataProperty(linkData, "from", relationshipData.fromEntity);
      model.setDataProperty(linkData, "to", relationshipData.toEntity);
      model.setDataProperty(linkData, "type", relationshipData.type);
      model.setDataProperty(linkData, "text", relationshipData.name);
      model.commitTransaction('update relationship');
    }
  }

}
