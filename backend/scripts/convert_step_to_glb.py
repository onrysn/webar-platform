import sys
import os
import time
import subprocess
import shutil

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
    import numpy as np 
except ImportError:
    print("[HATA] trimesh veya numpy bulunamadı.")
    sys.exit(1)


def get_all_processable_shapes(shape):
    """Hem Solid hem Shell hem de Face parçalarını al"""
    shapes = []
    shape_types = []
    
    # 1. Solid'ler
    if shape.Solids:
        for solid in shape.Solids:
            shapes.append(solid)
            shape_types.append("Solid")
    
    # 2. Shell'ler
    if shape.Shells:
        for shell in shape.Shells:
            already_included = False
            for solid in shape.Solids:
                if solid.Shells and any(s.isEqual(shell) for s in solid.Shells):
                    already_included = True
                    break
            if not already_included:
                shapes.append(shell)
                shape_types.append("Shell")
    
    # 3. Yedekler (Face/Unknown)
    if not shapes:
        if shape.Faces: 
             for face in shape.Faces:
                shapes.append(face)
                shape_types.append("Face")
        else:
            shapes.append(shape)
            shape_types.append("Unknown")
    
    return shapes, shape_types


def calculate_adaptive_deflection(shape, global_max_dim, is_shell=False):
    """
    OPTIMİZE EDİLMİŞ TOLERANS AYARI
    Orta yol: Detayları koru ama dosya boyutunu patlatma.
    """
    try:
        bbox = shape.BoundBox
        max_dim = max(bbox.XLength, bbox.YLength, bbox.ZLength)
        
        # Shell ise toleransı biraz daha sıkı tut (Factor: 0.6)
        # Solid ise biraz daha gevşek bırak (Factor: 1.0)
        factor = 0.6 if is_shell else 1.0

        # --- ORTA YOL AYARLARI ---
        
        if max_dim < 100:
            # Küçük parçalar (Vida, somun vs): Orta hassasiyet
            return max(0.03, max_dim * 0.002) * factor
            
        elif max_dim < 1000:
            # Orta boy parçalar:
            return max(0.1, max_dim * 0.002) * factor
            
        else:
            # Büyük parçalar (Çatı, Kaydırak):
            return min(max_dim * 0.0025, 4.0) * factor
    except:
        return 1.0


def compress_with_draco(input_glb, output_glb):
    """
    gltf-transform ile Draco compression uygula
    %80-90 boyut azaltma sağlar
    """
    try:
        print(f"[SCRIPT] 🗜️  Draco sıkıştırması başlıyor...", flush=True)
        
        # gltf-transform draco komutu
        compress_cmd = [
            'gltf-transform',
            'draco',
            input_glb,
            output_glb,
            '--method', 'edgebreaker',      # Daha iyi sıkıştırma
            '--encode-speed', '5',           # 0-10 (5 = dengeli)
            '--decode-speed', '5',           # 0-10 (5 = dengeli)
            '--quantize-position', '14',     # 14 bit (iyi kalite)
            '--quantize-normal', '10',       # 10 bit
            '--quantize-texcoord', '12',     # 12 bit
            '--quantize-color', '10',        # 10 bit
            '--quantize-generic', '12'       # 12 bit
        ]
        
        result = subprocess.run(
            compress_cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10 dakika timeout
        )
        
        if result.returncode != 0:
            raise Exception(f"gltf-transform error: {result.stderr}")
        
        # Başarı mesajı
        original_size_mb = os.path.getsize(input_glb) / (1024 * 1024)
        compressed_size_mb = os.path.getsize(output_glb) / (1024 * 1024)
        savings = (1 - compressed_size_mb / original_size_mb) * 100
        
        print(f"[SCRIPT] ✅ Draco sıkıştırma başarılı!", flush=True)
        print(f"[SCRIPT]    📊 Öncesi: {original_size_mb:.2f} MB", flush=True)
        print(f"[SCRIPT]    📊 Sonrası: {compressed_size_mb:.2f} MB", flush=True)
        print(f"[SCRIPT]    💾 Tasarruf: {savings:.1f}%", flush=True)
        
        return True
        
    except subprocess.TimeoutExpired:
        print(f"[UYARI] ⏱️  Sıkıştırma timeout (10dk aşıldı)", flush=True)
        return False
        
    except FileNotFoundError:
        print(f"[UYARI] ❌ gltf-transform bulunamadı. Draco sıkıştırması yapılamayacak.", flush=True)
        print(f"[UYARI] 💡 Docker'a 'npm install -g @gltf-transform/cli' eklemeyi unutmayın.", flush=True)
        return False
        
    except Exception as e:
        print(f"[UYARI] ❌ Draco sıkıştırma hatası: {e}", flush=True)
        return False


def convert(input_path, output_path):
    start_time = time.time()
    print(f"[SCRIPT] 🚀 İşleniyor: {input_path}", flush=True)

    try:
        shape = Part.Shape()
        shape.read(input_path)
        
        sub_shapes, shape_types = get_all_processable_shapes(shape)
        
        print(f"[SCRIPT] 📦 Tespit edilen Parça Sayısı: {len(sub_shapes)}", flush=True)
        
        solid_count = shape_types.count("Solid")
        shell_count = shape_types.count("Shell")
        face_count = shape_types.count("Face")
        
        if solid_count > 0: print(f"[SCRIPT]   → {solid_count} Solid", flush=True)
        if shell_count > 0: print(f"[SCRIPT]   → {shell_count} Shell (Double-Sided)", flush=True)
        if face_count > 0:  print(f"[SCRIPT]   → {face_count} Face", flush=True)

        bbox = shape.BoundBox
        global_max_dim = max(bbox.XLength, bbox.YLength, bbox.ZLength)

        scene = trimesh.Scene()
        
        SCALE_FACTOR = 0.001
        mat = Matrix()
        mat.scale(Vector(SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR))

        processed_count = 0
        failed_parts = []

        for i, (sub_shape, shape_type) in enumerate(zip(sub_shapes, shape_types)):
            try:
                is_shell_or_face = shape_type in ["Shell", "Face"]
                
                # Tolerans Hesapla
                l_deflection = calculate_adaptive_deflection(sub_shape, global_max_dim, is_shell=is_shell_or_face)
                
                if i % 20 == 0:
                    print(f"[SCRIPT] ⚙️  İşleniyor: {i}/{len(sub_shapes)}...", flush=True)

                # --- MESH OLUŞTURMA ---
                mesh = MeshPart.meshFromShape(
                    Shape=sub_shape,
                    LinearDeflection=l_deflection,
                    AngularDeflection=0.25, 
                    Relative=False
                )

                if not mesh.CountFacets or mesh.CountFacets == 0:
                    raise Exception(f"Boş mesh (0 facet)")

                mesh.transform(mat)
                temp_stl = f"{output_path}_part_{i}.stl"
                mesh.write(temp_stl)

                if os.path.exists(temp_stl):
                    stl_size = os.path.getsize(temp_stl)
                    if stl_size < 100:
                        raise Exception(f"STL çok küçük ({stl_size}B)")

                    tm = trimesh.load(temp_stl)
                    
                    if not tm.is_empty:
                        # Görsel İyileştirmeler
                        tm.visual.face_colors = [200, 200, 200, 255]

                        try:
                            pbr_material = trimesh.visual.material.PBRMaterial(
                                doubleSided=True,
                                main_color=[200, 200, 200, 255],
                                metallicFactor=0.1,
                                roughnessFactor=0.5
                            )
                            tm.visual.material = pbr_material
                        except Exception as mat_err:
                            print(f"[UYARI] Material atanamadı: {mat_err}")

                        node_name = f"{shape_type}_{i}"
                        scene.add_geometry(
                            tm,
                            node_name=node_name, 
                            geom_name=f"{node_name}_Geo"
                        )
                        processed_count += 1
                    else:
                        raise Exception("Trimesh boş geometry")
                    
                    os.remove(temp_stl)

            except Exception as e:
                error_type = shape_types[i]
                print(f"[HATA] Parça {i} ({error_type}): {str(e)}", flush=True)
                failed_parts.append((i, error_type, str(e)))
                
                temp_stl = f"{output_path}_part_{i}.stl"
                if os.path.exists(temp_stl):
                    try: os.remove(temp_stl)
                    except: pass
                continue

        if processed_count == 0:
            raise Exception("Hiçbir parça meshlenemedi.")

        if failed_parts:
            print(f"\n[UYARI] ⚠️  {len(failed_parts)} parça başarısız.", flush=True)

        # --- ÖNCE SIKIŞTIRILMAMIŞ GLB OLUŞTUR ---
        temp_glb = f"{output_path}.temp.glb"
        print(f"[SCRIPT] 💾 Geçici GLB oluşturuluyor...", flush=True)
        scene.export(temp_glb, file_type="glb")
        
        temp_size_mb = os.path.getsize(temp_glb) / (1024 * 1024)
        print(f"[SCRIPT] 📏 Sıkıştırılmamış GLB: {temp_size_mb:.2f} MB", flush=True)

        # --- DRACO SIKIŞTIRMASI ---
        compression_success = compress_with_draco(temp_glb, output_path)
        
        if compression_success:
            # Başarılı, temp dosyayı sil
            os.remove(temp_glb)
        else:
            # Başarısız, temp dosyayı final olarak kullan
            print(f"[SCRIPT] ⚠️  Draco sıkıştırması yapılamadı, düz GLB kullanılıyor", flush=True)
            shutil.move(temp_glb, output_path)

        # --- SONUÇ ---
        total_time = time.time() - start_time
        final_size_mb = os.path.getsize(output_path) / (1024 * 1024)

        print(f"\n[SCRIPT] ✅ BAŞARILI!", flush=True)
        print(f"[SCRIPT] 📦 İşlenen: {processed_count}/{len(sub_shapes)} parça", flush=True)
        print(f"[SCRIPT] ⏱️  Toplam Süre: {total_time:.2f}s", flush=True)
        print(f"[SCRIPT] 📊 Final Boyut: {final_size_mb:.2f} MB", flush=True)

    except Exception as e:
        print(f"[SCRIPT] ❌ KRİTİK HATA: {e}", flush=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("[HATA] Kullanım: python script.py <input.step> <output.glb>")
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])