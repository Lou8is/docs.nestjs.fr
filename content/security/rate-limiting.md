### Limitation du débit

Une technique courante pour protéger les applications des attaques par force brute est la **limitation de débit**. Pour commencer, vous devez installer le package `@nestjs/throttler`.

```bash
$ npm i --save @nestjs/throttler
```

Une fois l'installation terminée, le `ThrottlerModule` peut être configuré comme n'importe quel autre package Nest avec les méthodes `forRoot` ou `forRootAsync`.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
})
export class AppModule {}
```

Ce qui précède définira les options globales pour le `ttl`, le temps de vie en millisecondes, et le `limit`, le nombre maximum de requêtes dans le ttl, pour les routes de votre application qui sont surveillées.

Une fois que le module a été importé, vous pouvez choisir comment vous souhaitez lier le `ThrottlerGuard`. N'importe quel type de liaison tel que mentionné dans la section sur les [gardes](/guards) est acceptable. Si vous voulez lier la garde globalement, par exemple, vous pouvez le faire en ajoutant ce fournisseur à n'importe quel module :

```typescript
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}
```

#### Définitions de plusieurs limitateurs

Il peut arriver que vous souhaitiez mettre en place plusieurs définitions de limitation, comme par exemple pas plus de 3 appels par seconde, 20 appels en 10 secondes, et 100 appels en une minute. Pour ce faire, vous pouvez mettre en place vos définitions dans le tableau avec des options nommées, qui peuvent ensuite être référencées dans les décorateurs `@SkipThrottle()` et `@Throttle()` pour changer les options à nouveau.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
  ],
})
export class AppModule {}
```

#### Personnalisation

Il peut arriver que vous vouliez lier la garde à un contrôleur ou globalement, mais que vous vouliez désactiver la limitation de taux pour un ou plusieurs de vos terminaux. Pour cela, vous pouvez utiliser le décorateur `@SkipThrottle()`, pour annuler le limiteur pour une classe entière ou une seule route. Le décorateur `@SkipThrottle()` peut aussi prendre un objet dont les clés sont des chaînes de caractères et les valeurs des booléens pour le cas où vous voudriez exclure _la plus grande partie_ d'un contrôleur, mais pas toutes les routes, et de le configurer pour chaque ensemble de limitateurs si vous en avez plusieurs. Si vous ne passez pas d'objet, le défaut est d'utiliser `{{ '{' }} default : true {{ '}' }}`

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {}
```

Ce décorateur `@SkipThrottle()` peut être utilisé pour ignorer une route ou une classe ou pour annuler le fait d'ignorer une route dans une classe qui est ignorée.

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {
  // La limitation de débit est appliquée à cette route.
  @SkipThrottle({ default: false })
  dontSkip() {
    return 'La liste des utilisateurs fonctionne avec la limitation.';
  }
  // Cette route ne tient pas compte de la limitation du débit.
  doSkip() {
    return 'La liste des utilisateurs fonctionne sans la limitation.';
  }
}
```

Il y a aussi le décorateur `@Throttle()` qui peut être utilisé pour surcharger les paramètres `limit` et `ttl` définis dans le module global, pour donner des options de sécurité plus ou moins strictes. Ce décorateur peut être utilisé sur une classe ou une fonction. A partir de la version 5, le décorateur prend un objet avec la chaîne relative au nom du limitateur, et un objet avec les clés limit et ttl et des valeurs entières, similaires aux options passées au module racine. Si vous n'avez pas de nom défini dans vos options originales, utilisez la chaîne `default` Vous devez le configurer comme ceci :

```typescript
// Remplace la configuration par défaut pour la limitation du débit et la durée.
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Get()
findAll() {
  return "La liste des utilisateurs fonctionne avec la limitation personnalisée.";
}
```

#### Proxys

Si votre application tourne derrière un serveur proxy, vérifiez les options spécifiques de l'adaptateur HTTP ([express](http://expressjs.com/en/guide/behind-proxies.html) et [fastify](https://www.fastify.io/docs/latest/Reference/Server/#trustproxy)) pour l'option `trust proxy` et activez-la. Cela vous permettra d'obtenir l'adresse IP originale à partir de l'en-tête `X-Forwarded-For`, et vous pourrez surcharger la méthode `getTracker()` pour extraire la valeur de l'en-tête plutôt que de `req.ip`. L'exemple suivant fonctionne avec express et fastify :

```typescript
// throttler-behind-proxy.guard.ts
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip; // individualisez l'extraction de l'IP pour répondre à vos propres besoins
  }
}

// app.controller.ts
import { ThrottlerBehindProxyGuard } from './throttler-behind-proxy.guard';

@UseGuards(ThrottlerBehindProxyGuard)
```

> info **Astuce** Vous pouvez trouver l'API de l'objet de requête `req` pour express [ici](https://expressjs.com/en/api.html#req.ips) et pour fastify [ici](https://www.fastify.io/docs/latest/Reference/Request/).

#### Websockets

Ce module peut fonctionner avec des websockets, mais il nécessite une extension de classe. Vous pouvez étendre la classe `ThrottlerGuard` et surcharger la méthode `handleRequest` comme suit :

```typescript
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(context: ExecutionContext, limit: number, ttl: number, throttler: ThrottlerOptions): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const ip = client._socket.remoteAddress;
    const key = this.generateKey(context, ip, throttler.name);
    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      throw new ThrottlerException();
    }

    return true;
  }
}
```
> info **Astuce** Si vous utilisez ws, il est nécessaire de remplacer `_socket` par `conn`

Il y a quelques points à garder à l'esprit lorsque l'on travaille avec les WebSockets :

- La garde ne peut pas être enregistrée avec la méthode `APP_GUARD` ou `app.useGlobalGuards()`
- Lorsqu'une limite est atteinte, Nest émettra un événement `exception`, il faut donc s'assurer qu'il y a un listener prêt pour cela

> info **Astuce** Si vous utilisez le package `@nestjs/platform-ws`, vous pouvez utiliser `client._socket.remoteAddress` à la place.

#### GraphQL

La `ThrottlerGuard` peut également être utilisée pour travailler avec les requêtes GraphQL. Encore une fois, la garde peut être étendue, mais cette fois la méthode `getRequestResponse` sera surchargée

```typescript
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
```

#### Configuration

Les options suivantes sont valables pour l'objet passé au tableau des options du `ThrottlerModule` :

<table>
  <tr>
    <td><code>name</code></td>
    <td>le nom pour le suivi interne de l'ensemble des limitateurs utilisés. La valeur par défaut est `default` si elle n'est pas fournie.</td>
  </tr>
  <tr>
    <td><code>ttl</code></td>
    <td>le nombre de secondes pendant lesquelles chaque requête restera en mémoire</td>
  </tr>
  <tr>
    <td><code>limit</code></td>
    <td>le nombre maximum de requêtes dans la limite du TTL</td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>une liste d'expressions régulières d'agents-utilisateurs à ignorer pour les limitations de requêtes.</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>une fonction qui prend en paramètre le <code>ExecutionContext</code> et renvoie un <code>boolean</code> pour court-circuiter la logique du limitateur. Comme <code>@SkipThrottler()</code>, mais sur la base de la requête</td>
  </tr>
</table>

Si vous avez besoin de configurer le stockage à la place, ou si vous voulez utiliser certaines des options ci-dessus de manière plus globale, en les appliquant à chaque ensemble de limitateurs, vous pouvez passer les options ci-dessus via la clé d'option `throttlers` et utiliser le tableau suivant :

<table>
  <tr>
    <td><code>storage</code></td>
    <td>un service de stockage personnalisé pour le suivi de la limitation. <a href="/security/rate-limiting#storages">Voir ici.</a></td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>une liste d'expressions régulières d'agents-utilisateurs à ignorer pour les limitations de requêtes.</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>une fonction qui prend en paramètre le <code>ExecutionContext</code> et renvoie un <code>boolean</code> pour court-circuiter la logique du limitateur. Comme <code>@SkipThrottler()</code>, mais sur la base de la requête</td>
  </tr>
  <tr>
    <td><code>throttlers</code></td>
    <td>un tableau d'ensembles de limitateurs, définis à l'aide du tableau ci-dessus</td>
  </tr>
</table>

#### Configuration asynchrone

Vous pouvez vouloir obtenir votre configuration de limitation de débit de manière asynchrone plutôt que synchrone. Vous pouvez utiliser la méthode `forRootAsync()`, qui permet l'injection de dépendance et les méthodes `async`.

Une approche consisterait à utiliser une fonction factory :

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL'),
          limit: config.get('THROTTLE_LIMIT'),
        },
      ],
    }),
  ],
})
export class AppModule {}
```

Vous pouvez également utiliser la syntaxe `useClass` :

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ThrottlerConfigService,
    }),
  ],
})
export class AppModule {}
```

C'est possible, tant que `ThrottlerConfigService` implémente l'interface `ThrottlerOptionsFactory`.

#### Stockages

Le stockage intégré est un cache en mémoire qui garde la trace des requêtes effectuées jusqu'à ce qu'elles aient passé le TTL fixé par les options globales. Vous pouvez ajouter votre propre option de stockage à l'option `storage` du `ThrottlerModule` tant que la classe implémente l'interface `ThrottlerStorage`.

Pour les serveurs distribués, vous pouvez utiliser le fournisseur de stockage communautaire pour [Redis](https://github.com/kkoomen/nestjs-throttler-storage-redis) afin de disposer d'une source unique de vérité.

> info **Remarque** `ThrottlerStorage` peut être importé depuis `@nestjs/throttler`.

#### Helpers de temps

Il y a quelques méthodes d'aide pour rendre les temps plus lisibles si vous préférez les utiliser plutôt que la définition directe. `@nestjs/throttler` exporte cinq aides différentes, `seconds`, `minutes`, `hours`, `days`, et `weeks`. Pour les utiliser, appelez simplement `seconds(5)` ou n'importe quelle autre aide, et le nombre correct de millisecondes sera retourné.

#### Guide de migration

Pour la plupart des gens, mettre vos options dans un tableau sera suffisant.

Si vous utilisez un stockage personnalisé, vous devriez mettre vos `ttl` et `limit` dans un tableau et les assigner à la propriété `throttlers` de l'objet options.

Tout `@ThrottleSkip()` devrait maintenant recevoir un objet avec des props `string : boolean`. Les chaînes de caractères sont les noms des limitateurs. Si vous n'avez pas de nom, passez la chaîne `'default'`, car c'est ce qui sera utilisé sous le capot sinon.

Tous les décorateurs `@Throttle()` devraient aussi maintenant prendre un objet avec des clés de type chaîne de caractères, relatives aux noms des contextes du limitateur (encore une fois, `'default'` si aucun nom) et aux valeurs des objets qui ont les clés `limit` et `ttl`.

> Warning **Important** Le `ttl` est maintenant en **millisecondes**. Si vous voulez garder votre ttl en secondes pour plus de lisibilité, utilisez l'aide `seconds` de ce package. Il multiplie simplement le ttl par 1000 pour le rendre en millisecondes.

Pour plus d'informations, voir le [Changelog](https://github.com/nestjs/throttler/blob/master/CHANGELOG.md#500)