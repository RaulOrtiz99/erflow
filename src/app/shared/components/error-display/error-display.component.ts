// src/app/shared/components/error-display/error-display.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorHandlerService, ErrorMessage } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-container">
      <div *ngFor="let error of errors"
           class="error-message"
           [ngClass]="error.type">
        <span class="message">{{ error.message }}</span>
        <button class="close-btn" (click)="dismissError(error)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 350px;
    }

    .error-message {
      padding: 12px 20px;
      margin-bottom: 10px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .error { background-color: #f44336; color: white; }
    .warning { background-color: #ff9800; color: white; }
    .info { background-color: #2196f3; color: white; }

    .close-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0 5px;
      font-size: 20px;
    }
  `]
})
export class ErrorDisplayComponent implements OnInit {
  errors: ErrorMessage[] = [];

  constructor(private errorHandler: ErrorHandlerService) {}

  ngOnInit() {
    this.errorHandler.getErrors().subscribe(errors => {
      this.errors = errors;
    });
  }

  dismissError(error: ErrorMessage) {
    this.errorHandler.removeError(error);
  }
}
