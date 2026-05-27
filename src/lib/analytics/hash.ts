/**
 * SHA-256 — usado para hashear PII (email, telefone) antes de enviar para
 * pixels (Meta Advanced Matching e similares). Sempre normaliza pra
 * minúsculas + trim antes do hash.
 */
export async function sha256(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  if (typeof crypto === "undefined" || !crypto.subtle) {
    // Fallback determinístico simples — sem criptografia real, só evita
    // mandar valor cru em ambiente sem WebCrypto.
    let h = 0;
    for (let i = 0; i < normalized.length; i++) {
      h = (h * 31 + normalized.charCodeAt(i)) | 0;
    }
    return `fallback_${Math.abs(h).toString(16)}`;
  }
  const data = new TextEncoder().encode(normalized);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
