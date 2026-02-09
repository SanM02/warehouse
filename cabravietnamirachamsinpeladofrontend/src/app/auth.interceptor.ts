import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, retryWhen, mergeMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      // Reintentar automáticamente en errores de red
      retryWhen(errors => 
        errors.pipe(
          mergeMap((error, index) => {
            // Solo reintentar errores de conexión (no errores 401, 403, etc.)
            if (
              error instanceof HttpErrorResponse && 
              (error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504) &&
              index < 3 // Máximo 3 reintentos
            ) {
              console.log(`🔄 Reintentando conexión (intento ${index + 1}/3)...`);
              // Esperar 1 segundo antes de reintentar
              return timer(1000);
            }
            // Si no es reintentable o excedió reintentos, lanzar el error
            return throwError(() => error);
          })
        )
      ),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expirado o inválido
          console.warn('⚠️ Token expirado, redirigiendo a login...');
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          this.router.navigate(['/login']);
        } else if (error.status === 0) {
          // Error de red - servidor no disponible
          console.error('❌ Error de conexión: Servidor no disponible');
        }
        return throwError(() => error);
      })
    );
  }
}

