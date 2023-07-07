### Contexte d'exécution

Nest fournit plusieurs classes d'utilitaires qui facilitent l'écriture d'applications fonctionnant dans plusieurs contextes d'application (par exemple, les contextes d'application basés sur le serveur HTTP, les microservices et les WebSockets de Nest). Ces utilitaires fournissent des informations sur le contexte d'exécution actuel qui peuvent être utilisées pour construire des [gardes](/guards), des [filtres](/exception-filters) et des [intercepteurs](/interceptors) génériques qui peuvent fonctionner à travers un large éventail de contrôleurs, de méthodes et de contextes d'exécution.

Nous couvrons deux de ces classes dans ce chapitre : `ArgumentsHost` et `ExecutionContext`.

#### Classe ArgumentsHost

La classe `ArgumentsHost` fournit des méthodes pour récupérer les arguments passés à un handler. Elle permet de choisir le contexte approprié (par exemple, HTTP, RPC (microservice), ou WebSockets) pour récupérer les arguments. Le framework fournit une instance de `ArgumentsHost`, typiquement référencée comme un paramètre `host`, dans les endroits où vous pouvez vouloir y accéder. Par exemple, la méthode `catch()` d'un [filtre d'exception](exception-filters#argumentshost) est appelée avec une instance `ArgumentsHost`.

`ArgumentsHost` agit simplement comme une abstraction sur les arguments d'un gestionnaire. Par exemple, pour les applications serveur HTTP (quand `@nestjs/platform-express` est utilisé), l'objet `host` encapsule la liste `[request, response, next]` d'Express, où `request` est l'objet requête, `response` est l'objet réponse, et `next` est une fonction qui contrôle le cycle requête-réponse de l'application. En revanche, pour les applications [GraphQL](/graphql/quick-start), l'objet `host` contient le tableau `[root, args, context, info]`.

#### Contexte actuel de l'application

Lorsque l'on construit des [gardes](/guards), des [filtres](/exception-filters) et des [intercepteurs](/interceptors) génériques qui sont censés s'exécuter à travers de multiples contextes d'application, nous avons besoin d'un moyen de déterminer le type d'application dans lequel notre méthode s'exécute actuellement. C'est ce que nous faisons avec la méthode `getType()` de `ArgumentsHost` :

```typescript
if (host.getType() === 'http') {
  // faire quelque chose qui n'est important que dans le contexte des requêtes HTTP ordinaires (REST).
} else if (host.getType() === 'rpc') {
  // faire quelque chose qui n'est important que dans le contexte des requêtes de microservices.
} else if (host.getType<GqlContextType>() === 'graphql') {
  // faire quelque chose qui n'est important que dans le contexte des requêtes GraphQL
}
```

> info **Astuce** Le type `GqlContextType` est importé du package `@nestjs/graphql`.

Avec le type d'application disponible, nous pouvons écrire des composants plus génériques, comme indiqué ci-dessous.

#### Arguments du gestionnaire d'hôte

Pour récupérer la liste des arguments passés au gestionnaire, une approche consiste à utiliser la méthode `getArgs()` de l'objet hôte.

```typescript
const [req, res, next] = host.getArgs();
```

Vous pouvez extraire un argument particulier par son index en utilisant la méthode `getArgByIndex()` :

```typescript
const request = host.getArgByIndex(0);
const response = host.getArgByIndex(1);
```

Dans ces exemples, nous avons récupéré les objets requête et réponse par index, ce qui n'est généralement pas recommandé car cela couple l'application à un contexte d'exécution particulier. Au lieu de cela, vous pouvez rendre votre code plus robuste et réutilisable en utilisant l'une des méthodes utilitaires de l'objet `host` pour basculer vers le contexte d'application approprié pour votre application. Les méthodes utilitaires de changement de contexte sont présentées ci-dessous.

```typescript
/**
 * Passer à un contexte RPC.
 */
switchToRpc(): RpcArgumentsHost;
/**
 * Passer au contexte HTTP.
 */
switchToHttp(): HttpArgumentsHost;
/**
 * Passer au contexte WebSockets.
 */
switchToWs(): WsArgumentsHost;
```

Réécrivons l'exemple précédent en utilisant la méthode `switchToHttp()`. La méthode utilitaire `host.switchToHttp()` renvoie un objet `HttpArgumentsHost` approprié au contexte de l'application HTTP. L'objet `HttpArgumentsHost` possède deux méthodes utiles que nous pouvons utiliser pour extraire les objets désirés. Nous utilisons également les assertions de type Express dans ce cas pour retourner des objets nativement typés Express :

```typescript
const ctx = host.switchToHttp();
const request = ctx.getRequest<Request>();
const response = ctx.getResponse<Response>();
```

De même, `WsArgumentsHost` et `RpcArgumentsHost` ont des méthodes pour retourner les objets appropriés dans les contextes microservices et WebSockets. Voici les méthodes de `WsArgumentsHost` :

```typescript
export interface WsArgumentsHost {
  /**
   * Renvoie l'objet de données.
   */
  getData<T>(): T;
  /**
   * Renvoie l'objet client.
   */
  getClient<T>(): T;
}
```

Voici les méthodes de `RpcArgumentsHost` :

```typescript
export interface RpcArgumentsHost {
  /**
   * Returns the data object.
   */
  getData<T>(): T;

  /**
   * Returns the context object.
   */
  getContext<T>(): T;
}
```

#### Classe ExecutionContext

`ExecutionContext` étend `ArgumentsHost`, fournissant des détails supplémentaires sur le processus d'exécution en cours. Comme `ArgumentsHost`, Nest fournit une instance de `ExecutionContext` là où vous en avez besoin, comme dans la méthode `canActivate()` d'une [garde](/guards#contexte-dexécution) et la méthode `intercept()` d'un [intercepteur](/interceptors#contexte-dexécution). Il fournit les méthodes suivantes :

```typescript
export interface ExecutionContext extends ArgumentsHost {
  /**
   * Renvoie le type de la classe de contrôleur à laquelle appartient le gestionnaire actuel.
   */
  getClass<T>(): Type<T>;
  /**
   * Renvoie une référence au gestionnaire (méthode) qui sera invoqué
   * ensuite dans le pipeline de requêtes.
   */
  getHandler(): Function;
}
```

La méthode `getHandler()` renvoie une référence au gestionnaire qui va être invoqué. La méthode `getClass()` renvoie le type de la classe `Controller` à laquelle appartient ce handler particulier. Par exemple, dans un contexte HTTP, si la requête en cours de traitement est une requête `POST`, liée à la méthode `create()` du `CatsController`, `getHandler()` renvoie une référence à la méthode `create()` et `getClass()` renvoie le **type** (et non l'instance) du `CatsController`.

```typescript
const methodKey = ctx.getHandler().name; // "create"
const className = ctx.getClass().name; // "CatsController"
```

La possibilité d'accéder aux références à la fois à la classe courante et à la méthode du handler offre une grande flexibilité. Plus important encore, cela nous donne la possibilité d'accéder aux métadonnées définies par le décorateur `@SetMetadata()` depuis les gardiens ou les intercepteurs. Nous couvrons ce cas d'utilisation ci-dessous.

<app-banner-enterprise></app-banner-enterprise>

#### Réflexion et métadonnées

Nest offre la possibilité d'attacher des **métadonnées personnalisées** aux gestionnaires de routes grâce au décorateur `@SetMetadata()`. Nous pouvons alors accéder à ces métadonnées depuis notre classe pour prendre certaines décisions.

```typescript
@@filename(cats.controller)
@Post()
@SetMetadata('roles', ['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@SetMetadata('roles', ['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Astuce** Le décorateur `@SetMetadata()` est importé du package `@nestjs/common`.

Avec la construction ci-dessus, nous avons attaché les métadonnées `roles` (`roles` est une clé de métadonnées et `['admin']` est la valeur associée) à la méthode `create()`. Bien que cela fonctionne, ce n'est pas une bonne pratique d'utiliser `@SetMetadata()` directement dans vos routes. A la place, créez vos propres décorateurs, comme montré ci-dessous :

```typescript
@@filename(roles.decorator)
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
@@switch
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles) => SetMetadata('roles', roles);
```

Cette approche est beaucoup plus propre et lisible, et est fortement typée. Maintenant que nous avons un décorateur `@Roles()` personnalisé, nous pouvons l'utiliser pour décorer la méthode `create()`.

```typescript
@@filename(cats.controller)
@Post()
@Roles('admin')
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles('admin')
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

Pour accéder au(x) rôle(s) de la route (métadonnées personnalisées), nous allons utiliser la classe utilitaire `Reflector`, qui est fournie par le framework et exposée dans le package `@nestjs/core`. `Reflector` peut être injecté dans une classe de la manière habituelle :

```typescript
@@filename(roles.guard)
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}
@@switch
@Injectable()
@Dependencies(Reflector)
export class CatsService {
  constructor(reflector) {
    this.reflector = reflector;
  }
}
```

> info **Astuce** La classe `Reflector` est importée du package `@nestjs/core`.

Maintenant, pour lire les métadonnées du gestionnaire, utilisez la méthode `get()`.

```typescript
const roles = this.reflector.get<string[]>('roles', context.getHandler());
```

La méthode `Reflector#get` nous permet d'accéder facilement aux métadonnées en passant deux arguments : une **clé** de métadonnées et un **contexte** (cible du décorateur) pour récupérer les métadonnées. Dans cet exemple, la **clé** spécifiée est `'roles'` (référez-vous au fichier `roles.decorator.ts` ci-dessus et à l'appel `SetMetadata()` qui y a été fait). Le contexte est fourni par l'appel à `context.getHandler()`, qui permet d'extraire les métadonnées du gestionnaire de route en cours de traitement. Rappelez-vous, `getHandler()` nous donne une **référence** à la fonction du gestionnaire de route.

Nous pouvons également organiser notre contrôleur en appliquant des métadonnées au niveau du contrôleur, qui s'appliquent à toutes les routes de la classe du contrôleur.

```typescript
@@filename(cats.controller)
@Roles('admin')
@Controller('cats')
export class CatsController {}
@@switch
@Roles('admin')
@Controller('cats')
export class CatsController {}
```

Dans ce cas, pour extraire les métadonnées du contrôleur, nous passons `context.getClass()` comme second argument (pour fournir la classe du contrôleur comme contexte pour l'extraction des métadonnées) au lieu de `context.getHandler()` :

```typescript
@@filename(roles.guard)
const roles = this.reflector.get<string[]>('roles', context.getClass());
@@switch
const roles = this.reflector.get('roles', context.getClass());
```

Etant donné la possibilité de fournir des métadonnées à plusieurs niveaux, vous pouvez avoir besoin d'extraire et de fusionner des métadonnées provenant de plusieurs contextes. La classe `Reflector` fournit deux méthodes utilitaires utilisées pour aider à cela. Ces méthodes extraient **à la fois** les métadonnées du contrôleur et de la méthode, et les combinent de différentes manières.

Considérons le scénario suivant, dans lequel vous avez fourni des métadonnées `'roles'` aux deux niveaux.

```typescript
@@filename(cats.controller)
@Roles('user')
@Controller('cats')
export class CatsController {
  @Post()
  @Roles('admin')
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }
}
@@switch
@Roles('user')
@Controller('cats')
export class CatsController {}
  @Post()
  @Roles('admin')
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }
}
```

Si votre intention est de spécifier `'user'` comme rôle par défaut, et de le surcharger sélectivement pour certaines méthodes, vous devriez probablement utiliser la méthode `getAllAndOverride()`.

```typescript
const roles = this.reflector.getAllAndOverride<string[]>('roles', [
  context.getHandler(),
  context.getClass(),
]);
```

Une garde avec ce code, exécutée dans le contexte de la méthode `create()`, avec les métadonnées ci-dessus, résulterait en un `roles` contenant `['admin']`.

Pour obtenir les métadonnées des deux et les fusionner (cette méthode fusionne à la fois les tableaux et les objets), utilisez la méthode `getAllAndMerge()` :

```typescript
const roles = this.reflector.getAllAndMerge<string[]>('roles', [
  context.getHandler(),
  context.getClass(),
]);
```

Le résultat serait que `roles` contiendrait `['user', 'admin']`.

Pour ces deux méthodes de fusion, vous passez la clé de métadonnées comme premier argument, et un tableau de contextes cibles de métadonnées (c'est-à-dire les appels aux méthodes `getHandler()` et/ou `getClass())`) comme second argument.
