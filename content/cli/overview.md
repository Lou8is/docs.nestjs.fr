### Vue d'ensemble

La [CLI Nest](https://github.com/nestjs/nest-cli) est un outil d'interface de ligne de commande qui vous aide à initialiser, à développer et à maintenir vos applications Nest. Elle vous assiste de plusieurs manières, notamment en élaborant le projet, en le servant en mode développement, et en construisant et en regroupant l'application pour la distribution en production. Elle intègre les meilleures pratiques architecturales afin d'encourager la création d'applications bien structurées.

#### Installation

**Note** : Dans ce guide, nous décrivons l'utilisation de [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) pour installer des paquets, y compris l'interface de programmation Nest. D'autres gestionnaires de paquets peuvent être utilisés à votre discrétion. Avec npm, vous disposez de plusieurs options pour gérer la façon dont la ligne de commande de votre système d'exploitation résout l'emplacement du fichier binaire de l'interface de programmation `nest`. Ici, nous décrivons l'installation du binaire `nest` globalement en utilisant l'option `-g`. Cela apporte une certaine commodité, et c'est l'approche que nous adoptons tout au long de la documentation. Notez que l'installation globale de **n'importe quel** paquet `npm` laisse à l'utilisateur la responsabilité de s'assurer qu'il utilise la bonne version. Cela signifie également que si vous avez différents projets, chacun d'entre eux utilisera la **même** version de l'interface de programmation. Une alternative raisonnable est d'utiliser le programme [npx](https://github.com/npm/cli/blob/latest/docs/lib/content/commands/npx.md), intégré dans le clique `npm` (ou des fonctionnalités similaires avec d'autres gestionnaires de paquets) pour s'assurer que vous exécutez une **version gérée** de l'interface de programmation de Nest. Nous vous recommandons de consulter la [documentation npx](https://github.com/npm/cli/blob/latest/docs/lib/content/commands/npx.md) et/ou votre équipe de support DevOps pour plus d'informations.

Installez la CLI globalement en utilisant la commande `npm install -g` (voir la **Note** ci-dessus pour plus de détails sur les installations globales).

```bash
$ npm install -g @nestjs/cli
```

> info **Astuce** Alternativement, vous pouvez utiliser cette commande `npx @nestjs/cli@latest` sans installer la CLI globalement.

#### Processus de base

Une fois installée, vous pouvez invoquer des commandes CLI directement depuis la ligne de commande de votre système d'exploitation grâce à l'exécutable `nest`. Voyez les commandes `nest` disponibles en entrant ce qui suit :

```bash
$ nest --help
```

Obtenez de l'aide sur une commande individuelle en utilisant la construction suivante. Remplacez n'importe quelle commande, comme `new`, `add`, etc., à la place de `generate` dans l'exemple ci-dessous pour obtenir de l'aide détaillée sur cette commande :

```bash
$ nest generate --help
```

Pour créer, construire et exécuter un nouveau projet Nest de base en mode développement, accédez au dossier qui doit être le parent de votre nouveau projet et exécutez les commandes suivantes :

```bash
$ nest new mon-projet-nest
$ cd mon-projet-nest
$ npm run start:dev
```

Dans votre navigateur, ouvrez [http://localhost:3000](http://localhost:3000) pour voir la nouvelle application fonctionner. L'application sera automatiquement recompilée et rechargée lorsque vous modifierez l'un des fichiers sources.

> info **Astuce** Nous recommandons d'utiliser le [constructeur SWC](/recipes/swc) pour des constructions plus rapides (10x plus performant que le compilateur TypeScript par défaut).

#### Structure du projet

Lorsque vous lancez `nest new`, Nest génère une structure d'application standard en créant un nouveau dossier et en remplissant un ensemble initial de fichiers. Vous pouvez continuer à travailler dans cette structure par défaut, en ajoutant de nouveaux composants, comme décrit dans cette documentation. Nous nous référons à la structure du projet générée par `nest new` comme **mode standard**. Nest supporte également une structure alternative pour la gestion de multiples projets et bibliothèques appelée **mode monorepo**.

Hormis quelques considérations spécifiques sur le fonctionnement du processus de **construction** (essentiellement, le mode monorepo simplifie les complexités de construction qui peuvent parfois découler des structures de projet de type monorepo), et le support intégré des [library](/cli/libraries), le reste des fonctionnalités de Nest, et cette documentation, s'appliquent de la même manière aux structures de projet en mode standard et en mode monorepo. En fait, vous pouvez facilement passer du mode standard au mode monorepo à n'importe quel moment dans le futur, vous pouvez donc reporter cette décision en toute sécurité pendant que vous apprenez encore à connaître Nest.

Vous pouvez utiliser l'un ou l'autre mode pour gérer plusieurs projets. Voici un résumé rapide des différences :

| Fonctionnalité                                        | Mode standard                                                      | Mode Monorepo                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| Projets multiples                                     | Structure de système de fichiers séparée                           | Structure de système de fichiers unique                    |
| `node_modules` & `package.json`                       | Instances distinctes                                               | Partagés au sein du monorepo                             |
| Compilateur par défaut                                | `tsc`                                                              | webpack                                                    |
| Paramètres du compilateur                             | Spécifiés séparément                                               | Valeurs par défaut de Monorepo qui peuvent être modifiées par projet |
| Fichiers de configuration tels `.eslintrc.js`, `.prettierrc`, etc. | Spécifiés séparément                                               | Partagés au sein du monorepo                  |
| commandes `nest build` et `nest start`                | La cible est automatiquement définie par défaut comme étant le (seul) projet dans le contexte | La cible est par défaut le **projet par défaut** dans le monorepo |
| Bibliothèques                                         | Géré manuellement, généralement via npm packaging                  | Support intégré, y compris la gestion des routes et le bundling |

Lisez les sections [Espaces de travail](/cli/monorepo) et [Bibliothèques](/cli/libraries) pour obtenir des informations plus détaillées qui vous aideront à choisir le mode qui vous convient le mieux.

<app-banner-courses></app-banner-courses>

#### Syntaxe des commandes CLI

Toutes les commandes `nest` suivent le même format :

```bash
nest commandOuAlias argumentRequis [argumentOptionnel] [options]
```

Par exemple:

```bash
$ nest new mon-projet-nest --dry-run
```

Ici, `new` est la _commandOuAlias_. La commande `new` a un alias de `n`. `mon-projet-nest` est l'_argument_ requis. Si un _argumentRequis_ n'est pas fourni sur la ligne de commande, `nest` le demandera. De plus, `--dry-run` a une forme abrégée équivalente `-d`. En gardant cela à l'esprit, la commande suivante est l'équivalent de ce qui précède :

```bash
$ nest n mon-projet-nest -d
```

La plupart des commandes, et certaines options, ont des alias. Essayez de lancer `nest new --help` pour voir ces options et alias, et pour confirmer votre compréhension des constructions ci-dessus.

#### Vue d'ensemble des commandes

Lancez `nest <commande> --help` pour n'importe laquelle des commandes suivantes pour voir les options spécifiques à la commande.

Voir [usage](/cli/usages) pour une description détaillée de chaque commande.

| Commande   | Alias | Description                                                                                                                  |
| ---------- | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| `new`      | `n`   | Crée une nouvelle application en _mode standard_ avec tous les fichiers de base nécessaires à son fonctionnement.            |
| `generate` | `g`   | Génère et/ou modifie des fichiers sur la base d'un schéma.                                                                   |
| `build`    |       | Compile une application ou un espace de travail dans un dossier de sortie.                                                   |
| `start`    |       | Compile et exécute une application (ou un projet par défaut dans un espace de travail).                                      |
| `add`      |       | Importe une bibliothèque qui a été empaquetée en tant que **bibliothèque Nest**, en exécutant son schéma d'installation.     |
| `info`     | `i`   | Affiche des informations sur les packages Nest installés et d'autres informations utiles sur le système.                     |

#### Prérequis

La CLI Nest nécessite un binaire Node.js construit avec le [support d'internationalisation](https://nodejs.org/api/intl.html) (ICU), comme les binaires officiels de la [page du projet Node.js](https://nodejs.org/en/download). Si vous rencontrez des erreurs liées à ICU, vérifiez que votre binaire répond à cette exigence.

```bash
node -p process.versions.icu
```

Si la commande affiche `undefined`, votre binaire Node.js ne supporte pas l'internationalisation.
