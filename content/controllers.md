### Contrôleurs

Les contrôleurs sont chargés de traiter les **requêtes** entrantes et de renvoyer les **réponses** au client.

<figure><img src="/assets/Controllers_1.png" /></figure>

L'objectif d'un contrôleur est de recevoir des requêtes spécifiques pour l'application. Le mécanisme de **routage** permet de contrôler quel contrôleur reçoit quelles requêtes. Souvent, chaque contrôleur possède plus d'une route, et les différentes routes peuvent effectuer des actions différentes.

Pour créer un contrôleur de base, nous utilisons des classes et des **décorateurs**. Les décorateurs associent les classes aux métadonnées requises et permettent à Nest de créer une carte de routage (reliant les requêtes aux contrôleurs correspondants).

> info **Astuce** Pour créer rapidement un contrôleur CRUD avec la [validation](/techniques/validation) intégrée, vous pouvez utiliser le [générateur CRUD](/recipes/crud-generator#crud-generator) de la CLI: `nest g resource [nom]`.

#### Routage

Dans l'exemple suivant, nous allons utiliser le décorateur `@Controller()`, qui est **nécessaire** pour définir un contrôleur de base. Nous allons spécifier un préfixe de chemin de route optionnel de `cats`. L'utilisation d'un préfixe de chemin dans un décorateur `@Controller()` nous permet de regrouper facilement un ensemble de routes liées, et de minimiser le code répétitif. Par exemple, nous pouvons choisir de regrouper un ensemble de routes qui gèrent les interactions avec une entité chat sous la route `/cats`. Dans ce cas, nous pourrions spécifier le préfixe de chemin `cats` dans le décorateur `@Controller()` afin de ne pas avoir à répéter cette partie du chemin pour chaque route dans le fichier.

```typescript
@@filename(cats.controller)
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
@@switch
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll() {
    return 'This action returns all cats';
  }
}
```

> info **Astuce** Pour créer un contrôleur à l'aide de la CLI, il suffit d'exécuter la commande `$ nest g controller [nom]`.

Le décorateur de méthode de requête HTTP `@Get()` avant la méthode `findAll()` indique à Nest de créer un handler pour un endpoint spécifique pour les requêtes HTTP. L'endpoint correspond à la méthode de requête HTTP (GET dans ce cas) et au chemin d'accès. Qu'est-ce que le chemin d'accès ? Le chemin d'accès d'un handler est déterminé en concaténant le préfixe (facultatif) déclaré pour le contrôleur et tout chemin spécifié dans le décorateur de la méthode. Puisque nous avons déclaré un préfixe pour chaque route ( `cats`), et que nous n'avons pas ajouté d'information sur le chemin dans le décorateur, Nest va faire correspondre les requêtes `GET /cats` à ce handler. Comme mentionné, le chemin inclut à la fois le préfixe optionnel du contrôleur **et** toute chaîne de chemin déclarée dans le décorateur de la méthode de requête. Par exemple, un préfixe de chemin `cats` combiné avec le décorateur `@Get('breed')` produira une route pour des requêtes comme `GET /cats/breed`.

Dans notre exemple ci-dessus, lorsqu'une requête GET est faite à ce point de terminaison, Nest route la requête vers notre méthode `findAll()` définie par l'utilisateur. Notez que le nom de la méthode que nous choisissons ici est complètement arbitraire. Nous devons évidemment déclarer une méthode à laquelle lier la route, mais Nest n'attache aucune importance au nom de la méthode choisie.

Cette méthode renverra un code de réponse 200 et la réponse associée, qui dans ce cas est juste une chaîne de caractères. Pourquoi cela se produit-il ? Pour l'expliquer, nous allons d'abord introduire le concept selon lequel Nest utilise deux options **différentes** pour manipuler les réponses :

<table>
  <tr>
    <td>Standard (recommandé)</td>
    <td>
      Grâce à cette méthode intégrée, lorsqu'un gestionnaire de requête renvoie un objet ou un tableau JavaScript, il sera <strong>automatiquement</strong> sérialisé en JSON. En revanche, lorsqu'il renvoie un type primitif JavaScript (par exemple, <code>string</code>, <code>number</code>, <code>boolean</code>), Nest envoie uniquement la valeur sans tenter de la sérialiser. Cela simplifie la gestion des réponses : il suffit de renvoyer la valeur et Nest s'occupe du reste.
      <br />
      <br /> De plus, le <strong>code d'état</strong> de la réponse est toujours 200 par défaut, sauf pour les requêtes POST qui utilisent 201. Nous pouvons facilement modifier ce comportement en ajoutant le décorateur <code>@HttpCode(...)</code>au niveau d'un handler (voir <a href='controllers#code-de-retour'>Codes d'état</a>).
    </td>
  </tr>
  <tr>
    <td>Spécifique à une bibliothèque</td>
    <td>
      Nous pouvons utiliser l'objet <a href="https://expressjs.com/en/api.html#res" rel="nofollow" target="_blank">response</a> spécifique à la bibliothèque (par exemple, Express), qui peut être injecté à l'aide du décorateur <code>@Res()</code> dans la signature du gestionnaire de méthode (par exemple, <code>findAll(@Res() response)</code>). Cette approche vous permet d'utiliser les méthodes natives de gestion des réponses exposées par cet objet. Par exemple, avec Express, vous pouvez construire des réponses en utilisant un code tel que <code>response.status(200).send()</code>.
    </td>
  </tr>
</table>

> warning **Attention** Nest détecte quand le handler utilise soit `@Res()` soit `@Next()`, indiquant que vous avez choisi l'option spécifique à la bibliothèque. Si les deux approches sont utilisées en même temps, l'approche standard est **automatiquement désactivée** pour cette seule route et ne fonctionnera plus comme prévu. Pour utiliser les deux approches en même temps (par exemple, en injectant l'objet response pour définir uniquement les cookies/headers mais en laissant le reste au framework), vous devez mettre l'option `passthrough` à `true` dans le décorateur `@Res({{ '{' }} passthrough : true {{ '}' }})`.

<app-banner-devtools></app-banner-devtools>

#### L'objet requête

Les handlers ont souvent besoin d'accéder aux détails de la **requête** du client. Nest fournit un accès à l'objet [request](https://expressjs.com/en/api.html#req) de la plateforme sous-jacente (Express par défaut). Nous pouvons accéder à l'objet de requête en demandant à Nest de l'injecter en ajoutant le décorateur `@Req()` à la signature du handler.

```typescript
@@filename(cats.controller)
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(@Req() request: Request): string {
    return 'This action returns all cats';
  }
}
@@switch
import { Controller, Bind, Get, Req } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  @Bind(Req())
  findAll(request) {
    return 'This action returns all cats';
  }
}
```

> info **Astuce** Afin de profiter des typages d'`express` (comme dans l'exemple du paramètre `request : Request` ci-dessus), installez le paquet `@types/express`.

L'objet request représente la requête HTTP et possède des propriétés pour la chaîne de requête, les paramètres, les en-têtes HTTP et le corps de la requête (en savoir plus [ici](https://expressjs.com/en/api.html#req)). Dans la plupart des cas, il n'est pas nécessaire de saisir ces propriétés manuellement. Nous pouvons utiliser des décorateurs dédiés à la place, comme `@Body()` ou `@Query()`, qui sont disponibles d'emblée. Vous trouverez ci-dessous une liste des décorateurs fournis et des objets spécifiques à la plate-forme qu'ils représentent.

<table>
  <tbody>
    <tr>
      <td><code>@Request(), @Req()</code></td>
      <td><code>req</code></td></tr>
    <tr>
      <td><code>@Response(), @Res()</code><span class="table-code-asterisk">*</span></td>
      <td><code>res</code></td>
    </tr>
    <tr>
      <td><code>@Next()</code></td>
      <td><code>next</code></td>
    </tr>
    <tr>
      <td><code>@Session()</code></td>
      <td><code>req.session</code></td>
    </tr>
    <tr>
      <td><code>@Param(key?: string)</code></td>
      <td><code>req.params</code> / <code>req.params[key]</code></td>
    </tr>
    <tr>
      <td><code>@Body(key?: string)</code></td>
      <td><code>req.body</code> / <code>req.body[key]</code></td>
    </tr>
    <tr>
      <td><code>@Query(key?: string)</code></td>
      <td><code>req.query</code> / <code>req.query[key]</code></td>
    </tr>
    <tr>
      <td><code>@Headers(name?: string)</code></td>
      <td><code>req.headers</code> / <code>req.headers[name]</code></td>
    </tr>
    <tr>
      <td><code>@Ip()</code></td>
      <td><code>req.ip</code></td>
    </tr>
    <tr>
      <td><code>@HostParam()</code></td>
      <td><code>req.hosts</code></td>
    </tr>
  </tbody>
</table>

<sup>\* </sup>Pour des raisons de compatibilité avec les typages des plateformes HTTP sous-jacentes (par exemple, Express et Fastify), Nest fournit les décorateurs `@Res()` et `@Response()`. `@Res()` est simplement un alias de `@Response()`. Tous deux exposent directement l'interface objet `response` de la plateforme native sous-jacente. Lorsque vous les utilisez, vous devriez également importer les typages de la bibliothèque sous-jacente (par exemple, `@types/express`) pour en tirer le meilleur parti. Notez que lorsque vous injectez `@Res()` ou `@Response()` dans un handler de méthode, vous mettez Nest en **mode spécifique à la bibliothèque** pour ce handler, et vous devenez responsable de la gestion de la réponse. En faisant cela, vous devez émettre une sorte de réponse en faisant un appel à l'objet `response` (par exemple, `res.json(...)` ou `res.send(...)`), ou le serveur HTTP se bloquera.

> info **Astuce** Pour apprendre à créer vos propres décorateurs personnalisés, consultez [ce chapitre](/custom-decorators).

#### Ressources

Plus tôt, nous avons défini un point d'accès pour récupérer la ressource "chats" (route **GET**). En général, nous voudrons également fournir un point de terminaison qui crée de nouveaux enregistrements. Pour cela, créons le handler **POST** :

```typescript
@@filename(cats.controller)
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(): string {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
@@switch
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create() {
    return 'This action adds a new cat';
  }

  @Get()
  findAll() {
    return 'This action returns all cats';
  }
}
```

C'est aussi simple que cela. Nest fournit des décorateurs pour toutes les méthodes HTTP standard : `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`, `@Options()`, et `@Head()`. De plus, `@All()` définit un point de terminaison qui les gère tous.

#### Jokers de route

Les routes basés sur des motifs sont également pris en charge. Par exemple, l'astérisque est utilisé comme joker et correspondra à n'importe quelle combinaison de caractères.

```typescript
@Get('ab*cd')
findAll() {
  return 'Cette route utilise un joker';
}
```

Le chemin d'accès `'ab*cd'` correspondra à `abcd`, `ab_cd`, `abecd`, et ainsi de suite. Les caractères `?`, `+`, `*`, et `()` peuvent être utilisés dans un chemin d'accès, et sont des sous-ensembles de leurs expressions régulières correspondantes. Le trait d'union ( `-`) et le point (`.`) sont interprétés littéralement par les chemins basés sur des chaînes de caractères.

> warning **Attention** Un joker au milieu de l'itinéraire n'est pris en charge que par express.

#### Code de retour

Comme mentionné, le **code de retour** de la réponse est toujours **200** par défaut, sauf pour les requêtes POST qui sont **201**. Nous pouvons facilement changer ce comportement en ajoutant le décorateur `@HttpCode(...)` au niveau du handler.

```typescript
@Post()
@HttpCode(204)
create() {
  return 'This action adds a new cat';
}
```

> info **Astuce** Importez `HttpCode` depuis le paquet `@nestjs/common`.

Souvent, votre code de retour n'est pas statique mais dépend de différents facteurs. Dans ce cas, vous pouvez utiliser un objet **réponse** (injecté à l'aide de `@Res()`) spécifique à la bibliothèque (ou, en cas d'erreur, lancer une exception).

#### En-têtes

Pour spécifier un en-tête de réponse personnalisé, vous pouvez utiliser un décorateur `@Header()` ou un objet de réponse spécifique à la bibliothèque (et appeler `res.header()` directement).

```typescript
@Post()
@Header('Cache-Control', 'none')
create() {
  return 'This action adds a new cat';
}
```

> info **Astuce** Importez `Header` depuis le paquet `@nestjs/common`.

#### Redirection

Pour rediriger une réponse vers une URL spécifique, vous pouvez utiliser un décorateur `@Redirect()` ou un objet de réponse spécifique à la bibliothèque (et appeler directement `res.redirect()`).

`@Redirect()` prend deux arguments, `url` et `statusCode`, tous deux optionnels. La valeur par défaut de `statusCode` est `302` (`Found`) si elle est omise.

```typescript
@Get()
@Redirect('https://nestjs.com', 301)
```

> info **Astuce** Il peut arriver que vous souhaitiez déterminer le code de retour HTTP ou l'URL de redirection de manière dynamique. Pour ce faire, renvoyez un objet suivant l'interface `HttpRedirectResponse` (issue de `@nestjs/common`).

Les valeurs retournées remplaceront tous les arguments passés au décorateur `@Redirect()`. Par exemple :

```typescript
@Get('docs')
@Redirect('https://docs.nestjs.com', 302)
getDocs(@Query('version') version) {
  if (version && version === '5') {
    return { url: 'https://docs.nestjs.com/v5/' };
  }
}
```

#### Routes paramétrées

Les routes avec des chemins statiques ne fonctionnent pas lorsque vous devez accepter des **données dynamiques** dans le cadre de la requête (par exemple, `GET /cats/1` pour obtenir le chat avec l'identifiant `1`). Afin de définir des routes avec des paramètres, nous pouvons ajouter des **jetons** de paramètres de route dans le chemin de la route pour capturer la valeur dynamique à cette position dans l'URL de la requête. Le paramètre de route jeton dans l'exemple du décorateur `@Get()` ci-dessous démontre cette utilisation. Les paramètres de route déclarés de cette manière peuvent être accédés en utilisant le décorateur `@Param()`, qui doit être ajouté à la signature de la méthode.

> info **Astuce** Les routes paramétrées doivent être déclarées après les chemins statiques. Cela empêche les chemins paramétrés d'intercepter le trafic destiné aux chemins statiques.

```typescript
@@filename()
@Get(':id')
findOne(@Param() params: any): string {
  console.log(params.id);
  return `This action returns a #${params.id} cat`;
}
@@switch
@Get(':id')
@Bind(Param())
findOne(params) {
  console.log(params.id);
  return `This action returns a #${params.id} cat`;
}
```

`@Param()` est utilisé pour décorer un paramètre de méthode (`params` dans l'exemple ci-dessus), et rend les paramètres de **route** disponibles en tant que propriétés de ce paramètre de méthode décoré à l'intérieur du corps de la méthode. Comme le montre le code ci-dessus, nous pouvons accéder au paramètre `id` en référençant `params.id`. Vous pouvez également passer un jeton de paramètre particulier au décorateur, puis référencer le paramètre de route directement par son nom dans le corps de la méthode.

> info **Hint** Importez `Param` depuis le paquet `@nestjs/common`.

```typescript
@@filename()
@Get(':id')
findOne(@Param('id') id: string): string {
  return `This action returns a #${id} cat`;
}
@@switch
@Get(':id')
@Bind(Param('id'))
findOne(id) {
  return `This action returns a #${id} cat`;
}
```

#### Routage de sous-domaine

Le décorateur `@Controller` peut prendre une option `host` pour exiger que l'hôte HTTP des requêtes entrantes corresponde à une valeur spécifique.

```typescript
@Controller({ host: 'admin.example.com' })
export class AdminController {
  @Get()
  index(): string {
    return 'Admin page';
  }
}
```

> **Attention** Comme **Fastify** ne supporte pas les routeurs imbriqués, lors de l'utilisation du routage par sous-domaine, l'adaptateur Express (par défaut) doit être utilisé à la place.

Similaire à une route `path`, l'option `hosts` peut utiliser des jetons pour capturer la valeur dynamique à cette position dans le nom de l'hôte. Le jeton de paramètre d'hôte dans l'exemple du décorateur `@Controller()` ci-dessous démontre cette utilisation. Les paramètres d'hôtes déclarés de cette manière peuvent être accédés en utilisant le décorateur `@HostParam()`, qui doit être ajouté à la signature de la méthode.

```typescript
@Controller({ host: ':account.example.com' })
export class AccountController {
  @Get()
  getInfo(@HostParam('account') account: string) {
    return account;
  }
}
```

#### Portées

Pour les personnes issues de différents langages de programmation, il peut être surprenant d'apprendre que dans Nest, presque tout est partagé entre les requêtes entrantes. Nous avons un pool de connexion à la base de données, des services singleton avec un état global, etc. N'oubliez pas que Node.js ne suit pas le modèle sans état multithreadé requête/réponse dans lequel chaque requête est traitée par un thread séparé. Par conséquent, l'utilisation d'instances singleton est totalement **sécurisée** pour nos applications.

Cependant, il existe des cas où la durée de vie du contrôleur basée sur les requêtes peut être le comportement souhaité, par exemple la mise en cache par requête dans les applications GraphQL, le suivi des requêtes ou la gestion multi-tenant. Apprenez à contrôler les portées [ici](/fundamentals/injection-scopes).

#### Asynchronicité

Nous aimons le JavaScript moderne et nous savons que l'extraction de données est principalement **asynchrone**. C'est pourquoi Nest supporte et fonctionne bien avec les fonctions `async`.

> info **Astuce** En savoir plus sur la fonctionnalité `async / await` [ici](https://kamilmysliwiec.com/typescript-2-1-introduction-async-await)

Chaque fonction asynchrone doit retourner une `Promise` (littéralement, une promesse). Cela signifie que vous pouvez renvoyer une valeur différée que Nest sera capable de résoudre par lui-même. Voyons un exemple :

```typescript
@@filename(cats.controller)
@Get()
async findAll(): Promise<any[]> {
  return [];
}
@@switch
@Get()
async findAll() {
  return [];
}
```

Le code ci-dessus est tout à fait valide. En outre, les gestionnaires de route Nest sont encore plus puissants car ils peuvent renvoyer des [flux observables](https://rxjs-dev.firebaseapp.com/guide/observable) RxJS. Nest s'abonnera automatiquement à la source sous-jacente et prendra la dernière valeur émise (une fois que le flux est terminé).

```typescript
@@filename(cats.controller)
@Get()
findAll(): Observable<any[]> {
  return of([]);
}
@@switch
@Get()
findAll() {
  return of([]);
}
```

Les deux approches ci-dessus fonctionnent et vous pouvez utiliser celle qui correspond à vos besoins.

#### Charges utiles de requêtes

Notre exemple précédent de handler de route POST n'acceptait aucun paramètre client. Corrigeons cela en ajoutant le décorateur `@Body()` ici.

Mais d'abord (si vous utilisez TypeScript), nous devons déterminer le schéma **DTO** (Data Transfer Object). Un DTO est un objet qui définit comment les données seront envoyées sur le réseau. Nous pouvons déterminer le schéma DTO en utilisant des interfaces **TypeScript** ou de simples classes. Il est intéressant de noter que nous recommandons ici l'utilisation de **classes**. Pourquoi ? Les classes font partie de la norme JavaScript ES6 et sont donc conservées en tant qu'entités réelles dans le JavaScript compilé. D'autre part, comme les interfaces TypeScript sont supprimées lors de la transpilation, Nest ne peut pas s'y référer à l'exécution. Ceci est important car des fonctionnalités telles que les **Pipes** offrent des possibilités supplémentaires lorsqu'elles ont accès au métatype de la variable au moment de l'exécution.

Créons la classe `CreateCatDto` :

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Il n'a que trois propriétés de base. Par la suite, nous pouvons utiliser le DTO nouvellement créé dans le `CatsController` :

```typescript
@@filename(cats.controller)
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  return 'This action adds a new cat';
}
@@switch
@Post()
@Bind(Body())
async create(createCatDto) {
  return 'This action adds a new cat';
}
```

> info **Astuce** Notre `ValidationPipe` peut filtrer les propriétés qui ne doivent pas être reçues par le handler de la méthode. Dans ce cas, nous pouvons établir une liste des propriétés acceptables, et toute propriété non incluse dans la liste est automatiquement retirée de l'objet résultant. Dans l'exemple `CreateCatDto`, notre liste est constituée des propriétés `name`, `age`, et `breed`. Pour en savoir plus [ici](/techniques/validation#stripping-properties).

#### Gestion des erreurs

Un chapitre distinct est consacré à la gestion des erreurs (c'est-à-dire aux exceptions) [ici](/exception-filters).

#### Exemple de ressource complète

Voici un exemple qui utilise plusieurs des décorateurs disponibles pour créer un contrôleur de base. Ce contrôleur expose quelques méthodes pour accéder aux données internes et les manipuler.

```typescript
@@filename(cats.controller)
import { Controller, Get, Query, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateCatDto, UpdateCatDto, ListAllEntities } from './dto';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Body() createCatDto: CreateCatDto) {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(@Query() query: ListAllEntities) {
    return `This action returns all cats (limit: ${query.limit} items)`;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `This action returns a #${id} cat`;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
    return `This action updates a #${id} cat`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `This action removes a #${id} cat`;
  }
}
@@switch
import { Controller, Get, Query, Post, Body, Put, Param, Delete, Bind } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  @Bind(Body())
  create(createCatDto) {
    return 'This action adds a new cat';
  }

  @Get()
  @Bind(Query())
  findAll(query) {
    console.log(query);
    return `This action returns all cats (limit: ${query.limit} items)`;
  }

  @Get(':id')
  @Bind(Param('id'))
  findOne(id) {
    return `This action returns a #${id} cat`;
  }

  @Put(':id')
  @Bind(Param('id'), Body())
  update(id, updateCatDto) {
    return `This action updates a #${id} cat`;
  }

  @Delete(':id')
  @Bind(Param('id'))
  remove(id) {
    return `This action removes a #${id} cat`;
  }
}
```

> info **Astuce** Nest CLI fournit un générateur ("schématique") qui génère automatiquement **tout le code de base** pour nous aider à éviter de faire tout cela, et rendre l'expérience du développeur beaucoup plus simple. En savoir plus sur cette fonctionnalité [ici](/recipes/crud-generator).

#### Se mettre en marche

Avec le contrôleur ci-dessus entièrement défini, Nest ne sait toujours pas que `CatsController` existe et par conséquent ne créera pas d'instance de cette classe.

Les contrôleurs appartiennent toujours à un module, c'est pourquoi nous incluons le tableau `controllers` dans le décorateur `@Module()`. Puisque nous n'avons pas encore défini d'autres modules que le module racine `AppModule`, nous allons l'utiliser pour introduire le contrôleur `CatsController` :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';

@Module({
  controllers: [CatsController],
})
export class AppModule {}
```

Nous avons attaché les métadonnées à la classe du module en utilisant le décorateur `@Module()`, et Nest peut maintenant facilement déterminer quels contrôleurs doivent être montés.

#### Approche spécifique aux bibliothèques

Jusqu'à présent, nous avons discuté de la manière standard de Nest de manipuler les réponses. La deuxième façon de manipuler la réponse est d'utiliser un objet [response](https://expressjs.com/en/api.html#res) spécifique à la bibliothèque. Pour injecter un objet de réponse particulier, nous devons utiliser le décorateur `@Res()`. Pour montrer les différences, réécrivons le `CatsController` comme suit :

```typescript
@@filename()
import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Res() res: Response) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  findAll(@Res() res: Response) {
     res.status(HttpStatus.OK).json([]);
  }
}
@@switch
import { Controller, Get, Post, Bind, Res, Body, HttpStatus } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  @Bind(Res(), Body())
  create(res, createCatDto) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  @Bind(Res())
  findAll(res) {
     res.status(HttpStatus.OK).json([]);
  }
}
```

Bien que cette approche fonctionne, et permette en fait une plus grande flexibilité à certains égards en offrant un contrôle total de l'objet de la réponse (manipulation des en-têtes, caractéristiques propres à la bibliothèque, et autres), il convient de l'utiliser avec précaution. En général, l'approche est beaucoup moins claire et présente certains inconvénients. Le principal inconvénient est que votre code devient dépendant de la plate-forme (car les bibliothèques sous-jacentes peuvent avoir des API différentes sur l'objet response), et plus difficile à tester (vous devrez simuler l'objet response, etc.).

De plus, dans l'exemple ci-dessus, vous perdez la compatibilité avec les fonctionnalités de Nest qui dépendent de la gestion des réponses standard de Nest, comme les Intercepteurs et les décorateurs `@HttpCode()` / `@Header()`. Pour corriger cela, vous pouvez mettre l'option `passthrough` à `true`, comme suit :

```typescript
@@filename()
@Get()
findAll(@Res({ passthrough: true }) res: Response) {
  res.status(HttpStatus.OK);
  return [];
}
@@switch
@Get()
@Bind(Res({ passthrough: true }))
findAll(res) {
  res.status(HttpStatus.OK);
  return [];
}
```

Vous pouvez maintenant interagir avec l'objet de réponse natif (par exemple, définir des cookies ou des en-têtes en fonction de certaines conditions), mais laisser le reste au cadre.