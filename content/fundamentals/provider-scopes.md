### Portées d'injection

Pour les personnes issues de différents langages de programmation, il peut être inattendu d'apprendre que dans Nest, presque tout est partagé entre les requêtes entrantes. Nous avons un pool de connexion à la base de données, des services singleton avec un état global, etc. N'oubliez pas que Node.js ne suit pas le modèle sans état multithreadé requête/réponse dans lequel chaque requête est traitée par un thread distinct. Par conséquent, l'utilisation d'instances singleton est totalement **sécurisée** pour nos applications.

Cependant, il existe des cas limites où la durée de vie basée sur les requêtes peut être le comportement souhaité, par exemple la mise en cache par requête dans les applications GraphQL, le suivi des requêtes et la multi-location. Les champs d'application d'injection fournissent un mécanisme permettant d'obtenir le comportement souhaité pour la durée de vie du fournisseur.

#### Portée du fournisseur

Un fournisseur peut avoir l'une des portées suivantes :

<table>
  <tr>
    <td><code>DEFAULT</code></td>
    <td>Une seule instance du fournisseur est partagée par l'ensemble de l'application. La durée de vie de l'instance est directement liée au cycle de vie de l'application. Une fois que l'application a démarré, tous les fournisseurs singleton ont été instanciés. La portée du singleton est utilisée par défaut.</td>
  </tr>
  <tr>
    <td><code>REQUEST</code></td>
    <td>Une nouvelle instance du fournisseur est créée exclusivement pour chaque <strong>requête</strong> entrante.  L'instance est mise au rebut une fois le traitement de la requête terminé.</td>
  </tr>
  <tr>
    <td><code>TRANSIENT</code></td>
    <td>Les fournisseurs transitoires ne sont pas partagés entre les consommateurs. Chaque consommateur qui injecte un fournisseur transitoire reçoit une nouvelle instance dédiée.</td>
  </tr>
</table>

> info **Astuce** L'utilisation d'une portée singleton est **recommandée** dans la plupart des cas d'utilisation. Le partage des fournisseurs entre les consommateurs et les requêtes signifie qu'une instance peut être mise en cache et que son initialisation n'a lieu qu'une seule fois, lors du démarrage de l'application.

#### Usage

Spécifiez la portée de l'injection en passant la propriété `scope` à l'objet d'options du décorateur `@Injectable()` :

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

De même, pour les [fournisseurs personnalisés](/fundamentals/custom-providers), définissez la propriété `scope` dans le format long pour l'enregistrement d'un fournisseur :

```typescript
{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}
```

> info **Astuce** Importer l'enum `Scope` depuis `@nestjs/common`

La portée singleton est utilisée par défaut et n'a pas besoin d'être déclarée. Si vous voulez déclarer un provider comme singleton scoped, utilisez la valeur `Scope.DEFAULT` pour la propriété `scope`.

> warning **Remarque** Les passerelles Websocket ne doivent pas utiliser de fournisseurs à portée de requête, car elles doivent agir comme des singletons. Chaque passerelle encapsule une véritable socket et ne peut être instanciée plusieurs fois. Cette limitation s'applique également à d'autres fournisseurs, comme les [_Stratégies de passeport_](../security/authentication#request-scoped-strategies) ou les _contrôleurs Cron_.

#### Portée du contrôleur

Les contrôleurs peuvent également avoir une portée, qui s'applique à tous les gestionnaires de méthodes de requête déclarés dans ce contrôleur. Tout comme la portée du fournisseur, la portée d'un contrôleur détermine sa durée de vie. Dans le cas d'un contrôleur à portée de requête, une nouvelle instance est créée pour chaque requête entrante, et la poubelle est ramassée lorsque le traitement de la requête est terminé.

Déclarez la portée du contrôleur avec la propriété `scope` de l'objet `ControllerOptions` :

```typescript
@Controller({
  path: 'cats',
  scope: Scope.REQUEST,
})
export class CatsController {}
```

#### Hiérarchie des portées

La portée `REQUEST` remonte la chaîne d'injection. Un contrôleur qui dépend d'un fournisseur à portée de requête sera lui-même à portée de requête.

Imaginez le graphe de dépendance suivant : `CatsController <- CatsService <- CatsRepository`. Si `CatsService` est à portée de requête (et que les autres sont des singletons par défaut), `CatsController` deviendra à portée de requête car il dépend du service injecté. Le `CatsRepository`, qui n'est pas dépendant, restera à portée de singleton.

Les dépendances transitoires ne suivent pas ce modèle. Si un `DogsService` à portée de singleton injecte un fournisseur transitoire `LoggerService`, il recevra une nouvelle instance de ce dernier. Cependant, `DogsService` restera à portée de singleton, donc l'injecter n'importe où ne résoudra _pas_ une nouvelle instance de `DogsService`. Au cas où ce serait le comportement désiré, `DogsService` doit être explicitement marqué comme `TRANSIENT`.

<app-banner-courses></app-banner-courses>

#### Requête au fournisseur

Dans une application basée sur un serveur HTTP (par exemple, en utilisant `@nestjs/platform-express` ou `@nestjs/platform-fastify`), vous pouvez vouloir accéder à une référence à l'objet de requête original lorsque vous utilisez des fournisseurs à portée de requête. Vous pouvez le faire en injectant l'objet `REQUEST`.

Le fournisseur `REQUEST` est intrinsèquement à portée de requête, ce qui signifie que vous n'avez pas besoin de spécifier explicitement la portée `REQUEST` lorsque vous l'utilisez. De plus, même si vous essayez de le faire, cela ne sera pas pris en compte. Tout fournisseur qui s'appuie sur un fournisseur à portée de requête adopte automatiquement une portée de requête, et ce comportement ne peut pas être modifié.

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

En raison des différences de plateforme/protocole sous-jacentes, vous accédez à la requête entrante légèrement différemment pour les applications Microservice ou GraphQL. Dans les applications [GraphQL](/graphql/quick-start), vous injectez `CONTEXT` au lieu de `REQUEST` :

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private context) {}
}
```

Vous configurez ensuite votre valeur `context` (dans le `GraphQLModule`) pour qu'elle contienne `request` comme propriété.

#### Fournisseur d'Inquirer

Si vous voulez obtenir la classe dans laquelle un fournisseur a été construit, par exemple dans les fournisseurs de logs ou de métriques, vous pouvez injecter le jeton `INQUIRER`.

```typescript
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class HelloService {
  constructor(@Inject(INQUIRER) private parentClass: object) {}

  sayHello(message: string) {
    console.log(`${this.parentClass?.constructor?.name}: ${message}`);
  }
}
```

Puis utilisez-le comme suit :

```typescript
import { Injectable } from '@nestjs/common';
import { HelloService } from './hello.service';

@Injectable()
export class AppService {
  constructor(private helloService: HelloService) {}

  getRoot(): string {
    this.helloService.sayHello('Mon nom est getRoot');

    return 'Hello world!';
  }
}
```

Dans l'exemple ci-dessus, lorsque `AppService#getRoot` est appelé, `"AppService : Mon nom est getRoot"` sera enregistré dans la console.

#### Performance

L'utilisation de fournisseurs à portée de requête aura un impact sur les performances de l'application. Bien que Nest essaie de mettre en cache autant de métadonnées que possible, il devra toujours créer une instance de votre classe à chaque requête. Cela ralentira donc le temps de réponse moyen et le résultat global de l'analyse comparative. À moins qu'un fournisseur ne doive être à portée de requête, il est fortement recommandé d'utiliser la portée singleton par défaut.

> info **Astuce** Bien que tout cela semble assez intimidant, une application correctement conçue qui exploite des fournisseurs de services adaptés aux requêtes ne devrait pas être ralentie de plus de 5 % en termes de temps de latence.

#### Fournisseurs durables

Les fournisseurs à portée de requête, comme mentionné dans la section ci-dessus, peuvent entraîner une augmentation de la latence car le fait d'avoir au moins un fournisseur à portée de requête (injecté dans l'instance du contrôleur, ou plus profondément - injecté dans l'un de ses fournisseurs) fait que le contrôleur est également à portée de requête. Cela signifie qu'il doit être recréé (instancié) pour chaque requête individuelle (et ramassé par la suite). Cela signifie également que pour, disons, 30k requêtes en parallèle, il y aura 30k instances éphémères du contrôleur (et de ses fournisseurs adaptés aux requêtes).

Le fait d'avoir un fournisseur commun dont dépendent la plupart des fournisseurs (par exemple, une connexion à une base de données ou un service d'enregistrement) convertit automatiquement tous ces fournisseurs en fournisseurs à portée de requête. Cela peut poser un problème dans les **applications multi-tenants**, en particulier pour celles qui ont un fournisseur central de "source de données" à portée de requête qui récupère les en-têtes/tokens de l'objet de requête et, en fonction de ses valeurs, récupère la connexion/le schéma de base de données correspondant(e) (spécifique à ce locataire).

Par exemple, supposons que vous ayez une application utilisée alternativement par 10 clients différents. Chaque client a sa **propre source de données dédiée**, et vous voulez vous assurer que le client A ne pourra jamais accéder à la base de données du client B. Une façon d'y parvenir serait de déclarer un fournisseur de "source de données" à l'échelle de la requête qui, sur la base de l'objet de la requête, détermine quel est le "client actuel" et récupère la base de données correspondante. Avec cette approche, vous pouvez transformer votre application en une application multi-tenant en quelques minutes seulement. Mais l'inconvénient majeur de cette approche est que, comme il est très probable qu'une grande partie des composants de votre application repose sur le fournisseur "source de données", ils deviendront implicitement "à l'échelle de la requête", et donc vous verrez sans aucun doute un impact sur les performances de votre application.

Et si nous avions une meilleure solution ? Puisque nous n'avons que 10 clients, ne pourrions-nous pas avoir 10 [sous-arbres d'ID](/fundamentals/module-ref#resolving-scoped-providers) individuels par client (au lieu de recréer chaque arbre par requête) ? Si vos fournisseurs ne s'appuient sur aucune propriété qui soit réellement unique pour chaque requête consécutive (par exemple, l'UUID de la requête), mais qu'il existe des attributs spécifiques qui nous permettent de les agréger (les classer), il n'y a aucune raison de _recréer un sous-arbre DI_ pour chaque requête entrante ?

Et c'est justement là que les **fournisseurs durables** se révèlent utiles.

Avant de commencer à signaler les fournisseurs comme durables, nous devons d'abord enregistrer une **stratégie** qui indique à Nest quels sont ces "attributs de requête communs", fournir une logique qui regroupe les requêtes - les associe à leurs sous-arbres ID correspondants.

```typescript
import {
  HostComponentInfo,
  ContextId,
  ContextIdFactory,
  ContextIdStrategy,
} from '@nestjs/core';
import { Request } from 'express';

const tenants = new Map<string, ContextId>();

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
  attach(contextId: ContextId, request: Request) {
    const tenantId = request.headers['x-tenant-id'] as string;
    let tenantSubTreeId: ContextId;

    if (tenants.has(tenantId)) {
      tenantSubTreeId = tenants.get(tenantId);
    } else {
      tenantSubTreeId = ContextIdFactory.create();
      tenants.set(tenantId, tenantSubTreeId);
    }

    // Si l'arbre n'est pas durable, retourner l'objet "contextId" original
    return (info: HostComponentInfo) =>
      info.isTreeDurable ? tenantSubTreeId : contextId;
  }
}
```

> info **Astuce** De la même manière que pour la portée de la requête, la durabilité s'étend jusqu'à la chaîne d'injection. Cela signifie que si A dépend de B qui est marqué comme `durable`, A devient implicitement durable aussi (à moins que `durable` ne soit explicitement mis à `false` pour le fournisseur A).

> warning **Attention** Notez que cette stratégie n'est pas idéale pour les applications fonctionnant avec un grand nombre de clients.

La valeur retournée par la méthode `attach` indique à Nest quel identifiant de contexte doit être utilisé pour un hôte donné. Dans ce cas, nous avons spécifié que le `tenantSubTreeId` devrait être utilisé à la place de l'objet `contextId` original, auto-généré, lorsque le composant hôte (par exemple, un contrôleur à portée de requête) est marqué comme durable (vous pouvez apprendre comment marquer les fournisseurs comme durables ci-dessous). De plus, dans l'exemple ci-dessus, **aucun payload** ne serait enregistré (où payload = fournisseur `REQUEST`/`CONTEXT` qui représente la "racine" - parent de la sous-arborescence).

Si vous souhaitez enregistrer la charge utile pour un arbre durable, utilisez plutôt la construction suivante :

```typescript
// The return of `AggregateByTenantContextIdStrategy#attach` method:
return {
  resolve: (info: HostComponentInfo) =>
    info.isTreeDurable ? tenantSubTreeId : contextId,
  payload: { tenantId },
};
```

Maintenant, chaque fois que vous injectez le fournisseur `REQUEST` (ou `CONTEXT` pour les applications GraphQL) en utilisant `@Inject(REQUEST)`/`@Inject(CONTEXT)`, l'objet `payload` sera injecté (composé d'une seule propriété - `tenantId` dans ce cas).

D'accord, avec cette stratégie en place, vous pouvez l'enregistrer quelque part dans votre code (puisqu'elle s'applique globalement de toute façon), donc par exemple, vous pourriez la placer dans le fichier `main.ts` :

```typescript
ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());
```

> info **Astuce** La classe `ContextIdFactory` est importée du package `@nestjs/core`.

Tant que l'enregistrement a lieu avant qu'une requête n'arrive dans votre application, tout fonctionnera comme prévu.

Enfin, pour transformer un fournisseur régulier en fournisseur durable, il suffit de mettre le flag `durable` à `true` et de changer sa portée en `Scope.REQUEST` ( inutile si la portée REQUEST est déjà dans la chaîne d'injection) :

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CatsService {}
```

De même, pour les [fournisseurs personnalisés](/fundamentals/custom-providers), définissez la propriété `durable` dans le format long pour l'enregistrement d'un fournisseur :

```typescript
{
  provide: 'foobar',
  useFactory: () => { ... },
  scope: Scope.REQUEST,
  durable: true,
}
```
