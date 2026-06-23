import { encrypt, decrypt } from "eciesjs";

/**
 * ECIES encryption to the owner's wallet public key (non-custodial).
 * The memory blob is encrypted client-side before it ever touches 0G Storage,
 * so only the owner (holder of the matching private key) can read it.
 *
 * For the re-encryption oracle (planned), the same scheme is used server-side:
 * decrypt with the old owner's key, re-encrypt to the new owner's public key.
 *
 * Getting the recipient's secp256k1 public key:
 *  - recover it from a signed message (ethers SigningKey.recoverPublicKey),
 *    or maintain a small on-chain/off-chain registry of pubkeys per address.
 */

export function encryptForPubKey(pubKeyHex: string, plaintext: string): Uint8Array {
  const data = new TextEncoder().encode(plaintext);
  // eciesjs accepts a hex pubkey (0x-prefixed compressed or uncompressed) + Uint8Array.
  return Uint8Array.from(encrypt(pubKeyHex, data));
}

export function decryptWithPrivKey(privKeyHex: string, ciphertext: Uint8Array): string {
  const out = decrypt(privKeyHex, ciphertext);
  return new TextDecoder().decode(Uint8Array.from(out));
}
