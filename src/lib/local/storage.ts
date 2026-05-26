// Local "storage" mock. We don't actually upload anywhere; we just turn the
// uploaded blob into an object URL so the UI can preview it within the session.

interface UploadResult {
  data: { path: string } | null;
  error: { message: string } | null;
}

const blobUrls = new Map<string, string>();

export function localStorageBucket(bucket: string) {
  return {
    async upload(path: string, file: File | Blob, _options?: Record<string, unknown>): Promise<UploadResult> {
      try {
        const url = URL.createObjectURL(file);
        blobUrls.set(`${bucket}/${path}`, url);
        return { data: { path }, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload local falhou";
        return { data: null, error: { message: msg } };
      }
    },

    getPublicUrl(path: string) {
      const url = blobUrls.get(`${bucket}/${path}`) ?? `local://${bucket}/${path}`;
      return { data: { publicUrl: url } };
    },

    async remove(paths: string[]) {
      for (const p of paths) {
        const key = `${bucket}/${p}`;
        const url = blobUrls.get(key);
        if (url) {
          try { URL.revokeObjectURL(url); } catch { /* ignore */ }
          blobUrls.delete(key);
        }
      }
      return { data: paths.map((p) => ({ name: p })), error: null };
    },

    async createSignedUrl(path: string, _expiresIn: number) {
      const { data } = this.getPublicUrl(path);
      return { data: { signedUrl: data.publicUrl }, error: null };
    },

    async list(_prefix?: string) {
      return { data: [], error: null };
    },
  };
}

export const localStorageApi = {
  from: localStorageBucket,
};
