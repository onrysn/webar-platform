import bpy
import sys
import os

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

    # 3. GLB Olarak Export Et
    try:
        bpy.ops.export_scene.gltf(
            filepath=output_path,
            export_format='GLB',
            export_yup=True,  # GLB Y-yukarı eksen kullanır
            export_apply=True # Transformları uygula
        )
    except Exception as e:
        print(f"Error exporting GLB: {e}")
        sys.exit(1)
        
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