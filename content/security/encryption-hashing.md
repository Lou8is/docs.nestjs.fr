### Chiffrement et hachage

**Le chiffrement** est le processus d'encodage des informations. Ce processus convertit la représentation originale de l'information, connue sous le nom de texte en clair, en une forme alternative connue sous le nom de texte chiffré. Idéalement, seules les parties autorisées peuvent déchiffrer un texte chiffré en texte clair et accéder à l'information d'origine. Le chiffrement n'empêche pas en soi les interférences, mais refuse le contenu intelligible à un intercepteur potentiel. Le chiffrement est une fonction bidirectionnelle ; ce qui est chiffré peut être déchiffré avec la clé appropriée.

**Le hachage** est le processus de conversion d'une clé donnée en une autre valeur. Une fonction de hachage est utilisée pour générer la nouvelle valeur selon un algorithme mathématique. Une fois le hachage effectué, il devrait être impossible de passer de la sortie à l'entrée.

#### Chiffrement

Node.js fournit un [module cryptographique](https://nodejs.org/api/crypto.html) intégré que vous pouvez utiliser pour chiffrer et déchiffrer des chaînes, des nombres, des buffers, des flux, etc. Nest lui-même ne fournit aucun package supplémentaire au-dessus de ce module afin d'éviter d'introduire des abstractions inutiles.

A titre d'exemple, utilisons l'algorithme AES (Advanced Encryption System) `'aes-256-ctr'` en mode de cryptage CTR.

```typescript
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const iv = randomBytes(16);
const password = 'Password used to generate key';

// La longueur de la clé dépend de l'algorithme.
// Dans ce cas, pour aes256, il s'agit de 32 octets.
const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
const cipher = createCipheriv('aes-256-ctr', key, iv);

const textToEncrypt = 'Nest';
const encryptedText = Buffer.concat([
  cipher.update(textToEncrypt),
  cipher.final(),
]);
```

> warning **Attention** Un même vecteur d'initialisation (IV) ne doit pas être réutilisé pour chiffrer plusieurs messages avec une même clé

Il faut maintenant décrypter la valeur `encryptedText` :

```typescript
import { createDecipheriv } from 'crypto';

const decipher = createDecipheriv('aes-256-ctr', key, iv);
const decryptedText = Buffer.concat([
  decipher.update(encryptedText),
  decipher.final(),
]);
```

#### Hachage

Pour le hachage, nous recommandons d'utiliser les packages [bcrypt](https://www.npmjs.com/package/bcrypt) ou [argon2](https://www.npmjs.com/package/argon2). Nest lui-même ne fournit pas d'enveloppe supplémentaire au-dessus de ces modules afin d'éviter d'introduire des abstractions inutiles (ce qui rend la courbe d'apprentissage courte).

Par exemple, utilisons `bcrypt` pour hacher un mot de passe aléatoire.

Installez d'abord les packages nécessaires :

```shell
$ npm i bcrypt
$ npm i -D @types/bcrypt
```

Une fois l'installation terminée, vous pouvez utiliser la fonction `hash`, comme suit :

```typescript
import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
const password = 'random_password';
const hash = await bcrypt.hash(password, saltOrRounds);
```

Pour générer un salt, utilisez la fonction `genSalt` :

```typescript
const salt = await bcrypt.genSalt();
```

Pour comparer/vérifier un mot de passe, utilisez la fonction `compare` :

```typescript
const isMatch = await bcrypt.compare(password, hash);
```

Vous pouvez en savoir plus sur les fonctions disponibles [ici](https://www.npmjs.com/package/bcrypt).
