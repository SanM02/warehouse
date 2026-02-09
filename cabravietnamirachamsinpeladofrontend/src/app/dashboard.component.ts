import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Dashboard de Ventas</h2>
      <div class="card shadow mb-4">
        <div class="card-header bg-primary text-white">
          <i class="fas fa-chart-line me-2"></i>Gráfico de Ventas (Demo)
        </div>
        <div class="card-body">
          <canvas id="ventasChart" width="100%" height="40"></canvas>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Gráfico de ventas con datos simulados
  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const ctx = document.getElementById('ventasChart') as HTMLCanvasElement;
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
            datasets: [{
              label: 'Ventas ($)',
              data: [1200, 1500, 1100, 1800, 1700, 2100, 2500],
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13,110,253,0.1)',
              tension: 0.3,
              fill: true,
              pointRadius: 5,
              pointBackgroundColor: '#0d6efd',
              pointBorderColor: '#fff',
              pointHoverRadius: 7
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: true, position: 'top' },
              title: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }
    }
  }
}
