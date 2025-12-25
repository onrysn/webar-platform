import { WebIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3d';

// 1. WASM DOSYASININ YOLUNU VITE'TAN İSTİYORUZ
// Bu satır, build sırasında dosyanın asset olarak kopyalanmasını sağlar.
import dracoEncoderWasmUrl from 'draco3d/draco_encoder.wasm?url';

export const compressGLB = async (blob: Blob): Promise<Blob> => {
    
    // 2. WASM DOSYASINI MANUEL İNDİRİYORUZ
    // draco3d'nin kendi kendine bulmasını beklemiyoruz, biz veriyoruz.
    const response = await fetch(dracoEncoderWasmUrl);
    const wasmBinary = await response.arrayBuffer();

    const io = new WebIO();
    
    // 3. ENCODER MODÜLÜNÜ BİNARY İLE OLUŞTURUYORUZ
    io.registerDependencies({
        'draco3d.encoder': await draco3d.createEncoderModule({ wasmBinary }),
    });

    io.registerExtensions([KHRDracoMeshCompression]);

    const arrayBuffer = await blob.arrayBuffer();
    const document = await io.readBinary(new Uint8Array(arrayBuffer));

    // 4. SIKIŞTIRMA AYARLARI
    await document.transform(
        draco({
            method: 'edgebreaker',
            quantizePosition: 14,
            quantizeNormal: 10,
            quantizeTexcoord: 12,
            quantizeColor: 8,
            quantizeGeneric: 12
        })
    );
    
    const compressedBuffer = await io.writeBinary(document);

    return new Blob([compressedBuffer as any], { type: 'model/gltf-binary' });
};