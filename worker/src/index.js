const ADMIN_ROLES = new Set(['super_admin', 'ngo_executive', 'communications_admin', 'content_admin']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  if (!origin) return '';
  return allowed.includes(origin) ? origin : '';
}

function corsHeaders(request, env) {
  const origin = allowedOrigin(request, env);
  return {
    'access-control-allow-origin': origin || 'null',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

function safeSegment(value, fallback = 'asset', max = 64) {
  const out = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
  return out || fallback;
}

function safeScope(value, fallback = 'uploads') {
  const parts = String(value || '')
    .split('/')
    .map((x) => safeSegment(x, '', 48))
    .filter(Boolean)
    .slice(0, 5);
  return parts.join('/') || fallback;
}

function extForType(type, fallbackName = '') {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-m4v': 'm4v',
  };
  if (map[type]) return map[type];
  const m = String(fallbackName).toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  return m ? m[1] : 'bin';
}

function bearer(request) {
  const raw = request.headers.get('authorization') || '';
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

async function requireAdmin(request, env) {
  const token = bearer(request);
  if (!token) throw new Response('Missing administrator token', { status: 401 });
  const base = String(env.NEON_DATA_API_URL || '').replace(/\/+$/, '');
  if (!base) throw new Response('Worker backend is not configured', { status: 503 });

  const res = await fetch(`${base}/admin_users?select=id,role,is_active&is_active=eq.true&limit=1`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  if (!res.ok) throw new Response('Administrator token could not be verified', { status: 401 });
  const rows = await res.json().catch(() => []);
  const admin = Array.isArray(rows) ? rows[0] : null;
  if (!admin || !admin.is_active || !ADMIN_ROLES.has(admin.role)) {
    throw new Response('Administrator authorization required', { status: 403 });
  }
  return admin;
}

function publicBase(request, env) {
  const configured = String(env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  return new URL(request.url).origin;
}

function managedKey(key, prefix) {
  const value = String(key || '').replace(/^\/+/, '');
  if (!value.startsWith(prefix + '/')) throw new Response('Invalid storage key', { status: 400 });
  if (value.includes('..')) throw new Response('Invalid storage key', { status: 400 });
  return value;
}

async function handleMediaGet(request, env, pathname) {
  const key = decodeURIComponent(pathname.slice('/media/'.length));
  if (!key || key.includes('..')) return new Response('Not found', { status: 404 });
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(obj.body, { headers });
}

async function imageUpload(request, env, url) {
  await requireAdmin(request, env);
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!IMAGE_TYPES.has(type)) return json({ error: 'Unsupported image type.' }, 415);
  const length = Number(request.headers.get('content-length') || 0);
  if (length && length > MAX_IMAGE_BYTES) return json({ error: 'Image exceeds 12 MB.' }, 413);
  const body = await request.arrayBuffer();
  if (!body.byteLength || body.byteLength > MAX_IMAGE_BYTES) return json({ error: 'Invalid image size.' }, 413);

  const scope = safeScope(url.searchParams.get('scope'));
  const original = safeSegment(url.searchParams.get('name') || 'image', 'image', 140);
  const ext = extForType(type, original);
  const stem = safeSegment(original.replace(/\.[^.]+$/, ''), 'image', 80);
  const now = new Date();
  const key = `images/${scope}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}-${stem}.${ext}`;
  await env.MEDIA.put(key, body, { httpMetadata: { contentType: type } });
  return json({ key, url: `${publicBase(request, env)}/media/${key}` }, 201);
}

async function imageDelete(request, env, url) {
  await requireAdmin(request, env);
  const key = managedKey(url.searchParams.get('key'), 'images');
  await env.MEDIA.delete(key);
  return json({ ok: true, key });
}

async function videoCreate(request, env) {
  await requireAdmin(request, env);
  const payload = await request.json().catch(() => ({}));
  const type = String(payload.type || '').toLowerCase();
  const size = Number(payload.size || 0);
  if (!VIDEO_TYPES.has(type)) return json({ error: 'Unsupported video type.' }, 415);
  if (!size || size > MAX_VIDEO_BYTES) return json({ error: 'Video must be between 1 byte and 2 GB.' }, 413);
  const original = safeSegment(payload.name || 'video', 'video', 160);
  const ext = extForType(type, original);
  const stem = safeSegment(original.replace(/\.[^.]+$/, ''), 'video', 90);
  const now = new Date();
  const key = `videos/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}-${stem}.${ext}`;
  const upload = await env.MEDIA.createMultipartUpload(key, { httpMetadata: { contentType: type } });
  return json({
    key,
    uploadId: upload.uploadId,
    url: `${publicBase(request, env)}/media/${key}`,
    originalFilename: payload.name || original,
    mimeType: type,
    size,
  }, 201);
}

async function videoPart(request, env, url) {
  await requireAdmin(request, env);
  const key = managedKey(url.searchParams.get('key'), 'videos');
  const uploadId = String(url.searchParams.get('uploadId') || '');
  const partNumber = Number(url.searchParams.get('partNumber') || 0);
  if (!uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
    return json({ error: 'Invalid multipart upload parameters.' }, 400);
  }
  const upload = env.MEDIA.resumeMultipartUpload(key, uploadId);
  const part = await upload.uploadPart(partNumber, request.body);
  return json({ partNumber: part.partNumber, etag: part.etag });
}

async function videoComplete(request, env) {
  await requireAdmin(request, env);
  const payload = await request.json().catch(() => ({}));
  const key = managedKey(payload.key, 'videos');
  const uploadId = String(payload.uploadId || '');
  const parts = Array.isArray(payload.parts) ? payload.parts : [];
  if (!uploadId || !parts.length) return json({ error: 'Multipart upload data is incomplete.' }, 400);
  const normalized = parts.map((p) => ({ partNumber: Number(p.partNumber), etag: String(p.etag || '') }));
  if (normalized.some((p) => !Number.isInteger(p.partNumber) || p.partNumber < 1 || !p.etag)) {
    return json({ error: 'Invalid multipart parts.' }, 400);
  }
  const upload = env.MEDIA.resumeMultipartUpload(key, uploadId);
  const object = await upload.complete(normalized);
  return json({ key, url: `${publicBase(request, env)}/media/${key}`, size: object.size });
}

async function videoAbort(request, env) {
  await requireAdmin(request, env);
  const payload = await request.json().catch(() => ({}));
  const key = managedKey(payload.key, 'videos');
  const uploadId = String(payload.uploadId || '');
  if (!uploadId) return json({ error: 'uploadId is required.' }, 400);
  await env.MEDIA.resumeMultipartUpload(key, uploadId).abort();
  return json({ ok: true, key });
}

async function videoDelete(request, env, url) {
  await requireAdmin(request, env);
  const key = managedKey(url.searchParams.get('key'), 'videos');
  await env.MEDIA.delete(key);
  return json({ ok: true, key });
}

async function router(request, env) {
  const url = new URL(request.url);
  const p = url.pathname;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method === 'GET' && p === '/health') {
    return json({ ok: true, service: 'cdc-media', version: '3.0.0', capabilities: { image: true, video: true, multipart: true } });
  }
  if (request.method === 'GET' && p.startsWith('/media/')) return handleMediaGet(request, env, p);
  if (request.method === 'POST' && p === '/image/upload') return imageUpload(request, env, url);
  if (request.method === 'DELETE' && p === '/image/object') return imageDelete(request, env, url);
  if (request.method === 'POST' && p === '/upload/create') return videoCreate(request, env);
  if (request.method === 'PUT' && p === '/upload/part') return videoPart(request, env, url);
  if (request.method === 'POST' && p === '/upload/complete') return videoComplete(request, env);
  if (request.method === 'POST' && p === '/upload/abort') return videoAbort(request, env);
  if (request.method === 'DELETE' && p === '/upload/object') return videoDelete(request, env, url);
  return json({ error: 'Not found.' }, 404);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    try {
      const response = await router(request, env);
      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
      headers.set('x-content-type-options', 'nosniff');
      headers.set('referrer-policy', 'no-referrer');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (error) {
      if (error instanceof Response) {
        const body = await error.text().catch(() => 'Request failed');
        return json({ error: body || 'Request failed' }, error.status || 500, cors);
      }
      console.error('CDC media worker error', error);
      return json({ error: 'Internal media service error.' }, 500, cors);
    }
  },
};
