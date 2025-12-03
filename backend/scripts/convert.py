import bpy
import sys
import os

def convert_glb_to_usdz(input_path, output_path):
    # 1. Sahneyi tamamen temizle (Varsayılan küp, kamera vb. sil)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    print(f"Importing: {input_path}")
    
    # 2. GLB dosyasını içeri aktar
    try:
        bpy.ops.import_scene.gltf(filepath=input_path)
    except Exception as e:
        print(f"Error importing GLB: {e}")
        # Hata kodu ile çık
        sys.exit(1)

    print("Import successful. Exporting to USDZ...")

    # 3. USDZ olarak dışarı aktar
    # Blender 4.0 .usdz uzantısını görünce otomatik paketleme yapar
    try:
        bpy.ops.wm.usd_export(
            filepath=output_path,
            selected_objects_only=False, # Tüm sahneyi al
            export_materials=True,       # Materyalleri dahil et
            export_textures=True,        # Textureları dosya içine göm (USDZ için şart)
            # AR için ölçeklendirme bazen gerekebilir ama şimdilik standart bırakıyoruz
        )
    except Exception as e:
        print(f"Error exporting USDZ: {e}")
        sys.exit(1)
        
    print(f"Export successful: {output_path}")

if __name__ == "__main__":
    # Komut satırından gelen argümanları al
    # Blender argüman ayırıcı "--" işaretinden sonrasını okuyoruz
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    
    if len(argv) < 2:
        print("Usage: blender -b -P convert.py -- <input.glb> <output.usdz>")
        sys.exit(1)

    input_file = argv[0]
    output_file = argv[1]

    convert_glb_to_usdz(input_file, output_file)