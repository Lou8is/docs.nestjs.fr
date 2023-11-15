### Passport (authentification)

[Passport](https://github.com/jaredhanson/passport) est la bibliothèque d'authentification node.js la plus populaire, bien connue de la communauté et utilisée avec succès dans de nombreuses applications en production. Il est facile d'intégrer cette bibliothèque dans une application **Nest** en utilisant le module `@nestjs/passport`. A un niveau élevé, Passport exécute une série d'étapes pour :

- Authentifier un utilisateur en vérifiant ses "informations d'identification" (nom d'utilisateur/mot de passe, jeton Web JSON ([JWT](https://jwt.io/)) ou jeton d'identité provenant d'un fournisseur d'identité).
- Gérer l'état d'authentification (en émettant un jeton portable, tel qu'un JWT, ou en créant une [session Express](https://github.com/expressjs/session))
- Attacher des informations sur l'utilisateur authentifié à l'objet `Request` pour une utilisation ultérieure dans les gestionnaires de routes.

Passport dispose d'un riche écosystème de [stratégies](http://www.passportjs.org/) qui mettent en œuvre divers mécanismes d'authentification. Bien que simple dans son concept, l'ensemble des stratégies de Passport que vous pouvez choisir est large et présente une grande variété. Passport abstrait ces différentes étapes en un modèle standard, et le module `@nestjs/passport` enveloppe et standardise ce modèle dans des constructions Nest familières.

Dans ce chapitre, nous allons mettre en œuvre une solution d'authentification de bout en bout pour un serveur d'API RESTful à l'aide de ces modules puissants et flexibles. Vous pouvez utiliser les concepts décrits ici pour mettre en œuvre n'importe quelle stratégie Passport afin de personnaliser votre schéma d'authentification. Vous pouvez suivre les étapes de ce chapitre pour construire cet exemple complet.

#### Exigences en matière d'authentification

Précisons nos exigences. Pour ce cas d'utilisation, les clients commenceront par s'authentifier à l'aide d'un nom d'utilisateur et d'un mot de passe. Une fois authentifié, le serveur émettra un JWT qui pourra être envoyé en tant que ["bearer token" dans un en-tête d'autorisation] (https://tools.ietf.org/html/rfc6750) lors des demandes ultérieures pour prouver l'authentification. Nous allons également créer une route protégée qui ne sera accessible qu'aux demandes contenant un JWT valide.

Nous commencerons par la première exigence : l'authentification d'un utilisateur. Nous l'étendrons ensuite en émettant un JWT. Enfin, nous créerons une route protégée qui vérifiera que la requête contient un JWT valide.

Tout d'abord, nous devons installer les packages nécessaires. Passport fournit une stratégie appelée [passport-local](https://github.com/jaredhanson/passport-local) qui met en œuvre un mécanisme d'authentification par nom d'utilisateur/mot de passe, ce qui correspond à nos besoins pour cette partie de notre cas d'utilisation.

```bash
$ npm install --save @nestjs/passport passport passport-local
$ npm install --save-dev @types/passport-local
```

> warning **Remarque** Pour **n'importe quelle** stratégie Passport que vous choisissez, vous aurez toujours besoin des packages `@nestjs/passport` et `passport`. Ensuite, vous devrez installer le package spécifique à la stratégie (par exemple, `passport-jwt` ou `passport-local`) qui implémente la stratégie d'authentification particulière que vous construisez. De plus, vous pouvez également installer les définitions de type pour n'importe quelle stratégie Passport, comme montré ci-dessus avec `@types/passport-local`, qui fournit une assistance lors de l'écriture de code TypeScript.

#### Mettre en œuvre les stratégies Passeport

Nous sommes maintenant prêts à mettre en œuvre la fonction d'authentification. Nous commencerons par une vue d'ensemble du processus utilisé pour **toute** stratégie Passport. Il est utile de considérer Passport comme un mini framework en soi. L'élégance du cadre réside dans le fait qu'il abstrait le processus d'authentification en quelques étapes de base que vous personnalisez en fonction de la stratégie que vous mettez en œuvre. Il s'agit d'un framework parce que vous le configurez en fournissant des paramètres de personnalisation (sous forme d'objets JSON) et du code personnalisé sous la forme de fonctions de rappel, que Passport appelle au moment opportun. Le module `@nestjs/passport` enveloppe ce framework dans un package de style Nest, ce qui le rend facile à intégrer dans une application Nest. Nous utiliserons `@nestjs/passport` ci-dessous, mais voyons d'abord comment fonctionne **Passport seul**.

Dans le Passeport de base, vous configurez une stratégie en fournissant deux éléments :

1. Un ensemble d'options spécifiques à cette stratégie. Par exemple, dans une stratégie JWT, vous pouvez fournir un secret pour signer les jetons.
2. Un "callback de vérification", où vous indiquez à Passport comment interagir avec votre magasin d'utilisateurs (où vous gérez les comptes d'utilisateurs). Vous vérifiez ici si un utilisateur existe (et/ou créez un nouvel utilisateur) et si ses informations d'identification sont valides. La bibliothèque Passport s'attend à ce que ce callback renvoie un utilisateur complet si la validation réussit, ou un null si elle échoue (l'échec est défini comme l'utilisateur n'est pas trouvé, ou, dans le cas de passport-local, le mot de passe ne correspond pas).

Avec `@nestjs/passport`, vous configurez une stratégie Passport en étendant la classe `PassportStrategy`. Vous passez les options de la stratégie (point 1 ci-dessus) en appelant la méthode `super()` dans votre sous-classe, en passant éventuellement un objet options. Vous fournissez le callback de vérification (point 2 ci-dessus) en implémentant une méthode `validate()` dans votre sous-classe.

Nous allons commencer par générer un `AuthModule` et dans celui-ci, un `AuthService` :

```bash
$ nest g module auth
$ nest g service auth
```

Comme nous implémentons le `AuthService`, nous trouverons utile d'encapsuler les opérations des utilisateurs dans un `UsersService`, donc générons ce module et ce service maintenant :

```bash
$ nest g module users
$ nest g service users
```

Remplacez le contenu par défaut de ces fichiers générés comme indiqué ci-dessous. Pour notre exemple d'application, le `UsersService` maintient simplement une liste d'utilisateurs en mémoire codée en dur, et une méthode de recherche pour récupérer un utilisateur par son nom d'utilisateur. Dans une application réelle, c'est ici que vous construiriez votre modèle d'utilisateur et votre couche de persistance, en utilisant la bibliothèque de votre choix (par exemple, TypeORM, Sequelize, Mongoose, etc.).

```typescript
@@filename(users/users.service)
import { Injectable } from '@nestjs/common';

// Il doit s'agir d'une véritable classe/interface représentant une entité utilisateur.
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor() {
    this.users = [
      {
        userId: 1,
        username: 'john',
        password: 'changeme',
      },
      {
        userId: 2,
        username: 'maria',
        password: 'guess',
      },
    ];
  }

  async findOne(username) {
    return this.users.find(user => user.username === username);
  }
}
```

Dans le `UsersModule`, le seul changement nécessaire est d'ajouter le `UsersService` au tableau des exportations du décorateur `@Module` afin qu'il soit visible en dehors de ce module (nous l'utiliserons bientôt dans notre `AuthService`).

```typescript
@@filename(users/users.module)
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
@@switch
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Notre `AuthService` a pour tâche de récupérer un utilisateur et de vérifier son mot de passe. Nous créons une méthode `validateUser()` dans ce but. Dans le code ci-dessous, nous utilisons un opérateur d'étalement ES6 pratique pour retirer la propriété password de l'objet user avant de le renvoyer. Nous ferons appel à la méthode `validateUser()` de notre stratégie locale Passport dans un instant.

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
```

> Warning **Attention** Bien entendu, dans une application réelle, vous ne stockeriez pas un mot de passe en texte brut. Vous utiliseriez plutôt une bibliothèque comme [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme), avec un algorithme de hachage à sens unique salé. Avec cette approche, vous ne stockeriez que des mots de passe hachés, et compareriez ensuite le mot de passe stocké à une version hachée du mot de passe **entrant**, ne stockant ou n'exposant donc jamais les mots de passe des utilisateurs en texte brut. Pour que notre exemple d'application reste simple, nous violons cette règle absolue et utilisons du texte en clair. **Ne faites pas cela dans votre application réelle !**

Maintenant, nous mettons à jour notre `AuthModule` pour importer le `UsersModule`.

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
```

#### Mise en oeuvre de Passeport localement

Maintenant nous pouvons implémenter notre **stratégie d'authentification locale** de Passport. Créez un fichier appelé `local.strategy.ts` dans le dossier `auth`, et ajoutez le code suivant :

```typescript
@@filename(auth/local.strategy)
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
@@switch
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
@Dependencies(AuthService)
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(authService) {
    super();
    this.authService = authService;
  }

  async validate(username, password) {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

Nous avons suivi la recette décrite précédemment pour toutes les stratégies Passport. Dans notre cas d'utilisation avec passport-local, il n'y a pas d'options de configuration, donc notre constructeur appelle simplement `super()`, sans objet options.

> info **Astuce** Nous pouvons passer un objet d'options dans l'appel à `super()` pour personnaliser le comportement de la stratégie de passeport. Dans cet exemple, la stratégie passport-local attend par défaut des propriétés appelées `username` et `password` dans le corps de la requête. Passez un objet options pour spécifier des noms de propriétés différents, par exemple : `super({{ '{' }} usernameField : 'email' {{ '}' }})`. Voir la [documentation Passport](http://www.passportjs.org/docs/configure/) pour plus d'informations.

Nous avons également implémenté la méthode `validate()`. Pour chaque stratégie, Passport appellera la fonction verify (implémentée avec la méthode `validate()` dans `@nestjs/passport`) en utilisant un ensemble approprié de paramètres spécifiques à la stratégie. Pour la stratégie locale, Passport attend une méthode `validate()` avec la signature suivante : `validate(username : string, password:string) : any`.

La plupart du travail de validation est fait dans notre `AuthService` (avec l'aide de notre `UsersService`), donc cette méthode est assez simple. La méthode `validate()` pour **n'importe quelle** stratégie Passport suivra un schéma similaire, variant seulement dans les détails de la façon dont les informations d'identification sont représentées. Si un utilisateur est trouvé et que les informations d'identification sont valides, l'utilisateur est renvoyé afin que Passport puisse terminer ses tâches (par exemple, créer la propriété `user` sur l'objet `Request`), et que le pipeline de traitement des requêtes puisse continuer. S'il n'est pas trouvé, nous lançons une exception et laissons notre [couche d'exceptions](exception-filters) s'en charger.

Typiquement, la seule différence significative dans la méthode `validate()` pour chaque stratégie est **comment** vous déterminez si un utilisateur existe et est valide. Par exemple, dans une stratégie JWT, en fonction des besoins, nous pouvons évaluer si le `userId` porté dans le token décodé correspond à un enregistrement dans notre base de données d'utilisateurs, ou correspond à une liste de tokens révoqués. Ce modèle de sous-classification et de mise en œuvre d'une validation spécifique à une stratégie est donc cohérent, élégant et extensible.

Nous devons configurer notre `AuthModule` pour utiliser les fonctionnalités de Passport que nous venons de définir. Mettez à jour `auth.module.ts` pour qu'il ressemble à ceci :

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
```

#### Gardes Passport intégrées

Le chapitre [Gardes](gards) décrit la fonction première des gardes : déterminer si une requête sera traitée par le gestionnaire de route ou non. Cela reste vrai, et nous utiliserons bientôt cette capacité standard. Cependant, dans le contexte de l'utilisation du module `@nestjs/passport`, nous allons également introduire une légère nouveauté qui peut être déroutante à première vue, donc discutons-en maintenant. Considérons que votre application peut exister dans deux états, du point de vue de l'authentification :

1. l'utilisateur/client n'est **pas** connecté (n'est pas authentifié)
2. l'utilisateur/client **est** connecté (est authentifié)

Dans le premier cas (l'utilisateur n'est pas connecté), nous devons exécuter deux fonctions distinctes :

- Restreindre les routes auxquelles un utilisateur non authentifié peut accéder (c'est-à-dire refuser l'accès aux routes restreintes). Nous utiliserons les gardes dans leur capacité habituelle pour gérer cette fonction, en plaçant une garde sur les routes protégées. Comme vous pouvez l'imaginer, nous allons vérifier la présence d'un JWT valide dans cette garde, nous travaillerons donc sur cette garde plus tard, une fois que nous aurons réussi à émettre des JWTs.

- Initier **l'étape d'authentification** elle-même lorsqu'un utilisateur non authentifié tente de se connecter. C'est l'étape où nous allons **émettre** un JWT à un utilisateur valide. En y réfléchissant un instant, nous savons que nous aurons besoin de `POST` nom d'utilisateur/mot de passe pour initier l'authentification, donc nous mettrons en place une route `POST /auth/login` pour gérer cela. Cela soulève la question suivante : comment invoquer la stratégie passeport-local dans cette route ?

La réponse est simple : en utilisant un autre type de garde, légèrement différent. Le module `@nestjs/passport` nous fournit une garde intégrée qui fait cela pour nous. Cette garde invoque la stratégie Passport et lance les étapes décrites ci-dessus (récupération des informations d'identification, exécution de la fonction de vérification, création de la propriété `user`, etc).

Le deuxième cas énuméré ci-dessus (utilisateur connecté) s'appuie simplement sur le type de garde standard dont nous avons déjà parlé pour permettre aux utilisateurs connectés d'accéder aux itinéraires protégés.

<app-banner-courses-auth></app-banner-courses-auth>

#### Route login

Avec la stratégie en place, nous pouvons maintenant implémenter une route `/auth/login` simple, et appliquer la garde intégrée pour initier le flux passeport-local.

Ouvrez le fichier `app.controller.ts` et remplacez son contenu par ce qui suit :

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req) {
    return req.user;
  }
}
@@switch
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return req.user;
  }
}
```

Avec `@UseGuards(AuthGuard('local'))` nous utilisons une `AuthGuard` que `@nestjs/passport` a **automatiquement provisionné** pour nous quand nous avons étendu la stratégie passport-local. Décomposons cela. Notre stratégie locale Passport a un nom par défaut `'local''. Nous référençons ce nom dans le décorateur `@UseGuards()` pour l'associer au code fourni par le paquet `passport-local`. Ceci est utilisé pour désambiguïser la stratégie à invoquer dans le cas où nous aurions plusieurs stratégies Passport dans notre application (chacune pouvant fournir un `AuthGuard` spécifique à la stratégie). Bien que nous n'ayons pour l'instant qu'une seule stratégie de ce type, nous en ajouterons bientôt une seconde, ce qui rend ce paquet nécessaire pour la désambiguïsation.

Afin de tester notre route, nous allons faire en sorte que notre route `/auth/login` renvoie simplement l'utilisateur pour l'instant. Cela nous permet également de démontrer une autre fonctionnalité de Passport : Passport crée automatiquement un objet `user`, basé sur la valeur retournée par la méthode `validate()`, et l'assigne à l'objet `Request` en tant que `req.user`. Plus tard, nous remplacerons cela par du code pour créer et retourner un JWT à la place.

Comme il s'agit de routes API, nous allons les tester en utilisant la bibliothèque [cURL](https://curl.haxx.se/) communément disponible. Vous pouvez tester avec n'importe quel objet `user` codé en dur dans le `UsersService`.

```bash
$ # POST vers /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # résultat -> {"userId":1,"username":"john"}
```

Bien que cela fonctionne, passer le nom de la stratégie directement à `AuthGuard()` introduit des "magic strings" dans le code. Au lieu de cela, nous recommandons de créer votre propre classe, comme indiqué ci-dessous :

```typescript
@@filename(auth/local-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

Maintenant, nous pouvons mettre à jour le gestionnaire de route `/auth/login` et utiliser `LocalAuthGuard` à la place :

```typescript
@UseGuards(LocalAuthGuard)
@Post('auth/login')
async login(@Request() req) {
  return req.user;
}
```

#### Fonctionnalité JWT

Nous sommes prêts à passer à la partie JWT de notre système d'authentification. Passons en revue et affinons nos exigences :

- Permettre aux utilisateurs de s'authentifier avec leur nom d'utilisateur et leur mot de passe, en renvoyant un JWT à utiliser lors d'appels ultérieurs à des points d'extrémité d'API protégés. Nous sommes sur la bonne voie pour répondre à cette exigence. Pour la compléter, nous devons écrire le code qui émet un JWT.
- Créer des itinéraires API protégés en fonction de la présence d'un JWT valide en tant que jeton porteur.

Nous aurons besoin d'installer quelques paquets supplémentaires pour répondre à nos besoins en matière de JWT :

```bash
$ npm install --save @nestjs/jwt passport-jwt
$ npm install --save-dev @types/passport-jwt
```

Le package `@nestjs/jwt` (voir plus [ici](https://github.com/nestjs/jwt)) est un package utilitaire qui aide à la manipulation des JWT. Le package `passport-jwt` est le package Passport qui implémente la stratégie JWT et `@types/passport-jwt` fournit les définitions de type TypeScript.

Regardons de plus près comment une requête `POST /auth/login` est gérée. Nous avons décoré la route en utilisant le `AuthGuard` intégré fourni par la stratégie passport-local. Cela signifie que :

1. Le gestionnaire de route **ne sera invoqué que si l'utilisateur a été validé**
2. Le paramètre `req` contiendra une propriété `user` (remplie par Passport pendant le flux d'authentification locale).

Avec ceci en tête, nous pouvons enfin générer un vrai JWT, et le retourner dans cette route. Pour garder nos services proprement modulaires, nous allons nous occuper de la génération du JWT dans le `authService`. Ouvrez le fichier `auth.service.ts` dans le dossier `auth`, et ajoutez la méthode `login()`, et importez le `JwtService` comme indiqué :

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

Nous utilisons la bibliothèque `@nestjs/jwt`, qui fournit une fonction `sign()` pour générer notre JWT à partir d'un sous-ensemble de propriétés de l'objet `user`, que nous retournons ensuite comme un simple objet avec une seule propriété `access_token`. Note : nous avons choisi le nom de propriété `sub` pour contenir notre valeur `userId` afin d'être cohérent avec les standards JWT. N'oubliez pas d'injecter le fournisseur JwtService dans le `AuthService`.

Nous devons maintenant mettre à jour le `AuthModule` pour importer les nouvelles dépendances et configurer le `JwtModule`.

Tout d'abord, créez `constants.ts` dans le dossier `auth`, et ajoutez le code suivant :

```typescript
@@filename(auth/constants)
export const jwtConstants = {
  secret: 'N UTILISEZ PAS CETTE VALEUR. CRÉEZ PLUTÔT UN SECRET COMPLEXE ET GARDEZ-LE EN SÉCURITÉ EN DEHORS DU CODE SOURCE.',
};
@@switch
export const jwtConstants = {
  secret: 'N UTILISEZ PAS CETTE VALEUR. CRÉEZ PLUTÔT UN SECRET COMPLEXE ET GARDEZ-LE EN SÉCURITÉ EN DEHORS DU CODE SOURCE.',
};
```

Nous l'utiliserons pour partager notre clé entre les étapes de signature et de vérification du JWT.

> Warning **Attention** **Ne pas exposer cette clé publiquement**. Nous l'avons fait ici pour que le code soit clair, mais dans un système de production **vous devez protéger cette clé** à l'aide de mesures appropriées telles qu'un coffre-fort de secrets, une variable d'environnement ou un service de configuration.

Maintenant, ouvrez `auth.module.ts` dans le dossier `auth` et mettez-le à jour pour qu'il ressemble à ceci :

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

Nous configurons le `JwtModule` en utilisant `register()`, en passant un objet de configuration. Voir [ici](https://github.com/nestjs/jwt/blob/master/README.md) pour plus de détails sur le Nest `JwtModule` et [ici](https://github.com/auth0/node-jsonwebtoken#usage) pour plus de détails sur les options de configuration disponibles.

Maintenant nous pouvons mettre à jour la route `/auth/login` pour retourner un JWT.

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
@@switch
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }
}
```

Testons à nouveau nos routes en utilisant cURL. Vous pouvez tester avec n'importe quel objet `user` codé en dur dans le `UsersService`.

```bash
$ # POST vers /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # résultat -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note : le JWT ci-dessus a été tronqué.
```

#### Mise en œuvre du JWT de Passeport

Nous pouvons maintenant répondre à notre dernière exigence : protéger les points de terminaison en exigeant qu'un JWT valide soit présent dans la demande. Passport peut nous aider ici aussi. Il fournit la stratégie [passport-jwt](https://github.com/mikenicholson/passport-jwt) pour sécuriser les points de terminaison RESTful avec des jetons Web JSON. Commencez par créer un fichier appelé `jwt.strategy.ts` dans le dossier `auth`, et ajoutez le code suivant :

```typescript
@@filename(auth/jwt.strategy)
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
@@switch
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

Avec notre `JwtStrategy`, nous avons suivi la même recette décrite précédemment pour toutes les stratégies Passport. Cette stratégie nécessite une certaine initialisation, ce que nous faisons en passant un objet options dans l'appel `super()`. Vous pouvez en savoir plus sur les options disponibles [ici] (https://github.com/mikenicholson/passport-jwt#configure-strategy). Dans notre cas, ces options sont les suivantes :

- `jwtFromRequest` : fournit la méthode par laquelle le JWT sera extrait de la `Request`. Nous utiliserons l'approche standard qui consiste à fournir un jeton de porteur dans l'en-tête Authorization de nos demandes d'API. D'autres options sont décrites [ici](https://github.com/mikenicholson/passport-jwt#extracting-the-jwt-from-the-request).
- `ignoreExpiration` : juste pour être explicite, nous choisissons le paramètre par défaut `false`, qui délègue la responsabilité de s'assurer qu'un JWT n'a pas expiré au module Passport. Cela signifie que si notre route est fournie avec un JWT expiré, la requête sera refusée et une réponse `401 Unauthorized` sera envoyée. Passport s'en occupe automatiquement pour nous.
- `secretOrKey` : nous utilisons l'option rapide de fournir un secret symétrique pour signer le jeton. D'autres options, comme une clé publique codée en PEM, peuvent être plus appropriées pour les applications de production (voir [ici](https://github.com/mikenicholson/passport-jwt#configure-strategy) pour plus d'informations). Dans tous les cas, comme nous l'avons déjà dit, **ne pas exposer ce secret publiquement**.

La méthode `validate()` mérite qu'on s'y attarde. Pour la jwt-strategy, Passport vérifie d'abord la signature du JWT et décode le JSON. Il invoque ensuite notre méthode `validate()` en passant le JSON décodé comme unique paramètre. En se basant sur le fonctionnement de la signature JWT, **nous avons la garantie de recevoir un jeton valide** que nous avons préalablement signé et délivré à un utilisateur valide.

En conséquence, notre réponse au callback `validate()` est triviale : nous renvoyons simplement un objet contenant les propriétés `userId` et `username`. Rappelons que Passport va construire un objet `user` basé sur la valeur de retour de notre méthode `validate()`, et l'attacher en tant que propriété de l'objet `Request`.

Il convient également de souligner que cette approche nous laisse de la place (des " hooks" en quelque sorte) pour injecter d'autres logiques d'entreprise dans le processus. Par exemple, nous pourrions faire une recherche dans la base de données dans notre méthode `validate()` pour extraire plus d'informations sur l'utilisateur, résultant en un objet `user` plus enrichi disponible dans notre `Request`. C'est aussi l'endroit où nous pouvons décider d'effectuer une validation plus poussée du token, comme rechercher l'`userId` dans une liste de tokens révoqués, ce qui nous permet d'effectuer la révocation du token. Le modèle que nous avons implémenté ici dans notre code d'exemple est un modèle rapide, "JWT sans état", où chaque appel à l'API est immédiatement autorisé en fonction de la présence d'un JWT valide, et où un petit nombre d'informations sur le demandeur (son `userId` et son `username`) est disponible dans notre pipeline de requête.

Ajouter la nouvelle `JwtStrategy` comme fournisseur dans le `AuthModule` :

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

En important le même secret que celui utilisé lors de la signature du JWT, nous nous assurons que la phase de **vérification** effectuée par Passport, et la phase de **signature** effectuée dans notre AuthService, utilisent un secret commun.

Enfin, nous définissons la classe `JwtAuthGuard` qui étend la classe intégrée `AuthGuard` :

```typescript
@@filename(auth/jwt-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### Mise en œuvre de routes protégées et de gardes stratégiques JWT

Nous pouvons maintenant mettre en œuvre notre route protégée et sa garde associée.

Ouvrez le fichier `app.controller.ts` et mettez-le à jour comme indiqué ci-dessous :

```typescript
@@filename(app.controller)
import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
@@switch
import { Controller, Dependencies, Bind, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Dependencies(AuthService)
@Controller()
export class AppController {
  constructor(authService) {
    this.authService = authService;
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Bind(Request())
  getProfile(req) {
    return req.user;
  }
}
```

Encore une fois, nous appliquons le `AuthGuard` que le module `@nestjs/passport` a automatiquement provisionné pour nous lorsque nous avons configuré le module passport-jwt. Cette garde est référencée par son nom par défaut, `jwt`. Quand notre route `GET /profile` est frappée, le Guard va automatiquement invoquer notre stratégie personnalisée configurée par passport-jwt, valider le JWT, et assigner la propriété `user` à l'objet `Request`.

Assurez-vous que l'application fonctionne et testez les routes en utilisant `cURL`.

```bash
$ # GET /profile
$ curl http://localhost:3000/profile
$ # résultat -> {"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # résultat -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm... }

$ # GET /profile en utilisant le jeton d'accès (access_token) renvoyé à l'étape précédente comme code porteur
$ curl http://localhost:3000/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
$ # résultat -> {"userId":1,"username":"john"}
```

Notez que dans le `AuthModule`, nous avons configuré le JWT pour avoir une expiration de `60 seconds`. C'est probablement une expiration trop courte, et traiter les détails de l'expiration et du rafraîchissement des jetons dépasse le cadre de cet article. Cependant, nous avons choisi cela pour démontrer une qualité importante des JWTs et de la stratégie passport-jwt. Si vous attendez 60 secondes après l'authentification avant de tenter une requête `GET /profile`, vous recevrez une réponse `401 Unauthorized`. Cela est dû au fait que Passport vérifie automatiquement le délai d'expiration du JWT, ce qui vous évite de le faire dans votre application.

Nous avons maintenant terminé la mise en œuvre de l'authentification JWT. Les clients JavaScript (tels que Angular/React/Vue) et les autres applications JavaScript peuvent désormais s'authentifier et communiquer en toute sécurité avec notre serveur API.

#### Extension des gardes

Dans la plupart des cas, l'utilisation d'une classe `AuthGuard` fournie est suffisante. Cependant, il peut y avoir des cas d'utilisation où vous voudriez simplement étendre la gestion des erreurs par défaut ou la logique d'authentification. Pour cela, vous pouvez étendre la classe intégrée et surcharger les méthodes dans une sous-classe.

```typescript
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Ajoutez ici votre logique d'authentification personnalisée
    // par exemple, appellez super.logIn(request) pour établir une session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Vous pouvez lancer une exception sur la base des arguments "info" ou "err".
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

En plus d'étendre la gestion des erreurs et la logique d'authentification par défaut, nous pouvons permettre à l'authentification de passer par une chaîne de stratégies. La première stratégie qui réussit, la première redirection ou la première erreur interrompt la chaîne. Les échecs d'authentification passeront par chaque stratégie en série, pour finalement échouer si toutes les stratégies échouent.

```typescript
export class JwtAuthGuard extends AuthGuard(['strategy_jwt_1', 'strategy_jwt_2', '...']) { ... }
```

#### Activer l'authentification globalement

Si la grande majorité de vos points d'accès doivent être protégés par défaut, vous pouvez enregistrer la garde d'authentification comme une [garde globale](/guards#liaison-des-gardes) et au lieu d'utiliser le décorateur `@UseGuards()` au-dessus de chaque contrôleur, vous pouvez simplement indiquer quelles routes doivent être publiques.

Tout d'abord, enregistrez le `JwtAuthGuard` en tant que garde globale en utilisant la construction suivante (dans n'importe quel module) :

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

Avec ceci en place, Nest va automatiquement lier `JwtAuthGuard` à tous les endpoints.

Maintenant, nous devons fournir un mécanisme pour déclarer les routes comme publiques. Pour cela, nous pouvons créer un décorateur personnalisé en utilisant la fonction d'usine du décorateur `SetMetadata`.

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Dans le fichier ci-dessus, nous avons exporté deux constantes. L'une est notre clé de métadonnées nommée `IS_PUBLIC_KEY`, et l'autre est notre nouveau décorateur que nous allons appeler `Public` (vous pouvez alternativement le nommer `SkipAuth` ou `AllowAnon`, selon ce qui convient à votre projet).

Maintenant que nous avons un décorateur personnalisé `@Public()`, nous pouvons l'utiliser pour décorer n'importe quelle méthode, comme suit :

```typescript
@Public()
@Get()
findAll() {
  return [];
}
```

Enfin, nous avons besoin que le `JwtAuthGuard` retourne `true` lorsque la métadonnée `"isPublic"` est trouvée. Pour cela, nous allons utiliser la classe `Reflector` (en savoir plus [ici](/guards#mettre-en-place-lensemble)).

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

#### Stratégies liées aux requêtes

L'API du passeport est basée sur l'enregistrement de stratégies dans l'instance globale de la bibliothèque. Par conséquent, les stratégies ne sont pas conçues pour avoir des options dépendantes de la requête ou pour être dynamiquement instanciées par requête (en savoir plus sur les fournisseurs [request-scoped](/fundamentals/injection-scopes)). Lorsque vous configurez votre stratégie pour qu'elle soit adaptée aux requêtes, Nest ne l'instanciera jamais car elle n'est pas liée à une route spécifique. Il n'existe aucun moyen physique de déterminer quelles stratégies à portée de requête doivent être exécutées par requête.

Cependant, il existe des moyens de résoudre dynamiquement les fournisseurs à portée de requête au sein de la stratégie. Pour cela, nous utilisons la fonctionnalité [référence de module](/fundamentals/module-ref).

Tout d'abord, ouvrez le fichier `local.strategy.ts` et injectez le `ModuleRef` de la manière habituelle :

```typescript
constructor(private moduleRef: ModuleRef) {
  super({
    passReqToCallback: true,
  });
}
```

> info **Astuce** La classe `ModuleRef` est importée du paquet `@nestjs/core`.

Assurez-vous de mettre la propriété de configuration `passReqToCallback` à `true`, comme indiqué ci-dessus.

Dans l'étape suivante, l'instance de requête sera utilisée pour obtenir l'identifiant du contexte actuel, au lieu d'en générer un nouveau (pour en savoir plus sur le contexte de requête [ici](/fundamentals/module-ref#obtenir-la-sous-arborescence-actuelle)).

Maintenant, dans la méthode `validate()` de la classe `LocalStrategy`, utilisez la méthode `getByRequest()` de la classe `ContextIdFactory` pour créer un identifiant de contexte basé sur l'objet de requête, et passez-le à l'appel `resolve()` :

```typescript
async validate(
  request: Request,
  username: string,
  password: string,
) {
  const contextId = ContextIdFactory.getByRequest(request);
  // "AuthService" est un fournisseur à portée de requête
  const authService = await this.moduleRef.resolve(AuthService, contextId);
  ...
}
```

Dans l'exemple ci-dessus, la méthode `resolve()` renvoie de manière asynchrone l'instance du fournisseur `AuthService` (nous avons supposé que `AuthService` est marqué comme un fournisseur à portée de requête).

#### Personnaliser Passport

Toutes les options de personnalisation standard de Passport peuvent être passées de la même manière, en utilisant la méthode `register()`. Les options disponibles dépendent de la stratégie mise en œuvre. Par exemple, les options disponibles dépendent de la stratégie mise en œuvre :

```typescript
PassportModule.register({ session: true });
```

Vous pouvez également passer aux stratégies un objet d'options dans leurs constructeurs pour les configurer.
Pour la stratégie locale, vous pouvez passer par exemple :

```typescript
constructor(private authService: AuthService) {
  super({
    usernameField: 'email',
    passwordField: 'password',
  });
}
```

Consultez le [site web Passeport officiel](http://www.passportjs.org/docs/oauth/) pour connaître les noms de propriété.

#### Stratégies nommées

Lors de l'implémentation d'une stratégie, vous pouvez lui donner un nom en passant un second argument à la fonction `PassportStrategy`. Si vous ne le faites pas, chaque stratégie aura un nom par défaut (par exemple, 'jwt' pour jwt-strategy) :

```typescript
export class JwtStrategy extends PassportStrategy(Strategy, 'myjwt')
```

Ensuite, vous y faites référence via un décorateur comme `@UseGuards(AuthGuard('myjwt'))`.

#### GraphQL

Pour utiliser un AuthGuard avec [GraphQL](/graphql/quick-start), il faut étendre la classe AuthGuard intégrée et surcharger la méthode getRequest().

```typescript
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

Pour obtenir l'utilisateur authentifié actuel dans votre résolveur graphql, vous pouvez définir un décorateur `@CurrentUser()` :

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
```

Pour utiliser le décorateur ci-dessus dans votre résolveur, assurez-vous de l'inclure en tant que paramètre de votre requête ou mutation :

```typescript
@Query(returns => User)
@UseGuards(GqlAuthGuard)
whoAmI(@CurrentUser() user: User) {
  return this.usersService.findById(user.id);
}
```
