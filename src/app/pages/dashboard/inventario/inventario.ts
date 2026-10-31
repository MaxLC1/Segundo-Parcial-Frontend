import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../../services/inventario';
import { Catalogo } from '../../../services/catalogo';
import { SucursalesService } from '../../../services/sucursales';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.css']
})
export class Inventario implements OnInit {
  inventarios: any[] = [];
  isLoading = false;

  sucursales: any[] = [];
  productos: any[] = [];
  tallas: any[] = [];
  colores: any[] = [];

  showModal = false;
  isSaving = false;
  nuevoRegistro = { sucursal_id: null, producto_id: null, talla_id: null, color_id: null, cantidad: 1 };
  
  userRole: string | null = '';

  constructor(
    private invService: InventarioService,
    private catalogoService: Catalogo,
    private sucursalesService: SucursalesService,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userRole = this.auth.getRole();
    this.loadInventario();
    this.loadSelectData();
  }

  loadSelectData() {
    this.sucursalesService.getSucursales().subscribe(res => { this.sucursales = res; this.cdr.detectChanges(); });
    this.catalogoService.getProductos().subscribe(res => { this.productos = res; this.cdr.detectChanges(); });
    this.catalogoService.getTallas().subscribe(res => { this.tallas = res; this.cdr.detectChanges(); });
    this.catalogoService.getColores().subscribe(res => { this.colores = res; this.cdr.detectChanges(); });
  }

  loadInventario() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.invService.getInventarios().subscribe({
      next: (data) => {
        // Lógica de seguridad: Si es proveedor, solo ve su mercancía
        if (this.userRole === 'Proveedor') {
          // Simulamos filtrado por ID de proveedor real
          this.inventarios = data.filter((inv: any) => inv.producto?.proveedor_id != null);
        } else {
          this.inventarios = data;
        }
        this.filteredInventarios = this.inventarios;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Búsqueda por Voz ---
  searchText = '';
  filtroSucursal: number | null = null;
  filteredInventarios: any[] = [];
  isListening = false;

  filtrarInventario() {
    let baseInventarios = this.inventarios;
    
    // 1. Filtro estricto por Dropdown de Sucursal
    if (this.filtroSucursal) {
      baseInventarios = baseInventarios.filter(inv => inv.sucursal?.id === this.filtroSucursal);
    }

    if (!this.searchText || this.searchText.trim() === '') {
      this.filteredInventarios = baseInventarios;
    } else {
      const sentence = this.searchText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'para', 'por', 'con'];
      const sentenceWords = sentence.split(/\s+/)
        .map(w => w.replace(/[¿?.,!]/g, ''))
        .filter(w => w.length > 2 && !stopWords.includes(w));
      
      // 1. Obtenemos todas las sucursales únicas para saber si el usuario mencionó alguna
      const allSucursales = Array.from(new Set(this.inventarios.map(i => (i.sucursal?.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))));
      const mentionedSucursales = allSucursales.filter(suc => sentence.includes(suc));

      // 2. Primera pasada: detectar si la frase menciona ALGUN producto, color o talla del sistema globalmente
      let globalMentionedFeatures = false;
      for (const inv of baseInventarios) {
        const prodName = (inv.producto?.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const colorName = (inv.color?.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const tallaName = (inv.talla?.nombre || '').toLowerCase();
        
        let matchesProduct = false;
        if (sentence.includes(prodName) || prodName.includes(sentence)) {
          matchesProduct = true;
        } else {
          const prodWords = prodName.split(/\s+/).filter((w: string) => w.length > 2);
          matchesProduct = prodWords.some((pw: string) => 
            sentenceWords.some(sw => pw === sw || pw === sw.replace(/s$/, '') || sw === pw.replace(/s$/, ''))
          );
        }
        const matchesColor = colorName && sentenceWords.some(sw => colorName.includes(sw));
        const matchesTalla = tallaName && sentenceWords.some(sw => sw === tallaName);

        if (matchesProduct || matchesColor || matchesTalla) {
          globalMentionedFeatures = true;
          break;
        }
      }
      
      // 3. Segunda pasada: filtrar
      this.filteredInventarios = baseInventarios.filter(inv => {
        const prodName = (inv.producto?.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const colorName = (inv.color?.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const tallaName = (inv.talla?.nombre || '').toLowerCase();
        const sucursalName = (inv.sucursal?.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Si mencionó sucursales, esta fila DEBE pertenecer a una de las mencionadas
        if (mentionedSucursales.length > 0 && !mentionedSucursales.includes(sucursalName)) {
          return false; // Filtro estricto (AND)
        }

        // Si el usuario SOLO mencionó sucursales y ningún producto/color/talla en toda la frase, mostramos todo
        if (!globalMentionedFeatures && mentionedSucursales.length > 0) {
          return true;
        }

        // Evaluar producto
        let matchesProduct = false;
        if (sentence.includes(prodName) || prodName.includes(sentence)) {
          matchesProduct = true;
        } else {
          const prodWords = prodName.split(/\s+/).filter((w: string) => w.length > 2);
          matchesProduct = prodWords.some((pw: string) => 
            sentenceWords.some(sw => pw === sw || pw === sw.replace(/s$/, '') || sw === pw.replace(/s$/, ''))
          );
        }
        
        // Evaluar color y talla
        const matchesColor = colorName && sentenceWords.some(sw => sw.includes(colorName) || colorName.includes(sw));
        const matchesTalla = tallaName && sentenceWords.some(sw => sw === tallaName);
        
        return matchesProduct || matchesColor || matchesTalla;
      });
    }
    this.cdr.detectChanges();
  }

  iniciarBusquedaPorVoz() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta búsqueda por voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.isListening = true;
      this.cdr.detectChanges();
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.searchText = transcript;
      this.filtrarInventario();
    };

    recognition.onerror = (event: any) => {
      console.error("Error en reconocimiento de voz:", event.error);
      this.isListening = false;
      this.cdr.detectChanges();
    };

    recognition.onend = () => {
      this.isListening = false;
      this.cdr.detectChanges();
    };

    recognition.start();
  }

  isEditing = false;
  currentInventarioId: number | null = null;

  openModal() {
    this.isEditing = false;
    this.currentInventarioId = null;
    this.nuevoRegistro = { sucursal_id: null, producto_id: null, talla_id: null, color_id: null, cantidad: 1 };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  ajustarInventario(inv: any) {
    this.isEditing = true;
    this.currentInventarioId = inv.id;
    this.nuevoRegistro = {
      sucursal_id: inv.sucursal?.id,
      producto_id: inv.producto?.id,
      talla_id: inv.talla?.id,
      color_id: inv.color?.id,
      cantidad: inv.cantidad
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  guardar() {
    if (!this.nuevoRegistro.sucursal_id || !this.nuevoRegistro.producto_id || 
        !this.nuevoRegistro.talla_id || !this.nuevoRegistro.color_id || 
        this.nuevoRegistro.cantidad < 0) return;
        
    this.isSaving = true;
    this.cdr.detectChanges();
    
    const obs = this.isEditing
      ? this.invService.updateInventario(this.currentInventarioId!, { cantidad: this.nuevoRegistro.cantidad })
      : this.invService.addInventario(this.nuevoRegistro);

    obs.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeModal();
        this.loadInventario();
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  getProveedorName(productoId: number): string {
    const p = this.productos.find(x => x.id === productoId);
    return p?.proveedor?.nombre || 'Sin Proveedor Asignado';
  }

  getColeccionName(productoId: number): string {
    const p = this.productos.find(x => x.id === productoId);
    const colName = p?.coleccion?.nombre || 'Sin Colección';
    const tempName = p?.temporada?.nombre ? ` (${p.temporada.nombre})` : '';
    return colName + tempName;
  }
}

