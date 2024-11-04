### Validation

Il est fortement recommandé de valider la véracité de toutes les données envoyées à une application web. Pour valider automatiquement les requêtes entrantes, Nest propose plusieurs pipes immédiatement prêts à l'emploi :

- `ValidationPipe`
- `ParseIntPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`

Le `ValidationPipe` utilise le puissant paquet [class-validator](https://github.com/typestack/class-validator) et ses décorateurs de validation déclaratifs. Le `ValidationPipe` offre une approche pratique pour appliquer des règles de validation à toutes les charges utiles (payloads) clients entrantes, où les règles spécifiques sont déclarées avec des annotations simples dans les déclarations de classe/DTO locales de chaque module.

#### Aperçu

Dans le chapitre sur les [Pipes](/pipes), nous avons parcouru le processus de construction de pipes simples et de leur liaison avec les contrôleurs, les méthodes ou avec l'application globale pour illustrer comment le processus fonctionne. Assurez-vous de revoir ce chapitre pour mieux comprendre les sujets de ce chapitre. Ici, nous allons nous concentrer sur divers cas d'utilisation du **monde réel** du `ValidationPipe`, et montrer comment utiliser certaines de ses fonctionnalités de personnalisation avancées.

#### Utilisation du ValidationPipe intégré

Pour commencer à l'utiliser, nous installons d'abord la dépendance requise.

```bash
$ npm i --save class-validator class-transformer
```

> info **Astuce** Le `ValidationPipe` est exporté du paquet `@nestjs/common`.

Comme ce pipe utilise les librairies [`class-validator`](https://github.com/typestack/class-validator) et [`class-transformer`](https://github.com/typestack/class-transformer), il y a beaucoup d'options disponibles. Vous configurez ces paramètres via un objet de configuration transmis au pipe. Voici les options intégrées disponibles :

```typescript
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}
```

En plus de celles-ci, toutes les options de `class-validator` (héritées de l'interface `ValidatorOptions`) sont disponibles :

<table>
  <tr>
    <th>Option</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>enableDebugMessages</code></td>
    <td><code>booléen</code></td>
    <td>Si défini sur true, le validateur affichera des messages d'avertissement supplémentaires dans la console lorsque quelque chose ne va pas.</td>
  </tr>
  <tr>
    <td><code>skipUndefinedProperties</code></td>
    <td><code>booléen</code></td>
    <td>Si défini sur true, le validateur ignorera la validation de toutes les propriétés qui sont indéfinies dans l'objet à valider.</td>
  </tr>
  <tr>
    <td><code>skipNullProperties</code></td>
    <td><code>booléen</code></td>
    <td>Si défini sur true, le validateur ignorera la validation de toutes les propriétés qui sont nulles dans l'objet à valider.</td>
  </tr>
  <tr>
    <td><code>skipMissingProperties</code></td>
    <td><code>booléen</code></td>
    <td>Si défini sur true, le validateur ignorera la validation de toutes les propriétés qui sont nulles ou indéfinies dans l'objet à valider.</td>
  </tr>
  <tr>
    <td><code>whitelist</code></td>
    <td><code>booléen</code></td>
    <td>Si défini sur true, le validateur supprimera de l'objet validé (retourné) toutes les propriétés qui n'utilisent pas de décorateurs de validation.</td>
  </tr>
  <tr>
    <td><code>forbidNonWhitelisted</code></td>
    <td><code>booléen</code></td>
    <td>Si défini sur true, au lieu de supprimer les propriétés non autorisées, le validateur lèvera une exception.</td>
  </tr>
  <tr>
    <td><code>forbidUnknownValues</code></td>
    <td><code>booléen</code></td>
    <td>Si défini sur true, les tentatives de validation d'objets inconnus échouent immédiatement.</td>
  </tr>
  <tr>
    <td><code>disableErrorMessages</code></td>
    <td><code>booléen</code></td>
    <td>Si défini sur true, les erreurs de validation ne seront pas renvoyées au client.</td>
  </tr>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td><code>nombre</code></td>
    <td>Ce paramètre vous permet de spécifier le type d'exception qui sera utilisé en cas d'erreur. Par défaut, il génère l'exception <code>BadRequestException</code>.</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td><code>Fonction</code></td>
    <td>Prend un tableau d'erreurs de validation et renvoie un objet d'exception.</td>
  </tr>
  <tr>
    <td><code>groups</code></td>
    <td><code>string[]</code></td>
    <td>Groupes à utiliser lors de la validation de l'objet.</td>
  </tr>
  <tr>
    <td><code>always</code></td>
    <td><code>booléen</code></td>
    <td>Défini la valeur par défaut pour l'option <code>always</code> des décorateurs. La valeur par défaut peut être remplacée dans les options du décorateur.</td>
  </tr>

  <tr>
    <td><code>strictGroups</code></td>
    <td><code>booléen</code></td>
    <td>Si <code>groups</code> n'est pas fourni ou est vide, ignore les décorateurs ayant au moins un groupe.</td>
  </tr>
  <tr>
    <td><code>dismissDefaultMessages</code></td>
    <td><code>booléen</code></td>
    <td>Si défini sur true, la validation n'utilisera pas les messages par défaut. Le message d'erreur sera toujours <code>undefined</code> s'il n'est pas défini explicitement.</td>
  </tr>
  <tr>
    <td><code>validationError.target</code></td>
    <td><code>booléen</code></td>
    <td>Indique si la cible doit être exposée dans <code>ValidationError</code>.</td>
  </tr>
  <tr>
    <td><code>validationError.value</code></td>
    <td><code>booléen</code></td>
    <td>Indique si la valeur validée doit être exposée dans <code>ValidationError</code>.</td>
  </tr>
  <tr>
    <td><code>stopAtFirstError</code></td>
    <td><code>booléen</code></td>
    <td>Lorsqu'il est défini sur true, la validation de la propriété donnée s'arrêtera après avoir rencontré la première erreur. Par défaut, il est défini sur false.</td>
  </tr>
</table>

> info **Remarque** Trouvez plus d'informations sur le paquet `class-validator` dans son [dépôt](https://github.com/typestack/class-validator).

#### Validation automatique

Nous commencerons par lier `ValidationPipe` au niveau de l'application, garantissant ainsi que tous endpoints sont protégés contre la réception de données incorrectes.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Pour tester notre pipe, créons un endpoint basique.

```typescript
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return 'This action adds a new user';
}
```

> info **Astuce** Étant donné que TypeScript ne stocke pas de métadonnées sur les **interfaces ou types génériques**, lorsque vous les utilisez dans vos DTO, `ValidationPipe` pourrait ne pas être en mesure de valider correctement les données entrantes. Pour cette raison, envisagez d'utiliser des classes concrètes dans vos DTO.

> info **Astuce** Lors de l'importation de vos DTO, vous ne pouvez pas utiliser une importation de type uniquement, car cela serait effacé à l'exécution, c'est-à-dire rappelez vous d'importer : `import {{ '{' }} CreateUserDto {{ '}' }}` au lieu de : `import type {{ '{' }} CreateUserDto {{ '}' }}`.

Maintenant, nous pouvons ajouter quelques règles de validation dans notre `CreateUserDto`. Nous le faisons en utilisant des décorateurs fournis par le paquet `class-validator`, décrits en détail [ici](https://github.com/typestack/class-validator#validation-decorators). De cette manière, toute route qui utilise le `CreateUserDto` appliquera automatiquement ces règles de validation.

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

Avec ces règles en place, si une requête atteint notre endpoint avec une propriété `email` invalide dans le corps de la requête, l'application répondra automatiquement avec un code `400 Bad Request`, ainsi qu'avec le corps de réponse suivant :

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email"]
}
```

En plus de valider les corps de requête, le `ValidationPipe` peut être utilisé avec d'autres propriétés de l'objet de requête. Imaginons que nous voulions accepter `:id` dans le chemin du endpoint. Pour garantir que seuls les nombres sont acceptés pour ce paramètre de requête, nous pouvons utiliser la construction suivante :

```typescript
@Get(':id')
findOne(@Param() params: FindOneParams) {
  return 'This action returns a user';
}
```

`FindOneParams`, tout comme un DTO, est simplement une classe qui définit des règles de validation en utilisant `class-validator`. Cela ressemblerait à ça :

```typescript
import { IsNumberString } from 'class-validator';

export class FindOneParams {
  @IsNumberString()
  id: number;
}
```

#### Désactivation des erreurs détaillées.

Les messages d'erreur peuvent être utiles pour expliquer ce qui était incorrect dans une requête. Cependant, certains environnements de production préfèrent désactiver les erreurs détaillées. Faites cela en passant un objet d'options au `ValidationPipe` :

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    disableErrorMessages: true,
  }),
);
```

En conséquence, les messages d'erreur détaillés ne seront pas affichés dans le corps de la réponse.

#### Exclusion de propriétés

Notre `ValidationPipe` peut également filtrer les propriétés qui ne devraient pas être reçues par le gestionnaire de méthode. Dans ce cas, nous pouvons mettre sur la **whitelist** les propriétés acceptables, et toute propriété non incluse dans la liste d'acceptation est automatiquement supprimée de l'objet résultant.Par exemple, si notre gestionnaire attend les propriétés `email` et `password` , mais qu'une requête inclut également une propriété `age`, cette propriété peut être automatiquement supprimée du DTO résultant. Pour activer ce comportement, définissez `whitelist` sur `true`.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
```

Lorsque cette valeur est définie sur true, cela supprimera automatiquement les propriétés non autorisées (celles sans aucun décorateur dans la classe de validation).

Alternativement, vous pouvez arrêter le traitement de la requête lorsque des propriétés non autorisées sont présentes, et renvoyer une réponse d'erreur à l'utilisateur. Pour activer cela, définissez la propriété `forbidNonWhitelisted` sur `true`, en combinaison avec le réglage de `whitelist` sur `true`.

<app-banner-courses></app-banner-courses>

#### Transformer les objets de charge utile (payloads)

Les charges utiles provenant du réseau sont des objets JavaScript simples. Le `ValidationPipe` peut automatiquement transformer les charges utiles en objets typés selon leurs classes de DTO. Pour activer la transformation automatique, définissez `transform` sur `true`. Cela peut être fait au niveau de la méthode :

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

Pour activer ce comportement au niveau global, définissez l'option sur un pipe global :

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
  }),
);
```

Avec l'option auto-transformation activée, le `ValidationPipe` effectuera également la conversion des types primitifs. Dans l'exemple suivant, la méthode `findOne()` prend un argument qui représente un paramètre d'extraction `id` du chemin :

```typescript
@Get(':id')
findOne(@Param('id') id: number) {
  console.log(typeof id === 'number'); // true
  return 'This action returns a user';
}
```

Par défaut, chaque paramètre de chemin et paramètre de requête arrive sur le réseau en tant que `string`. Dans l'exemple ci-dessus, nous avons spécifié le type `id` comme étant un `number` (dans la signature de la méthode). Par conséquent, le `ValidationPipe` tentera de convertir automatiquement un identifiant de type chaîne en un nombre.

#### Conversion explicite

Dans la section précédente, nous avons montré comment le `ValidationPipe` peut implicitement transformer les paramètres de requête et de chemin en fonction du type attendu. Cependant, cette fonctionnalité nécessite d'avoir la transformation automatique activée.

Alternativement (avec l'auto-transformation désactivée), vous pouvez caster explicitement les valeurs en utilisant `ParseIntPipe` ou `ParseBoolPipe` (notez que `ParseStringPipe` n'est pas nécessaire car, comme mentionné précédemment, chaque paramètre de chemin et de requête arrive sur le réseau en tant que `string` par défaut).

```typescript
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,
  @Query('sort', ParseBoolPipe) sort: boolean,
) {
  console.log(typeof id === 'number'); // true
  console.log(typeof sort === 'boolean'); // true
  return 'This action returns a user';
}
```

> info **Astuce** Le `ParseIntPipe` et le `ParseBoolPipe` sont exportés du paquet `@nestjs/common`.

#### Types mappés

Lorsque vous développez des fonctionnalités telles que **CRUD** (Create/Read/Update/Delete) il est souvent utile de construire des variantes d'un type d'entité de base. Nest fournit plusieurs fonctions utilitaires qui effectuent des transformations de type pour rendre cette tâche plus pratique.

> **Attention** Si votre application utilise le paquet `@nestjs/swagger`, consultez [ce chapitre](/openapi/mapped-types) pour plus d'informations sur les types mappés. De même, si vous utilisez le paquet `@nestjs/graphql`, consultez [ce chapitre](/graphql/mapped-types). Les deux packages reposent fortement sur les types et nécessitent donc une importation différente pour être utilisés. Par conséquent, si vous avez utilisé `@nestjs/mapped-types` (au lieu de celui approprié, soit `@nestjs/swagger` ou `@nestjs/graphql` en fonction du type de votre application), vous pourriez rencontrer divers effets secondaires non documentés.

Lors de la construction de types de validation d'entrée (également appelés DTO), il est souvent utile de créer des variations **create** et **update** du même type. Par exemple, la variante **create** peut nécessiter tous les champs, tandis que la variante **update** peut rendre tous les champs facultatifs.

Nest fournit la fonction utilitaire `PartialType()` pour faciliter cette tâche et réduire le code redondant.

La fonction `PartialType()` renvoie un type (classe) avec toutes les propriétés du type d'entrée définies comme facultatives. Par exemple, supposons que nous ayons un type **create** comme suit :

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Par défaut, tous ces champs sont obligatoires. Pour créer un type avec les mêmes champs, mais en les rendant tous facultatifs, utilisez `PartialType()` en passant la référence de classe (`CreateCatDto`) en argument :

```typescript
export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

> info **Astuce** La fonction `PartialType()` est importée depuis le package `@nestjs/mapped-types`.

La fonction `PickType()` construit un nouveau type (classe) en sélectionnant un ensemble de propriétés à partir d'un type d'entrée. Par exemple, supposons que nous commencions avec un type comme :

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Nous pouvons sélectionner un ensemble de propriétés de cette classe en utilisant la fonction utilitaire `PickType()` :

```typescript
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
```

> info **Astuce** La fonction `PickType()` est importée depuis le paquet `@nestjs/mapped-types`.

La fonction `OmitType()` construit un type en sélectionnant toutes les propriétés d'un type d'entrée, puis en supprimant un ensemble particulier de clés. Par exemple, supposons que nous commençons avec un type comme :

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Nous pouvons générer un type dérivé qui possède toutes les propriétés **sauf** `name` comme indiqué ci-dessous. Dans cette construction, le deuxième argument de `OmitType` est un tableau de noms de propriétés.

```typescript
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
```

> info **Astuce** La fonction `OmitType()` est importée depuis le paquet `@nestjs/mapped-types`.

La fonction `IntersectionType()` combine deux types en un nouveau type (classe). Par exemple, supposons que nous ayons deux types comme suit :

```typescript
export class CreateCatDto {
  name: string;
  breed: string;
}

export class AdditionalCatInfo {
  color: string;
}
```

Nous pouvons générer un nouveau type qui combine toutes les propriétés des deux types.

```typescript
export class UpdateCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
```

> info **Astuce** La fonction `IntersectionType()` est importée depuis le paquet `@nestjs/mapped-types`.

Les fonctions utilitaires de mappage de types sont composables. Par exemple, ce qui suit produira un type (classe) qui a toutes les propriétés du type `CreateCatDto` sauf `name`, et ces propriétés seront définies comme facultatives :

```typescript
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
```

#### Analyse et validation des tableaux.

TypeScript ne stocke pas de métadonnées sur les génériques ou les interfaces, de sorte que lorsque vous les utilisez dans vos DTO, le `ValidationPipe` peut ne pas être en mesure de valider correctement les données entrantes. Par exemple, dans le code suivant, les `createUserDtos` ne seront pas correctement validés :

```typescript
@Post()
createBulk(@Body() createUserDtos: CreateUserDto[]) {
  return 'This action adds new users';
}
```

Pour valider le tableau, créez une classe dédiée qui contient une propriété enveloppant le tableau, ou utilisez le `ParseArrayPipe`.

```typescript
@Post()
createBulk(
  @Body(new ParseArrayPipe({ items: CreateUserDto }))
  createUserDtos: CreateUserDto[],
) {
  return 'This action adds new users';
}
```

De plus, le `ParseArrayPipe` peut être utile lors de l'analyse des paramètres de requête. Considérons une méthode `findByIds()` qui renvoie des utilisateurs en fonction des identifiants passés en tant que paramètres de requête.

```typescript
@Get()
findByIds(
  @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
  ids: number[],
) {
  return 'This action returns users by ids';
}
```

Cette construction valide les paramètres de requête entrants d'une requête HTTP `GET` comme suit :

```bash
GET /?ids=1,2,3
```

#### WebSockets et Microservices

Bien que ce chapitre montre des exemples utilisant des applications de style HTTP (par exemple, Express ou Fastify), le `ValidationPipe` fonctionne de la même manière pour les WebSockets et les microservices, quelle que soit la méthode de transport utilisée.

#### En savoir plus

Pour en savoir plus sur les validateurs personnalisés, les messages d'erreur et les décorateurs disponibles fournis par le paquet `class-validator` rendez-vous [ici](https://github.com/typestack/class-validator).
