### Compression

La compression permet de réduire considérablement la taille du corps de la réponse, ce qui augmente la vitesse d'une application web.

Pour les sites web **à fort trafic** en production, il est fortement recommandé de décharger la compression du serveur d'application - typiquement en utilisant un proxy inverse à la place (par exemple, Nginx). Dans ce cas, vous ne devriez pas utiliser de middleware de compression.

#### Utilisation avec Express (par défaut)

Utilisez le package middleware [compression](https://github.com/expressjs/compression) pour activer la compression gzip.

Installez d'abord le package requis :

```bash
$ npm i --save compression
```

Une fois l'installation terminée, appliquez le middleware de compression en tant que middleware global.

```typescript
import * as compression from 'compression';
// quelque part dans votre fichier d'initialisation
app.use(compression());
```

#### Utilisation avec Fastify

Si vous utilisez l'adaptateur `FastifyAdapter`, vous devrez utiliser [fastify-compress](https://github.com/fastify/fastify-compress) :

```bash
$ npm i --save @fastify/compress
```

Une fois l'installation terminée, appliquez le middleware `@fastify/compress` en tant que middleware global.

```typescript
import compression from '@fastify/compress';
// quelque part dans votre fichier d'initialisation
await app.register(compression);
```

Par défaut, `@fastify/compress` utilisera la compression Brotli (sur Node >= 11.7.0) lorsque les navigateurs indiquent qu'ils supportent cet encodage. Bien que Brotli puisse être assez efficace en termes de taux de compression, il peut aussi être assez lent. Par défaut, Brotli définit une qualité de compression maximale de 11, bien qu'elle puisse être ajustée pour réduire le temps de compression au détriment de la qualité de compression en ajustant le paramètre `BROTLI_PARAM_QUALITY` entre 0 (minimum) et 11 (maximum). Cela nécessitera un réglage fin pour optimiser les performances en termes d'espace et de temps. Voici un exemple avec une qualité de 4 :

```typescript
import { constants } from 'zlib';
// quelque part dans votre fichier d'initialisation
await app.register(compression, { brotliOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } } });
```

Pour simplifier, vous pouvez demander à `fastify-compress` d'utiliser uniquement la compression deflate et gzip pour compresser les réponses; cela peut entraîner des réponses potentiellement plus volumineuses, mais elles seront livrées beaucoup plus rapidement.

Pour spécifier les encodages, il faut fournir un second argument à `app.register` :

```typescript
await app.register(compression, { encodings: ['gzip', 'deflate'] });
```

Ce qui précède indique à `fastify-compress` de n'utiliser que les encodages gzip et deflate, en préférant gzip si le client supporte les deux.
