### Serverless

L'informatique sans serveur (serverless) est un modèle d'exécution du cloud computing dans lequel le fournisseur de cloud alloue des ressources machine à la demande, en s'occupant des serveurs pour le compte de ses clients. Lorsqu'une application n'est pas utilisée, aucune ressource informatique ne lui est allouée. La tarification est basée sur la quantité réelle de ressources consommées par une application ([source](https://en.wikipedia.org/wiki/Serverless_computing)).

Avec une **architecture sans serveur**, vous vous concentrez purement sur les fonctions individuelles dans le code de votre application. Des services tels que AWS Lambda, Google Cloud Functions et Microsoft Azure Functions s'occupent de toute la gestion du matériel physique, du système d'exploitation de la machine virtuelle et du logiciel du serveur web.

> info **Info** Ce chapitre ne couvre pas les avantages et les inconvénients des fonctions sans serveur et ne plonge pas dans les spécificités des fournisseurs de cloud.

#### Démarrage à froid

Un démarrage à froid est la première fois que votre code est exécuté depuis un certain temps. Selon le fournisseur de cloud que vous utilisez, il peut s'agir de plusieurs opérations différentes, depuis le téléchargement du code et l'amorçage du runtime jusqu'à l'exécution finale de votre code.
Ce processus ajoute **une latence significative** en fonction de plusieurs facteurs, le langage, le nombre de paquets dont votre application a besoin, etc.

Le démarrage à froid est important et, bien qu'il y ait des choses qui échappent à notre contrôle, il y a encore beaucoup de choses que nous pouvons faire de notre côté pour le rendre aussi court que possible.

Bien que vous puissiez considérer Nest comme un framework à part entière conçu pour être utilisé dans des applications d'entreprise complexes, il est également  **adapté à des applications** (ou des scripts) beaucoup plus "simples". Par exemple, avec l'utilisation de la fonctionnalité [applications indépendantes](/standalone-applications), vous pouvez tirer parti du système DI de Nest dans des travailleurs simples, des tâches CRON, des CLI ou des fonctions sans serveur.

#### Critères d'évaluation

Pour mieux comprendre quel est le coût de l'utilisation de Nest ou d'autres bibliothèques bien connues (comme `express`) dans le contexte des fonctions sans serveur, comparons le temps nécessaire au runtime Node pour exécuter les scripts suivants :

```typescript
// #1 Express
import * as express from 'express';

async function bootstrap() {
  const app = express();
  app.get('/', (req, res) => res.send('Hello world!'));
  await new Promise<void>((resolve) => app.listen(3000, resolve));
}
bootstrap();

// #2 Nest (avec @nestjs/platform-express)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(3000);
}
bootstrap();

// #3 Nest en tant qu'application indépendante (pas de serveur HTTP)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  console.log(app.get(AppService).getHello());
}
bootstrap();

// #4 Script Node.js brut
async function bootstrap() {
  console.log('Hello world!');
}
bootstrap();
```

Pour tous ces scripts, nous avons utilisé le compilateur `tsc` (TypeScript) et donc le code reste dégroupé (`webpack` n'est pas utilisé).

|                                      |                   |
| ------------------------------------ | ----------------- |
| Express                              | 0.0079s (7.9ms)   |
| Nest avec `@nestjs/platform-express` | 0.1974s (197.4ms) |
| Nest (application indépendante)      | 0.1117s (111.7ms) |
| Script Node.js brut                  | 0.0071s (7.1ms)   |

> info **Note** Machine: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.

Maintenant, répétons tous les benchmarks mais cette fois en utilisant `webpack` (si vous avez [Nest CLI](/cli/overview) installé, vous pouvez lancer `nest build --webpack`) pour empaqueter notre application dans un seul fichier JavaScript exécutable.
Cependant, au lieu d'utiliser la configuration par défaut de `webpack` fournie par Nest CLI, nous allons nous assurer de regrouper toutes les dépendances (`node_modules`) ensemble, comme suit :

```javascript
module.exports = (options, webpack) => {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
  ];

  return {
    ...options,
    externals: [],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
  };
};
```

> info **Astuce** Pour indiquer à Nest CLI d'utiliser cette configuration, créez un nouveau fichier `webpack.config.js` dans le répertoire racine de votre projet.

Avec cette configuration, nous avons obtenu les résultats suivants :

|                                      |                  |
| ------------------------------------ | ---------------- |
| Express                              | 0.0068s (6.8ms)  |
| Nest avec `@nestjs/platform-express` | 0.0815s (81.5ms) |
| Nest (application indépendante)      | 0.0319s (31.9ms) |
| Script Node.js brut                  | 0.0066s (6.6ms)  |

> info **Note** Machine: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.

> info **Astuce** Vous pouvez l'optimiser encore plus en appliquant des techniques supplémentaires de minification et d'optimisation du code (en utilisant les plugins `webpack`, etc.).

Comme vous pouvez le voir, la façon dont vous compilez (et si vous bundlez votre code) est cruciale et a un impact significatif sur le temps de démarrage global. Avec `webpack`, vous pouvez réduire le temps de démarrage d'une application Nest autonome (projet de démarrage avec un module, un contrôleur et un service) à ~32 ms en moyenne, et à ~81,5 ms pour une application NestJS basée sur HTTP et express.

Pour les applications Nest plus compliquées, par exemple, avec 10 ressources (générées par le schéma `$ nest g resource` = 10 modules, 10 contrôleurs, 10 services, 20 classes DTO, 50 points de terminaison HTTP + `AppModule`), le démarrage global sur MacBook Pro Mid 2014, 2,5 GHz Quad-Core Intel Core i7, 16 Go 1600 MHz DDR3, SSD est d'environ 0,1298s (129,8ms). L'exécution d'une application monolithique en tant que fonction sans serveur n'a généralement pas beaucoup de sens de toute façon, alors considérez ce benchmark plus comme un exemple de la façon dont le temps de démarrage peut potentiellement augmenter au fur et à mesure que votre application grandit.

#### Optimisation de la durée d'exécution

Jusqu'à présent, nous avons abordé les optimisations au moment de la compilation. Celles-ci ne sont pas liées à la manière dont vous définissez les fournisseurs et chargez les modules Nest dans votre application, ce qui joue un rôle essentiel au fur et à mesure que votre application prend de l'ampleur.

Imaginons par exemple qu'une connexion à une base de données soit définie comme un [fournisseur asynchrone](/fundamentals/async-providers). Les fournisseurs asynchrones sont conçus pour retarder le démarrage de l'application jusqu'à ce qu'une ou plusieurs tâches asynchrones soient terminées.
Cela signifie que si votre fonction serverless nécessite en moyenne 2s pour se connecter à la base de données (au démarrage), votre endpoint aura besoin d'au moins deux secondes supplémentaires (parce qu'il doit attendre que la connexion soit établie) pour renvoyer une réponse (lorsqu'il s'agit d'un démarrage à froid et que votre application n'était pas déjà en cours d'exécution).

Comme vous pouvez le voir, la façon dont vous structurez vos fournisseurs est quelque peu différente dans un **environnement sans serveur** où le temps de démarrage est important.
Un autre bon exemple est l'utilisation de Redis pour la mise en cache, mais seulement dans certains scénarios. Dans ce cas, vous ne devriez peut-être pas définir une connexion Redis en tant que fournisseur asynchrone, car cela ralentirait le temps de démarrage, même si cela n'est pas nécessaire pour cette invocation de fonction spécifique.

Parfois, vous pouvez également charger paresseusement des modules entiers, en utilisant la classe `LazyModuleLoader`, comme décrit dans [ce chapitre](/fundamentals/lazy-loading-modules). La mise en cache est un bon exemple ici aussi.
Imaginez que votre application ait, disons, `CacheModule` qui se connecte en interne à Redis et exporte aussi `CacheService` pour interagir avec le stockage Redis. Si vous n'en avez pas besoin pour toutes les invocations potentielles de fonctions, vous pouvez simplement le charger à la demande,
vous pouvez simplement le charger à la demande, paresseusement. De cette façon, vous obtiendrez un temps de démarrage plus rapide (lors d'un démarrage à froid) pour toutes les invocations qui ne nécessitent pas de mise en cache.

```typescript
if (request.method === RequestMethod[RequestMethod.GET]) {
  const { CacheModule } = await import('./cache.module');
  const moduleRef = await this.lazyModuleLoader.load(() => CacheModule);

  const { CacheService } = await import('./cache.service');
  const cacheService = moduleRef.get(CacheService);

  return cacheService.get(ENDPOINT_KEY);
}
```

Un autre bon exemple est celui d'un webhook ou d'un worker qui, en fonction de certaines conditions spécifiques (par exemple, les arguments d'entrée), peut effectuer différentes opérations.
Dans ce cas, vous pouvez spécifier une condition dans votre gestionnaire de route qui charge paresseusement un module approprié pour l'invocation de la fonction spécifique, et charge simplement tous les autres modules paresseusement.

```typescript
if (workerType === WorkerType.A) {
  const { WorkerAModule } = await import('./worker-a.module');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerAModule);
  // ...
} else if (workerType === WorkerType.B) {
  const { WorkerBModule } = await import('./worker-b.module');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerBModule);
  // ...
}
```

#### Exemple d'intégration

La façon dont le fichier d'entrée de votre application (typiquement le fichier `main.ts`) est censé ressembler **dépend de plusieurs facteurs** et donc **il n'y a pas de modèle unique** qui fonctionne simplement pour tous les scénarios.
Par exemple, le fichier d'initialisation requis pour démarrer votre fonction serverless varie selon les fournisseurs de cloud (AWS, Azure, GCP, etc.).
De même, selon que vous souhaitez exécuter une application HTTP typique avec plusieurs routes/points de terminaison ou simplement fournir une seule route (ou exécuter une partie spécifique du code),
le code de votre application sera différent (par exemple, pour l'approche endpoint par fonction, vous pourriez utiliser `NestFactory.createApplicationContext` au lieu de démarrer le serveur HTTP, de configurer le middleware, etc.)

Juste à des fins d'illustration, nous allons intégrer Nest (en utilisant `@nestjs/platform-express` et en faisant tourner l'ensemble du routeur HTTP entièrement fonctionnel)
avec le framework [Serverless](https://www.serverless.com/) (dans ce cas, ciblant AWS Lambda). Comme nous l'avons mentionné précédemment, votre code sera différent en fonction du fournisseur de cloud que vous choisissez, et de nombreux autres facteurs.

Tout d'abord, installons les packages nécessaires :

```bash
$ npm i @codegenie/serverless-express aws-lambda
$ npm i -D @types/aws-lambda serverless-offline
```

> info **Astuce** Pour accélérer les cycles de développement, nous installons le plugin `serverless-offline` qui émule AWS λ et API Gateway.

Une fois le processus d'installation terminé, créons le fichier `serverless.yml` pour configurer le framework Serverless :

```yaml
service: serverless-example

plugins:
  - serverless-offline

provider:
  name: aws
  runtime: nodejs14.x

functions:
  main:
    handler: dist/main.handler
    events:
      - http:
          method: ANY
          path: /
      - http:
          method: ANY
          path: '{proxy+}'
```

> info **Astuce** Pour en savoir plus sur le framework Serverless, consultez la [documentation officielle](https://www.serverless.com/framework/docs/).

Avec cela, nous pouvons maintenant naviguer vers le fichier `main.ts` et mettre à jour notre code bootstrap avec le boilerplate requis :

```typescript
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
```

> info **Astuce** Pour créer plusieurs fonctions sans serveur et partager des modules communs entre elles, nous recommandons d'utiliser le [mode Monorepo](/cli/monorepo#mode-monorepo).

> warning **Attention** Si vous utilisez le paquet `@nestjs/swagger`, il y a quelques étapes supplémentaires requises pour le faire fonctionner correctement dans le contexte de la fonction sans serveur. Consultez ce [thread](https://github.com/nestjs/swagger/issues/199) pour plus d'informations.

Ensuite, ouvrez le fichier `tsconfig.json` et assurez-vous d'activer l'option `esModuleInterop` pour que le paquet `@codegenie/serverless-express` se charge correctement.

```json
{
  "compilerOptions": {
    ...
    "esModuleInterop": true
  }
}
```

Maintenant nous pouvons construire notre application (avec `nest build` ou `tsc`) et utiliser le CLI `serverless` pour démarrer notre fonction lambda localement :

```bash
$ npm run build
$ npx serverless offline
```

Une fois l'application lancée, ouvrez votre navigateur et naviguez vers `http://localhost:3000/dev/[ANY_ROUTE]` (où `[ANY_ROUTE]` est n'importe quel point de terminaison enregistré dans votre application).

Dans les sections précédentes, nous avons montré que l'utilisation de `webpack` et l'empaquetage de votre application peuvent avoir un impact significatif sur le temps de démarrage global.
Cependant, pour que cela fonctionne dans notre exemple, il y a quelques configurations supplémentaires que vous devez ajouter dans votre fichier `webpack.config.js`. Généralement,
pour s'assurer que notre fonction `handler` sera récupérée, nous devons changer la propriété `output.libraryTarget` en `commonjs2`.

```javascript
return {
  ...options,
  externals: [],
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... le reste de la configuration
};
```

Avec ceci en place, vous pouvez maintenant utiliser `$ nest build --webpack` pour compiler le code de votre fonction (et ensuite `$ npx serverless offline` pour la tester).

Il est également recommandé (mais **non obligatoire** car cela ralentira votre processus de construction) d'installer le paquet `terser-webpack-plugin` et de surcharger sa configuration pour garder les noms de classe intacts lors de la minification de votre construction de production. Ne pas le faire peut résulter en un comportement incorrect lors de l'utilisation de `class-validator` dans votre application.

```javascript
const TerserPlugin = require('terser-webpack-plugin');

return {
  ...options,
  externals: [],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  },
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... le reste de la configuration
};
```

#### Utilisation de la fonction d'application indépendante

Alternativement, si vous voulez garder votre fonction très légère et que vous n'avez besoin d'aucune fonctionnalité liée à HTTP (routage, mais aussi gardes, intercepteurs, pipes, etc.),
vous pouvez simplement utiliser `NestFactory.createApplicationContext` (comme mentionné plus tôt) au lieu de lancer le serveur HTTP entier (et `express` sous le capot), comme suit :

```typescript
@@filename(main)
import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AppService } from './app.service';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const appService = appContext.get(AppService);

  return {
    body: appService.getHello(),
    statusCode: HttpStatus.OK,
  };
};
```

> info **Astuce** Soyez conscient que `NestFactory.createApplicationContext` n'enveloppe pas les méthodes du contrôleur avec des améliorations ( garde, intercepteurs, etc.). Pour cela, vous devez utiliser la méthode `NestFactory.create`.

Vous pouvez également transmettre l'objet `event` à, disons, un fournisseur `EventsService` qui peut le traiter et renvoyer une valeur correspondante (en fonction de la valeur d'entrée et de votre logique métier).

```typescript
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const eventsService = appContext.get(EventsService);
  return eventsService.process(event);
};
```
