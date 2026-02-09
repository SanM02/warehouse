import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  generarFacturaPDF(datosFactura: any): void {
    const doc = new jsPDF();
    
    // Configuración de colores
    const primaryColor = [52, 58, 64];
    const secondaryColor = [108, 117, 125];
    
    // CABECERA DE LA EMPRESA
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('FERRETERÍA CENTRAL', 20, 20);
    
    doc.setFontSize(10);
    doc.text('RUC: 1234567890001', 20, 27);
    doc.text('Dir: Av. Principal 123, Ciudad', 20, 32);
    
    // NÚMERO DE FACTURA
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(`FACTURA: ${datosFactura.numero_factura}`, 120, 20);
    doc.setFontSize(10);
    doc.text(`Fecha: ${datosFactura.fecha}`, 120, 27);
    doc.text(`Hora: ${datosFactura.hora}`, 120, 32);
    
    // LÍNEA SEPARADORA
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 40, 190, 40);
    
    // DATOS DEL CLIENTE
    let yPosition = 50;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE:', 20, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPosition += 8;
    doc.text(`${datosFactura.cliente.tipo_documento}: ${datosFactura.cliente.numero_documento}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Nombre: ${datosFactura.cliente.nombre}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Email: ${datosFactura.cliente.email || 'N/A'}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Teléfono: ${datosFactura.cliente.telefono || 'N/A'}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Dirección: ${datosFactura.cliente.direccion || 'N/A'}`, 20, yPosition);
    
    // LÍNEA SEPARADORA
    yPosition += 10;
    doc.line(20, yPosition, 190, yPosition);
    
    // CABECERA DE LA TABLA DE PRODUCTOS
    yPosition += 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition, 170, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('CÓDIGO', 25, yPosition + 5);
    doc.text('DESCRIPCIÓN', 55, yPosition + 5);
    doc.text('CANT', 120, yPosition + 5);
    doc.text('PRECIO', 140, yPosition + 5);
    doc.text('SUBTOTAL', 165, yPosition + 5);
    
    // PRODUCTOS
    doc.setFont('helvetica', 'normal');
    yPosition += 12;
    
    datosFactura.detalles.forEach((detalle: any) => {
      doc.text(detalle.codigo || 'N/A', 25, yPosition);
      doc.text(detalle.producto.substring(0, 25), 55, yPosition);
      doc.text(detalle.cantidad.toString(), 125, yPosition);
      doc.text(`₲${detalle.precio_unitario.toFixed(0)}`, 142, yPosition);
      doc.text(`₲${detalle.subtotal.toFixed(0)}`, 167, yPosition);
      yPosition += 6;
      
      // Nueva página si es necesario
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    // LÍNEA SEPARADORA FINAL
    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    
    // TOTALES
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('SUBTOTAL:', 140, yPosition);
    doc.text(`₲${datosFactura.subtotal.toFixed(0)}`, 170, yPosition);
    
    if (datosFactura.descuento_total && datosFactura.descuento_total > 0) {
      yPosition += 6;
      doc.text('DESCUENTO:', 140, yPosition);
      doc.text(`-₲${datosFactura.descuento_total.toFixed(0)}`, 170, yPosition);
    }
    
    yPosition += 6;
    doc.text('IVA (12%):', 140, yPosition);
    doc.text(`₲${datosFactura.impuesto_total.toFixed(0)}`, 170, yPosition);
    
    yPosition += 8;
    doc.setFontSize(12);
    doc.text('TOTAL:', 140, yPosition);
    doc.text(`₲${datosFactura.total.toFixed(0)}`, 170, yPosition);
    
    // OBSERVACIONES
    if (datosFactura.observaciones) {
      yPosition += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACIONES:', 20, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      
      // Dividir texto largo en múltiples líneas
      const splitText = doc.splitTextToSize(datosFactura.observaciones, 170);
      doc.text(splitText, 20, yPosition);
    }
    
    // PIE DE PÁGINA
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Gracias por su compra - Ferretería Central', 20, 280);
    doc.text(`Vendedor: ${datosFactura.vendedor?.nombre || 'Sistema'}`, 20, 285);
    
    // DESCARGAR PDF
    doc.save(`factura-${datosFactura.numero_factura}.pdf`);
  }
}
