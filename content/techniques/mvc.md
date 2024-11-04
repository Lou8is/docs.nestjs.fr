### Modèle-Vue-Contrôleur

Nest utilise par défaut la bibliothèque [Express](https://github.com/expressjs/express). Par conséquent, toutes les techniques d'utilisation du modèle MVC (Modèle-Vue-Contrôleur) dans Express s'appliquent également à Nest.

Commençons par mettre en place une application Nest simple à l'aide de l'outil [CLI](https://github.com/nestjs/nest-cli) :

```bash
$ npm i -g @nestjs/cli
$ nest new project
```

Pour créer une application MVC, nous avons également besoin d'un [moteur de modèle](https://expressjs.com/en/guide/using-template-engines.html) pour générer nos vues HTML :

```bash
$ npm install --save hbs
```

Nous avons utilisé le moteur `hbs` ([Handlebars](https://github.com/pillarjs/hbs#readme)), mais vous pouvez utiliser ce qui correspond à vos besoins. Une fois le processus d'installation terminé, nous devons configurer l'instance express en utilisant le code suivant :

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Nous avons dit à [Express](https://github.com/expressjs/express) que le répertoire `public` sera utilisé pour stocker les actifs statiques, que `views` contiendra les templates, et que le moteur de template `hbs` sera utilisé pour générer les sorties HTML.

#### Rendu des modèles

Maintenant, créons un répertoire `views` et un modèle `index.hbs` à l'intérieur. Dans le template, nous allons imprimer un `message` passé par le contrôleur :

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>App</title>
  </head>
  <body>
    {{ "{{ message }\}" }}
  </body>
</html>
```

Ensuite, ouvrez le fichier `app.controller` et remplacez la méthode `root()` par le code suivant :

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }
}
```

Dans ce code, nous spécifions le template à utiliser dans le décorateur `@Render()`, et la valeur de retour de la méthode du gestionnaire de route est passée au template pour le rendu. Notez que la valeur de retour est un objet avec une propriété `message`, correspondant à l'espace réservé `message` que nous avons créé dans le modèle.

Pendant que l'application fonctionne, ouvrez votre navigateur et naviguez jusqu'à `http://localhost:3000`. Vous devriez voir le message `Hello world!`.

#### Rendu dynamique des modèles

Si la logique de l'application doit décider dynamiquement du modèle à afficher, alors nous devrions utiliser le décorateur `@Res()`, et fournir le nom de la vue dans notre gestionnaire de route, plutôt que dans le décorateur `@Render()` :

> info **Astuce** Lorsque Nest détecte le décorateur `@Res()`, il injecte l'objet `response` spécifique à la bibliothèque. Nous pouvons utiliser cet objet pour effectuer un rendu dynamique du modèle. Pour en savoir plus sur l'API de l'objet `response` [lisez ceci](https://expressjs.com/en/api.html).

```typescript
@@filename(app.controller)
import { Get, Controller, Res, Render } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  root(@Res() res: Response) {
    return res.render(
      this.appService.getViewName(),
      { message: 'Hello world!' },
    );
  }
}
```

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/15-mvc).

#### Fastify

Comme indiqué dans ce [chapitre](/techniques/performance), nous pouvons utiliser n'importe quel fournisseur HTTP compatible avec Nest. L'une de ces bibliothèques est [Fastify](https://github.com/fastify/fastify). Afin de créer une application MVC avec Fastify, nous devons installer les packages suivants :

```bash
$ npm i --save @fastify/static @fastify/view handlebars
```

Les étapes suivantes couvrent presque le même processus utilisé avec Express, avec des différences mineures spécifiques à la plateforme. Une fois le processus d'installation terminé, ouvrez le fichier `main.ts` et mettez à jour son contenu :

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

L'API Fastify a quelques différences, mais le résultat final de ces appels de méthode est le même. Une différence notable est que lorsque vous utilisez Fastify, le nom du modèle que vous passez dans le décorateur `@Render()` doit inclure l'extension du fichier.

Voici comment vous pouvez le configurer :

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index.hbs')
  root() {
    return { message: 'Hello world!' };
  }
}
```

Alternativement, vous pouvez utiliser le décorateur `@Res()` pour injecter directement la réponse et spécifier la vue que vous voulez rendre, comme montré ci-dessous :

```typescript
import { Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Get()
root(@Res() res: FastifyReply) {
  return res.view('index.hbs', { title: 'Hello world!' });
}
```

Pendant que l'application fonctionne, ouvrez votre navigateur et naviguez jusqu'à `http://localhost:3000`. Vous devriez voir le message `Hello world!`.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/17-mvc-fastify).
