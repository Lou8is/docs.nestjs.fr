### Gestion du cache

La mise en cache est une **technique** simple et efficace qui permet d'améliorer les performances de votre application. Elle agit comme un stockage temporaire de données qui permet un accès performant aux données.

#### Installation

Installez d'abord les packages nécessaires :

```bash
$ npm install @nestjs/cache-manager cache-manager
```

> warning **Attention** La version 4 de `cache-manager` utilise les secondes pour le `TTL (Time-To-Live)`. La version actuelle de `cache-manager` (v5) utilise des millisecondes à la place. NestJS ne convertit pas la valeur, et transmet simplement le ttl que vous fournissez à la bibliothèque. En d'autres termes :
> * Si vous utilisez `cache-manager` v4, fournissez le ttl en secondes
> * Si vous utilisez `cache-manager` v5, fournissez le ttl en millisecondes.
> * La documentation se réfère à des secondes, puisque NestJS a été publié avec la version 4 du gestionnaire de cache.

#### Cache en mémoire

Nest fournit une API unifiée pour différents fournisseurs de stockage de cache. Celui qui est intégré est un stockage de données en mémoire. Cependant, vous pouvez facilement passer à une solution plus complète, comme Redis.

Pour activer la mise en cache, importez le module `CacheModule` et appelez sa méthode `register()`.

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
})
export class AppModule {}
```

#### Interagir avec le stockage de données dans le cache

Pour interagir avec l'instance du gestionnaire de cache, injectez-la dans votre classe en utilisant le jeton `CACHE_MANAGER`, comme suit :

```typescript
constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
```

> info **Astuce** La classe `Cache` est importée du package `cache-manager`, tandis que le token `CACHE_MANAGER` provient du package `@nestjs/cache-manager`.

La méthode `get` de l'instance `Cache` (du package `cache-manager`) est utilisée pour récupérer des éléments du cache. Si l'élément n'existe pas dans le cache, `null` sera retourné.

```typescript
const value = await this.cacheManager.get('key');
```

Pour ajouter un élément au cache, utilisez la méthode `set` :

```typescript
await this.cacheManager.set('key', 'value');
```

Le délai d'expiration par défaut du cache est de 5 secondes.

Vous pouvez spécifier manuellement un TTL (délai d'expiration en secondes) pour cette clé spécifique, comme suit :

```typescript
await this.cacheManager.set('key', 'value', 1000);
```

Pour désactiver l'expiration du cache, mettez la propriété de configuration `ttl` à `0` :

```typescript
await this.cacheManager.set('key', 'value', 0);
```

Pour supprimer un élément du cache, utilisez la méthode `del` :

```typescript
await this.cacheManager.del('key');
```

Pour effacer tout le cache, utilisez la méthode `reset` :

```typescript
await this.cacheManager.reset();
```

#### Mise en cache automatique des réponses

> warning **Attention** Dans les applications [GraphQL](/graphql/quick-start), les intercepteurs sont exécutés séparément pour chaque résolveur de champs. Ainsi, `CacheModule` (qui utilise les intercepteurs pour mettre en cache les réponses) ne fonctionnera pas correctement.

Pour activer la mise en cache automatique des réponses, il suffit de lier le `CacheInterceptor` à l'endroit où vous voulez mettre les données en cache.

```typescript
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get()
  findAll(): string[] {
    return [];
  }
}
```

> warning **Attention** Seuls les endpoints `GET` sont mis en cache. De même, les routes de serveur HTTP qui injectent l'objet de réponse natif (`@Res()`) ne peuvent pas utiliser l'intercepteur de cache. Voir
> <a href="/interceptors#mappage-des-réponses">mappage des réponses</a> pour plus de détails.

Pour réduire la quantité de code de base nécessaire, vous pouvez lier `CacheInterceptor` à tous les points de terminaison de manière globale :

```typescript
import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

#### Personnalisation de la mise en cache

Toutes les données mises en cache ont leur propre délai d'expiration ([TTL](https://en.wikipedia.org/wiki/Time_to_live)). Pour personnaliser les valeurs par défaut, passez l'objet options à la méthode `register()`.

```typescript
CacheModule.register({
  ttl: 5, // secondes
  max: 10, // nombre maximum d'éléments dans le cache
});
```

#### Utilisation globale du module

Lorsque vous voulez utiliser `CacheModule` dans d'autres modules, vous devez l'importer (comme c'est le cas pour tout module Nest). Vous pouvez aussi le déclarer comme [module global](/modules#modules-globaux) en fixant la propriété `isGlobal` de l'objet options à `true`, comme indiqué ci-dessous. Dans ce cas, vous n'aurez pas besoin d'importer `CacheModule` dans d'autres modules une fois qu'il aura été chargé dans le module racine (par exemple, `AppModule`).

```typescript
CacheModule.register({
  isGlobal: true,
});
```

#### Surcharges du cache global

Lorsque le cache global est activé, les entrées du cache sont stockées sous une `CacheKey` qui est générée automatiquement en fonction du chemin de la route. Vous pouvez surcharger certains paramètres de cache (`@CacheKey()` et `@CacheTTL()`) pour chaque méthode, ce qui permet de personnaliser les stratégies de mise en cache pour les méthodes individuelles des contrôleurs. Cela peut s'avérer très utile lors de l'utilisation de [différents stockages de cache](/techniques/caching#différents-stockages).

```typescript
@Controller()
export class AppController {
  @CacheKey('custom_key')
  @CacheTTL(20)
  findAll(): string[] {
    return [];
  }
}
```

> info **Astuce** Les décorateurs `@CacheKey()` et `@CacheTTL()` sont importés du package `@nestjs/cache-manager`.

The `@CacheKey()` decorator may be used with or without a corresponding `@CacheTTL()` decorator and vice versa. One may choose to override only the `@CacheKey()` or only the `@CacheTTL()`. Settings that are not overridden with a decorator will use the default values as registered globally (see [Customize caching](/techniques/caching#personnalisation-de-la-mise-en-cache)).

#### WebSockets et Microservices

Vous pouvez également appliquer le `CacheInterceptor` aux abonnés WebSocket ainsi qu'aux patterns Microservice (quelle que soit la méthode de transport utilisée).

```typescript
@@filename()
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
@@switch
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

Cependant, le décorateur supplémentaire `@CacheKey()` est nécessaire pour spécifier une clé utilisée pour stocker et récupérer ultérieurement les données mises en cache. Notez également qu'il ne faut pas **tout mettre en cache**. Les actions qui effectuent des opérations métier plutôt que de simplement interroger les données ne doivent jamais être mises en cache.

De plus, vous pouvez spécifier un délai d'expiration du cache (TTL) en utilisant le décorateur `@CacheTTL()`, qui remplacera la valeur globale par défaut du TTL.

```typescript
@@filename()
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
@@switch
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

> info **Astuce** Le décorateur `@CacheTTL()` peut être utilisé avec ou sans le décorateur `@CacheKey()` correspondant.

#### Ajuster le suivi

Par défaut, Nest utilise l'URL de la requête (dans une application HTTP) ou la clé de cache (dans les applications websockets et microservices, définie via le décorateur `@CacheKey()`) pour associer les enregistrements de cache à vos endpoints. Néanmoins, vous pouvez parfois vouloir mettre en place un suivi basé sur différents facteurs, par exemple, en utilisant des en-têtes HTTP (par exemple, `Authorization` pour identifier correctement les points de terminaison `profile`).

Pour ce faire, créez une sous-classe de `CacheInterceptor` et surchargez la méthode `trackBy()`.

```typescript
@Injectable()
class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    return 'key';
  }
}
```

#### Différents stockages

Ce service tire parti de [cache-manager](https://github.com/node-cache-manager/node-cache-manager) sous le capot. Le package `cache-manager` supporte une large gamme de stockages utiles, par exemple, le [stockage Redis](https://github.com/dabroek/node-cache-manager-redis-store). Une liste complète des magasins supportés est disponible [ici](https://github.com/node-cache-manager/node-cache-manager#store-engines). Pour configurer le magasin Redis, il suffit de passer le package avec les options correspondantes à la méthode `register()`.

```typescript
import type { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';

@Module({
  imports: [
    CacheModule.register<RedisClientOptions>({
      store: redisStore,

      // Configuration spécifique au stockage :
      host: 'localhost',
      port: 6379,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

> warning **Attention** `cache-manager-redis-store` ne supporte pas redis v4. Pour que l'interface `ClientOpts` existe et fonctionne correctement, vous devez installer la
> dernière version majeure de `redis` 3.x.x. Voir cette [issue](https://github.com/dabroek/node-cache-manager-redis-store/issues/40) pour suivre la progression de cette mise à jour.

#### Configuration asynchrone

Vous pouvez vouloir passer des options de module de manière asynchrone au lieu de les passer statiquement au moment de la compilation. Dans ce cas, utilisez la méthode `registerAsync()`, qui fournit plusieurs façons de gérer la configuration asynchrone.

Une approche consiste à utiliser une fonction factory :

```typescript
CacheModule.registerAsync({
  useFactory: () => ({
    ttl: 5,
  }),
});
```

Notre fabrique se comporte comme toutes les autres fabriques de modules asynchrones (elle peut être `async` et est capable d'injecter des dépendances via `inject`).

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    ttl: configService.get('CACHE_TTL'),
  }),
  inject: [ConfigService],
});
```

Vous pouvez également utiliser la méthode `useClass` :

```typescript
CacheModule.registerAsync({
  useClass: CacheConfigService,
});
```

La construction ci-dessus instanciera `CacheConfigService` dans `CacheModule` et l'utilisera pour obtenir l'objet options. Le `CacheConfigService` doit implémenter l'interface `CacheOptionsFactory` afin de fournir les options de configuration :

```typescript
@Injectable()
class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      ttl: 5,
    };
  }
}
```

Si vous souhaitez utiliser un fournisseur de configuration existant importé d'un module différent, utilisez la syntaxe `useExisting` :

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Cela fonctionne de la même manière que `useClass` avec une différence essentielle - `CacheModule` va chercher dans les modules importés pour réutiliser tout `ConfigService` déjà créé, au lieu d'instancier le sien.

> info **Astuce** `CacheModule#register` et `CacheModule#registerAsync` et `CacheOptionsFactory` ont un générique optionnel (argument de type) pour restreindre les options de configuration spécifiques au magasin, ce qui les rend sûrs du point de vue du type.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/20-cache).
