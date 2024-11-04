### Middleware

Un middleware est une fonction qui est appelée **avant** le handler de route. Les fonctions intermédiaires ont accès aux objets [request](https://expressjs.com/en/4x/api.html#req) et [response](https://expressjs.com/en/4x/api.html#res), ainsi qu'à la fonction intermédiaire `next()` dans le cycle requête-réponse de l'application. La fonction **next** de l'intergiciel est généralement désignée par une variable nommée `next`.

<figure><img class="illustrative-image" src="/assets/Middlewares_1.png" /></figure>

Les middlewares Nest sont, par défaut, équivalents aux middlewares [express](https://expressjs.com/en/guide/using-middleware.html). La description suivante, tirée de la documentation officielle d'express, décrit les capacités des middlewares :

<blockquote class="external">
  Les fonctions middleware peuvent effectuer les tâches suivantes :
  <ul>
    <li>exécuter n'importe quel code.</li>
    <li>apporter des modifications aux objets "requête" et "réponse".</li>
    <li>mettre fin au cycle requête-réponse.</li>
    <li>appeler la fonction middleware suivante dans la pile.</li>
    <li>si la fonction middleware actuelle ne met pas fin au cycle requête-réponse, elle doit appeler <code>next()</code> pour
      passer le contrôle à la fonction middleware suivante. Dans le cas contraire, la requête sera laissée en suspens.</li>
  </ul>
</blockquote>

Vous implémentez un middleware Nest personnalisé soit dans une fonction, soit dans une classe avec un décorateur `@Injectable()`. La classe doit implémenter l'interface `NestMiddleware`, tandis que la fonction n'a pas d'exigences particulières. Commençons par implémenter un middleware simple en utilisant une classe.

>  warning **Attention** `Express` et `fastify` gèrent les middlewares différemment et fournissent des signatures de méthodes différentes, apprenez-en plus [ici](/techniques/performance#middleware).


```typescript
@@filename(logger.middleware)
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
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

#### Injection de dépendances

Le middleware Nest prend entièrement en charge l'injection de dépendances. Tout comme les fournisseurs et les contrôleurs, ils sont capables **d'injecter des dépendances** qui sont disponibles dans le même module. Comme d'habitude, cela se fait à travers le `constructeur`.

#### Appliquer le middleware

Il n'y a pas de place pour les middlewares dans le décorateur `@Module()`. A la place, nous les configurons en utilisant la méthode `configure()` de la classe du module. Les modules qui incluent un middleware doivent implémenter l'interface `NestModule`. Configurons l'intergiciel `LoggerMiddleware` au niveau de `AppModule`.

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
@@switch
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
```

Dans l'exemple ci-dessus, nous avons configuré le `LoggerMiddleware` pour les gestionnaires de routes `/cats` qui ont été précédemment définis dans le `CatsController`. Nous pouvons également restreindre un middleware à une méthode de requête particulière en passant un objet contenant la route `path` et la requête `method` à la méthode `forRoutes()` lors de la configuration du middleware. Dans l'exemple ci-dessous, nous avons importé l'enum `RequestMethod` pour référencer le type de méthode de requête désiré.

```typescript
@@filename(app.module)
import { Module, NestModule, RequestMethod, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
@@switch
import { Module, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
```

> info **Astuce** La méthode `configure()` peut être rendue asynchrone en utilisant `async/await` (par exemple, vous pouvez `await` la fin d'une opération asynchrone dans le corps de la méthode `configure()`).

> warning **Attention** Lorsque vous utilisez l'adaptateur `express`, l'application NestJS va enregistrer `json` et `urlencoded` à partir du paquet `body-parser` par défaut. Cela signifie que si vous voulez personnaliser ce middleware via le `MiddlewareConsumer`, vous devez désactiver le middleware global en mettant le drapeau `bodyParser` à `false` lors de la création de l'application avec `NestFactory.create()`.

#### Jokers de route

Les itinéraires basés sur des motifs sont également pris en charge. Par exemple, l'astérisque est utilisé comme **caractère générique**, et correspondra à n'importe quelle combinaison de caractères :

```typescript
forRoutes({
    path: 'ab*cd',
    method: RequestMethod.ALL,
});
```

Le chemin d'accès `'ab*cd'` correspondra à `abcd`, `ab_cd`, `abecd`, et ainsi de suite. Les caractères `?`, `+`, `*`, et `()` peuvent être utilisés dans un chemin d'accès, et sont des sous-ensembles de leurs expressions régulières correspondantes. Le trait d'union ( `-`) et le point (`.`) sont interprétés littéralement par les chemins basés sur des chaînes de caractères.

> warning **Attention** Le paquet `fastify` utilise la dernière version du paquet `path-to-regexp`, qui ne supporte plus les astérisques `*`. A la place, vous devez utiliser des paramètres (par exemple, `(.*)`, `:splat*`).

#### Consommateur de middleware

Le `MiddlewareConsumer` est une classe "helper". Elle fournit plusieurs méthodes intégrées pour gérer les middlewares. Toutes peuvent être simplement **chaînées** dans le [style fluide](https://en.wikipedia.org/wiki/Fluent_interface). La méthode `forRoutes()` peut prendre une seule chaîne, plusieurs chaînes, un objet `RouteInfo`, une classe de contrôleur et même plusieurs classes de contrôleur. Dans la plupart des cas, vous passerez simplement une liste de **contrôleurs** séparés par des virgules. Voici un exemple avec un seul contrôleur :

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}
@@switch
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}
```

> info **Astuce** La méthode `apply()` peut prendre un seul middleware, ou plusieurs arguments pour spécifier <a href="/middleware#middlewares-multiples">plusieurs middlewares</a>.

#### Exclure des routes

Parfois, nous voulons **exclure** certaines routes de l'application du middleware. Nous pouvons facilement exclure certaines routes avec la méthode `exclude()`. Cette méthode peut prendre une seule chaîne de caractères, plusieurs chaînes de caractères, ou un objet `RouteInfo` identifiant les routes à exclure, comme montré ci-dessous :

```typescript
consumer
  .apply(LoggerMiddleware)
  .exclude(
    { path: 'cats', method: RequestMethod.GET },
    { path: 'cats', method: RequestMethod.POST },
    'cats/(.*)',
  )
  .forRoutes(CatsController);
```

> info **Astuce** La méthode `exclude()` prend en charge les paramètres joker en utilisant le paquet [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters).

Dans l'exemple ci-dessus, `LoggerMiddleware` sera lié à toutes les routes définies dans `CatsController` **excepté** les trois passées à la méthode `exclude()`.

#### Middleware fonctionnel

La classe `LoggerMiddleware` que nous avons utilisée est assez simple. Elle n'a pas de membres, pas de méthodes supplémentaires, et pas de dépendances. Pourquoi ne pas la définir dans une simple fonction au lieu d'une classe ? En fait, c'est possible. Ce type de middleware est appelé ** middleware fonctionnel**. Pour illustrer la différence, transformons le middleware du logger, basé sur une classe, en middleware fonctionnel :

```typescript
@@filename(logger.middleware)
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request...`);
  next();
};
@@switch
export function logger(req, res, next) {
  console.log(`Request...`);
  next();
};
```

Et utilisons-le dans le `AppModule` :

```typescript
@@filename(app.module)
consumer
  .apply(logger)
  .forRoutes(CatsController);
```

> info **Astuce** Envisagez d'utiliser l'alternative plus simple du **middleware fonctionnel** chaque fois que votre middleware n'a besoin d'aucune dépendance.

#### Middlewares multiples

Comme mentionné ci-dessus, afin de lier plusieurs middleware qui sont exécutés séquentiellement, il suffit de fournir une liste séparée par des virgules dans la méthode `apply()` :

```typescript
consumer.apply(cors(), helmet(), logger).forRoutes(CatsController);
```

#### Middleware global

Si nous voulons lier le middleware à chaque route enregistrée en une seule fois, nous pouvons utiliser la méthode `use()` qui est fournie par l'instance `INestApplication` :

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.use(logger);
await app.listen(process.env.PORT ?? 3000);
```

> info **Astuce** L'accès au conteneur DI dans un middleware global n'est pas possible. Vous pouvez utiliser un [middleware fonctionnel](middleware#middleware-fonctionnel) à la place en utilisant `app.use()`. Alternativement, vous pouvez utiliser un middleware de classe et le consommer avec `.forRoutes('*')` dans le `AppModule` (ou tout autre module).
