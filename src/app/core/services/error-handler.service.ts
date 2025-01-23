// src/app/core/services/error-handler.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ErrorMessage {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private errorsSubject = new BehaviorSubject<ErrorMessage[]>([]);

  addError(
    message: string,
    type: 'error' | 'warning' | 'info' = 'error'
  ): void {
    const currentErrors = this.errorsSubject.value;
    const newError: ErrorMessage = {
      message,
      type,
      timestamp: new Date(),
    };

    this.errorsSubject.next([...currentErrors, newError]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeError(newError);
    }, 5000);
  }

  removeError(error: ErrorMessage): void {
    const currentErrors = this.errorsSubject.value;
    this.errorsSubject.next(
      currentErrors.filter((e) => e.timestamp !== error.timestamp)
    );
  }

  getErrors(): Observable<ErrorMessage[]> {
    return this.errorsSubject.asObservable();
  }

  clearErrors(): void {
    this.errorsSubject.next([]);
  }
}
