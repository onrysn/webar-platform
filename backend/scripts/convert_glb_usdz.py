import bpy
import sys
import os
import math  # Matematik kütüphanesini ekledik (radyan dönüşümü için)

def convert_glb_to_usdz(input_path, output_path):
    # 1. Sahneyi tamamen temizle
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    print(f"Importing: {input_path}")
    
    # 2. GLB dosyasını içeri aktar
    try:
        bpy.ops.import_scene.gltf(filepath=input_path)
    except Exception as e:
        print(f"Error importing GLB: {e}")
        sys.exit(1)

    print("Import successful. Fixing axis orientation...")

    # --- EKSEN DÜZELTME BAŞLANGICI ---
    try:
        # Sahnedeki tüm objeleri seç
        bpy.ops.object.select_all(action='SELECT')
        
        # X ekseninde 90 derece döndür.
        # Eğer model hala ters duruyorsa burayı -90 (math.radians(-90)) yapmayı deneyin.
        bpy.ops.transform.rotate(value=math.radians(90), orient_axis='X')
        
        # Dönüşümü "Uygula" (Apply Transform). 
        # Bu işlem rotasyon değerini 0'a sıfırlar ama geometriyi kalıcı olarak döndürür.
        # Bu adım USDZ export için kritiktir, yoksa bazı görüntüleyiciler rotasyonu görmezden gelebilir.
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
        
    except Exception as e:
        print(f"Warning: Could not rotate object: {e}")
    # --- EKSEN DÜZELTME BİTİŞİ ---

    print("Axis fixed. Exporting to USDZ...")

    # 3. USDZ olarak dışarı aktar
    try:
        bpy.ops.wm.usd_export(
            filepath=output_path,
            selected_objects_only=False,
            export_materials=True,
            export_textures=True, 
            # Bazen root transform'u sıfırlamak da işe yarar ama yukarıdaki manuel rotasyon daha garantidir.
        )
    except Exception as e:
        print(f"Error exporting USDZ: {e}")
        sys.exit(1)
        
    print(f"Export successful: {output_path}")

if __name__ == "__main__":
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    
    if len(argv) < 2:
        print("Usage: blender -b -P convert_glb_usdz.py -- <input.glb> <output.usdz>")
        sys.exit(1)

    input_file = argv[0]
    output_file = argv[1]

    convert_glb_to_usdz(input_file, output_file)