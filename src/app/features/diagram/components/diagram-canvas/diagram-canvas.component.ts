// Actualizar src/app/features/diagram/components/diagram-canvas/diagram-canvas.component.ts

import {DiagramService} from '../../../../core/services/diagram.service';
import {CodeGeneratorService} from '../../../../core/services/code-generator.service';
import { firstValueFrom } from 'rxjs';

export class DiagramCanvasComponent {
  constructor(
    private diagramService: DiagramService,
    private codeGeneratorService: CodeGeneratorService
  ) {}

  // Método para exportar el diagrama a código JPA
  async exportToJpa() {
    const currentDiagram = await firstValueFrom(this.diagramService.getCurrentDiagram());
    if (!currentDiagram) return;

    const jpaCode = this.codeGeneratorService.generateJpaEntities(
      currentDiagram.entities,
      currentDiagram.relationships
    );

    // Creamos un archivo para descargar
    const blob = new Blob([jpaCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'entities.java';
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
