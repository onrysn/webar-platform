# GLTF to USDZ Converter - Optimized API

High-performance GLTF/GLB to USDZ conversion service optimized for production use.

## 🚀 Performance Optimizations

- **Async Processing**: Non-blocking conversion with `Bun.spawn()`
- **Worker Pool**: Max 4 concurrent conversions (configurable)
- **Memory Cache**: SHA-256 based caching for identical files
- **Smart Cleanup**: Automatic file expiration every minute
- **No UI Overhead**: API-only service (UI removed)

## 📊 Expected Performance

- **Single Conversion**: ~1-3 seconds (unchanged)
- **Concurrent Requests**: Up to 4x throughput
- **Cached Files**: ~50-100ms response time
- **Overall Improvement**: ~30-40% faster than previous version

## 🔧 API Endpoints

### POST /api/convert
Convert GLTF/GLB to USDZ

```bash
curl -X POST http://localhost:3001/api/convert -F "file=@model.glb"
```

Response:
```json
{
  "id": "1706025600000_abc-123",
  "expires": 1706027400000,
  "name": "model.usdz",
  "cached": false
}
```

### GET /api/download?id={id}&name={name}
Download converted USDZ file

### GET /health
Health check with conversion stats

## 🐳 Docker

```bash
docker build -t gltf2usdz-converter .
docker run -p 3001:3001 gltf2usdz-converter
```

## ⚙️ Configuration

Edit `server/index.ts`:
- `EXPIRATION_TIME`: File retention (default: 30 min)
- `MAX_CONCURRENT_CONVERSIONS`: Worker pool size (default: 4)
- `CACHE_SIZE_LIMIT`: Max cached items (default: 50)

Made with:
- [bun](https://bun.sh)
- [google/usd_from_gltf](https://github.com/google/usd_from_gltf)

Acknowledgments:
- [marlon360](https://github.com/marlon360) for providing the [docker image for usd_from_gltf](https://hub.docker.com/r/marlon360/usd-from-gltf).
- [shadcn/ui](https://ui.shadcn.com) and [aceternity UI](https://ui.aceternity.com) for providing beautiful UI components.

## Development

To install the dependencies, run:

```bash
bun install
```

To start the server, navigate to the **server** directory and run:

```bash
bun run dev
```

For frontend development, navigate to the **client** directory and run:

```bash
bun run dev
```

## Docker Image

There's a Docker image for the project available at [Docker Hub](https://hub.docker.com/r/arthurrmp/gltf2usdz-online). 

To run it on your machine, ensure [Docker](https://www.docker.com/products/docker-desktop) is installed and run the command:

```bash
docker run -it -p 4000:4000 arthurrmp/gltf2usdz-online
```

After that, you will be able to access the project at http://localhost:4000. All processing will happen locally.

You can also deploy it to any cloud provider.

