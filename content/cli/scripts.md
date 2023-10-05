### CLI de Nest et scripts

Cette section fournit des informations supplémentaires sur la façon dont la commande `nest` interagit avec les compilateurs et les scripts afin d'aider les équipes DevOps à gérer l'environnement de développement.

Une application Nest est une application TypeScript **standard** qui doit être compilée en JavaScript avant de pouvoir être exécutée. Il existe plusieurs façons d'accomplir l'étape de compilation, et les développeurs/équipes sont libres de choisir celle qui leur convient le mieux. Dans cette optique, Nest fournit un ensemble d'outils prêts à l'emploi qui visent à accomplir les tâches suivantes :

- Fournir un processus de construction/exécution standard, disponible en ligne de commande, qui fonctionne simplement avec des valeurs par défaut raisonnables.
- Veiller à ce que le processus de construction/exécution soit **ouvert**, afin que les développeurs puissent accéder directement aux outils sous-jacents pour les personnaliser à l'aide de fonctionnalités et d'options natives.
- Rester un framework TypeScript/Node.js complètement standard, de sorte que l'ensemble du pipeline de compilation/déploiement/exécution puisse être géré par n'importe quel outil externe que l'équipe de développement choisit d'utiliser.

Cet objectif est atteint grâce à la combinaison de la commande `nest`, d'un compilateur TypeScript installé localement, et des scripts `package.json`. Nous décrivons ci-dessous comment ces technologies fonctionnent ensemble. Cela devrait vous aider à comprendre ce qui se passe à chaque étape du processus de construction/exécution, et comment personnaliser ce comportement si nécessaire.

#### The binaire nest

La commande `nest` est un binaire au niveau du système d'exploitation (c'est-à-dire qu'elle s'exécute à partir de la ligne de commande du système d'exploitation). Cette commande englobe en fait 3 domaines distincts, décrits ci-dessous. Nous recommandons de lancer les sous-commandes de construction (`nest build`) et d'exécution (`nest start`) via les scripts `package.json` fournis automatiquement lorsqu'un projet est construit (voir [typescript starter](https://github.com/nestjs/typescript-starter) si vous souhaitez commencer par cloner un dépôt, au lieu d'exécuter `nest new`).

#### Build

`nest build` est une enveloppe au-dessus du compilateur standard `tsc` ou du compilateur `swc` (pour les [projets standards](/cli/overview#structure-du-projet)) ou du bundler webpack utilisant le `ts-loader` (pour les [monorepos](/cli/overview#structure-du-projet)). Il n'ajoute aucune autre fonctionnalité ou étape de compilation, à l'exception de la gestion de `tsconfig-paths`. La raison pour laquelle il existe est que la plupart des développeurs, en particulier lorsqu'ils débutent avec Nest, n'ont pas besoin d'ajuster les options du compilateur (par exemple, le fichier `tsconfig.json`), ce qui peut parfois être délicat.

Voir la documentation [nest build](/cli/usages#nest-build) pour plus de détails.

#### Exécution

`nest start` s'assure simplement que le projet a été compilé (comme `nest build`), puis invoque la commande `node` d'une manière portable et facile pour exécuter l'application compilée. Comme pour les builds, vous êtes libre de personnaliser ce processus selon vos besoins, soit en utilisant la commande `nest start` et ses options, soit en la remplaçant complètement. L'ensemble du processus est un pipeline standard de construction et d'exécution d'applications TypeScript, et vous êtes libre de gérer le processus comme tel.

Voir la documentation [nest start](/cli/usages#nest-start) pour plus de détails.

#### Génération

Les commandes `nest generate`, comme leur nom l'indique, génèrent de nouveaux projets Nest, ou des composants à l'intérieur de ceux-ci.

#### Scripts de packages

L'exécution des commandes `nest` au niveau des commandes du système d'exploitation nécessite que le binaire `nest` soit installé globalement. C'est une fonctionnalité standard de npm, et en dehors du contrôle direct de Nest. Une conséquence de ceci est que le binaire `nest` installé globalement n'est **pas** géré comme une dépendance de projet dans `package.json`. Par exemple, deux développeurs différents peuvent utiliser deux versions différentes du binaire `nest`. La solution standard pour cela est d'utiliser des scripts de package afin de traiter les outils utilisés dans les étapes de construction et d'exécution comme des dépendances de développement.

Lorsque vous lancez `nest new`, ou clonez le [typescript starter](https://github.com/nestjs/typescript-starter), Nest remplit les scripts `package.json` du nouveau projet avec des commandes comme `build` et `start`. Il installe également les outils de compilation sous-jacents (comme `typescript`) en tant que **dépendances dev**.

Vous lancez le build et exécutez des scripts avec des commandes comme :

```bash
$ npm run build
```

et

```bash
$ npm run start
```

Ces commandes utilisent les capacités de script de npm pour exécuter `nest build` ou `nest start` en utilisant le binaire **localement installé** `nest`. En utilisant ces scripts de paquets intégrés, vous avez une gestion complète des dépendances sur les commandes CLI de Nest*. Cela signifie qu'en suivant cette utilisation **recommandée**, tous les membres de votre organisation peuvent être assurés d'exécuter la même version des commandes.

\*Ceci s'applique aux commandes `build` et `start`. Les commandes `nest new` et `nest generate` ne font pas partie du pipeline de construction/exécution, elles opèrent donc dans un contexte différent, et ne sont pas accompagnées de scripts `package.json` intégrés.

Pour la plupart des développeurs/équipes, il est recommandé d'utiliser les scripts du package pour construire et exécuter leurs projets Nest. Vous pouvez entièrement personnaliser le comportement de ces scripts via leurs options (`--path`, `--webpack`, `--webpackPath`) et/ou personnaliser les fichiers d'options de `tsc` ou du compilateur webpack (par exemple, `tsconfig.json`) selon les besoins. Vous êtes également libre de lancer un processus de compilation complètement personnalisé pour compiler le TypeScript (ou même d'exécuter le TypeScript directement avec `ts-node`).

#### Rétrocompatibilité

Les applications Nest étant des applications purement TypeScript, les versions précédentes des scripts de construction/exécution Nest continueront à fonctionner. Vous n'êtes pas obligé de les mettre à jour. Vous pouvez choisir de profiter des nouvelles commandes `nest build` et `nest start` lorsque vous êtes prêt, ou continuer à exécuter les scripts précédents ou personnalisés.

#### Migration

Bien que vous ne soyez pas obligé de faire des changements, vous pouvez vouloir migrer vers l'utilisation des nouvelles commandes CLI au lieu d'utiliser des outils tels que `tsc-watch` ou `ts-node`. Dans ce cas, installez simplement la dernière version de `@nestjs/cli`, à la fois globalement et localement :

```bash
$ npm install -g @nestjs/cli
$ cd  /some/project/root/folder
$ npm install -D @nestjs/cli
```

Vous pouvez alors remplacer les `scripts` définis dans `package.json` par les suivants :

```typescript
"build": "nest build",
"start": "nest start",
"start:dev": "nest start --watch",
"start:debug": "nest start --debug --watch",
```
