### Filtres d'exception

Nest est livré avec une **couche d'exceptions** intégrée qui est responsable du traitement de toutes les exceptions non gérées dans une application. Lorsqu'une exception n'est pas gérée par le code de votre application, elle est prise en charge par cette couche, qui envoie alors automatiquement une réponse appropriée et conviviale.

<figure>
  <img class="illustrative-image" src="/assets/Filter_1.png" />
</figure>

Cette action est effectuée par un **filtre d'exception global** intégré, qui gère les exceptions de type `HttpException` (et ses sous-classes). Quand une exception est **non reconnue** (n'est ni `HttpException` ni une classe qui hérite de `HttpException`), le filtre d'exception intégré génère la réponse JSON par défaut suivante :

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

> info **Astuce** Le filtre d'exception global supporte partiellement la bibliothèque `http-errors`. Fondamentalement, toute exception lancée contenant les propriétés `statusCode` et `message` sera correctement remplie et renvoyée en tant que réponse (au lieu de l'exception par défaut `InternalServerErrorException` pour les exceptions non reconnues).

#### Lancer des exceptions standard

Nest fournit une classe intégrée `HttpException`, exposée dans le package `@nestjs/common`. Pour les applications HTTP REST/GraphQL API typiques, la meilleure pratique consiste à envoyer des objets de réponse HTTP standard lorsque certaines conditions d'erreur se produisent.

Par exemple, dans le `CatsController`, nous avons une méthode `findAll()` (un gestionnaire de route `GET`). Supposons que ce gestionnaire de route lève une exception pour une raison quelconque. Pour le démontrer, nous allons le coder en dur comme suit :

```typescript
@@filename(cats.controller)
@Get()
async findAll() {
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
```

> info **Astuce** Nous avons utilisé `HttpStatus` ici. C'est une enum d'aide importée du package `@nestjs/common`.

Lorsque le client appelle ce point d'accès, la réponse ressemble à ceci :

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

Le constructeur de `HttpException` prend deux arguments obligatoires qui déterminent la
réponse :

- L'argument `response` définit le corps de la réponse JSON. Il peut s'agir d'une `string`
ou un `object` comme décrit ci-dessous.
- L'argument `status` définit le [code de retour HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status).

Par défaut, le corps de la réponse JSON contient deux propriétés :

- `statusCode`: prend par défaut le code de retour HTTP fourni dans l'argument `status`.
- `message`: une brève description de l'erreur HTTP basée sur le `status`.

Pour surcharger uniquement la partie message du corps de la réponse JSON, fournissez une chaîne de caractères
dans l'argument `response`. Pour surcharger tout le corps de la réponse JSON, passez un objet dans l'argument `response`. Nest sérialisera l'objet et le retournera en tant que corps de réponse JSON.

Le second argument du constructeur - `status` - doit être un code de statut HTTP valide.
La meilleure pratique est d'utiliser l'enum `HttpStatus` importée de `@nestjs/common`.

Il y a un **troisième** argument du constructeur (optionnel) - `options` - qui peut être utilisé pour fournir une [cause](https://nodejs.org/en/blog/release/v16.9.0/#error-cause) d'erreur. Cet objet `cause` n'est pas sérialisé dans l'objet réponse, mais il peut être utile à des fins de journalisation, en fournissant des informations précieuses sur l'erreur interne qui a causé la levée de la `HttpException`.

Voici un exemple de surcharge de l'ensemble du corps de la réponse et d'indication de la cause de l'erreur :

```typescript
@@filename(cats.controller)
@Get()
async findAll() {
  try {
    await this.service.findAll()
  } catch (error) {
    throw new HttpException({
      status: HttpStatus.FORBIDDEN,
      error: 'This is a custom message',
    }, HttpStatus.FORBIDDEN, {
      cause: error
    });
  }
}
```

En utilisant ce qui précède, voici à quoi ressemblerait la réponse :

```json
{
  "status": 403,
  "error": "This is a custom message"
}
```

#### Exceptions personnalisées

Dans la plupart des cas, vous n'aurez pas besoin d'écrire des exceptions personnalisées, et vous pourrez utiliser l'exception HTTP Nest intégrée, comme décrit dans la section suivante. Si vous avez besoin de créer des exceptions personnalisées, c'est une bonne pratique de créer votre propre **hiérarchie d'exceptions**, où vos exceptions personnalisées héritent de la classe de base `HttpException`. Avec cette approche, Nest reconnaîtra vos exceptions, et s'occupera automatiquement des réponses d'erreur. Implémentons une telle exception personnalisée :

```typescript
@@filename(forbidden.exception)
export class ForbiddenException extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}
```

Puisque `ForbiddenException` étend la base `HttpException`, elle fonctionnera de manière transparente avec le gestionnaire d'exception intégré, et nous pouvons donc l'utiliser dans la méthode `findAll()`.

```typescript
@@filename(cats.controller)
@Get()
async findAll() {
  throw new ForbiddenException();
}
```

#### Exceptions HTTP intégrées

Nest fournit un ensemble d'exceptions standard qui héritent de la base `HttpException`. Celles-ci sont exposées à partir du package `@nestjs/common`, et représentent la plupart des exceptions HTTP les plus courantes :

- `BadRequestException`
- `UnauthorizedException`
- `NotFoundException`
- `ForbiddenException`
- `NotAcceptableException`
- `RequestTimeoutException`
- `ConflictException`
- `GoneException`
- `HttpVersionNotSupportedException`
- `PayloadTooLargeException`
- `UnsupportedMediaTypeException`
- `UnprocessableEntityException`
- `InternalServerErrorException`
- `NotImplementedException`
- `ImATeapotException`
- `MethodNotAllowedException`
- `BadGatewayException`
- `ServiceUnavailableException`
- `GatewayTimeoutException`
- `PreconditionFailedException`

Toutes les exceptions intégrées peuvent également fournir une `cause` et une description de l'erreur en utilisant le paramètre `options` :

```typescript
throw new BadRequestException('Something bad happened', {
  cause: new Error(),
  description: 'Some error description',
});
```

Voici comment se présenterait la réponse :

```json
{
  "message": "Something bad happened",
  "error": "Some error description",
  "statusCode": 400
}
```

#### Filtres d'exception

Bien que le filtre d'exception de base (intégré) puisse gérer automatiquement de nombreux cas pour vous, vous pouvez vouloir **un contrôle total** sur la couche d'exceptions. Par exemple, vous pouvez vouloir ajouter la journalisation ou utiliser un schéma JSON différent en fonction de certains facteurs dynamiques. Les **filtres d'exceptions** sont conçus exactement dans ce but. Ils vous permettent de contrôler le flux exact de contrôle et le contenu de la réponse renvoyée au client.

Créons un filtre d'exception qui est responsable de la capture des exceptions qui sont une instance de la classe `HttpException`, et de l'implémentation d'une logique de réponse personnalisée pour ces exceptions. Pour ce faire, nous aurons besoin d'accéder aux objets `Request` et `Response` de la plateforme sous-jacente. Nous allons accéder à l'objet `Request` afin de pouvoir extraire l' `url` original et l'inclure dans les informations de logging. Nous allons utiliser l'objet `Response` pour prendre le contrôle direct de la réponse qui est envoyée, en utilisant la méthode `response.json()`.

```typescript
@@filename(http-exception.filter)
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
@@switch
import { Catch, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
```

> info **Astuce** Tous les filtres d'exception doivent implémenter l'interface générique `ExceptionFilter<T>`. Cela vous oblige à fournir la méthode `catch(exception : T, host : ArgumentsHost)` avec la signature indiquée. `T` indique le type de l'exception.

> warning **Attention** Si vous utilisez `@nestjs/platform-fastify`, vous pouvez utiliser `response.send()` au lieu de `response.json()`. N'oubliez pas d'importer les bons types de `fastify`.

Le décorateur `@Catch(HttpException)` lie les métadonnées requises au filtre d'exception, indiquant à Nest que ce filtre particulier recherche des exceptions de type `HttpException` et rien d'autre. Le décorateur `@Catch()` peut prendre un seul paramètre, ou une liste séparée par des virgules. Cela vous permet de configurer le filtre pour plusieurs types d'exceptions à la fois.

#### ArgumentsHost

Examinons les paramètres de la méthode `catch()`. Le paramètre `exception` est l'objet d'exception en cours de traitement. Le paramètre `host` est un objet `ArgumentsHost`. L'objet `ArgumentsHost` est un puissant objet utilitaire que nous examinerons plus en détail dans le [chapitre sur le contexte d'exécution](/fundamentals/execution-context)\*. Dans cet exemple de code, nous l'utilisons pour obtenir une référence aux objets `Request` et `Response` qui sont passés au gestionnaire de requête original (dans le contrôleur d'où provient l'exception). Dans cet exemple de code, nous avons utilisé quelques méthodes d'aide sur `ArgumentsHost` pour obtenir les objets `Request` et `Response` désirés. Pour en savoir plus sur `ArgumentsHost`, [cliquez ici](/fundamentals/execution-context).

\*La raison de ce niveau d'abstraction est que `ArgumentsHost` fonctionne dans tous les contextes (par exemple, le contexte du serveur HTTP avec lequel nous travaillons maintenant, mais aussi les Microservices et les WebSockets). Dans le chapitre sur le contexte d'exécution, nous verrons comment nous pouvons accéder aux <a href="/fundamentals/execution-context#arguments-du-gestionnaire-dhôte">arguments sous-jacents</a> appropriés pour **n'importe quel** contexte d'exécution grâce à la puissance de `ArgumentsHost` et de ses fonctions d'aide. Cela nous permettra d'écrire des filtres d'exception génériques qui fonctionnent dans tous les contextes.

<app-banner-courses></app-banner-courses>

#### Filtres de liaison

Lions notre nouveau `HttpExceptionFilter` à la méthode `create()` du `CatsController`.

```typescript
@@filename(cats.controller)
@Post()
@UseFilters(new HttpExceptionFilter())
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
@@switch
@Post()
@UseFilters(new HttpExceptionFilter())
@Bind(Body())
async create(createCatDto) {
  throw new ForbiddenException();
}
```

> info **Astuce** Le décorateur `@UseFilters()` est importé du package `@nestjs/common`.

Nous avons utilisé le décorateur `@UseFilters()` ici. Similaire au décorateur `@Catch()`, il peut prendre une seule instance de filtre, ou une liste d'instances de filtres séparées par des virgules. Ici, nous avons créé l'instance de `HttpExceptionFilter` en place. Alternativement, vous pouvez passer la classe (au lieu d'une instance), laissant la responsabilité de l'instanciation au framework, et permettant **l'injection de dépendance**.

```typescript
@@filename(cats.controller)
@Post()
@UseFilters(HttpExceptionFilter)
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
@@switch
@Post()
@UseFilters(HttpExceptionFilter)
@Bind(Body())
async create(createCatDto) {
  throw new ForbiddenException();
}
```

> info **Astuce** Préférez appliquer des filtres en utilisant des classes plutôt que des instances lorsque c'est possible. Cela réduit l'utilisation de la **mémoire** puisque Nest peut facilement réutiliser des instances de la même classe dans l'ensemble de votre module.

Dans l'exemple ci-dessus, le `HttpExceptionFilter` est appliqué uniquement au gestionnaire de route `create()`, ce qui en fait un filtre de méthode. Les filtres d'exception peuvent être définis à différents niveaux : méthode de contrôleur/résolveur/gateway, contrôleur ou global. Par exemple, pour configurer un filtre à l'échelle du contrôleur, vous devez faire ce qui suit :

```typescript
@@filename(cats.controller)
@UseFilters(new HttpExceptionFilter())
export class CatsController {}
```

Cette construction met en place le `HttpExceptionFilter` pour chaque gestionnaire de route défini à l'intérieur du `CatsController`.

Pour créer un filtre global, vous devez procéder comme suit :

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> warning **Attention** La méthode `useGlobalFilters()` ne configure pas les filtres pour les passerelles ou les applications hybrides.

Les filtres à portée globale sont utilisés dans toute l'application, pour chaque contrôleur et chaque gestionnaire de route. En termes d'injection de dépendances, les filtres globaux enregistrés en dehors de tout module (avec `useGlobalFilters()` comme dans l'exemple ci-dessus) ne peuvent pas injecter de dépendances puisque cela est fait en dehors du contexte de tout module. Afin de résoudre ce problème, vous pouvez enregistrer un filtre global **directement depuis n'importe quel module** en utilisant la construction suivante :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

> info **Astuce** Lorsque vous utilisez cette approche pour réaliser l'injection de dépendances pour le filtre, notez que quel que soit le module dans lequel cette construction est employée, le filtre est, en fait, global. Où cela doit-il être fait ? Choisissez le module où le filtre (`HttpExceptionFilter` dans l'exemple ci-dessus) est défini. De plus, `useClass` n'est pas la seule façon de gérer l'enregistrement de fournisseurs personnalisés. Apprenez-en plus [ici](/fundamentals/custom-providers).

Cette technique permet d'ajouter autant de filtres que nécessaire ; il suffit d'ajouter chacun d'entre eux au tableau des fournisseurs.

#### Tout capturer

Afin de capturer **toutes** les exceptions non gérées (quel que soit le type d'exception), laissez la liste des paramètres du décorateur `@Catch()` vide, par exemple, `@Catch()`.

Dans l'exemple ci-dessous, nous avons un code qui est agnostique car il utilise l'[adaptateur HTTP](./faq/http-adapter) pour délivrer la réponse, et n'utilise aucun des objets spécifiques à la plateforme (`Request` et `Response`) directement :

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
```

> warning **Attention** Lorsque l'on combine un filtre d'exception qui attrape tout avec un filtre lié à un type spécifique, le filtre "attrape tout" doit être déclaré en premier pour permettre au filtre spécifique de gérer correctement le type lié.

#### Héritage

En règle générale, vous créez des filtres d'exception entièrement personnalisés, conçus pour répondre aux exigences de votre application. Cependant, il peut arriver que vous souhaitiez simplement étendre le **filtre d'exception global** intégré par défaut et modifier son comportement en fonction de certains facteurs.

Pour déléguer le traitement des exceptions au filtre de base, vous devez étendre `BaseExceptionFilter` et appeler la méthode `catch()` héritée.

```typescript
@@filename(all-exceptions.filter)
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception, host) {
    super.catch(exception, host);
  }
}
```

> warning **Attention** Les filtres à portée de méthode et à portée de contrôleur qui étendent le `BaseExceptionFilter` ne doivent pas être instanciés avec `new`. A la place, laissez le framework les instancier automatiquement.

Les filtres globaux **peuvent** étendre le filtre de base. Cela peut se faire de deux manières.

La première méthode consiste à injecter la référence `HttpAdapter` lors de l'instanciation du filtre global personnalisé :

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

La seconde méthode consiste à utiliser le jeton `APP_FILTER` <a href="exception-filters#filtres-de-liaison">comme indiqué ici</a>.
