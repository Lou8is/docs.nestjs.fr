### Introduction

La spécification [OpenAPI](https://swagger.io/specification/) est un format de définition indépendant du langage utilisé pour décrire les API REST. Nest fournit un [module](https://github.com/nestjs/swagger) dédié qui permet de générer une telle spécification en s'appuyant sur des décorateurs.

#### Installation

Pour commencer à l'utiliser, nous devons d'abord installer les dépendances nécessaires.

```bash
$ npm install --save @nestjs/swagger
```

#### Bootstrap

Une fois le processus d'installation terminé, ouvrez le fichier `main.ts` et initialisez Swagger en utilisant la classe `SwaggerModule` :

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

> info **Astuce** `document` (retourné par la méthode `SwaggerModule#createDocument()`) est un objet sérialisable conforme à [OpenAPI Document](https://swagger.io/specification/#openapi-document). Au lieu de l'héberger via HTTP, vous pouvez également le sauvegarder en tant que fichier JSON/YAML, et le consommer de différentes manières.

Le `DocumentBuilder` aide à structurer un document de base conforme à la spécification OpenAPI. Il fournit plusieurs méthodes qui permettent de définir des propriétés telles que le titre, la description, la version, etc. Afin de créer un document complet (avec toutes les routes HTTP définies), nous utilisons la méthode `createDocument()` de la classe `SwaggerModule`. Cette méthode prend deux arguments, une instance d'application et un objet d'options Swagger. Alternativement, nous pouvons fournir un troisième argument, qui doit être de type `SwaggerDocumentOptions`. Plus d'informations à ce sujet dans la section [Document options](/openapi/introduction#options-de-document).

Une fois que nous avons créé un document, nous pouvons appeler la méthode `setup()`. Elle accepte :

1. Le chemin pour monter l'interface utilisateur Swagger
2. Une instance d'application
3. L'objet document instancié ci-dessus
4. Un paramètre de configuration optionnel (en savoir plus [ici](/openapi/introduction#options-de-document))

Vous pouvez maintenant exécuter la commande suivante pour démarrer le serveur HTTP :

```bash
$ npm run start
```

Pendant que l'application fonctionne, ouvrez votre navigateur et naviguez vers `http://localhost:3000/api`. Vous devriez voir l'interface utilisateur de Swagger.

<figure><img src="/assets/swagger1.png" /></figure>

Comme vous pouvez le voir, le `SwaggerModule` reflète automatiquement tous vos endpoints.

> info **Astuce** Pour générer et télécharger un fichier Swagger JSON, naviguez vers `http://localhost:3000/api-json` (en supposant que votre documentation Swagger soit disponible sous `http://localhost:3000/api`).

> warning **Attention** Lors de l'utilisation de `fastify` et `helmet`, il peut y avoir un problème avec la [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP), pour résoudre cette collision, configurez la CSP comme indiqué ci-dessous :
>
> ```typescript
> app.register(helmet, {
>   contentSecurityPolicy: {
>     directives: {
>       defaultSrc: [`'self'`],
>       styleSrc: [`'self'`, `'unsafe-inline'`],
>       imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
>       scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
>     },
>   },
> });
>
> // Si vous n'avez pas l'intention d'utiliser CSP, vous pouvez utiliser ceci :
> app.register(helmet, {
>   contentSecurityPolicy: false,
> });
> ```

#### Options de document

Lors de la création d'un document, il est possible de fournir quelques options supplémentaires pour affiner le comportement de la bibliothèque. Ces options doivent être de type `SwaggerDocumentOptions`, qui peuvent être les suivantes :

```TypeScript
export interface SwaggerDocumentOptions {
  /**
   * Liste des modules à inclure dans la spécification
   */
  include?: Function[];

  /**
   * Modèles supplémentaires qui devraient être inspectés et inclus dans la spécification
   */
  extraModels?: Function[];

  /**
   * Si `true`, swagger ignorera le préfixe global défini par la méthode `setGlobalPrefix()`.
   */
  ignoreGlobalPrefix?: boolean;

  /**
   * Si `true`, swagger chargera également les routes des modules importés par les modules `include`.
   */
  deepScanRoutes?: boolean;

  /**
   * OperationIdFactory personnalisé qui sera utilisé pour générer le `operationId`
   * basé sur `controllerKey` et `methodKey`.
   * @default () => controllerKey_methodKey
   */
  operationIdFactory?: (controllerKey: string, methodKey: string) => string;
}
```

Par exemple, si vous voulez vous assurer que la bibliothèque génère des noms d'opérations comme `createUser` au lieu de `UserController_createUser`, vous pouvez définir ce qui suit :

```TypeScript
const options: SwaggerDocumentOptions =  {
  operationIdFactory: (
    controllerKey: string,
    methodKey: string
  ) => methodKey
};
const document = SwaggerModule.createDocument(app, config, options);
```

#### Options de configuration

Vous pouvez configurer l'interface utilisateur de Swagger en passant l'objet options qui remplit l'interface `SwaggerCustomOptions` comme quatrième argument de la méthode `SwaggerModule#setup`.

```TypeScript
export interface SwaggerCustomOptions {
  /**
   * Si `true`, les chemins des ressources Swagger seront préfixés par le préfixe global défini par `setGlobalPrefix()`.
   * Par défaut : `false`.
   * @see https://docs.nestjs.com/faq/global-prefix
   */
  useGlobalPrefix?: boolean;

  /**
   * Si `false`, seules les définitions d'API (JSON et YAML) seront servies (sur `/{path}-json` et `/{path}-yaml`).
   * Ceci est particulièrement utile si vous hébergez déjà une interface Swagger ailleurs et que vous souhaitez simplement servir des définitions d'API.
   * Par défaut : `true`.
   */
  swaggerUiEnabled?: boolean;

  /**
   * Url de la définition de l'API à charger dans Swagger UI.
   */
  swaggerUrl?: string;

  /**
   * Chemin d'accès à la définition JSON de l'API à servir.
   * Par défaut : `<path>-json`.
   */
  jsonDocumentUrl?: string;

  /**
   * Chemin d'accès à la définition YAML de l'API à servir.
   * Par défaut : `<path>-yaml`.
   */
  yamlDocumentUrl?: string;

  /**
   * Hook permettant de modifier le document OpenAPI avant qu'il ne soit servi.
   * Il est appelé après la génération du document et avant qu'il ne soit servi en tant que JSON & YAML.
   */
  patchDocumentOnRequest?: <TRequest = any, TResponse = any>(
    req: TRequest,
    res: TResponse,
    document: OpenAPIObject
  ) => OpenAPIObject;

  /**
   * Si `true`, le sélecteur de définitions OpenAPI est affiché dans l'interface Swagger UI.
   * Par défaut : `false`.
   */
  explorer?: boolean;

  /**
   * Options supplémentaires de l'interface utilisateur de Swagger
   */
  swaggerOptions?: SwaggerUiOptions;

  /**
   * Styles CSS personnalisés à injecter dans la page Swagger UI.
   */
  customCss?: string;

  /**
   * URL(s) d'une feuille de style CSS personnalisée à charger dans la page Swagger UI.
   */
  customCssUrl?: string | string[];

  /**
   * URL(s) des fichiers JavaScript personnalisés à charger dans la page Swagger UI.
   */
  customJs?: string | string[];

  /**
   * Scripts JavaScript personnalisés à charger dans la page Swagger UI.
   */
  customJsStr?: string | string[];

  /**
   * Favicon personnalisé pour la page Swagger UI.
   */
  customfavIcon?: string;

  /**
   * Titre personnalisé pour la page Swagger UI.
   */
  customSiteTitle?: string;

  /**
   * Chemin du système de fichiers (ex : ./node_modules/swagger-ui-dist) contenant les éléments statiques de l'interface utilisateur de Swagger.
   */
  customSwaggerUiPath?: string;

  /**
   * @deprecated Cette propriété n'a aucun effet.
   */
  validatorUrl?: string;

  /**
   * @deprecated Cette propriété n'a aucun effet.
   */
  url?: string;

  /**
   * @deprecated Cette propriété n'a aucun effet.
   */
  urls?: Record<'url' | 'name', string>[];

}
```

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/11-swagger).
