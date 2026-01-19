import bpy
import sys
import os
import subprocess
import shutil
import time


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
        
    except Exception as e:
        print(f"[UYARI] ⚠️  Draco sıkıştırma hatası: {e}", flush=True)
        return False


def convert_cad_to_glb(input_path, output_path):
    # 1. Sahneyi temizle
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    print(f"Processing: {input_path}")
    
    # Dosya uzantısını al (örn: .fbx, .obj)
    ext = os.path.splitext(input_path)[1].lower()
    
    # 2. Format türüne göre import işlemi
    try:
        if ext == '.fbx':
            # FBX Import
            bpy.ops.import_scene.fbx(filepath=input_path)
        elif ext == '.obj':
            # OBJ Import
            bpy.ops.import_scene.obj(filepath=input_path)
        elif ext == '.dxf':
            # DXF Import (Blender'da eklenti açık olmalıdır, core'da vardır ama check etmek gerekir)
            bpy.ops.import_scene.dxf(filepath=input_path)
        elif ext == '.dae':
            # Collada Import
            bpy.ops.wm.collada_import(filepath=input_path)
        else:
            print(f"Unsupported format: {ext}")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error importing {ext}: {e}")
        sys.exit(1)

    print("Import successful. Exporting to GLB...")

    # 3. Önce geçici GLB oluştur
    start_time = time.time()
    temp_glb = f"{output_path}.temp.glb"
    
    try:
        bpy.ops.export_scene.gltf(
            filepath=temp_glb,
            export_format='GLB',
            export_yup=True,  # GLB Y-yukarı eksen kullanır
            export_apply=True # Transformları uygula
        )
    except Exception as e:
        print(f"Error exporting GLB: {e}")
        sys.exit(1)
    
    temp_size_mb = os.path.getsize(temp_glb) / (1024 * 1024)
    print(f"[SCRIPT] 📏 Sıkıştırılmamış GLB: {temp_size_mb:.2f} MB", flush=True)

    # 4. Draco sıkıştırması
    compression_success = compress_with_draco(temp_glb, output_path)
    
    if compression_success:
        # Başarılı, temp dosyayı sil
        os.remove(temp_glb)
    else:
        # Başarısız, temp dosyayı final olarak kullan
        print(f"[SCRIPT] ⚠️  Draco sıkıştırması yapılamadı, düz GLB kullanılıyor", flush=True)
        shutil.move(temp_glb, output_path)
    
    # 5. Sonuç
    total_time = time.time() - start_time
    final_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    
    print(f"\n[SCRIPT] ✅ BAŞARILI!", flush=True)
    print(f"[SCRIPT] ⏱️  Toplam Süre: {total_time:.2f}s", flush=True)
    print(f"[SCRIPT] 📊 Final Boyut: {final_size_mb:.2f} MB", flush=True)
    print(f"Export successful: {output_path}")

if __name__ == "__main__":
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    
    if len(argv) < 2:
        print("Usage: blender -b -P convert_cad_to_glb.py -- <input_file> <output.glb>")
        sys.exit(1)

    input_file = argv[0]
    output_file = argv[1]

    convert_cad_to_glb(input_file, output_file)