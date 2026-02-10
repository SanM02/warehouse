import { Component, Renderer2, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getUsernameFromToken } from './jwt.utils';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Front_ferre';
  sidebarOpen = true;
  isBrowser: boolean;
  username: string | null = null;
  isLoginPage = false;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  goToDashboard() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/']);
  }

  goToTables() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/tables']);
  }

  goToTables2() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/tables2']);
  }


  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.isBrowser) {
      if (!this.sidebarOpen) {
        this.renderer.addClass(document.body, 'sb-sidenav-toggled');
      } else {
        this.renderer.removeClass(document.body, 'sb-sidenav-toggled');
      }
    }
  }


  goToFacturacion() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/facturacion']);
  }

  goToHistorialFacturas() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/historial-facturas']);
  }

  goToProveedores() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/proveedores']);
  }

  goToClientes() {
    this.updateUsername();
    this.router.navigate(['/clientes']);
  }

  goToOrdenesCompra() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/ordenes-compra']);
  }

  goToRecepciones() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/recepciones']);
  }

  goToFacturasCompra() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/facturas-compra']);
  }

  goToProductoProveedor() {
    this.updateUsername(); // Refrescar usuario al navegar
    this.router.navigate(['/producto-proveedor']);
  }

  ngOnInit() {
    // Detectar ruta de login
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isLoginPage = event.urlAfterRedirects === '/login' || event.url === '/login';
      this.updateBodyClass();
    });

    // Verificar ruta inicial
    this.isLoginPage = this.router.url === '/login';

    // Asegura que la clase no quede pegada al recargar
    if (this.isBrowser) {
      this.renderer.removeClass(document.body, 'sb-sidenav-toggled');
      this.updateBodyClass();
      this.updateUsername();
    }
  }

  updateBodyClass() {
    if (this.isBrowser) {
      if (this.isLoginPage) {
        this.renderer.removeClass(document.body, 'sb-nav-fixed');
        this.renderer.addClass(document.body, 'login-page');
      } else {
        this.renderer.addClass(document.body, 'sb-nav-fixed');
        this.renderer.removeClass(document.body, 'login-page');
      }
    }
  }

  updateUsername() {
    if (this.isBrowser) {
      const token = localStorage.getItem('token');
      const savedUsername = localStorage.getItem('username');
      
      if (token) {
        // Priorizar el username guardado directamente en localStorage
        if (savedUsername) {
          this.username = savedUsername;
          console.log('Username from localStorage:', this.username);
        } else {
          // Si no hay username guardado, intentar extraerlo del token
          this.username = getUsernameFromToken(token);
          console.log('Username from token:', this.username);
          
          // Si no se puede extraer del token, el usuario necesita hacer login de nuevo
          if (!this.username) {
            console.log('No username found, user might need to login again');
            this.username = null;
          }
        }
      } else {
        // Sin token, no hay usuario logueado
        this.username = null;
        console.log('No token found');
      }
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('username'); // También limpiar el username guardado
    }
    this.username = null;
    this.router.navigate(['/login']);
  }
}
