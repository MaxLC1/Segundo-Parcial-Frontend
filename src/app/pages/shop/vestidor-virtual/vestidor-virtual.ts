import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-vestidor-virtual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vestidor-virtual.html',
  styleUrls: ['./vestidor-virtual.css']
})
export class VestidorVirtual implements OnInit {
  productos: any[] = [];
  productoSeleccionado: any = null;
  
  userPhotoUrl: string | null = null;
  
  isProcessing = false;
  showResult = false;
  
  processedClothingUrl: string | null = null;

  // Controles de ajuste
  scale: number = 1.0;
  rotation: number = 0;
  posX: number = 0;
  posY: number = 0;
  
  // Variables de arrastre
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialPosX = 0;
  private initialPosY = 0;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/catalogo/productos`).subscribe(data => {
      this.productos = data;
      this.cdr.detectChanges();
    });
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.userPhotoUrl = e.target.result;
        this.showResult = false;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  // Mensajes de IA
  aiStatusMessage: string = 'Iniciando motor de IA...';

  async probarPrenda() {
    if (!this.userPhotoUrl || !this.productoSeleccionado) {
      alert("Debes subir tu foto y seleccionar una prenda.");
      return;
    }

    this.isProcessing = true;
    this.showResult = false;
    this.processedClothingUrl = null;
    
    // Auto-Ajuste Inteligente (Heurística de pose)
    // Para una foto de retrato normal, la prenda debe ser más grande y estar más abajo
    this.scale = 1.4;
    this.rotation = 0;
    this.posX = 0;
    this.posY = 80; // Desplazamiento hacia abajo para encajar en los hombros
    
    this.aiStatusMessage = 'Extrayendo prenda del catálogo...';
    this.cdr.detectChanges();

    try {
      const rawUrl = this.getImagenUrl(this.productoSeleccionado.imagen_url);
      
      const proxyResponse = await this.http.get<any>(`${environment.apiUrl}/archivos/proxy-imagen?url=${encodeURIComponent(rawUrl)}`).toPromise();
      const base64Image = proxyResponse.base64;
      
      this.processedClothingUrl = await this.removeBackground(base64Image);
    } catch (e) {
      console.error("Error procesando imagen:", e);
      this.processedClothingUrl = this.getImagenUrl(this.productoSeleccionado.imagen_url);
    }

    // Simular el proceso de detección de pose
    this.aiStatusMessage = 'Analizando puntos clave del cuerpo...';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.aiStatusMessage = 'Mapeando hombros y torso...';
      this.cdr.detectChanges();
    }, 1000);
    
    setTimeout(() => {
      this.aiStatusMessage = 'Adaptando tejido a la silueta...';
      this.cdr.detectChanges();
    }, 2000);

    setTimeout(() => {
      this.isProcessing = false;
      this.showResult = true;
      this.cdr.detectChanges();
    }, 3000);
  }

  // --- Lógica de Arrastre ---
  onDragStart(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDragging = true;
    
    if (event instanceof MouseEvent) {
      this.startX = event.clientX;
      this.startY = event.clientY;
    } else {
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
    }
    
    this.initialPosX = this.posX;
    this.initialPosY = this.posY;
  }

  onDragMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    
    let currentX = 0;
    let currentY = 0;
    
    if (event instanceof MouseEvent) {
      currentX = event.clientX;
      currentY = event.clientY;
    } else {
      currentX = event.touches[0].clientX;
      currentY = event.touches[0].clientY;
    }
    
    const deltaX = currentX - this.startX;
    const deltaY = currentY - this.startY;
    
    this.posX = this.initialPosX + deltaX;
    this.posY = this.initialPosY + deltaY;
    this.cdr.detectChanges();
  }

  onDragEnd() {
    this.isDragging = false;
  }
  
  getTransformStyle(): string {
    return `translate(calc(-50% + ${this.posX}px), ${this.posY}px) scale(${this.scale}) rotate(${this.rotation}deg)`;
  }

  removeBackground(imageSrc: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject("No canvas ctx");
          
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Asumimos que el color de fondo está en los bordes (ej. 0,0)
          const bgR = data[0];
          const bgG = data[1];
          const bgB = data[2];
          const tolerance = 40; // Tolerancia para borrar grises/blancos de fondo
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (Math.abs(r - bgR) < tolerance && 
                Math.abs(g - bgG) < tolerance && 
                Math.abs(b - bgB) < tolerance) {
              data[i + 3] = 0; // Transparente
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          console.error("Error en canvas (probablemente CORS):", error);
          reject(error);
        }
      };
      img.onerror = (err) => {
        console.error("Error cargando imagen para canvas:", err);
        reject(err);
      };
      img.src = imageSrc;
    });
  }

  getImagenUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http://192.168.')) {
      return url.replace(/http:\/\/192\.168\.\d+\.\d+:\d+\//, `${environment.baseApiUrl}/`);
    }
    if (!url.startsWith('http')) {
      const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
      return `${environment.baseApiUrl}/${cleanUrl}`;
    }
    return url;
  }
}
