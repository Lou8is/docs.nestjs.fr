### Autorisation

**L'autorisation** est le processus qui détermine ce qu'un utilisateur peut faire. Par exemple, un utilisateur administrateur est autorisé à créer, modifier et supprimer des messages. Un utilisateur non administrateur n'est autorisé qu'à lire les messages.

L'autorisation est orthogonale et indépendante de l'authentification. Cependant, l'autorisation nécessite un mécanisme d'authentification.

Il existe de nombreuses approches et stratégies différentes pour gérer les autorisations. L'approche adoptée pour un projet dépend des exigences particulières de l'application. Ce chapitre présente quelques approches de l'autorisation qui peuvent être adaptées à un grand nombre d'exigences différentes.

#### Mise en œuvre d'un système RBAC de base

Le contrôle d'accès basé sur les rôles (**RBAC**, pour Role-based access control) est un mécanisme de contrôle d'accès neutre défini autour des rôles et des privilèges. Dans cette section, nous allons montrer comment implémenter un mécanisme RBAC très basique en utilisant des [gardes](/guards) Nest.

Tout d'abord, créons un enum `Role` représentant les rôles dans le système :

```typescript
@@filename(role.enum)
export enum Role {
  User = 'user',
  Admin = 'admin',
}
```

> info **Astuce** Dans les systèmes plus sophistiqués, vous pouvez stocker les rôles dans une base de données ou les extraire du fournisseur d'authentification externe.

Avec cela en place, nous pouvons créer un décorateur `@Roles()`. Ce décorateur permet de spécifier les rôles requis pour accéder à des ressources spécifiques.

```typescript
@@filename(roles.decorator)
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
@@switch
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
```

Maintenant que nous avons un décorateur personnalisé `@Roles()`, nous pouvons l'utiliser pour décorer n'importe quel gestionnaire de route.

```typescript
@@filename(cats.controller)
@Post()
@Roles(Role.Admin)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles(Role.Admin)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

Enfin, nous créons une classe `RolesGuard` qui va comparer les rôles assignés à l'utilisateur actuel aux rôles réels requis par la route en cours de traitement. Afin d'accéder au(x) rôle(s) de la route (métadonnées personnalisées), nous allons utiliser la classe d'aide `Reflector`, qui est fournie par le framework et exposée dans le package `@nestjs/core`.

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
```

> info **Astuce** Référez-vous à la section [Réflexion et métadonnées](/fundamentals/execution-context#réflexion-et-métadonnées) du chapitre sur le contexte d'exécution pour plus de détails sur l'utilisation de `Reflector` d'une manière adaptée au contexte.

> warning **Remarque** Cet exemple est appelé "**basique**" car nous ne vérifions la présence de rôles qu'au niveau du gestionnaire d'itinéraire. Dans les applications réelles, vous pouvez avoir des points de terminaison ou des gestionnaires qui impliquent plusieurs opérations, dans lesquelles chacune d'entre elles nécessite un ensemble spécifique de permissions. Dans ce cas, vous devrez fournir un mécanisme de vérification des rôles quelque part dans votre logique d'entreprise, ce qui rendra la maintenance un peu plus difficile car il n'y aura pas d'endroit centralisé qui associe les permissions à des actions spécifiques.

Dans cet exemple, nous avons supposé que `request.user` contient l'instance de l'utilisateur et les rôles autorisés (sous la propriété `roles`). Dans votre application, vous ferez probablement cette association dans votre **garde d'authentification** personnalisée - voir le chapitre [authentification](/security/authentication) pour plus de détails.

Pour que cet exemple fonctionne, votre classe `User` doit ressembler à ce qui suit :

```typescript
class User {
  // ...autres propriétés
  roles: Role[];
}
```

Enfin, assurez-vous d'enregistrer la garde `RolesGuard`, par exemple, au niveau du contrôleur, ou globalement :

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
],
```

Lorsqu'un utilisateur ne disposant pas de privilèges suffisants effectue une requête sur un point d'accès, Nest renvoie automatiquement la réponse suivante :

```typescript
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

> info **Astuce** Si vous souhaitez renvoyer une réponse d'erreur différente, vous devez lancer votre propre exception spécifique au lieu de renvoyer une valeur booléenne.

<app-banner-courses-auth></app-banner-courses-auth>

#### Autorisation basée sur les revendications

Lorsqu'une identité est créée, elle peut se voir attribuer une ou plusieurs revendications émises par un tiers de confiance. Une revendication est une paire nom-valeur qui représente ce que le sujet peut faire, et non ce qu'il est.

Pour mettre en œuvre une autorisation basée sur les revendications dans Nest, vous pouvez suivre les mêmes étapes que nous avons montrées ci-dessus dans la section [RBAC](/security/authorization#mise-en-œuvre-dun-système-rbac-de-base) avec une différence importante : au lieu de vérifier les rôles spécifiques, vous devez comparer les **permissions**. Chaque utilisateur se voit attribuer un ensemble de permissions. De même, chaque ressource ou point de terminaison définirait les permissions requises (par exemple, à travers un décorateur `@RequirePermissions()` dédié) pour y accéder.

```typescript
@@filename(cats.controller)
@Post()
@RequirePermissions(Permission.CREATE_CAT)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@RequirePermissions(Permission.CREATE_CAT)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Astuce** Dans l'exemple ci-dessus, `Permission` (similaire à `Role` que nous avons montré dans la section RBAC) est une énumération TypeScript qui contient toutes les permissions disponibles dans votre système.

#### Intégration de CASL

[CASL](https://casl.js.org/) est une bibliothèque d'autorisation isomorphe qui restreint les ressources auxquelles un client donné est autorisé à accéder. Elle est conçue pour être adoptée de manière incrémentale et peut facilement évoluer entre une simple autorisation basée sur les revendications et une autorisation complète basée sur les sujets et les attributs.

Pour commencer, installez d'abord le package `@casl/ability` :

```bash
$ npm i @casl/ability
```

> info **Astuce** Dans cet exemple, nous avons choisi CASL, mais vous pouvez utiliser n'importe quelle autre bibliothèque comme `accesscontrol` ou `acl`, en fonction de vos préférences et des besoins de votre projet.

Une fois l'installation terminée, pour illustrer les mécanismes de la CASL, nous allons définir deux classes d'entités : `User` et `Article`.

```typescript
class User {
  id: number;
  isAdmin: boolean;
}
```

La classe `User` est constituée de deux propriétés, `id`, qui est un identifiant unique de l'utilisateur, et `isAdmin`, qui indique si l'utilisateur a des privilèges d'administrateur.

```typescript
class Article {
  id: number;
  isPublished: boolean;
  authorId: number;
}
```

La classe `Article` possède trois propriétés, respectivement `id`, `isPublished`, et `authorId`. `id` est un identifiant unique de l'article, `isPublished` indique si l'article a déjà été publié ou non, et `authorId`, qui est l'identifiant de l'utilisateur qui a écrit l'article.

Passons maintenant en revue et affinons nos exigences pour cet exemple :

- Les administrateurs peuvent gérer (créer/lire/mettre à jour/supprimer) toutes les entités.
- Les utilisateurs ont un accès en lecture seule à tout
- Les utilisateurs peuvent mettre à jour leurs articles (`article.authorId === userId`)
- Les articles déjà publiés ne peuvent pas être supprimés (`article.isPublished === true`)

En gardant cela à l'esprit, nous pouvons commencer par créer un enum `Action` représentant toutes les actions possibles que les utilisateurs peuvent effectuer avec les entités :

```typescript
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}
```

> warning **Remarque** `manage` est un mot-clé spécial de la CASL qui représente "toute" action.

Pour encapsuler la bibliothèque CASL, générons maintenant le `CaslModule` et le `CaslAbilityFactory`.

```bash
$ nest g module casl
$ nest g class casl/casl-ability.factory
```

Avec ceci en place, nous pouvons définir la méthode `createForUser()` sur la `CaslAbilityFactory`. Cette méthode va créer l'objet `Ability` pour un utilisateur donné :

```typescript
type Subjects = InferSubjects<typeof Article | typeof User> | 'all';

export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<
      Ability<[Action, Subjects]>
    >(Ability as AbilityClass<AppAbility>);

    if (user.isAdmin) {
      can(Action.Manage, 'all'); // accès en lecture/écriture à tout
    } else {
      can(Action.Read, 'all'); // accès en lecture seule à tout
    }

    can(Action.Update, Article, { authorId: user.id });
    cannot(Action.Delete, Article, { isPublished: true });

    return build({
      // Lire https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types pour plus de détails
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
```

> warning **Remarque** `all` est un mot-clé spécial de la CASL qui représente "tout sujet".

> info **Astuce** Les classes `Ability`, `AbilityBuilder`, `AbilityClass` et `ExtractSubjectType` sont exportées depuis le package `@casl/ability`.

> info **Astuce** L'option `detectSubjectType` permet à CASL de comprendre comment extraire le type de sujet d'un objet. Pour plus d'informations, consultez la [documentation CASL](https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types).

Dans l'exemple ci-dessus, nous avons créé l'instance `Ability` en utilisant la classe `AbilityBuilder`. Comme vous l'avez probablement deviné, `can` et `cannot` acceptent les mêmes arguments mais ont des significations différentes, `can` permet de faire une action sur le sujet spécifié et `cannot` l'interdit. Les deux fonctions peuvent accepter jusqu'à 4 arguments. Pour en savoir plus sur ces fonctions, consultez la [documentation CASL officielle](https://casl.js.org/v6/en/guide/intro).

Enfin, assurez-vous d'ajouter la `CaslAbilityFactory` aux tableaux `providers` et `exports` dans la définition du module `CaslModule` :

```typescript
import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';

@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
```

Avec ceci en place, nous pouvons injecter la `CaslAbilityFactory` dans n'importe quelle classe en utilisant l'injection de constructeur standard tant que le `CaslModule` est importé dans le contexte de l'hôte :

```typescript
constructor(private caslAbilityFactory: CaslAbilityFactory) {}
```

Utilisez-le ensuite dans une classe comme suit.

```typescript
const ability = this.caslAbilityFactory.createForUser(user);
if (ability.can(Action.Read, 'all')) {
  // "user" a un accès en lecture à tout
}
```

> info **Astuce** Pour en savoir plus sur la classe `Ability`, consultez la [documentation CASL officielle](https://casl.js.org/v6/en/guide/intro).

Par exemple, supposons qu'un utilisateur ne soit pas un administrateur. Dans ce cas, l'utilisateur doit pouvoir lire les articles, mais la création de nouveaux articles ou la suppression d'articles existants doit être interdite.

```typescript
const user = new User();
user.isAdmin = false;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Read, Article); // true
ability.can(Action.Delete, Article); // false
ability.can(Action.Create, Article); // false
```

> info **Astuce** Bien que les classes `Ability` et `AbilityBuilder` fournissent toutes deux des méthodes `can` et `cannot`, elles ont des objectifs différents et acceptent des arguments légèrement différents.

De plus, comme nous l'avons spécifié dans nos exigences, l'utilisateur doit pouvoir mettre à jour ses articles :

```typescript
const user = new User();
user.id = 1;

const article = new Article();
article.authorId = user.id;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Update, article); // true

article.authorId = 2;
ability.can(Action.Update, article); // false
```

Comme vous pouvez le voir, l'instance `Ability` nous permet de vérifier les permissions d'une manière assez lisible. De même, `AbilityBuilder` nous permet de définir les permissions (et de spécifier diverses conditions) de la même manière. Pour plus d'exemples, visitez la documentation officielle.

#### Avancé : Implémentation d'une `PoliciesGuard`

Dans cette section, nous allons montrer comment construire une garde un peu plus sophistiquée, qui vérifie si un utilisateur répond à des **politiques d'autorisation** spécifiques qui peuvent être configurées au niveau de la méthode (vous pouvez l'étendre pour respecter les politiques configurées au niveau de la classe également). Dans cet exemple, nous allons utiliser le package CASL à des fins d'illustration, mais l'utilisation de cette bibliothèque n'est pas obligatoire. Nous utiliserons également le fournisseur `CaslAbilityFactory` que nous avons créé dans la section précédente.

Tout d'abord, précisons les exigences. L'objectif est de fournir un mécanisme qui permette de spécifier des contrôles de politique par gestionnaire de route. Nous prendrons en charge à la fois les objets et les fonctions (pour des contrôles plus simples et pour ceux qui préfèrent un code plus fonctionnel).

Commençons par définir des interfaces pour les gestionnaires de politiques :

```typescript
import { AppAbility } from '../casl/casl-ability.factory';

interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
```

Comme mentionné plus haut, nous avons proposé deux façons de définir un gestionnaire de politique : un objet (instance d'une classe qui implémente l'interface `IPolicyHandler`) et une fonction (qui répond au type `PolicyHandlerCallback`).

Avec cela en place, nous pouvons créer un décorateur `@CheckPolicies()`. Ce décorateur permet de spécifier quelles politiques doivent être respectées pour accéder à des ressources spécifiques.

```typescript
export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
```

Maintenant, créons une `PoliciesGuard` qui va extraire et exécuter tous les policy handlers liés à un gestionnaire de route.

```typescript
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(user);

    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
```

> info **Astuce** Dans cet exemple, nous avons supposé que `request.user` contient l'instance de l'utilisateur. Dans votre application, vous ferez probablement cette association dans votre **garde d'authentification** personnalisée - voir le chapitre [authentification](/security/authentication) pour plus de détails.

Décomposons cet exemple. Le `policyHandlers` est un tableau de handlers assignés à la méthode par le décorateur `@CheckPolicies()`. Ensuite, nous utilisons la méthode `CaslAbilityFactory#create` qui construit l'objet `Ability`, nous permettant de vérifier si un utilisateur a les permissions suffisantes pour effectuer des actions spécifiques. Nous passons cet objet au gestionnaire de politique qui est soit une fonction, soit une instance d'une classe qui implémente le `IPolicyHandler`, exposant la méthode `handle()` qui retourne un booléen. Enfin, nous utilisons la méthode `Array#every` pour nous assurer que chaque handler renvoie la valeur `true`.

Enfin, pour tester cette garde, liez-la à n'importe quel gestionnaire de route et enregistrez un gestionnaire de politique en ligne (approche fonctionnelle), comme suit :

```typescript
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Article))
findAll() {
  return this.articlesService.findAll();
}
```

Alternativement, nous pouvons définir une classe qui implémente l'interface `IPolicyHandler` :

```typescript
export class ReadArticlePolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Read, Article);
  }
}
```

Et l'utiliser comme suit :

```typescript
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies(new ReadArticlePolicyHandler())
findAll() {
  return this.articlesService.findAll();
}
```

> warning **Remarque** Puisque nous devons instancier le gestionnaire de politique sur place en utilisant le mot-clé `new`, la classe `ReadArticlePolicyHandler` ne peut pas utiliser l'injection de dépendance. Ceci peut être résolu avec la méthode `ModuleRef#get` (en savoir plus [ici](/fundamentals/module-ref)). En fait, au lieu d'enregistrer des fonctions et des instances à travers le décorateur `@CheckPolicies()`, vous devez autoriser le passage d'un `Type<IPolicyHandler>`. Ensuite, à l'intérieur de votre garde, vous pouvez récupérer une instance en utilisant une référence de type : `moduleRef.get(YOUR_HANDLER_TYPE)` ou même l'instancier dynamiquement en utilisant la méthode `ModuleRef#create`.
