import sys
import os
import time

# --- AYARLAR ---
POSSIBLE_PATHS = [
    '/usr/lib/freecad/lib',
    '/usr/share/freecad/lib',
    '/usr/lib/freecad-daily/lib'
]

for path_option in POSSIBLE_PATHS:
    if os.path.exists(path_option):
        sys.path.append(path_option)
        break

try:
    import FreeCAD
    import Part
    import Mesh
    import MeshPart
    from FreeCAD import Matrix, Vector
except ImportError:
    print("[HATA] FreeCAD modülleri eksik.")
    sys.exit(1)

try:
    import trimesh
except ImportError:
    print("[HATA] trimesh bulunamadı.")
    sys.exit(1)


def convert(input_path, output_path):
    start_time = time.time()
    # flush=True logların anlık akmasını sağlar
    print(f"[SCRIPT] İşleniyor: {input_path}", flush=True)

    try:
        # 1. GÜVENLİ OKUMA (Part.read Asla Çökmez)
        shape = Part.Shape()
        shape.read(input_path)
        
        # 2. PARÇALARI AYIKLA
        # Dosya tek parça (Compound) olsa bile içindeki Solid'leri (Katıları) alıyoruz.
        sub_solids = shape.Solids
        
        # Eğer solid yoksa (örn: yüzey model), kendisini tek parça al
        if not sub_solids:
            sub_solids = [shape]
            
        print(f"[SCRIPT] Tespit edilen Parça Sayısı: {len(sub_solids)}", flush=True)

        # 3. GLOBAL TOLERANS HESABI
        bbox = shape.BoundBox
        max_dim = max(bbox.XLength, bbox.YLength, bbox.ZLength)
        
        # Dinamik hassasiyet (Büyük parçalar kaba, küçükler hassas)
        l_deflection = max(0.5, min(max_dim * 0.005, 100.0))
        print(f"[SCRIPT] Hassasiyet (Tolerans): {l_deflection:.4f}", flush=True)

        scene = trimesh.Scene()

        # Ölçek matrisi (MM -> M)
        SCALE_FACTOR = 0.001
        mat = Matrix()
        mat.scale(Vector(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR))

        processed_count = 0

        # 4. HER PARÇAYI AYRI AYRI İŞLE
        for i, solid in enumerate(sub_solids):
            try:
                # Mesh oluştur (MeshPart algoritması hızlıdır)
                mesh = MeshPart.meshFromShape(
                    Shape=solid,
                    LinearDeflection=l_deflection,
                    AngularDeflection=0.2, # Hız için 0.2 radyan (~11 derece)
                    Relative=False
                )

                # Ölçekle
                mesh.transform(mat)

                # Temp STL yaz
                temp_stl = f"{output_path}_part_{i}.stl"
                mesh.write(temp_stl)

                if os.path.exists(temp_stl):
                    tm = trimesh.load(temp_stl)

                    if not tm.is_empty:
                        # İSİMLENDİRME:
                        # Orijinal isimleri alamadığımız için Solid_0, Solid_1 veriyoruz.
                        # Frontend'de bu isimleri göreceksiniz.
                        node_name = f"Solid_{i}"
                        
                        scene.add_geometry(
                            tm,
                            node_name=node_name, 
                            geom_name=f"{node_name}_Geo"
                        )
                        processed_count += 1
                    
                    # Temizlik
                    os.remove(temp_stl)

            except Exception as e:
                print(f"[UYARI] Parça {i} işlenirken hata: {e}", flush=True)
                continue

        if processed_count == 0:
            raise Exception("Hiçbir parça meshlenemedi.")

        # 5. GLB EXPORT
        scene.export(output_path, file_type="glb")

        total_time = time.time() - start_time
        size_mb = os.path.getsize(output_path) / (1024 * 1024)

        print(f"[SCRIPT] BAŞARILI! {processed_count} parça ayrıştırıldı.", flush=True)
        print(f"[SCRIPT] Süre: {total_time:.2f}s | Boyut: {size_mb:.2f} MB", flush=True)

    except Exception as e:
        print(f"[SCRIPT] KRİTİK HATA: {e}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])