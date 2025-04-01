### Gardes

Une garde est une classe annotée avec le décorateur `@Injectable()`, qui implémente l'interface `CanActivate`.

<figure><img class="illustrative-image" src="/assets/Guards_1.png" /></figure>

Les gardes ont une **responsabilité unique**. Elles déterminent si une requête donnée sera traitée par le gestionnaire de route ou non, en fonction de certaines conditions (comme les permissions, les rôles, les ACL, etc.) présentes au moment de l'exécution. C'est ce que l'on appelle souvent **autorisation**. L'autorisation (et sa cousine, l'**authentification**, avec laquelle elle collabore généralement) est généralement gérée par un [middleware](/middleware) dans les applications Express traditionnelles. Le middleware est un bon choix pour l'authentification, puisque des choses comme la validation de jetons et l'attachement de propriétés à l'objet `request` ne sont pas fortement liées à un contexte de route particulier (et à ses métadonnées).

Mais le middleware, de par sa nature, est stupide. Il ne sait pas quel handler sera exécuté après avoir appelé la fonction `next()`. D'un autre côté, les **Gardes** ont accès à l'instance `ExecutionContext`, et savent donc exactement ce qui va être exécuté ensuite. Ils sont conçus, tout comme les filtres d'exception, les pipes et les intercepteurs, pour vous permettre d'interposer une logique de traitement au bon moment dans le cycle requête/réponse, et de le faire de manière déclarative. Cela permet de conserver un code DRY et déclaratif.

> info **Astuces** Les gardes sont exécutés **après** tous les middleware, mais **avant** tout intercepteur ou pipe.

#### Garde d'autorisation

Comme nous l'avons mentionné, **l'autorisation** est un excellent cas d'utilisation pour les Gardes parce que des routes spécifiques ne devraient être disponibles que lorsque l'appelant (habituellement un utilisateur authentifié spécifique) a les permissions suffisantes. Le `AuthGuard` que nous allons construire maintenant suppose que l'utilisateur est authentifié (et que, par conséquent, un jeton est attaché aux en-têtes de la requête). Il va extraire et valider le jeton, et utiliser l'information extraite pour déterminer si la requête peut être traitée ou non.

```typescript
@@filename(auth.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard {
  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
```

> info **Astuce** Si vous cherchez un exemple concret de mise en œuvre d'un mécanisme d'authentification dans votre application, consultez [ce chapitre]( /security/authentication). De même, pour un exemple d'autorisation plus sophistiqué, consultez [cette page]( /security/authorization).

La logique à l'intérieur de la fonction `validateRequest()` peut être aussi simple ou sophistiquée que nécessaire. Le but principal de cet exemple est de montrer comment les gardes s'intègrent dans le cycle requête/réponse.

Chaque garde doit implémenter une fonction `canActivate()`. Cette fonction doit retourner un booléen, indiquant si la requête en cours est autorisée ou non. Elle peut retourner la réponse de manière synchrone ou asynchrone (via une `Promise` ou un `Observable`). Nest utilise la valeur de retour pour contrôler l'action suivante :

- si elle renvoie `true`, la requête sera traitée.
- s'il renvoie `false`, Nest refusera la requête.

<app-banner-enterprise></app-banner-enterprise>

#### Contexte d'exécution

La fonction `canActivate()` prend un seul argument, l'instance `ExecutionContext`. Le `ExecutionContext` hérite de `ArgumentsHost`. Nous avons vu `ArgumentsHost` précédemment dans le chapitre sur les filtres d'exception. Dans l'exemple ci-dessus, nous utilisons simplement les mêmes méthodes d'aide définies sur `ArgumentsHost` que nous avons utilisées plus tôt, pour obtenir une référence à l'objet `Request`. Vous pouvez vous référer à la section **ArgumentsHost** du chapitre [exception filters](/exception-filters#argumentshost) pour plus d'informations sur ce sujet.

En étendant `ArgumentsHost`, `ExecutionContext` ajoute également plusieurs nouvelles méthodes d'aide qui fournissent des détails supplémentaires sur le processus d'exécution en cours. Ces détails peuvent être utiles pour construire des gardes plus génériques qui peuvent fonctionner à travers un large ensemble de contrôleurs, de méthodes et de contextes d'exécution. En savoir plus sur `ExecutionContext` [ici](/fundamentals/execution-context).

#### Authentification basée sur le rôle

Construisons une garde plus fonctionnelle qui n'autorise l'accès qu'aux utilisateurs ayant un rôle spécifique. Nous commencerons par un modèle de garde basique, que nous développerons dans les sections suivantes. Pour l'instant, il permet à toutes les requêtes d'être traitées :

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard {
  canActivate(context) {
    return true;
  }
}
```

#### Liaison des gardes

Comme les pipes et les filtres d'exception, les gardes peuvent être limitées au **périmètre du contrôleur**, de la méthode, ou globaux. Ci-dessous, nous mettons en place une garde à l'échelle du contrôleur en utilisant le décorateur `@UseGuards()`. Ce décorateur peut prendre un seul argument, ou une liste d'arguments séparés par des virgules. Cela vous permet d'appliquer facilement l'ensemble approprié de gardes en une seule déclaration.

```typescript
@@filename()
@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {}
```

> info **Astuce** Le décorateur `@UseGuards()` est importé du package `@nestjs/common`.

Ci-dessus, nous avons passé la classe `RolesGuard` (au lieu d'une instance), laissant la responsabilité de l'instanciation au framework et permettant l'injection de dépendances. Comme pour les pipes et les filtres d'exception, nous pouvons également passer une instance :

```typescript
@@filename()
@Controller('cats')
@UseGuards(new RolesGuard())
export class CatsController {}
```

La construction ci-dessus attache la garde à chaque handler déclaré par ce contrôleur. Si nous souhaitons que la garde ne s'applique qu'à une seule méthode, nous appliquons le décorateur `@UseGuards()` **au niveau de la méthode**.

Pour mettre en place une garde globale, utilisez la méthode `useGlobalGuards()` de l'instance de l'application Nest :

```typescript
@@filename()
const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new RolesGuard());
```

> warning **Remarque** Dans le cas des applications hybrides, la méthode `useGlobalGuards()` ne met pas en place les gardes pour les passerelles et les microservices par défaut (voir [application hybride](/faq/hybrid-application) pour des informations sur la façon de changer ce comportement). Pour les applications microservices "standard" (non hybrides), `useGlobalGuards()` monte les gardes globalement.

Les gardes globales sont utilisées dans toute l'application, pour chaque contrôleur et chaque gestionnaire de route. En termes d'injection de dépendances, les gardes globales enregistrées depuis l'extérieur d'un module (avec `useGlobalGuards()` comme dans l'exemple ci-dessus) ne peuvent pas injecter de dépendances puisque cela est fait en dehors du contexte d'un module. Afin de résoudre ce problème, vous pouvez mettre en place une garde directement depuis n'importe quel module en utilisant la construction suivante :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

> info **Astuce** Lorsque vous utilisez cette approche pour réaliser l'injection de dépendances pour le gardien, notez que, quel que soit le module dans lequel cette construction est employée, la garde est, en fait, globale. Où cela doit-il être fait ? Choisissez le module où la garde (`RolesGuard` dans l'exemple ci-dessus) est définie. De plus, `useClass` n'est pas la seule façon de traiter de l'enregistrement de fournisseurs personnalisés. Apprenez-en plus [ici](/fundamentals/custom-providers).

#### Définition des rôles par gestionnaire

Notre `RolesGuard` fonctionne, mais elle n'est pas encore très intelligente. Nous ne profitons pas encore de la caractéristique la plus importante de la garde - le [contexte d'exécution](/fundamentals/execution-context). Elle ne connaît pas encore les rôles, ni quels rôles sont autorisés pour chaque gestionnaire. Le `CatsController`, par exemple, pourrait avoir différents schémas de permission pour différentes routes. Certaines pourraient n'être accessibles qu'à un utilisateur administrateur, et d'autres pourraient être ouvertes à tout le monde. Comment pouvons-nous faire correspondre les rôles aux routes d'une manière flexible et réutilisable ?


C'est là que les **métadonnées personnalisées** entrent en jeu (en savoir plus [ici](/fundamentals/execution-context#réflexion-et-métadonnées)). Nest fournit la possibilité d'attacher des **métadonnées** personnalisées aux gestionnaires de routes à travers des décorateurs créés via la méthode statique `Reflector#createDecorator`, ou le décorateur intégré `@SetMetadata()`.

Par exemple, créons un décorateur `@Roles()` en utilisant la méthode `Reflector#createDecorator` qui attachera les métadonnées au handler. Le `Reflector` est fourni par le framework et exposé dans le package `@nestjs/core`.

```ts
@@filename(roles.decorator)
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
```

Le décorateur `Roles` est ici une fonction qui prend un seul argument de type `string[]`.

Maintenant, pour utiliser ce décorateur, nous annotons simplement le handler avec lui :

```typescript
@@filename(cats.controller)
@Post()
@Roles(['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles(['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

Ici, nous avons attaché les métadonnées du décorateur `Roles` à la méthode `create()`, indiquant que seuls les utilisateurs ayant le rôle `admin` devraient être autorisés à accéder à cette route.

Alternativement, au lieu d'utiliser la méthode `Reflector#createDecorator`, nous pourrions utiliser le décorateur intégré `@SetMetadata()`. En savoir plus [ici](/fundamentals/execution-context#approche-bas-niveau).

#### Mettre en place l'ensemble

Revenons maintenant en arrière et lions cela à notre `RolesGuard`. Actuellement, il retourne simplement `true` dans tous les cas, permettant à toutes les requêtes d'être traitées. Nous voulons rendre la valeur de retour conditionnelle en comparant les **rôles assignés à l'utilisateur actuel** aux rôles réels requis par la route en cours de traitement. Afin d'accéder au(x) rôle(s) de la route (métadonnées personnalisées), nous allons utiliser la classe d'aide `Reflector` à nouveau, comme présenté ci-dessous :

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return matchRoles(roles, user.roles);
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return matchRoles(roles, user.roles);
  }
}
```

> info **Astuce** Dans le monde de node.js, il est courant d'attacher l'utilisateur autorisé à l'objet `request`. Ainsi, dans notre exemple de code ci-dessus, nous supposons que `request.user` contient l'instance de l'utilisateur et les rôles autorisés. Dans votre application, vous ferez probablement cette association dans votre **garde d'authentification** (ou middleware). Consultez [ce chapitre](/security/authentication) pour plus d'informations sur ce sujet.

> warning **Attention** La logique à l'intérieur de la fonction `matchRoles()` peut être aussi simple ou sophistiquée que nécessaire. Le but principal de cet exemple est de montrer comment les gardes s'intègrent dans le cycle requête/réponse.

Référez-vous à la section <a href="/fundamentals/execution-context#réflexion-et-métadonnées">Reflection et métadonnées</a> du chapitre **Contexte d'exécution** pour plus de détails sur l'utilisation de `Reflector` en fonction du contexte.

Lorsqu'un utilisateur ne disposant pas de privilèges suffisants effectue une requête sur un point de terminaison, Nest renvoie automatiquement la réponse suivante :

```typescript
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

Notez que dans les coulisses, quand une garde retourne `false`, le framework lance une `ForbiddenException`. Si vous voulez retourner une réponse d'erreur différente, vous devez lancer votre propre exception. Par exemple :

```typescript
throw new UnauthorizedException();
```

Toute exception levée par une garde sera traitée par la [couche d'exceptions](/exception-filters) (filtre d'exceptions global et tous les filtres d'exceptions appliqués au contexte actuel).

> info **Astuce** Si vous cherchez un exemple concret de mise en œuvre de l'autorisation, consultez [ce chapitre](/security/authorization).
