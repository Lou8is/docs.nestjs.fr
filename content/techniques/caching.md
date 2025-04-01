### Gestion du cache

La mise en cache est une **technique** puissante et simple pour améliorer les performances de votre application. En agissant comme une couche de stockage temporaire, elle permet un accès plus rapide aux données fréquemment utilisées, réduisant ainsi la nécessité d'aller chercher ou de calculer la même information à plusieurs reprises. Il en résulte des temps de réponse plus rapides et une efficacité globale accrue.

#### Installation

Pour commencer à utiliser la mise en cache dans Nest, vous devez installer le paquet `@nestjs/cache-manager` ainsi que le paquet `cache-manager`.

```bash
$ npm install @nestjs/cache-manager cache-manager
```

Par défaut, tout est stocké en mémoire ; Comme `cache-manager` utilise [Keyv](https://keyv.org/docs/) en interne, vous pouvez facilement passer à une solution de stockage plus avancée, comme Redis, en installant le paquetage approprié. Nous couvrirons cela plus en détail plus tard.

#### Cache en mémoire

Pour activer la mise en cache dans votre application, importez le module `CacheModule` et configurez-le en utilisant la méthode `register()` :

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

Cette configuration initialise la mise en cache en mémoire avec les paramètres par défaut, ce qui vous permet de commencer à mettre en cache les données immédiatement.

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

> warning **Note** La mémoire cache en mémoire ne peut stocker que des valeurs de types pris en charge par [l'algorithme de clonage structuré](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#javascript_types).

Vous pouvez spécifier manuellement un TTL (délai d'expiration en millisecondes) pour cette clé spécifique, comme suit :

```typescript
await this.cacheManager.set('key', 'value', 1000);
```

Où `1000` est le TTL en millisecondes - dans ce cas, l'élément de cache expirera après une seconde.

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

#### Time-to-live (TTL)

La valeur par défaut de `ttl` est `0`, ce qui signifie que le cache n'expirera jamais. Pour spécifier un [TTL](https://en.wikipedia.org/wiki/Time_to_live) personnalisé, vous pouvez fournir l'option `ttl` dans la méthode `register()`, comme démontré ci-dessous :

```typescript
CacheModule.register({
  ttl: 5000, // milliseconds
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

Vous pouvez appliquer le décorateur `@CacheTTL()` à chaque contrôleur pour définir un TTL de cache pour l'ensemble du contrôleur. Dans les situations où des paramètres de TTL de cache au niveau du contrôleur et au niveau de la méthode sont définis, les paramètres de TTL de cache spécifiés au niveau de la méthode auront la priorité sur ceux définis au niveau du contrôleur.

```typescript
@Controller()
@CacheTTL(50)
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

#### Utilisation d'autres stockages

Le passage à un magasin de cache différent est simple. Tout d'abord, installez le paquetage approprié. Par exemple, pour utiliser Redis, installez le paquet `@keyv/redis` :

```bash
$ npm install @keyv/redis
```

Avec ceci en place, vous pouvez enregistrer le `CacheModule` avec plusieurs magasins comme indiqué ci-dessous :

```typescript
import { Module } from '@nestjs/common';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis('redis://localhost:6379'),
          ],
        };
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

Dans cet exemple, nous avons enregistré deux stockages : `CacheableMemory` et `KeyvRedis`. Le magasin `CacheableMemory` est un simple stockage en mémoire, tandis que `KeyvRedis` est un magasin Redis. Le tableau `stores` est utilisé pour spécifier les stockages que vous voulez utiliser. Le premier magasin du tableau est le stockage par défaut, et les autres sont des stockages de repli.
Consultez la [documentation Keyv](https://keyv.org/docs/) pour plus d'informations sur les stockages disponibles.

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

Vous pouvez également passer ce que l'on appelle des `extraProviders` à la méthode `registerAsync()`. Ces fournisseurs seront fusionnés avec les fournisseurs du module.

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

C'est utile lorsque vous souhaitez fournir des dépendances supplémentaires à la fonction de factory ou au constructeur de la classe.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/20-cache).
