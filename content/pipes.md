### Pipes

Un pipe est une classe annotée avec le décorateur `@Injectable()`, qui implémente l'interface `PipeTransform`.

<figure>
  <img src="/assets/Pipe_1.png" />
</figure>

Les pipes ont deux cas d'utilisation typiques :

- **transformation**: transformer les données d'entrée dans la forme souhaitée (par exemple, d'une chaîne de caractères à un nombre entier)
- **validation**: évalue les données d'entrée et, si elles sont valides, les transmet sans modification ; dans le cas contraire, lance une exception

Dans les deux cas, les pipes opèrent sur les `arguments` traités par un <a href="controllers#routes-paramétrées">contrôleur gestionnaire de route</a>. Nest interpose un pipe juste avant l'invocation d'une méthode, et le pipe reçoit les arguments destinés à la méthode et opère sur eux. Toute opération de transformation ou de validation a lieu à ce moment-là, après quoi le gestionnaire de route est invoqué avec tous les arguments (potentiellement) transformés.

Nest est livré avec un certain nombre de pipes intégrés que vous pouvez utiliser immédiatement. Vous pouvez également créer vos propres pipes. Dans ce chapitre, nous allons présenter les pipes intégrés et montrer comment les lier à des gestionnaires de routes. Nous examinerons ensuite plusieurs pipes personnalisés afin de montrer comment vous pouvez en créer un à partir de zéro.

> info **Astuce** Les pipes fonctionnent à l'intérieur de la zone d'exceptions. Cela signifie que lorsqu'un pipe lève une exception, celle-ci est traitée par la couche d'exceptions (filtre d'exceptions global et tous les [filtres d'exceptions](/exception-filters) appliqués au contexte actuel). Compte tenu de ce qui précède, il devrait être clair que lorsqu'une exception est levée dans un pipe, aucune méthode de contrôleur n'est exécutée par la suite. Vous disposez ainsi d'une technique de meilleure pratique pour valider les données provenant de sources externes qui entrent dans l'application à la frontière du système.

#### Pipes intégrés

Nest est livré avec neuf pipes prêtes à l'emploi :

- `ValidationPipe`
- `ParseIntPipe`
- `ParseFloatPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`
- `ParseEnumPipe`
- `DefaultValuePipe`
- `ParseFilePipe`

Ils sont exportés depuis le package `@nestjs/common`.

Jetons un coup d'oeil rapide à l'utilisation de `ParseIntPipe`. C'est un exemple du cas d'utilisation **transformation**, où le pipe s'assure que le paramètre d'une méthode est converti en un entier JavaScript (ou lève une exception si la conversion échoue). Plus loin dans ce chapitre, nous montrerons une implémentation personnalisée simple pour un `ParseIntPipe`. Les techniques d'exemple ci-dessous s'appliquent également aux autres pipes de transformation intégrés (`ParseBoolPipe`, `ParseFloatPipe`, `ParseEnumPipe`, `ParseArrayPipe` et `ParseUUIDPipe`, auxquels nous nous référerons comme les pipes `Parse*` dans ce chapitre).

#### Liaison de pipes

Pour utiliser un pipe, nous devons lier une instance de la classe pipe au contexte approprié. Dans notre exemple `ParseIntPipe`, nous voulons associer le pipe à une méthode particulière de traitement de route, et nous assurer qu'il s'exécute avant que la méthode ne soit appelée. Nous le faisons avec la construction suivante, que nous appellerons "lier le pipe" au niveau des paramètres de la méthode :

```typescript
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

Cela garantit que l'une des deux conditions suivantes est vraie : soit le paramètre que nous recevons dans la méthode `findOne()` est un nombre (comme prévu dans notre appel à `this.catsService.findOne()`), soit une exception est levée avant que le gestionnaire de route ne soit appelé.

Par exemple, supposons que la route s'appelle comme suit :

```bash
GET localhost:3000/abc
```

Nest va lever une exception comme celle-ci :

```json
{
  "statusCode": 400,
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request"
}
```

L'exception empêchera l'exécution du corps de la méthode `findOne()`.

Dans l'exemple ci-dessus, nous passons une classe (`ParseIntPipe`), et non une instance, laissant la responsabilité de l'instanciation au framework et permettant l'injection de dépendance. Comme pour les pipes et les guards, nous pouvons à la place passer une instance. Passer une instance est utile si nous voulons personnaliser le comportement du pipe intégré en lui passant des options :

```typescript
@Get(':id')
async findOne(
  @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
  id: number,
) {
  return this.catsService.findOne(id);
}
```

La liaison des autres pipes de transformation (tous les pipes **Parse\***) fonctionne de manière similaire. Ces pipes fonctionnent tous dans le contexte de la validation des paramètres de la route, des paramètres de la chaîne de requête et des valeurs du corps de la requête.

Par exemple, avec un paramètre de chaîne de requête :

```typescript
@Get()
async findOne(@Query('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

Voici un exemple d'utilisation de `ParseUUIDPipe` pour analyser un paramètre de type chaîne et valider s'il s'agit d'un UUID.

```typescript
@@filename()
@Get(':uuid')
async findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
  return this.catsService.findOne(uuid);
}
@@switch
@Get(':uuid')
@Bind(Param('uuid', new ParseUUIDPipe()))
async findOne(uuid) {
  return this.catsService.findOne(uuid);
}
```

> info **Astuce** Lorsque vous utilisez `ParseUIDPipe()` vous analysez les UUID en version 3, 4 ou 5, si vous n'avez besoin que d'une version spécifique de l'UUID vous pouvez passer une version dans les options du pipe.

Ci-dessus, nous avons vu des exemples de liaison des différents pipes intégrés de la famille `Parse*`. Lier les pipes de validation est un peu différent ; nous en discuterons dans la section suivante.

> info **Astuce** Voir également [Techniques de validation](/techniques/validation) pour des exemples détaillés de pipes de validation.

#### Pipes personnalisés

Comme nous l'avons mentionné, vous pouvez construire vos propres pipes. Bien que Nest fournisse un `ParseIntPipe` et un `ValidationPipe` intégrés et robustes, construisons des versions personnalisées simples de chacun d'entre eux à partir de zéro pour voir comment les pipes personnalisés sont construits.

Nous commençons avec un simple `ValidationPipe`. Initialement, nous lui ferons simplement prendre une valeur en entrée et retourner immédiatement la même valeur, se comportant comme une fonction d'identité.

```typescript
@@filename(validation.pipe)
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationPipe {
  transform(value, metadata) {
    return value;
  }
}
```

> info **Astuce** `PipeTransform<T, R>` est une interface générique qui doit être implémentée par tout pipe. L'interface générique utilise `T` pour indiquer le type de la `valeur` en entrée, et `R` pour indiquer le type de retour de la méthode `transform()`.

Chaque pipe doit implémenter la méthode `transform()` pour remplir le contrat de l'interface `PipeTransform`. Cette méthode a deux paramètres :

- `value`
- `metadata`

Le paramètre `value` est l'argument de la méthode en cours de traitement (avant qu'il ne soit reçu par la méthode de gestion de la route), et `metadata` est la métadonnée de l'argument de la méthode en cours de traitement. L'objet metadata possède les propriétés suivantes :

```typescript
export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: Type<unknown>;
  data?: string;
}
```

Ces propriétés décrivent l'argument en cours de traitement.

<table>
  <tr>
    <td>
      <code>type</code>
    </td>
    <td>Indique si l'argument est un corps
      <code>@Body()</code>, requête
      <code>@Query()</code>, paramètre
      <code>@Param()</code>, ou un paramètre personnalisé (en savoir plus)
      <a routerLink="/custom-decorators">ici</a>).</td>
  </tr>
  <tr>
    <td>
      <code>metatype</code>
    </td>
    <td>
      Fournit le métatype de l'argument, par exemple,
      <code>String</code>. Note : la valeur est
      <code>undefined</code> si vous omettez une déclaration de type dans la signature de la méthode du gestionnaire de route, ou si vous utilisez du JavaScript pur.
    </td>
  </tr>
  <tr>
    <td>
      <code>data</code>
    </td>
    <td>La chaîne transmise au décorateur, par exemple
      <code>@Body('string')</code>. La valeur est
      <code>undefined</code> si vous laissez la parenthèse du décorateur vide.</td>
  </tr>
</table>

> warning **Attention** Les interfaces TypeScript disparaissent lors de la transpilation. Ainsi, si le type d'un paramètre de méthode est déclaré comme une interface au lieu d'une classe, la valeur `metatype` sera `Object`.

#### Validation basée sur un schéma

Rendons notre pipe de validation un peu plus utile. Regardons de plus près la méthode `create()` du `CatsController`, où nous voudrions probablement nous assurer que l'objet post body est valide avant d'essayer d'exécuter notre méthode de service.

```typescript
@@filename()
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
async create(@Body() createCatDto) {
  this.catsService.create(createCatDto);
}
```

Concentrons-nous sur le paramètre `createCatDto` du corps. Son type est `CreateCatDto` :

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Nous voulons nous assurer que toute requête entrante vers la méthode create contient un corps valide. Nous devons donc valider les trois membres de l'objet `createCatDto`. Nous pourrions le faire à l'intérieur de la méthode de gestion de la route, mais ce n'est pas l'idéal car cela enfreindrait le **principe de la responsabilité unique** (SRP).

Une autre approche pourrait consister à créer une **classe de validateur** et à y déléguer la tâche. Cela présente l'inconvénient de devoir se souvenir d'appeler ce validateur au début de chaque méthode.

Pourquoi ne pas créer un middleware de validation ? Cela pourrait fonctionner, mais il n'est malheureusement pas possible de créer un ** middleware générique** qui puisse être utilisé dans tous les contextes de l'ensemble de l'application. En effet, le middleware ne connaît pas le **contexte d'exécution**, y compris le handler qui sera appelé et ses paramètres.

Bien entendu, c'est exactement le cas d'utilisation pour lequel les pipes sont conçus. Continuons donc à affiner notre pipe de validation.

<app-banner-courses></app-banner-courses>

#### Validation des schémas d'objets

Il existe plusieurs approches pour effectuer la validation des objets d'une manière propre et [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself). Une approche courante consiste à utiliser une validation basée sur le **schéma**. Essayons cette approche.

La bibliothèque [Zod](https://zod.dev/) vous permet de créer des schémas de manière simple, avec une API lisible. Construisons un pipe de validation qui utilise les schémas basés sur Zod.

Commencez par installer le package requis :

```bash
$ npm install --save zod
```

Dans l'exemple de code ci-dessous, nous créons une classe simple qui prend un schéma comme argument du constructeur. Nous appliquons ensuite la méthode `schema.parse()`, qui valide notre argument entrant par rapport au schéma fourni.

Comme indiqué précédemment, un **pipe de validation** renvoie la valeur inchangée ou lève une exception.

Dans la section suivante, vous verrez comment nous fournissons le schéma approprié pour une méthode de contrôleur donnée en utilisant le décorateur `@UsePipes()`. Ce faisant, nous rendons notre pipe de validation réutilisable dans tous les contextes, comme nous l'avions prévu.

```typescript
@@filename()
import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodObject } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}
@@switch
import { BadRequestException } from '@nestjs/common';

export class ZodValidationPipe {
  constructor(private schema) {}

  transform(value, metadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}

```

#### Liaison des pipes de validation

Plus tôt, nous avons vu comment lier des pipes de transformation (comme `ParseIntPipe` et le reste des pipes `Parse*`).

La liaison des pipes de validation est également très simple.

Dans ce cas, nous voulons lier le pipe au niveau de l'appel de la méthode. Dans notre exemple actuel, nous devons faire ce qui suit pour utiliser le `ZodValidationPipe` :

1. Créer une instance de `ZodValidationPipe`
2. Passer le schéma Zod spécifique au contexte dans le constructeur de classe du pipe.
3. Lier le pipe à la méthode

Exemple de schéma de Zod :

```typescript
import { z } from 'zod';

export const createCatSchema = z
  .object({
    name: z.string(),
    age: z.number(),
    breed: z.string(),
  })
  .required();

export type CreateCatDto = z.infer<typeof createCatSchema>;
```

Nous le faisons en utilisant le décorateur `@UsePipes()` comme indiqué ci-dessous :

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ZodValidationPipe(createCatSchema))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Bind(Body())
@UsePipes(new ZodValidationPipe(createCatSchema))
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Astuce** Le décorateur `@UsePipes()` est importé du package `@nestjs/common`.

> warning **Attention** La bibliothèque `zod` nécessite que la configuration `strictNullChecks` soit activée dans votre fichier `tsconfig.json`.

#### Valideur de classe

> warning **Attention** Les techniques présentées dans cette section requièrent TypeScript et ne sont pas disponibles si votre application est écrite en JavaScript classique.

Examinons une autre application de notre technique de validation.

Nest fonctionne bien avec la bibliothèque [class-validator](https://github.com/typestack/class-validator). Cette puissante bibliothèque vous permet d'utiliser une validation basée sur un décorateur. La validation basée sur un décorateur est extrêmement puissante, surtout lorsqu'elle est combinée avec les capacités **Pipe** de Nest puisque nous avons accès au `metatype` de la propriété traitée. Avant de commencer, nous devons installer les packages nécessaires :

```bash
$ npm i --save class-validator class-transformer
```

Une fois ces éléments installés, nous pouvons ajouter quelques décorateurs à la classe `CreateCatDto`. Nous voyons ici un avantage significatif de cette technique : la classe `CreateCatDto` reste la seule source de vérité pour le corps de notre objet Post (plutôt que d'avoir à créer une classe de validation séparée).

```typescript
@@filename(create-cat.dto)
import { IsString, IsInt } from 'class-validator';

export class CreateCatDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsString()
  breed: string;
}
```

> info **Astuce** Apprenez-en plus sur les décorateurs class-validator [ici](https://github.com/typestack/class-validator#usage).

Nous pouvons maintenant créer une classe `ValidationPipe` qui utilise ces annotations.

```typescript
@@filename(validation.pipe)
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

> info **Astuce** Pour rappel, vous n'avez pas à créer vous-même un pipe de validation générique, car le `ValidationPipe` est fourni par la version standard de Nest. Le `ValidationPipe` intégré offre plus d'options que l'exemple que nous avons construit dans ce chapitre, qui a été maintenu de manière basique pour illustrer le fonctionnement d'un pipe personnalisé. Vous pouvez trouver tous les détails, ainsi que de nombreux exemples ici.

> warning **Remarque** Nous avons utilisé la bibliothèque [class-transformer](https://github.com/typestack/class-transformer) ci-dessus, qui est créée par le même auteur que la bibliothèque **class-validator**, et par conséquent, elles fonctionnent très bien ensemble.

Passons en revue ce code. Tout d'abord, notez que la méthode `transform()` est marquée comme `asynchrone`. Ceci est possible parce que Nest supporte à la fois les pipes synchrones et **asynchrones**. Nous rendons cette méthode `async` parce que certaines des validations du class-validator [peuvent être asynchrones](https://github.com/typestack/class-validator#custom-validation-classes) (utilise les promesses).

Notez ensuite que nous utilisons la déstructuration pour extraire le champ metatype (en extrayant uniquement ce membre d'une `ArgumentMetadata`) dans notre paramètre `metatype`. C'est juste un raccourci pour obtenir l'objet `ArgumentMetadata` en entier et ensuite avoir une déclaration supplémentaire pour assigner la variable metatype.

Ensuite, notons la fonction d'aide `toValidate()`. Elle est chargée de contourner l'étape de validation lorsque l'argument en cours de traitement est un type JavaScript natif (ces derniers ne peuvent pas avoir de décorateurs de validation attachés, il n'y a donc aucune raison de les faire passer par l'étape de validation).

Ensuite, nous utilisons la fonction de transformateur de classe `plainToInstance()` pour transformer notre objet argument JavaScript en un objet typé afin de pouvoir appliquer la validation. La raison pour laquelle nous devons faire cela est que le corps du message entrant, lorsqu'il est désérialisé à partir de la requête réseau, n'a **aucune information de type** (c'est la façon dont la plateforme sous-jacente, comme Express, fonctionne). Class-validator a besoin d'utiliser les décorateurs de validation que nous avons définis pour notre DTO plus tôt, nous devons donc effectuer cette transformation pour traiter le corps entrant comme un objet décoré de manière appropriée, et non comme un simple objet classique.

Enfin, comme indiqué précédemment, puisqu'il s'agit d'un **pipe de validation**, il renvoie la valeur inchangée ou lève une exception.

La dernière étape consiste à lier le `ValidationPipe`. Les pipes peuvent être à l'échelle du paramètre, de la méthode, du contrôleur ou de l'ensemble. Plus tôt, avec notre pipe de validation basé sur Zod, nous avons vu un exemple de liaison du pipe au niveau de la méthode.
Dans l'exemple ci-dessous, nous allons lier l'instance du pipe au décorateur `@Body()` du gestionnaire de route afin que notre pipe soit appelé pour valider le corps du message.

```typescript
@@filename(cats.controller)
@Post()
async create(
  @Body(new ValidationPipe()) createCatDto: CreateCatDto,
) {
  this.catsService.create(createCatDto);
}
```

Les pipes à portée de paramètre sont utiles lorsque la logique de validation ne concerne qu'un seul paramètre spécifié.

#### Pipes à portée globale

Puisque le `ValidationPipe` a été créé pour être aussi générique que possible, nous pouvons réaliser sa pleine utilité en le configurant comme un **pipe global** de sorte qu'il soit appliqué à chaque gestionnaire de route dans l'ensemble de l'application.

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

> warning **Remarque** Dans le cas des <a href="faq/hybrid-application">applications hybrides</a>, la méthode `useGlobalPipes()` ne configure pas les pipes pour les passerelles et les microservices. Pour les applications microservices "standard" (non hybrides), la méthode `useGlobalPipes()` configure les pipes de manière globale.

Les pipes globaux sont utilisés dans l'ensemble de l'application, pour chaque contrôleur et chaque gestionnaire de route.

Notez qu'en termes d'injection de dépendances, les pipes globaux enregistrés depuis l'extérieur d'un module (avec `useGlobalPipes()` comme dans l'exemple ci-dessus) ne peuvent pas injecter de dépendances puisque la liaison a été faite en dehors du contexte d'un module. Afin de résoudre ce problème, vous pouvez mettre en place un pipe global **directement depuis n'importe quel module** en utilisant la construction suivante :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

> info **Astuce** Lorsque vous utilisez cette approche pour réaliser l'injection de dépendances pour le pipe, notez que, quel que soit le module où cette construction est employée, le pipe est, en fait, global. Où cela doit-il être fait ? Choisissez le module où le pipe (`ValidationPipe` dans l'exemple ci-dessus) est défini. De plus, `useClass` n'est pas la seule façon de gérer l'enregistrement de fournisseurs personnalisés. Apprenez-en plus [ici](/fundamentals/custom-providers).

#### ValidationPipe intégré

Pour rappel, vous n'avez pas besoin de construire un pipe de validation générique par vous-même puisque le `ValidationPipe` est fourni par Nest. Le `ValidationPipe` intégré offre plus d'options que l'exemple que nous avons construit dans ce chapitre, qui a été gardé basique dans le but d'illustrer les mécanismes d'un pipe personnalisé. Vous pouvez trouver tous les détails, ainsi que de nombreux exemples [ici](/techniques/validation).

#### Cas d'application de la transformation

La validation n'est pas le seul cas d'utilisation des pipes personnalisés. Au début de ce chapitre, nous avons mentionné qu'un pipe peut aussi **transformer** les données d'entrée au format désiré. Ceci est possible parce que la valeur retournée par la fonction `transform` écrase complètement la valeur précédente de l'argument.

Quand est-ce utile ? Il arrive que les données transmises par le client doivent être modifiées, par exemple en convertissant une chaîne de caractères en un nombre entier, avant de pouvoir être traitées correctement par la méthode de traitement de l'itinéraire. En outre, certains champs de données obligatoires peuvent être manquants et nous aimerions appliquer des valeurs par défaut. Les **pipes de transformation** peuvent remplir ces fonctions en interposant une fonction de traitement entre la requête du client et le gestionnaire de la requête.

Voici un simple `ParseIntPipe` qui est responsable de l'analyse d'une chaîne de caractères en une valeur entière. (Comme indiqué plus haut, Nest a un `ParseIntPipe` intégré qui est plus sophistiqué ; nous l'incluons comme un exemple simple d'un pipe de transformation personnalisé).

```typescript
@@filename(parse-int.pipe)
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
@@switch
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe {
  transform(value, metadata) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
```

Nous pouvons ensuite lier ce pipe au paramètre sélectionné, comme indiqué ci-dessous :

```typescript
@@filename()
@Get(':id')
async findOne(@Param('id', new ParseIntPipe()) id) {
  return this.catsService.findOne(id);
}
@@switch
@Get(':id')
@Bind(Param('id', new ParseIntPipe()))
async findOne(id) {
  return this.catsService.findOne(id);
}
```

Un autre cas de transformation utile serait de sélectionner une **entité utilisateur existante** dans la base de données à l'aide d'un identifiant fourni dans la requête :

```typescript
@@filename()
@Get(':id')
findOne(@Param('id', UserByIdPipe) userEntity: UserEntity) {
  return userEntity;
}
@@switch
@Get(':id')
@Bind(Param('id', UserByIdPipe))
findOne(userEntity) {
  return userEntity;
}
```

Nous laissons l'implémentation de ce pipe au lecteur, mais notez que comme tous les autres pipes de transformation, il reçoit une valeur en entrée (un `id`) et retourne une valeur en sortie (un objet `UserEntity`). Cela peut rendre votre code plus déclaratif et [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) en abstrayant le code de base hors de votre handler et dans un pipe commun.

#### Fournir des valeurs par défaut

Les pipes `Parse*` s'attendent à ce que la valeur d'un paramètre soit définie. Ils lèvent une exception s'ils reçoivent des valeurs `null` ou `undefined`. Pour permettre à un endpoint de gérer les valeurs manquantes d'un paramètre de chaîne de requête, nous devons fournir une valeur par défaut à injecter avant que les pipes `Parse*` n'opèrent sur ces valeurs. Le `DefaultValuePipe` remplit cette fonction. Instanciez simplement un `DefaultValuePipe` dans le décorateur `@Query()` avant le pipe `Parse*` approprié, comme montré ci-dessous :

```typescript
@@filename()
@Get()
async findAll(
  @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly: boolean,
  @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
) {
  return this.catsService.findAll({ activeOnly, page });
}
```
