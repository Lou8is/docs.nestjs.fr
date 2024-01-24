### Référence des commandes de l'interface de ligne de commande (CLI)

#### nest new

Crée un nouveau projet Nest (mode standard).

```bash
$ nest new <nom> [options]
$ nest n <nom> [options]
```

##### Description

Crée et initialise un nouveau projet Nest. Demande de choisir le gestionnaire de paquets.

- Crée un dossier avec le `<nom>` donné
- Remplit le dossier avec les fichiers de configuration
- Crée des sous-dossiers pour le code source (`/src`) et les tests de bout en bout (end-to-end) (`/test`)
- Remplit les sous-dossiers avec les fichiers par défaut pour les composants de l'application et les tests.

##### Arguments

| Argument | Description                 |
|---------| --------------------------- |
| `<nom>` | Le nom du nouveau projet |

##### Options

| Option                                | Description                                                                                                                                                                                             |
| ------------------------------------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--dry-run`                           | Signale les changements qui seraient effectués, mais n'effectue pas de modifications sur le système de fichiers.<br/> Alias: `-d`                                                                       |
| `--skip-git`                          | Ignore l'initialisation du dépôt Git.<br/> Alias: `-g`                                                                                                                                                  |
| `--skip-install`                      | Ignore l'installation des paquets (ou dépendances).<br/> Alias: `-s`                                                                                                                                    |
| `--package-manager [package-manager]` | Spécifie le gestionnaire de paquets. Utilise `npm`, `yarn`, ou `pnpm`. Le gestionnaire de paquets doit être installé globalement.<br/> Alias: `-p`                                                      |
| `--language [language]`               | Spécifie le language de programmation (`TS` ou `JS`).<br/> Alias: `-l`                                                                                                                                  |
| `--collection [collectionName]`       | Spécifie la collection de schémas. Utilise le nom du package de l'installation npm contenant le schéma.<br/> Alias: `-c`                                                                                |
| `--strict`                            | Démarre le projet avec les indicateurs du compilateur TypeScript suivants: `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `forceConsistentCasingInFileNames`, `noFallthroughCasesInSwitch` |

#### nest generate

Génère et/ou modifie des fichiers en fonction d'un schéma.

```bash
$ nest generate <schéma> <nom> [options]
$ nest g <schéma> <nom> [options]
```

##### Arguments

| Argument  | Description                                                                                        |
|-----------|----------------------------------------------------------------------------------------------------|
| `<schéma>` | Le `schéma` ou la `collection:schéma` à générer. Veuillez consulter le tableau ci-dessous pour voir les schémas disponibles. |
| `<nom>`   | Le nom du composant généré.                                                                        |

##### Schémas

| Nom          | Alias | Description                                                                                                                    |
|--------------| ----- |--------------------------------------------------------------------------------------------------------------------------------|
| `app`        |       | Génère une nouvelle application au sein d'un monorépo (conversion en monorépo si c'est une structure standard)..               |
| `library`    | `lib` | Génère une nouvelle bibliothèque au sein d'un monorépo (conversion en monorépo si c'est une structure standard).               |
| `class`      | `cl`  | Génère une nouvelle classe.                                                                                                    |
| `controller` | `co`  | Génère une déclaration de contrôleur.                                                                                          |
| `decorator`  | `d`   | Génère un décorateur personnalisé.                                                                                             |
| `filter`     | `f`   | Génère une déclaration de filtre.                                                                                              |
| `gateway`    | `ga`  | Génère une déclaration de passerelle.                                                                                          |
| `guard`      | `gu`  | Génère une déclaration de garde.                                                                                               |
| `interface`  | `itf` | Génère un interface.                                                                                                           |
| `interceptor` | `itc` | Génère une déclaration d'intercepteur.                                                                                        |
| `middleware` | `mi`  | Génère une déclaration de middleware.                                                                                          |
| `module`     | `mo`  | Génère une déclaration de module.                                                                                              |
| `pipe`       | `pi`  | Génère une déclaration de pipe.                                                                                                |
| `provider`   | `pr`  | Génère une déclaration de fournisseur.                                                                                         |
| `resolver`   | `r`   | Génère une déclaration de résolveur.                                                                                           |
| `resource`   | `res` | Génère une nouvelle ressource CRUD. Pour plus de détails veuillez voir: [CRUD (resource) generator](/recipes/crud-generator). (TS seulement) |
| `service`    | `s`   | Génère une déclaration de service.                                                                                             |

##### Options

| Option                          | Description                                                                                                                         |
| ------------------------------- |-------------------------------------------------------------------------------------------------------------------------------------|
| `--dry-run`                     | Signale les modifications qui seraient apportées, mais n'effectue pas de modifications sur le système de fichiers.<br/> Alias: `-d` |
| `--project [project]`           | Le projet auquel cet élément devrait être ajouté.<br/> Alias: `-p`                                                                  |
| `--flat`                        | Ne génère pas de dossier pour cet élément.                                                                                          |
| `--collection [collectionName]` | Spécifie la collection de schémas. Utilise le nom du package de l'installation npm contenant le schéma.<br/> Alias: `-c`            |
| `--spec`                        | Impose la génération des fichiers de tests (par défaut).                                                                            |
| `--no-spec`                     | Désactive la génération des fichiers de tests.                                                                                      |

#### nest build

Compile une application ou un espace de travail dans un dossier de sortie.

La commande `build` est aussi responsable de:

- Mapper des chemins (si l'on utilise des alias de chemins) via `tsconfig-paths`
- Annoter des DTO avec des décorateurs OpenAPI (si le plugin CLI `@nestjs/swagger` est activé)
- Annoter des DTO avec des décorateurs GraphQL decorators (si le plugin CLI `@nestjs/graphql` CLI plugin est activé)

```bash
$ nest build <nom> [options]
```

##### Arguments

| Argument | Description                       |
|---------| --------------------------------- |
| `<nom>` | Le nom du projet à construire. |

##### Options

| Option            | Description                                                                                                                                                                                                         |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--path [path]`   | Chemin vers le fichier `tsconfig`. <br/>Alias `-p`                                                                                                                                                                  |
| `--config [path]` | Chemin vers le fichier de configuration `nest-cli`. <br/>Alias `-c`                                                                                                                                                 |
| `--watch`         | Exécute en mode "watch" (reload en direct).<br /> Si vous utilisez `tsc` pour compiler, vous pouvez écrire `rs` pour redémarrer l'application (si l'option `manualRestart` est défini avec `true`). <br/>Alias `-w` |
| `--builder [nom]` | Spécifie le générateur à utiliser pour la compilation. (`tsc`, `swc`, ou `webpack`). <br/>Alias `-b`                                                                                                                |
| `--webpack`       | Utilise webpack pour la compilation (Obsolète: utilisez `--builder webpack` à la place).                                                                                                                            |
| `--webpackPath`   | Chemin vers la configuration de webpack.                                                                                                                                                                            |
| `--tsc`           | Force l'utilisation de `tsc` pour la compilation.                                                                                                                                                                   |

#### nest start

Compile et exécute une application (ou le projet par défaut dans un espace de travail).

```bash
$ nest start <nom> [options]
```

##### Arguments

| Argument | Description                  |
|---------|------------------------------|
| `<nom>` | Le nom du projet à éxécuter. |

##### Options

| Option                 | Description                                                                                                                                  |
|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `--path [path]`        | Chemin vers le fichier `tsconfig`. <br/>Alias `-p`                                                                                           |
| `--config [path]`      | Chemin vers le fichier de configuration `nest-cli`. <br/>Alias `-c`                                                                          |
| `--watch`              | Exécute en mode "watch" (reload en direct) <br/>Alias `-w`                                                                                   |
| `--builder [nom]`      | Spécifie le générateur à utiliser pour la compilation. (`tsc`, `swc`, ou `webpack`). <br/>Alias `-b`                                         |
| `--preserveWatchOutput` | Conserve les anciens messages de la console en mode "watch" au lieu d'effacer' l'écran. (`tsc` mode watch uniquement)                        |
| `--watchAssets`        | Exécute en mode "watch" (reload en direct), surveille les fichiers non-TS (assets). Voir [Assets](cli/monorepo#assets) pour plus de details. |
| `--debug [hostport]`   | Exécute en mode debug (avec l'indicateur --inspect) <br/>Alias `-d`                                                                          |
| `--webpack`            | (Obsolète: utilisez `--builder webpack` à la place).                                                                                         |
| `--webpackPath`        | Chemin vers la configuration de webpack.                                                                                                     |
| `--tsc`                | FForce l'utilisation de `tsc` pour la compilation.                                                                                           |
| `--exec [binary]`      | Exécutable à utiliser (par défaut: `node`). <br/>Alias `-e`                                                                                          |
| `-- [key=value]`        | Arguments de la ligne de commande qui peuvent être référencés avec `process.argv`.                                                   |

#### nest add

Importe une bibliothèque qui a été mise en paquet en tant que  **nest library**, en exécutant son schéma d'installation.

```bash
$ nest add <nom> [options]
```

##### Arguments

| Argument | Description                        |
|---------| ---------------------------------- |
| `<nom>` | Le nom de la bibliothèque à importer. |

#### nest info

Affiche des informations sur les packages Nest installés ainsi que d'autres informations utiles sur le système. Par exemple :

```bash
$ nest info
```

```bash
 _   _             _      ___  _____  _____  _     _____
| \ | |           | |    |_  |/  ___|/  __ \| |   |_   _|
|  \| |  ___  ___ | |_     | |\ `--. | /  \/| |     | |
| . ` | / _ \/ __|| __|    | | `--. \| |    | |     | |
| |\  ||  __/\__ \| |_ /\__/ //\__/ /| \__/\| |_____| |_
\_| \_/ \___||___/ \__|\____/ \____/  \____/\_____/\___/

[System Information]
OS Version : macOS High Sierra
NodeJS Version : v16.18.0
[Nest Information]
microservices version : 10.0.0
websockets version : 10.0.0
testing version : 10.0.0
common version : 10.0.0
core version : 10.0.0
```
