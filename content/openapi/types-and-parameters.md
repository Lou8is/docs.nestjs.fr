### Types et paramètres

Le `SwaggerModule` recherche tous les décorateurs `@Body()`, `@Query()`, et `@Param()` dans les gestionnaires de route pour générer le document API. Il crée également les définitions de modèle correspondantes en tirant parti de la réflexion. Considérons le code suivant :

```typescript
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Astuce** Pour définir explicitement la définition du corps, utilisez le décorateur `@ApiBody()` (importé du paquet `@nestjs/swagger`).

En se basant sur `CreateCatDto`, l'interface Swagger de définition de modèle suivante sera créée :

<figure><img src="/assets/swagger-dto.png" /></figure>

Comme vous pouvez le voir, la définition est vide bien que la classe ait quelques propriétés déclarées. Afin de rendre les propriétés de la classe visibles par le `SwaggerModule`, nous devons soit les annoter avec le décorateur `@ApiProperty()`, soit utiliser le plugin CLI (voir la section [Plugin](/openapi/cli-plugin)) qui le fera automatiquement :

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

> info **Astuce** Au lieu d'annoter manuellement chaque propriété, vous pouvez utiliser le plugin Swagger (voir la section [Plugin](/openapi/cli-plugin)) qui le fera automatiquement pour vous.

Ouvrons le navigateur et vérifions le modèle `CreateCatDto` généré :

<figure><img src="/assets/swagger-dto2.png" /></figure>

En outre, le décorateur `@ApiProperty()` permet de définir diverses propriétés [Schema Object](https://swagger.io/specification/#schemaObject) :

```typescript
@ApiProperty({
  description: 'The age of a cat',
  minimum: 1,
  default: 1,
})
age: number;
```

> info **Astuce** Au lieu de taper explicitement la propriété `{{"@ApiProperty({ required : false })"}`, vous pouvez utiliser le décorateur `@ApiPropertyOptional()`.

Pour définir explicitement le type de la propriété, utilisez la clé `type` :

```typescript
@ApiProperty({
  type: Number,
})
age: number;
```

#### Tableaux

Lorsque la propriété est un tableau, nous devons indiquer manuellement le type de tableau comme indiqué ci-dessous :

```typescript
@ApiProperty({ type: [String] })
names: string[];
```

> info **Astuce** Pensez à utiliser le plugin Swagger (voir la section [Plugin](/openapi/cli-plugin)) qui détectera automatiquement les tableaux.

Soit vous incluez le type en tant que premier élément d'un tableau (comme indiqué ci-dessus), soit vous définissez la propriété `isArray` à `true`.

<app-banner-enterprise></app-banner-enterprise>

#### Dépendances circulaires

Lorsque vous avez des dépendances circulaires entre les classes, utilisez une fonction paresseuse pour fournir à `SwaggerModule` des informations sur les types :

```typescript
@ApiProperty({ type: () => Node })
node: Node;
```

> info **Astuce** Pensez à utiliser le plugin Swagger (voir la section [Plugin](/openapi/cli-plugin)) qui détectera automatiquement les dépendances circulaires.

#### Génériques et interfaces

Comme TypeScript ne stocke pas de métadonnées sur les génériques ou les interfaces, lorsque vous les utilisez dans vos DTO, `SwaggerModule` peut ne pas être capable de générer correctement des définitions de modèles à l'exécution. Par exemple, le code suivant ne sera pas correctement inspecté par le module Swagger :

```typescript
createBulk(@Body() usersDto: CreateUserDto[])
```

Afin de surmonter cette limitation, vous pouvez définir le type de manière explicite :

```typescript
@ApiBody({ type: [CreateUserDto] })
createBulk(@Body() usersDto: CreateUserDto[])
```

#### Enums

Pour identifier un `enum`, nous devons définir manuellement la propriété `enum` sur la `@ApiProperty` avec un tableau de valeurs.

```typescript
@ApiProperty({ enum: ['Admin', 'Moderator', 'User']})
role: UserRole;
```

Vous pouvez également définir un enum TypeScript comme suit :

```typescript
export enum UserRole {
  Admin = 'Admin',
  Moderator = 'Moderator',
  User = 'User',
}
```

Vous pouvez alors utiliser l'enum directement avec le décorateur de paramètres `@Query()` en combinaison avec le décorateur `@ApiQuery()`.

```typescript
@ApiQuery({ name: 'role', enum: UserRole })
async filterByRole(@Query('role') role: UserRole = UserRole.User) {}
```

<figure><img src="/assets/enum_query.gif" /></figure>

Avec `isArray` fixé à **true**, le `enum` peut être sélectionné comme un **multi-select** :

<figure><img src="/assets/enum_query_array.gif" /></figure>

#### Schéma des enums

Par défaut, la propriété `enum` ajoutera une définition brute de [Enum](https://swagger.io/docs/specification/data-models/enums/) sur le `parameter`.

```yaml
- breed:
    type: 'string'
    enum:
      - Persian
      - Tabby
      - Siamese
```

La spécification ci-dessus fonctionne bien dans la plupart des cas. Cependant, si vous utilisez un outil qui prend la spécification en **entrée** et génère du code **client**, vous pouvez rencontrer un problème avec le code généré qui contient des `enums` dupliqués. Considérons l'extrait de code suivant :

```typescript
// code généré côté client
export class CatDetail {
  breed: CatDetailEnum;
}

export class CatInformation {
  breed: CatInformationEnum;
}

export enum CatDetailEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}

export enum CatInformationEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}
```

> info **Astuce** L'extrait ci-dessus est généré à l'aide d'un outil appelé [NSwag](https://github.com/RicoSuter/NSwag).

Vous pouvez voir que vous avez maintenant deux `enums` qui sont exactement les mêmes.
Pour résoudre ce problème, vous pouvez passer un `enumName` avec la propriété `enum` dans votre décorateur.

```typescript
export class CatDetail {
  @ApiProperty({ enum: CatBreed, enumName: 'CatBreed' })
  breed: CatBreed;
}
```

La propriété `enumName` permet à `@nestjs/swagger` de transformer `CatBreed` en son propre `schema`, ce qui rend l'enum `CatBreed` réutilisable. La spécification ressemblera à ce qui suit :

```yaml
CatDetail:
  type: 'object'
  properties:
    ...
    - breed:
        schema:
          $ref: '#/components/schemas/CatBreed'
CatBreed:
  type: string
  enum:
    - Persian
    - Tabby
    - Siamese
```

> info **Astuce** Tout **décorateur** qui prend `enum` comme propriété prendra aussi `enumName`.

#### Exemples de valeurs de propriétés

Vous pouvez définir un seul exemple pour une propriété en utilisant la clé `example`, comme ceci :

```typescript
@ApiProperty({
  example: 'persian',
})
breed: string;
```

Si vous souhaitez fournir plusieurs exemples, vous pouvez utiliser la clé `examples` en passant un objet structuré comme suit :

```typescript
@ApiProperty({
  examples: {
    Persian: { value: 'persian' },
    Tabby: { value: 'tabby' },
    Siamese: { value: 'siamese' },
    'Scottish Fold': { value: 'scottish_fold' },
  },
})
breed: string;
```

#### Définitions brutes

Dans certains cas, tels que les tableaux ou les matrices profondément imbriqués, vous devrez peut-être définir manuellement votre type :

```typescript
@ApiProperty({
  type: 'array',
  items: {
    type: 'array',
    items: {
      type: 'number',
    },
  },
})
coords: number[][];
```

Vous pouvez également spécifier des schémas d'objets bruts, comme ceci :

```typescript
@ApiProperty({
  type: 'object',
  properties: {
    name: {
      type: 'string',
      example: 'Error'
    },
    status: {
      type: 'number',
      example: 400
    }
  },
  required: ['name', 'status']
})
rawDefinition: Record<string, any>;
```

Pour définir manuellement le contenu de vos entrées/sorties dans les classes de contrôleurs, utilisez la propriété `schema` :

```typescript
@ApiBody({
  schema: {
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'number',
      },
    },
  },
})
async create(@Body() coords: number[][]) {}
```

#### Modèles additionnels

Pour définir des modèles supplémentaires qui ne sont pas directement référencés dans vos contrôleurs mais qui doivent être inspectés par le module Swagger, utilisez le décorateur `@ApiExtraModels()` :

```typescript
@ApiExtraModels(ExtraModel)
export class CreateCatDto {}
```

> info **Astuce** Vous ne devez utiliser `@ApiExtraModels()` qu'une seule fois pour une classe de modèle spécifique.

Alternativement, vous pouvez passer un objet d'options avec la propriété `extraModels` spécifiée à la méthode `SwaggerModule#createDocument()`, comme suit :

```typescript
const documentFactory = () =>
  SwaggerModule.createDocument(app, options, {
    extraModels: [ExtraModel],
  });
```

Pour obtenir une référence (`$ref`) à votre modèle, utilisez la fonction `getSchemaPath(ExtraModel)` :

```typescript
'application/vnd.api+json': {
   schema: { $ref: getSchemaPath(ExtraModel) },
},
```

#### oneOf, anyOf, allOf

Pour combiner des schémas, vous pouvez utiliser les mots-clés `oneOf`, `anyOf` ou `allOf` ([en savoir plus](https://swagger.io/docs/specification/data-models/oneof-anyof-allof-not/)).

```typescript
@ApiProperty({
  oneOf: [
    { $ref: getSchemaPath(Cat) },
    { $ref: getSchemaPath(Dog) },
  ],
})
pet: Cat | Dog;
```

Si vous souhaitez définir un tableau polymorphe (c'est-à-dire un tableau dont les membres couvrent plusieurs schémas), vous devez utiliser une définition brute (voir ci-dessus) pour définir votre type à la main.

```typescript
type Pet = Cat | Dog;

@ApiProperty({
  type: 'array',
  items: {
    oneOf: [
      { $ref: getSchemaPath(Cat) },
      { $ref: getSchemaPath(Dog) },
    ],
  },
})
pets: Pet[];
```

> info **Astuce** La fonction `getSchemaPath()` est importée de `@nestjs/swagger`.

Les deux modèles `Cat` et `Dog` doivent être définis comme des modèles supplémentaires en utilisant le décorateur `@ApiExtraModels()` (au niveau de la classe).

#### Nom et description du schéma

Comme vous avez pu le remarquer, le nom du schéma généré est basé sur le nom de la classe du modèle original (par exemple, le modèle `CreateCatDto` génère un schéma `CreateCatDto`). Si vous souhaitez changer le nom du schéma, vous pouvez utiliser le décorateur `@ApiSchema()`.

Voici un exemple :

```typescript
@ApiSchema({ name: 'CreateCatRequest' })
class CreateCatDto {}
```

Le modèle ci-dessus sera traduit dans le schéma en `CreateCatRequest`.

Par défaut, aucune description n'est ajoutée au schéma généré. Vous pouvez en ajouter une en utilisant l'attribut `description` :

```typescript
@ApiSchema({ description: 'Description of the CreateCatDto schema' })
class CreateCatDto {}
```

De cette manière, la description sera incluse dans le schéma, comme suit :

```yaml
schemas:
  CreateCatDto:
    type: object
    description: Description of the CreateCatDto schema
```