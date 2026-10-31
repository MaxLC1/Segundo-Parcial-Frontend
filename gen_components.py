import os

base_path = r"C:\Users\PC\.gemini\antigravity-ide\scratch\Primer-Parcial-SI2--Frontend\src\app\pages\dashboard"

components = {
    "devoluciones": "Devoluciones",
    "delivery": "Delivery",
    "mis-productos": "MisProductos"
}

for folder, class_name in components.items():
    folder_path = os.path.join(base_path, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # TS
    ts_content = f"""import {{ Component }} from '@angular/core';
import {{ CommonModule }} from '@angular/common';
import {{ FormsModule }} from '@angular/forms';

@Component({{
  selector: 'app-{folder}',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './{folder}.html',
  styleUrls: ['./{folder}.css']
}})
export class {class_name} {{
  // TODO: Implementar lógica de {folder}
}}
"""
    with open(os.path.join(folder_path, f"{folder}.ts"), "w") as f:
        f.write(ts_content)

    # HTML
    html_content = f"""<div class="panel-header">
  <h2>Gestión de {class_name}</h2>
</div>
<div class="glass-card table-container">
  <p>Módulo de {class_name} en construcción...</p>
</div>
"""
    with open(os.path.join(folder_path, f"{folder}.html"), "w") as f:
        f.write(html_content)

    # CSS
    with open(os.path.join(folder_path, f"{folder}.css"), "w") as f:
        f.write("")
