### Authentification

L'authentification est un élément **essentiel** de la plupart des applications. Il existe de nombreuses approches et stratégies différentes pour gérer l'authentification. L'approche adoptée pour un projet dépend des exigences particulières de l'application. Ce chapitre présente plusieurs approches de l'authentification qui peuvent être adaptées à un grand nombre d'exigences différentes.

Précisons nos exigences. Pour ce cas d'utilisation, les clients commenceront par s'authentifier à l'aide d'un nom d'utilisateur et d'un mot de passe. Une fois authentifié, le serveur émettra un JWT qui pourra être envoyé en tant que [bearer token](https://tools.ietf.org/html/rfc6750) (littéralement "jeton porteur") dans un en-tête d'autorisation sur les requêtes ultérieures afin de prouver l'authentification. Nous allons également créer une route protégée qui n'est accessible qu'aux requêtes contenant un JWT valide.

Nous commencerons par la première exigence : l'authentification d'un utilisateur. Nous l'étendrons ensuite en émettant un JWT. Enfin, nous allons créer une route protégée qui vérifie que la requête contient un JWT valide.

#### Créer un module d'authentification

Nous allons commencer par générer un `AuthModule` et dans celui-ci, un `AuthService` et un `AuthController`. Nous allons utiliser le `AuthService` pour implémenter la logique d'authentification, et le `AuthController` pour exposer les terminaux d'authentification.

```bash
$ nest g module auth
$ nest g controller auth
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

#### Implémentation du point d'accès "Se connecter"

Notre `AuthService` a pour tâche de récupérer un utilisateur et de vérifier son mot de passe. Nous créons une méthode `signIn()` dans ce but. Dans le code ci-dessous, nous utilisons un opérateur d'étalement ES6 pratique pour retirer la propriété password de l'objet user avant de le renvoyer. Il s'agit d'une pratique courante lors du retour d'objets utilisateurs, car vous ne souhaitez pas exposer des champs sensibles tels que des mots de passe ou d'autres clés de sécurité.

```typescript
@@filename(auth/auth.service)
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO : Générer un JWT et le renvoyer ici
    // au lieu de l'objet utilisateur
    return result;
  }
}
@@switch
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO : Générer un JWT et le renvoyer ici
    // au lieu de l'objet utilisateur
    return result;
  }
}
```

> Warning **Attention** Bien entendu, dans une application réelle, vous ne stockeriez pas un mot de passe en texte brut. Vous utiliseriez plutôt une bibliothèque comme [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme), avec un algorithme de hachage à sens unique avec salage. Avec cette approche, vous ne stockeriez que des mots de passe hachés, et compareriez ensuite le mot de passe stocké à une version hachée du mot de passe **entrant**, ne stockant ou n'exposant donc jamais les mots de passe des utilisateurs en texte brut. Pour que notre exemple d'application reste simple, nous violons cette règle absolue et utilisons du texte en clair. **Ne faites pas cela dans votre application réelle !**

Maintenant, nous mettons à jour notre `AuthModule` pour importer le `UsersModule`.

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
```

Avec ceci en place, ouvrons le `AuthController` et ajoutons lui une méthode `signIn()`. Cette méthode sera appelée par le client pour authentifier un utilisateur. Elle recevra le nom d'utilisateur et le mot de passe dans le corps de la requête, et retournera un jeton JWT si l'utilisateur est authentifié.

```typescript
@@filename(auth/auth.controller)
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
```

> info **Astuce** Idéalement, au lieu d'utiliser le type `Record<string, any>`, nous devrions utiliser une classe DTO pour définir la forme du corps de la requête. Voir le chapitre [validation](/techniques/validation) pour plus d'informations.

<app-banner-courses-auth></app-banner-courses-auth>

#### Jeton JWT

Nous sommes prêts à passer à la partie JWT de notre système d'authentification. Passons en revue et affinons nos exigences :

- Permettre aux utilisateurs de s'authentifier avec leur nom d'utilisateur et leur mot de passe, en renvoyant un JWT à utiliser lors d'appels ultérieurs à des points d'extrémité d'API protégés. Nous sommes sur la bonne voie pour répondre à cette exigence. Pour la compléter, nous devons écrire le code qui émet un JWT.
- Créer des itinéraires API protégés en fonction de la présence d'un JWT valide en tant que jeton porteur.

Nous devrons installer un package supplémentaire pour répondre à nos besoins en matière de JWT :

```bash
$ npm install --save @nestjs/jwt
```

> info **Astuce** Le package `@nestjs/jwt` (voir plus [ici](https://github.com/nestjs/jwt)) est un package utilitaire qui aide à la manipulation des JWT. Cela inclut la génération et la vérification des jetons JWT.

Pour garder nos services modulaires de manière propre, nous allons nous occuper de la génération du JWT dans le `authService`. Ouvrez le fichier `auth.service.ts` dans le dossier `auth`, injectez le `JwtService`, et mettez à jour la méthode `signIn` pour générer un jeton JWT comme montré ci-dessous :

```typescript
@@filename(auth/auth.service)
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

    async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.userId, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
@@switch
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async signIn(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
```

Nous utilisons la librairie `@nestjs/jwt`, qui fournit une fonction `signAsync()` pour générer notre JWT à partir d'un sous-ensemble de propriétés de l'objet `user`, que nous retournons ensuite comme un simple objet avec une seule propriété `access_token`. Note : nous avons choisi le nom de propriété `sub` pour contenir notre valeur `userId` afin d'être cohérent avec les standards JWT. N'oubliez pas d'injecter le fournisseur JwtService dans le `AuthService`.

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

> Warning **Attention** **Ne pas exposer cette clé publiquement**. Nous l'avons fait ici pour que le code soit clair, mais dans un système de production **vous devez protéger cette clé** en utilisant des mesures appropriées telles qu'un coffre-fort de secrets, une variable d'environnement ou un service de configuration.

Maintenant, ouvrez `auth.module.ts` dans le dossier `auth` et mettez-le à jour pour qu'il ressemble à ceci :

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

> hint **Astuce** Nous enregistrons le `JwtModule` comme global pour nous faciliter la tâche. Cela signifie que nous n'avons pas besoin d'importer le `JwtModule` ailleurs dans notre application.

Nous configurons le `JwtModule` en utilisant `register()`, en passant un objet de configuration. Voir [ici](https://github.com/nestjs/jwt/blob/master/README.md) pour plus de détails sur le Nest `JwtModule` et [ici](https://github.com/auth0/node-jsonwebtoken#usage) pour plus de détails sur les options de configuration disponibles.

Testons à nouveau nos routes en utilisant cURL. Vous pouvez tester avec n'importe quel objet `user` codé en dur dans le `UsersService`.

```bash
$ # POST vers /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note : le JWT ci-dessus a été tronqué.
```

#### Mise en œuvre de la garde d'authentification

Nous pouvons maintenant aborder notre dernière exigence : protéger les endpoints en exigeant qu'un JWT valide soit présent dans la requête. Nous allons le faire en créant une `AuthGuard` que nous pourrons utiliser pour protéger nos routes.

```typescript
@@filename(auth/auth.guard)
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: jwtConstants.secret
        }
      );
      // 💡 Nous attribuons ici le payload à l'objet de la requête
      // afin que nous puissions y accéder dans nos gestionnaires de routes
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

Nous pouvons maintenant implémenter notre route protégée et enregistrer notre `AuthGuard` pour la protéger.

Ouvrez le fichier `auth.controller.ts` et mettez-le à jour comme indiqué ci-dessous :

```typescript
@@filename(auth.controller)
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

Nous appliquons le `AuthGuard` que nous venons de créer à la route `GET /profile` afin qu'elle soit protégée.

Assurez-vous que l'application est lancée, et testez les routes en utilisant `cURL`.

```bash
$ # GET /profile
$ curl http://localhost:3000/auth/profile
{"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."}

$ # GET /profile en utilisant le jeton d'accès (access_token) renvoyé à l'étape précédente comme jeton porteur
$ curl http://localhost:3000/auth/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
{"sub":1,"username":"john","iat":...,"exp":...}
```

Notez que dans le `AuthModule`, nous avons configuré le JWT pour avoir une expiration de `60 seconds`. C'est une expiration trop courte, et traiter les détails de l'expiration et du rafraîchissement des jetons dépasse le cadre de cet article. Cependant, nous avons choisi cela pour démontrer une qualité importante des JWTs. Si vous attendez 60 secondes après l'authentification avant de tenter une requête `GET /auth/profile`, vous recevrez une réponse `401 Unauthorized`. C'est parce que `@nestjs/jwt` vérifie automatiquement le délai d'expiration du JWT, vous évitant ainsi d'avoir à le faire dans votre application.

Nous avons maintenant terminé la mise en œuvre de l'authentification JWT. Les clients JavaScript (tels que Angular/React/Vue) et autres applications JavaScript peuvent désormais s'authentifier et communiquer en toute sécurité avec notre serveur API.

#### Activer l'authentification globalement

Si la grande majorité de vos points d'accès doivent être protégés par défaut, vous pouvez enregistrer la garde d'authentification comme une [garde globale](/guards#liaison-des-gardes) et au lieu d'utiliser le décorateur `@UseGuards()` au-dessus de chaque contrôleur, vous pouvez simplement indiquer quelles routes doivent être publiques.

Tout d'abord, enregistrez le `AuthGuard` en tant que garde globale en utilisant la construction suivante (dans n'importe quel module, par exemple, dans le `AuthModule`) :

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: AuthGuard,
  },
],
```

Avec ceci en place, Nest va automatiquement lier `AuthGuard` à tous les endpoints.

Nous devons maintenant fournir un mécanisme pour déclarer les routes comme publiques. Pour cela, nous pouvons créer un décorateur personnalisé en utilisant la fonction d'usine de décorateur `SetMetadata`.

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

Enfin, nous avons besoin que le `AuthGuard` retourne `true` lorsque la métadonnée `"isPublic"` est trouvée. Pour cela, nous allons utiliser la classe `Reflector` (en lire plus [ici](/guards#mettre-en-place-lensemble)).

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 💡 Voir cette condition
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      // 💡 Nous attribuons ici le payload à l'objet de la requête
      // afin que nous puissions y accéder dans nos gestionnaires de routes
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### Intégration de Passport

[Passport](https://github.com/jaredhanson/passport) est la bibliothèque d'authentification node.js la plus populaire, bien connue de la communauté et utilisée avec succès dans de nombreuses applications de production. Il est facile d'intégrer cette bibliothèque dans une application **Nest** en utilisant le module `@nestjs/passport`.

Pour savoir comment intégrer Passport à NestJS, consultez ce [chapitre](/recipes/passport).

#### Exemple

Vous trouverez une version complète du code de ce chapitre [ici](https://github.com/nestjs/nest/tree/master/sample/19-auth-jwt).
