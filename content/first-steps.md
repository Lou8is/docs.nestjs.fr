### Premiers pas

Dans cette série d'articles, vous apprendrez les **fondamentaux** de Nest. Pour vous familiariser avec les éléments essentiels des applications Nest, nous construirons une application CRUD de base avec des fonctionnalités qui couvrent les bases de nombreux sujets.

#### Langage

Nous sommes amoureux de [TypeScript](https://www.typescriptlang.org/), mais surtout de [Node.js](https://nodejs.org/en/). C'est pourquoi Nest est compatible à la fois avec TypeScript et **le JavaScript pur**. Nest profite des dernières fonctionnalités du langage, donc pour l'utiliser avec du JavaScript de base, nous avons besoin d'un compilateur [Babel](https://babeljs.io/).

Nous utiliserons principalement TypeScript dans les exemples que nous fournissons, mais vous pouvez toujours **changer les extraits de code** en syntaxe JavaScript pur (il suffit de cliquer pour basculer le bouton de langage dans le coin supérieur droit de chaque extrait).

#### Prérequis

Veuillez vous assurer que [Node.js](https://nodejs.org) (version >= 16) est installé sur votre système d'exploitation.

#### Mise en place

La mise en place d'un nouveau projet est assez simple avec la [CLI Nest](/cli/overview). Si [npm](https://www.npmjs.com/) est installé, vous pouvez créer un nouveau projet Nest à l'aide des commandes suivantes dans le terminal de votre système d'exploitation :

```bash
$ npm i -g @nestjs/cli
$ nest new nom-du-projet
```

> info **Astuce** Pour créer un nouveau projet avec l'ensemble des fonctionnalités [plus strictes](https://www.typescriptlang.org/tsconfig#strict) de TypeScript, passez le flag `--strict` à la commande `nest new`.

Le répertoire `nom-du-projet` sera créé, les modules node et quelques autres fichiers de base seront installés, et un répertoire `src/` sera créé et rempli avec plusieurs fichiers de base.

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.spec.ts</div>
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">app.service.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

Voici un bref aperçu de ces fichiers de base :

|                          |                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `app.controller.ts`      | Un contrôleur de base avec une seule route.                                                                                    |
| `app.controller.spec.ts` | Les tests unitaires pour le contrôleur.                                                                                        |
| `app.module.ts`          | Le module racine de l'application.                                                                                             |
| `app.service.ts`         | Un service de base avec une seule méthode.                                                                                     |
| `main.ts`                | Le fichier d'entrée de l'application qui utilise la fonction de base `NestFactory` pour créer une instance d'application Nest. |

Le fichier `main.ts` inclut une fonction asynchrone, qui va **bootstrapper** notre application :

```typescript
@@filename(main)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

Pour créer une instance d'application Nest, nous utilisons la classe `NestFactory`. `NestFactory` expose quelques méthodes statiques qui permettent de créer une instance d'application. La méthode `create()` renvoie un objet application, qui satisfait à l'interface `INestApplication`. Cet objet fournit un ensemble de méthodes qui sont décrites dans les chapitres suivants. Dans l'exemple `main.ts` ci-dessus, nous démarrons simplement notre listener HTTP, qui permet à l'application d'attendre les requêtes HTTP entrantes.

Notez qu'un projet conçu à l'aide de l'interface de programmation Nest crée une structure de projet initiale qui encourage les développeurs à suivre la convention consistant à conserver chaque module dans son propre répertoire.

> info **Astuce** Par défaut, si une erreur survient lors de la création de l'application, votre application sortira avec le code `1`. Si vous voulez qu'elle lève une erreur à la place, désactivez l'option `abortOnError` (par exemple, `NestFactory.create(AppModule, {{ '{' }} abortOnError: false {{ '}' }})`).

<app-banner-courses></app-banner-courses>

#### Plateforme

Nest a pour objectif d'être un framework indépendant de toute plateforme. L'indépendance vis-à-vis des plateformes permet de créer des parties logiques réutilisables dont les développeurs peuvent tirer parti dans différents types d'applications. Techniquement, Nest est capable de fonctionner avec n'importe quel framework HTTP Node une fois qu'un adaptateur est créé. Deux plateformes HTTP sont prises en charge dès le départ : [express](https://expressjs.com/) et [fastify](https://www.fastify.io). Vous pouvez choisir celle qui correspond le mieux à vos besoins.

|                    |                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform-express` | [Express](https://expressjs.com/) est un framework web minimaliste bien connu pour node. C'est une bibliothèque testée et prête pour la production, avec beaucoup de ressources implémentées par la communauté. Le paquet `@nestjs/platform-express` est utilisé par défaut. Beaucoup d'utilisateurs et de cas d'usages se satisfont d'Express, et aucune action n'est nécessaire pour l'activer. |
| `platform-fastify` | [Fastify](https://www.fastify.io/) est un framework de haute performance et de faible encombrement qui vise à fournir un maximum d'efficacité et de rapidité. Lisez comment l'utiliser [ici](/techniques/performance).                                                                                                                                  |

Quelle que soit la plate-forme utilisée, elle expose sa propre interface d'application. Celles-ci sont respectivement appelées `NestExpressApplication` et `NestFastifyApplication`.

Lorsque vous passez un type à la méthode `NestFactory.create()`, comme dans l'exemple ci-dessous, l'objet `app` aura des méthodes disponibles exclusivement pour cette plateforme spécifique. Notez cependant que vous n'avez pas **besoin** de spécifier un type **sauf** si vous voulez accéder à l'API de la plateforme sous-jacente.

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```

#### Lancer l'application

Une fois le processus d'installation terminé, vous pouvez exécuter la commande suivante à l'invite de commande de votre système d'exploitation pour lancer l'application et démarrer l'écoute des requêtes HTTP entrantes :

```bash
$ npm run start
```

> info **Astuce** Afin d'accélérer le processus de développement (les builds sont x20 fois plus rapides), vous pouvez utiliser le [constructeur SWC](/recipes/swc) en passant le flag `-b swc` au script `start` comme suit `npm run start -- -b swc`.

Cette commande lance l'application avec le serveur HTTP écoutant sur le port défini dans le fichier `src/main.ts`. Une fois l'application lancée, ouvrez votre navigateur et naviguez vers `http://localhost:3000/`. Vous devriez voir le message `Hello World!`.

Pour surveiller les modifications apportées à vos fichiers, vous pouvez lancer l'application à l'aide de la commande suivante :

```bash
$ npm run start:dev
```

Cette commande surveille vos fichiers, recompile et recharge automatiquement le serveur.

#### Linting et formatage

La [CLI](/cli/overview) s'efforce de mettre en place un flux de travail de développement fiable à grande échelle. Ainsi, un projet Nest généré est livré avec un **linter** et un **formateur** de code préinstallés (respectivement [eslint](https://eslint.org/) et [prettier](https://prettier.io/)).

> info **Astuce** Vous n'êtes pas sûr du rôle des formateurs par rapport à celui des linters ? Apprenez la différence [ici](https://prettier.io/docs/en/comparison.html).

Pour assurer une stabilité et une extensibilité maximales, nous utilisons les paquets cli de base [`eslint`](https://www.npmjs.com/package/eslint) et [`prettier`](https://www.npmjs.com/package/prettier). Cette configuration permet une intégration soignée des IDE avec les extensions officielles.

Pour les environnements headless où un IDE n'est pas pertinent (Intégration Continue, Git hooks, etc.), un projet Nest est livré avec des scripts `npm` prêts à l'emploi.

```bash
# Lint and autofix with eslint
$ npm run lint

# Format with prettier
$ npm run format
```
