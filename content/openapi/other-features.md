### Autres fonctionnalités

Cette page énumère toutes les autres fonctions disponibles qui peuvent vous être utiles.

#### Préfixe global

Pour ignorer un préfixe global pour les routes définies par `setGlobalPrefix()`, utilisez `ignoreGlobalPrefix` :

```typescript
const document = SwaggerModule.createDocument(app, options, {
  ignoreGlobalPrefix: true,
});
```

#### Paramètres globaux

Vous pouvez définir des paramètres pour toutes les routes en utilisant `DocumentBuilder`, comme indiqué ci-dessous :

```typescript
const config = new DocumentBuilder()
  .addGlobalParameters({
    name: 'tenantId',
    in: 'header',
  })
  // autres configurations
  .build();
```

#### Réponses globales

Vous pouvez définir des réponses globales pour toutes les routes en utilisant `DocumentBuilder`. Ceci est utile pour mettre en place des réponses cohérentes à travers tous les endpoints de votre application, comme des codes d'erreur tels que `401 Unauthorized` (non autorisé) ou `500 Internal Server Error` (erreur interne du serveur).

```typescript
const config = new DocumentBuilder()
  .addGlobalResponse({
    status: 500,
    description: 'Internal server error',
  })
  // autres configurations
  .build();
```

#### Spécifications multiples

Le `SwaggerModule` fournit un moyen de supporter des spécifications multiples. En d'autres termes, vous pouvez servir différentes documentations, avec différentes interfaces utilisateur, sur différents points d'accès.

Pour supporter des spécifications multiples, votre application doit être écrite avec une approche modulaire. La méthode `createDocument()` prend un troisième argument, `extraOptions`, qui est un objet avec une propriété nommée `include`. La propriété `include` prend une valeur qui est un tableau de modules.

Vous pouvez configurer le support de spécifications multiples comme indiqué ci-dessous :

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CatsModule } from './cats/cats.module';
import { DogsModule } from './dogs/dogs.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * createDocument(application, configurationOptions, extraOptions);
   *
   * La méthode createDocument prend un troisième argument optionnel "extraOptions"
   * qui est un objet avec la propriété "include" où vous pouvez passer un tableau 
   * de modules que vous voulez inclure dans cette spécification Swagger : 
   * CatsModule et DogsModule auront deux spécifications Swagger distinctes qui seront exposées 
   * sur deux SwaggerUI différentes avec deux points de terminaison différents.
   */

  const options = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();

  const catDocumentFactory = () =>
    SwaggerModule.createDocument(app, options, {
      include: [CatsModule],
    });
  SwaggerModule.setup('api/cats', app, catDocumentFactory);

  const secondOptions = new DocumentBuilder()
    .setTitle('Dogs example')
    .setDescription('The dogs API description')
    .setVersion('1.0')
    .addTag('dogs')
    .build();

  const dogDocumentFactory = () =>
    SwaggerModule.createDocument(app, secondOptions, {
      include: [DogsModule],
    });
  SwaggerModule.setup('api/dogs', app, dogDocumentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Vous pouvez maintenant démarrer votre serveur avec la commande suivante :

```bash
$ npm run start
```

Naviguez vers `http://localhost:3000/api/cats` pour voir l'interface utilisateur Swagger pour les `cats` :

<figure><img src="/assets/swagger-cats.png" /></figure>

A son tour, `http://localhost:3000/api/dogs` exposera l'interface Swagger pour les `dogs` :

<figure><img src="/assets/swagger-dogs.png" /></figure>

#### Menu déroulant dans la barre d'exploration

Pour activer le support de multiples spécifications dans le menu déroulant de la barre d'exploration, vous devrez mettre `explorer : true` et configurer `swaggerOptions.urls` dans votre `SwaggerCustomOptions`.

> info **Astuce** Assurez-vous que `swaggerOptions.urls` pointe vers le format JSON de vos documents Swagger ! Pour spécifier le document JSON, utilisez `jsonDocumentUrl` dans `SwaggerCustomOptions`. Pour plus d'options de configuration, consultez [ici](/openapi/introduction#options-de-configuration).
>
> Voici comment définir plusieurs spécifications à partir d'une liste déroulante dans la barre d'exploration :

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CatsModule } from './cats/cats.module';
import { DogsModule } from './dogs/dogs.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Main API options
  const options = new DocumentBuilder()
    .setTitle('Multiple Specifications Example')
    .setDescription('Description for multiple specifications')
    .setVersion('1.0')
    .build();

  // Create main API document
  const document = SwaggerModule.createDocument(app, options);

  // Setup main API Swagger UI with dropdown support
  SwaggerModule.setup('api', app, document, {
    explorer: true,
    swaggerOptions: {
      urls: [
        {
          name: '1. API',
          url: 'api/swagger.json',
        },
        {
          name: '2. Cats API',
          url: 'api/cats/swagger.json',
        },
        {
          name: '3. Dogs API',
          url: 'api/dogs/swagger.json',
        },
      ],
    },
    jsonDocumentUrl: '/api/swagger.json',
  });

  // Cats API options
  const catOptions = new DocumentBuilder()
    .setTitle('Cats Example')
    .setDescription('Description for the Cats API')
    .setVersion('1.0')
    .addTag('cats')
    .build();

  // Create Cats API document
  const catDocument = SwaggerModule.createDocument(app, catOptions, {
    include: [CatsModule],
  });

  // Setup Cats API Swagger UI
  SwaggerModule.setup('api/cats', app, catDocument, {
    jsonDocumentUrl: '/api/cats/swagger.json',
  });

  // Dogs API options
  const dogOptions = new DocumentBuilder()
    .setTitle('Dogs Example')
    .setDescription('Description for the Dogs API')
    .setVersion('1.0')
    .addTag('dogs')
    .build();

  // Create Dogs API document
  const dogDocument = SwaggerModule.createDocument(app, dogOptions, {
    include: [DogsModule],
  });

  // Setup Dogs API Swagger UI
  SwaggerModule.setup('api/dogs', app, dogDocument, {
    jsonDocumentUrl: '/api/dogs/swagger.json',
  });

  await app.listen(3000);
}

bootstrap();
```

Dans cet exemple, nous avons mis en place une API principale ainsi que des spécifications distinctes pour les chats et les chiens, chacune étant accessible à partir du menu déroulant de la barre d'exploration.