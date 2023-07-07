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

Par défaut, `@fastify/compress` utilisera la compression Brotli (sur Node >= 11.7.0) lorsque les navigateurs indiquent qu'ils supportent cet encodage. Bien que Brotli soit assez efficace en termes de taux de compression, il est également assez lent. Pour cette raison, vous pouvez demander à fastify-compress de n'utiliser que deflate et gzip pour compresser les réponses ; vous vous retrouverez avec des réponses plus volumineuses mais elles seront délivrées beaucoup plus rapidement.

Pour spécifier les encodages, il faut fournir un second argument à `app.register` :

```typescript
await app.register(compression, { encodings: ['gzip', 'deflate'] });
```

Ce qui précède indique à `fastify-compress` de n'utiliser que les encodages gzip et deflate, en préférant gzip si le client supporte les deux.
