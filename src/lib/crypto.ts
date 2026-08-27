import { timingSafeEqual, createHash } from "crypto";

// Compara duas strings em tempo constante, evitando timing attacks em
// tokens, secrets e hashes. Ambos os lados são reduzidos a um digest de
// tamanho fixo antes da comparação, para que a checagem de comprimento do
// timingSafeEqual nunca vaze o tamanho original do valor comparado.
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(createHash("sha256").update(a).digest());
  const bufB = Buffer.from(createHash("sha256").update(b).digest());
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
