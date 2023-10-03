### Performance (Fastify)

Par défaut, Nest utilise le framework [Express](https://expressjs.com/). Comme mentionné précédemment, Nest offre également une compatibilité avec d'autres bibliothèques telles que, par exemple, [Fastify](https://github.com/fastify/fastify). Nest réalise cette indépendance vis-à-vis du framework en implémentant un adaptateur de framework dont la fonction principale est de fournir un middleware et des gestionnaires à des implémentations appropriées spécifiques à la bibliothèque.

> info **Astuce** Notez que pour qu'un adaptateur de framework soit mis en œuvre, la bibliothèque cible doit fournir un traitement de pipeline requête/réponse similaire à celui que l'on trouve dans Express.

[Fastify](https://github.com/fastify/fastify) fournit un bon framework alternatif à Nest car il résout les problèmes de conception d'une manière similaire à Express. Cependant, fastify est bien **plus rapide** qu'Express, obtenant des résultats presque deux fois meilleurs. Une question légitime est de savoir pourquoi Nest utilise Express comme fournisseur HTTP par défaut ? La raison est qu'Express est largement utilisé, bien connu, et qu'il dispose d'un énorme ensemble de middlewares compatibles, qui sont disponibles pour les utilisateurs de Nest immédiatement.

Mais comme Nest est indépendant du framework, vous pouvez facilement passer de l'un à l'autre. Fastify peut être un meilleur choix lorsque vous accordez une grande importance à des performances très rapides. Pour utiliser Fastify, il suffit de choisir l'adaptateur intégré `FastifyAdapter` comme montré dans ce chapitre.

#### Installation

Tout d'abord, nous devons installer le package requis :

```bash
$ npm i --save @nestjs/platform-fastify
```

#### Adaptateur

Une fois la plateforme Fastify installée, nous pouvons utiliser le `FastifyAdapter`.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.listen(3000);
}
bootstrap();
```

Par défaut, Fastify n'écoute que sur l'interface `localhost 127.0.0.1` ([en savoir plus](https://www.fastify.io/docs/latest/Guides/Getting-Started/#your-first-server)). Si vous voulez accepter des connexions sur d'autres hôtes, vous devez spécifier `'0.0.0.0'` dans l'appel `listen()` :

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000, '0.0.0.0');
}
```

#### Packages spécifiques à la plate-forme

Gardez à l'esprit que lorsque vous utilisez le `FastifyAdapter`, Nest utilise Fastify comme **fournisseur HTTP**. Cela signifie que toutes les recettes qui s'appuient sur Express peuvent ne plus fonctionner. Vous devez, à la place, utiliser des packages équivalents à Fastify.

#### Réponse de redirection

Fastify gère les réponses de redirection légèrement différemment d'Express. Pour effectuer une redirection correcte avec Fastify, renvoyez le code d'état et l'URL, comme suit :

```typescript
@Get()
index(@Res() res) {
  res.status(302).redirect('/login');
}
```

#### Options Fastify

Vous pouvez passer des options au constructeur de Fastify à travers le constructeur `FastifyAdapter`. Par exemple :

```typescript
new FastifyAdapter({ logger: true });
```


#### Middleware

Les fonctions du middleware récupèrent les objets `req` et `res` bruts au lieu des wrappers de Fastify. C'est ainsi que fonctionne le package `middie` (qui est utilisé sous le capot) et `fastify` - consultez cette [page](https://www.fastify.io/docs/latest/Reference/Middleware/) pour plus d'informations,

```typescript
@@filename(logger.middleware)
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    console.log('Request...');
    next();
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  use(req, res, next) {
    console.log('Request...');
    next();
  }
}
```

#### Configuration de route

Vous pouvez la fonctionnalité de [configuration de route](https://fastify.dev/docs/latest/Reference/Routes/#config) de Fastify avec le décorateur `@RouteConfig()`.

```typescript
@RouteConfig({ output: 'hello world' })
@Get()
index(@Req() req) {
  return req.routeConfig.output;
}
```

> info **Astuce** `@RouteConfig()` est importé de `@nestjs/platform-fastify`.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/10-fastify).
