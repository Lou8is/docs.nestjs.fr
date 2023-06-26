### Introduction

Nest (NestJS) est un framework permettant de construire des applications côté serveur [Node.js](https://nodejs.org/) efficaces et évolutives. Il utilise le JavaScript progressif, est construit avec et supporte entièrement [TypeScript](http://www.typescriptlang.org/) (tout en permettant aux développeurs de coder en JavaScript pur) et combine des éléments de la POO (programmation orientée objet), de la PF (programmation fonctionnelle) et de la FRP (programmation fonctionnelle réactive).

Sous le capot, Nest utilise un serveur HTTP robuste comme [Express](https://expressjs.com/) (par défaut) et peut également être configuré pour utiliser [Fastify](https://github.com/fastify/fastify) !

Nest fournit un niveau d'abstraction au-dessus de ces frameworks Node.js communs (Express/Fastify), mais expose également leurs API directement au développeur. Cela donne aux développeurs la liberté d'utiliser la myriade de modules tiers disponibles pour la plateforme sous-jacente.

#### Philosophie

Ces dernières années, grâce à Node.js, JavaScript est devenu la "lingua franca" du web pour les applications frontend et backend. Cela a donné naissance à des projets géniaux comme [Angular](https://angular.io/), [React](https://github.com/facebook/react) et [Vue](https://github.com/vuejs/vue), qui améliorent la productivité des développeurs et permettent la création d'applications frontend rapides, testables et extensibles. Cependant, bien qu'il existe de nombreuses bibliothèques, aides et outils superbes pour Node (et JavaScript côté serveur), aucun d'entre eux ne résout efficacement le problème principal de **l'Architecture**.

Nest fournit une architecture d'application prête à l'emploi qui permet aux développeurs et aux équipes de créer des applications hautement testables, évolutives, faiblement couplées et facilement maintenables. L'architecture est fortement inspirée par Angular.

#### Installation

Pour commencer, vous pouvez soit créer le projet à l'aide de la [CLI Nest] (/cli/overview), soit cloner un projet de départ (les deux produiront le même résultat).

Pour créer le projet à l'aide de l'interface de programmation Nest, exécutez les commandes suivantes. Cela créera un nouveau répertoire de projet et le remplira avec les fichiers de base initiaux de Nest et les modules de soutien, créant ainsi une structure de base conventionnelle pour votre projet. La création d'un nouveau projet à l'aide de l'interface de programmation **Nest** est recommandée pour les nouveaux utilisateurs. Nous poursuivrons cette approche dans [Premiers pas](first-steps).

```bash
$ npm i -g @nestjs/cli
$ nest new nom-du-projet
```

> info **Astuce** Pour créer un nouveau projet TypeScript avec des fonctionnalités plus strictes, passez le flag `--strict` à la commande `nest new`.

#### Alternatives

Il est également possible d'installer le projet de démarrage TypeScript avec **Git** :

```bash
$ git clone https://github.com/nestjs/typescript-starter.git projet
$ cd projet
$ npm install
$ npm run start
```

> info **Astuce** Si vous souhaitez cloner le dépôt sans l'historique git, vous pouvez utiliser [degit](https://github.com/Rich-Harris/degit).

Ouvrez votre navigateur et naviguez vers [`http://localhost:3000/`](http://localhost:3000/).

Pour installer la version JavaScript du projet de base, utilisez `javascript-starter.git` dans la séquence de commandes ci-dessus.

Vous pouvez également créer manuellement un nouveau projet à partir de zéro en installant le noyau et les fichiers de support avec **npm** (ou **yarn**). Dans ce cas, bien sûr, vous serez responsable de la création des fichiers de base du projet vous-même.

```bash
$ npm i --save @nestjs/core @nestjs/common rxjs reflect-metadata
```
