# Security and privacy

EatOS handles health-adjacent data, so it is built to keep that data on
the person's devices and under their control.

## What is protected, and how

| Data | Protection |
|---|---|
| Event log on a device | Optional passphrase encryption (XChaCha20-Poly1305, key from scrypt N=2^15). The app starts locked. |
| Saved secrets (sync code, Anthropic API key) | Encrypted with the same key when device protection is on |
| Backups | Plain JSON or passphrase-encrypted, restorable on any device |
| Server files (`apps/api`) | Encrypted at rest when `EATOS_DATA_KEY` is set; files are owner-only (mode 600) |
| Calendar data | Only free/busy is read; titles are dropped unless the person opts in |
| Ask EatOS | On-device by default. The optional Claude adapter sends only the typed sentence, with the person's own key |
| Delivery menus | A dish with no allergen information is treated as unsafe for anyone with an allergy |

## Your controls

- **Export** all data, plain or encrypted, at any time (Profile).
- **Delete** all data on the device, and on the sync server when sync is on. Setup then confirms what was deleted, and says so if the server could not be reached.
- **Lock** the app from Profile when protection is on.

## Design decisions

- There is no recovery for a lost passphrase. A backup is the safety net.
- Randomness is supplied by the platform (`expo-crypto` on devices, `node:crypto` on the server); the vault itself is pure JavaScript (`@noble/ciphers`, `@noble/hashes`) so it behaves the same on web, iOS and Android.
- Key settings and the salt are bound to each ciphertext as associated data. Tampering with any of them makes decryption fail.
- Files are written atomically (write to a temporary file, then rename).

## Known limits

- The API server identifies a user by a sync code in the `x-user-id` header. It is meant for a personal or household server, not the open internet; put it behind HTTPS and a reverse proxy with real authentication before exposing it.
- Events travel to the sync server in plain JSON (over HTTPS if you deploy it so). Server-side encryption protects files at rest, not data in transit or in memory.
- On the web, the browser's storage holds the encrypted log and the app cannot stop a person from using a weak passphrase beyond a minimum length.

## Reporting a problem

Open a private security advisory on the repository.
