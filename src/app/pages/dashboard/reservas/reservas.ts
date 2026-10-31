import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService } from '../../../services/reservas';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css']
})
export class Reservas implements OnInit {
  reservas: any[] = [];
  isLoading = false;

  notificationMessage: string | null = null;

  constructor(private reservasService: ReservasService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadReservas();
  }

  loadReservas() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.reservasService.getReservas().subscribe({
      next: (data) => {
        this.reservas = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando reservas:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarEstado(reserva: any, nuevoEstado: string) {
    if (confirm(`¿Cambiar estado de la reserva #${reserva.id} a ${nuevoEstado}?`)) {
      this.reservasService.cambiarEstado(reserva.id, nuevoEstado).subscribe({
        next: () => {
          this.loadReservas();
          this.mostrarNotificacion(`Sistema: Se ha notificado al cliente que su reserva está ${nuevoEstado}.`);
        },
        error: (err) => {
          console.error('Error actualizando estado:', err);
        }
      });
    }
  }

  mostrarNotificacion(mensaje: string) {
    this.notificationMessage = mensaje;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.notificationMessage = null;
      this.cdr.detectChanges();
    }, 4000);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'badge text-warning';
      case 'Preparada': return 'badge text-primary';
      case 'Completada': return 'badge text-success';
      case 'Cancelada': return 'badge text-error';
      default: return 'badge text-muted';
    }
  }
}

