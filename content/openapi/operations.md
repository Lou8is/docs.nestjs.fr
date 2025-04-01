### Opérations

En termes d'OpenAPI, les chemins sont des endpoints (ressources), tels que `/users` ou `/reports/summary`, que votre API expose, et les opérations sont les méthodes HTTP utilisées pour manipuler ces chemins, telles que `GET`, `POST` ou `DELETE`.

#### Tags

Pour attacher un contrôleur à un tag spécifique, utilisez le décorateur `@ApiTags(...tags)`.

```typescript
@ApiTags('cats')
@Controller('cats')
export class CatsController {}
```

#### En-têtes

Pour définir des en-têtes personnalisés qui sont attendus dans le cadre de la requête, utilisez `@ApiHeader()`.

```typescript
@ApiHeader({
  name: 'X-MyHeader',
  description: 'En-tête personnalisé',
})
@Controller('cats')
export class CatsController {}
```

#### Réponses

Pour définir une réponse HTTP personnalisée, utilisez le décorateur `@ApiResponse()`.

```typescript
@Post()
@ApiResponse({ status: 201, description: 'L enregistrement a été créé avec succès.'})
@ApiResponse({ status: 403, description: 'Interdit.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

Nest fournit un ensemble de décorateurs **API response** qui héritent du décorateur `@ApiResponse` :

- `@ApiOkResponse()`
- `@ApiCreatedResponse()`
- `@ApiAcceptedResponse()`
- `@ApiNoContentResponse()`
- `@ApiMovedPermanentlyResponse()`
- `@ApiFoundResponse()`
- `@ApiBadRequestResponse()`
- `@ApiUnauthorizedResponse()`
- `@ApiNotFoundResponse()`
- `@ApiForbiddenResponse()`
- `@ApiMethodNotAllowedResponse()`
- `@ApiNotAcceptableResponse()`
- `@ApiRequestTimeoutResponse()`
- `@ApiConflictResponse()`
- `@ApiPreconditionFailedResponse()`
- `@ApiTooManyRequestsResponse()`
- `@ApiGoneResponse()`
- `@ApiPayloadTooLargeResponse()`
- `@ApiUnsupportedMediaTypeResponse()`
- `@ApiUnprocessableEntityResponse()`
- `@ApiInternalServerErrorResponse()`
- `@ApiNotImplementedResponse()`
- `@ApiBadGatewayResponse()`
- `@ApiServiceUnavailableResponse()`
- `@ApiGatewayTimeoutResponse()`
- `@ApiDefaultResponse()`

```typescript
@Post()
@ApiCreatedResponse({ description: 'L enregistrement a été créé avec succès.'})
@ApiForbiddenResponse({ description: 'Interdit.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

Pour spécifier un modèle de retour pour une requête, nous devons créer une classe et annoter toutes les propriétés avec le décorateur `@ApiProperty()`.

```typescript
export class Cat {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

Le modèle `Cat` peut alors être utilisé en combinaison avec la propriété `type` du décorateur de réponse.

```typescript
@ApiTags('cats')
@Controller('cats')
export class CatsController {
  @Post()
  @ApiCreatedResponse({
    description: 'L enregistrement a été créé avec succès.',
    type: Cat,
  })
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }
}
```

Ouvrons le navigateur et vérifions le modèle `Cat` généré :

<figure><img src="/assets/swagger-response-type.png" /></figure>

#### Téléchargement de fichiers

Vous pouvez activer le téléchargement de fichiers pour une méthode spécifique avec le décorateur `@ApiBody` et `@ApiConsumes()`. Voici un exemple complet utilisant la technique de [Téléchargement de fichiers](/techniques/file-upload) :

```typescript
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'Liste des chats',
  type: FileUploadDto,
})
uploadFile(@UploadedFile() file) {}
```

Où `FileUploadDto` est défini comme suit :

```typescript
class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
```

Pour gérer le téléchargement de plusieurs fichiers, vous pouvez définir `FilesUploadDto` comme suit :

```typescript
class FilesUploadDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];
}
```

#### Extensions

Pour ajouter une extension à une requête, utilisez le décorateur `@ApiExtension()`. Le nom de l'extension doit être préfixé par `x-`.

```typescript
@ApiExtension('x-foo', { hello: 'world' })
```

#### Avancé : Générique `ApiResponse`

Avec la possibilité de fournir des [définitions brutes](/openapi/types-and-parameters#définitions-brutes), nous pouvons définir un schéma générique pour l'interface utilisateur de Swagger. Supposons que nous ayons le DTO suivant :

```ts
export class PaginatedDto<TData> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  results: TData[];
}
```

Nous sautons la décoration de `results` car nous lui fournirons une définition brute plus tard. Maintenant, définissons un autre DTO et nommons-le, par exemple, `CatDto`, comme suit :

```ts
export class CatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

Nous pouvons alors définir une réponse `PaginatedDto<CatDto>`, comme suit :

```ts
@ApiOkResponse({
  schema: {
    allOf: [
      { $ref: getSchemaPath(PaginatedDto) },
      {
        properties: {
          results: {
            type: 'array',
            items: { $ref: getSchemaPath(CatDto) },
          },
        },
      },
    ],
  },
})
async findAll(): Promise<PaginatedDto<CatDto>> {}
```

Dans cet exemple, nous spécifions que la réponse aura allOf `PaginatedDto` et que la propriété `results` sera de type `Array<CatDto>`.

- La fonction `getSchemaPath()` qui renvoie le chemin du schéma OpenAPI à partir du fichier de spécification OpenAPI pour un modèle donné.
- `allOf` est un concept fourni par l'OAS 3 pour couvrir divers cas d'utilisation liés à l'héritage.

Enfin, puisque `PaginatedDto` n'est pas directement référencé par un contrôleur, le `SwaggerModule` ne sera pas capable de générer une définition de modèle correspondante pour le moment. Dans ce cas, nous devons l'ajouter en tant que [modèle additionnel](/openapi/types-and-parameters#modèles-additionnels). Par exemple, nous pouvons utiliser le décorateur `@ApiExtraModels()` au niveau du contrôleur, comme suit :

```ts
@Controller('cats')
@ApiExtraModels(PaginatedDto)
export class CatsController {}
```

Si vous lancez Swagger maintenant, le fichier `swagger.json` généré pour ce point de terminaison spécifique devrait avoir la réponse suivante définie :

```json
"responses": {
  "200": {
    "description": "",
    "content": {
      "application/json": {
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/PaginatedDto"
            },
            {
              "properties": {
                "results": {
                  "$ref": "#/components/schemas/CatDto"
                }
              }
            }
          ]
        }
      }
    }
  }
}
```

Pour le rendre réutilisable, nous pouvons créer un décorateur personnalisé pour `PaginatedDto`, comme suit :

```ts
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              results: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
```

> info **Astuce** L'interface `Type<any>` et la fonction `applyDecorators` sont importées du paquet `@nestjs/common`.

Pour s'assurer que `SwaggerModule` génère une définition pour notre modèle, nous devons l'ajouter comme un modèle supplémentaire, comme nous l'avons fait plus tôt avec le `PaginatedDto` dans le contrôleur.

Avec ceci en place, nous pouvons utiliser le décorateur personnalisé `@ApiPaginatedResponse()` sur notre point de terminaison :

```ts
@ApiPaginatedResponse(CatDto)
async findAll(): Promise<PaginatedDto<CatDto>> {}
```

Pour les outils de génération de clients, cette approche pose une ambiguïté sur la façon dont le `PaginatedResponse<TModel>` est généré pour le client. L'extrait suivant est un exemple de résultat d'un générateur de client pour le point d'arrivée `GET /` ci-dessus.

```typescript
// Angular
findAll(): Observable<{ total: number, limit: number, offset: number, results: CatDto[] }>
```

Comme vous pouvez le voir, le **Type de retour** ici est ambigu. Pour contourner ce problème, vous pouvez ajouter une propriété `title` au `schema` pour `ApiPaginatedResponse` :

```typescript
export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        title: `PaginatedResponseOf${model.name}`,
        allOf: [
          // ...
        ],
      },
    }),
  );
};
```

Le résultat de l'outil de génération de clients est maintenant le suivant :

```ts
// Angular
findAll(): Observable<PaginatedResponseOfCatDto>
```
