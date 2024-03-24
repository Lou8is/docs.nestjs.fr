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

Vous pouvez ajouter des définitions de paramètres à toutes les routes en utilisant `DocumentBuilder` :

```typescript
const options = new DocumentBuilder().addGlobalParameters({
  name: 'tenantId',
  in: 'header',
});
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

  const catDocument = SwaggerModule.createDocument(app, options, {
    include: [CatsModule],
  });
  SwaggerModule.setup('api/cats', app, catDocument);

  const secondOptions = new DocumentBuilder()
    .setTitle('Dogs example')
    .setDescription('The dogs API description')
    .setVersion('1.0')
    .addTag('dogs')
    .build();

  const dogDocument = SwaggerModule.createDocument(app, secondOptions, {
    include: [DogsModule],
  });
  SwaggerModule.setup('api/dogs', app, dogDocument);

  await app.listen(3000);
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
