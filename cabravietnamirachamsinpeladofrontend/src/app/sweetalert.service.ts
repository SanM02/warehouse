import Swal from 'sweetalert2';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SweetAlertService {
  success(msg: string, title: string = 'Éxito') {
    Swal.fire({ icon: 'success', title, text: msg });
  }
  error(msg: string, title: string = 'Error') {
    Swal.fire({ icon: 'error', title, text: msg });
  }
  confirm(msg: string, title: string = '¿Estás seguro?') {
    return Swal.fire({ icon: 'warning', title, text: msg, showCancelButton: true, confirmButtonText: 'Sí', cancelButtonText: 'No' });
  }
  info(msg: string, title: string = 'Información') {
    Swal.fire({ icon: 'info', title, text: msg });
  }
}
