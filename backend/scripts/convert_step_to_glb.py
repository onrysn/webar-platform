import sys
import os
import time

# --- AYARLAR ---
POSSIBLE_PATHS = [
    '/usr/lib/freecad/lib',
    '/usr/share/freecad/lib',
    '/usr/lib/freecad-daily/lib'
]

found_path = False
for path_option in POSSIBLE_PATHS:
    if os.path.exists(path_option):
        sys.path.append(path_option)
        found_path = True
        break

try:
    import FreeCAD
    import Part
    import Mesh
    # MeshPart: Daha hızlı ve akıllı mesh algoritması
    import MeshPart 
    from FreeCAD import Matrix, Vector 
except ImportError:
    print("HATA: FreeCAD modülleri eksik.")
    sys.exit(1)

try:
    import trimesh
except ImportError:
    print("HATA: trimesh bulunamadı.")
    sys.exit(1)

def convert(input_path, output_path):
    start_time = time.time()
    print(f"[SCRIPT] İşleniyor: {input_path}")
    
    temp_stl = output_path + ".temp.stl"

    try:
        # 1. STEP Dosyasını Oku
        shape = Part.Shape()
        shape.read(input_path)
        
        # --- [OPTIMIZASYON 1] DİNAMİK TOLERANS HESAPLAMA ---
        # Modelin boyutlarını (Bounding Box) alıyoruz
        bbox = shape.BoundBox
        max_dimension = max(bbox.XLength, bbox.YLength, bbox.ZLength)
        
        # Eğer model çok büyükse (örn: 10000mm), 2.0mm tolerans çok küçüktür (milyonlarca poligon).
        # Modelin boyutuna göre dinamik bir tolerans belirliyoruz.
        # Boyutun %0.3'ü kadar sapmaya izin veriyoruz.
        # Örnek: 10 metre (10000mm) model için -> 30mm tolerans (Hızlı ve yeterli)
        # Örnek: 10 cm (100mm) model için -> 0.3mm tolerans (Detaylı)
        
        calculated_linear_deflection = max_dimension * 0.003
        
        # Güvenlik sınırları: En az 0.1, en fazla 50.0 olsun
        LINEAR_DEFLECTION = max(0.5, min(calculated_linear_deflection, 100.0))

        # Açısal sapma (Radyan cinsinden). 0.2 radyan (~11.46 derece) genelde optimum hız/kalite sunar.
        ANGULAR_DEFLECTION = 0.2 
        
        print(f"[SCRIPT] Model Boyutu: {max_dimension:.2f} | Linear Deflection: {LINEAR_DEFLECTION:.4f}")

        # --- [OPTIMIZASYON 2] MeshPart Kullanımı ---
        # shape.tessellate yerine meshFromShape kullanıyoruz.
        # Bu algoritma düz yüzeyleri az, kıvrımlı yüzeyleri çok böler.
        mesh_feature = MeshPart.meshFromShape(
            Shape=shape, 
            LinearDeflection=LINEAR_DEFLECTION, 
            AngularDeflection=ANGULAR_DEFLECTION, 
            Relative=False
        )
        
        # ---------------------------------------------------------
        # [OPTIMIZASYON 3] MATRIX SCALE (C++ Hızıyla)
        # ---------------------------------------------------------
        SCALE_FACTOR = 0.001
        mat = Matrix()
        mat.scale(Vector(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR))
        mesh_feature.transform(mat)
        
        # ---------------------------------------------------------
        # [OPTIMIZASYON 4] Binary STL Yazma
        # ---------------------------------------------------------
        mesh_feature.write(temp_stl)
        
        read_convert_time = time.time() - start_time
        print(f"[SCRIPT] FreeCAD işlemleri tamamlandı ({read_convert_time:.2f}s)")

        if not os.path.exists(temp_stl):
            raise Exception("Ara dosya oluşturulamadı.")

        # 3. Trimesh ile Sadece Format Değiştir (GLB Export)
        # Binary STL okumak çok hızlıdır
        mesh = trimesh.load(temp_stl)
        
        # Export ayarları: Draco sıkıştırması Node.js tarafında yapılacağı için burada raw bırakıyoruz (daha hızlı)
        mesh.export(output_path, file_type='glb')
        
        # Temizlik
        if os.path.exists(temp_stl):
            os.remove(temp_stl)
            
        total_time = time.time() - start_time
        final_size = os.path.getsize(output_path) / (1024 * 1024)
        print(f"[SCRIPT] BAŞARILI! Toplam Süre: {total_time:.2f}s | Boyut: {final_size:.2f} MB")

    except Exception as e:
        print(f"[SCRIPT] HATA: {str(e)}")
        if 'temp_stl' in locals() and os.path.exists(temp_stl):
            os.remove(temp_stl)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])