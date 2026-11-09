import { Cliente } from './pages/dashboard/cliente/cliente';
import { Comercial } from './pages/dashboard/comercial/comercial';
import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Shop } from './pages/shop/shop';
import { Home } from './pages/shop/home/home';
import { VestidorVirtual } from './pages/shop/vestidor-virtual/vestidor-virtual';
import { ShopColecciones } from './pages/shop/colecciones/colecciones';
import { Dashboard } from './pages/dashboard/dashboard';
import { Categorias } from './pages/dashboard/categorias/categorias';
import { Productos } from './pages/dashboard/productos/productos';
import { Sucursales } from './pages/dashboard/sucursales/sucursales';
import { TallasColores } from './pages/dashboard/tallas-colores/tallas-colores';
import { Inventario } from './pages/dashboard/inventario/inventario';
import { Usuarios } from './pages/dashboard/usuarios/usuarios';
import { Perfil } from './pages/dashboard/perfil/perfil';
import { Ventas } from './pages/dashboard/ventas/ventas';
import { HistorialVentas } from './pages/dashboard/historial-ventas/historial-ventas';
import { Reportes } from './pages/dashboard/reportes/reportes';
import { Proveedores } from './pages/dashboard/proveedores/proveedores';
import { Colecciones } from './pages/dashboard/colecciones/colecciones';
import { Reservas } from './pages/dashboard/reservas/reservas';
import { Devoluciones } from './pages/dashboard/devoluciones/devoluciones';
import { MisProductos } from './pages/dashboard/mis-productos/mis-productos';
import { Delivery } from './pages/dashboard/delivery/delivery';
import { SaasComponent } from './pages/dashboard/saas/saas';
import { BitacoraComponent } from './pages/dashboard/bitacora/bitacora';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: Shop,
    children: [
      { path: '', component: Home },
      { path: 'colecciones', component: ShopColecciones },
      { path: 'vestidor-virtual', component: VestidorVirtual },
    ],
  },
  { path: 'login', component: Login },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      {
        path: 'productos',
        component: Productos,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Encargado', 'AdministradorPlataforma'] },
      },
      {
        path: 'categorias',
        component: Categorias,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Encargado', 'AdministradorPlataforma'] },
      },
      {
        path: 'colecciones',
        component: Colecciones,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Encargado', 'AdministradorPlataforma'] },
      },
      {
        path: 'proveedores',
        component: Proveedores,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'AdministradorPlataforma'] },
      },
      {
        path: 'sucursales',
        component: Sucursales,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'AdministradorPlataforma'] },
      },
      {
        path: 'variantes',
        component: TallasColores,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Encargado', 'AdministradorPlataforma'] },
      },
      {
        path: 'inventario',
        component: Inventario,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Encargado', 'Proveedor', 'Cajero', 'AdministradorPlataforma'] },
      },
      {
        path: 'usuarios',
        component: Usuarios,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'AdministradorPlataforma'] },
      },
      {
        path: 'bitacora',
        component: BitacoraComponent,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'AdministradorPlataforma'] },
      },
      {
        path: 'ventas',
        component: Ventas,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Cajero', 'Encargado', 'AdministradorPlataforma'] },
      },
      {
        path: 'reservas',
        component: Reservas,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Encargado', 'AdministradorPlataforma'] },
      },
      {
        path: 'historial-ventas',
        component: HistorialVentas,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Encargado', 'AdministradorPlataforma'] },
      },
      {
        path: 'reportes',
        component: Reportes,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'AdministradorPlataforma'] },
      },
      {
        path: 'devoluciones',
        component: Devoluciones,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'AdministradorPlataforma'] },
      },
      {
        path: 'delivery',
        component: Delivery,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Repartidor', 'AdministradorPlataforma'] },
      },
      {
        path: 'saas',
        component: SaasComponent,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'AdministradorPlataforma'] },
      },
      {
        path: 'mis-productos',
        component: MisProductos,
        canActivate: [roleGuard],
        data: { roles: ['Proveedor'] },
      },
      {
        path: 'cliente',
        component: Cliente,
        canActivate: [roleGuard],
        data: { roles: ['Cliente'] },
      },
      {
        path: 'comercial',
        component: Comercial,
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'AdministradorPlataforma'] },
      },
      { path: 'perfil', component: Perfil },
      { path: '', redirectTo: 'perfil', pathMatch: 'full' },
    ],
  },
];
