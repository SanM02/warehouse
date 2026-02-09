import { Routes } from '@angular/router';
import { TablesComponent } from './tables/tables.component';
import { FacturacionComponent } from './facturacion.component';
import { HistorialFacturasComponent } from './historial-facturas.component';
import { Tables2Component } from './tables2.component';
import { StaticNavigationComponent } from './static-navigation.component';
import { LightSidenavComponent } from './light-sidenav.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { LogoutComponent } from './logout.component';
import { ForgotPasswordComponent } from './forgot-password.component';
import { Error401Component } from './error401.component';
import { Error404Component } from './error404.component';
import { Error500Component } from './error500.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProveedoresComponent } from './proveedores.component';
import { OrdenesCompraComponent } from './ordenes-compra.component';
import { RecepcionesComponent } from './recepciones.component';
import { ProductoProveedorComponent } from './producto-proveedor.component';
import { ClientesComponent } from './clientes.component';
import { FacturasCompraComponent } from './facturas-compra.component';

import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'logout', component: LogoutComponent },
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'tables', component: TablesComponent, canActivate: [AuthGuard] },
  { path: 'tables2', component: Tables2Component, canActivate: [AuthGuard] },
  { path: 'static-navigation', component: StaticNavigationComponent, canActivate: [AuthGuard] },
  { path: 'light-sidenav', component: LightSidenavComponent, canActivate: [AuthGuard] },
  { path: 'facturacion', component: FacturacionComponent, canActivate: [AuthGuard] },
  { path: 'historial-facturas', component: HistorialFacturasComponent, canActivate: [AuthGuard] },
  { path: 'proveedores', component: ProveedoresComponent, canActivate: [AuthGuard] },
  { path: 'ordenes-compra', component: OrdenesCompraComponent, canActivate: [AuthGuard] },
  { path: 'recepciones', component: RecepcionesComponent, canActivate: [AuthGuard] },
  { path: 'producto-proveedor', component: ProductoProveedorComponent, canActivate: [AuthGuard] },
  { path: 'clientes', component: ClientesComponent, canActivate: [AuthGuard] },
  { path: 'facturas-compra', component: FacturasCompraComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: '401', component: Error401Component },
  { path: '404', component: Error404Component },
  { path: '500', component: Error500Component },
  { path: '**', redirectTo: '/404' }
];