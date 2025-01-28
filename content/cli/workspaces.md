### Espaces de travail

Nest propose deux modes d'organisation du code :

- **mode standard** : utile pour construire des applications individuelles centrées sur un projet, qui ont leurs propres dépendances et paramètres, et qui n'ont pas besoin d'optimiser le partage de modules, ou d'optimiser des constructions complexes. C'est le mode par défaut.
- **mode monorepo** : ce mode traite les artefacts de code comme faisant partie d'un **monorepo** léger, et peut être plus approprié pour les équipes de développeurs et/ou les environnements multi-projets. Il automatise certaines parties du processus de construction pour faciliter la création et la composition de composants modulaires, encourage la réutilisation du code, facilite les tests d'intégration, facilite le partage d'artefacts à l'échelle du projet comme les règles `eslint` et d'autres politiques de configuration, et est plus facile à utiliser que des alternatives comme les sous-modules github. Le mode monorepo emploie le concept d'un **espace de travail**, représenté dans le fichier `nest-cli.json`, pour coordonner la relation entre les composants du monorepo.

Il est important de noter que pratiquement toutes les fonctionnalités de Nest sont indépendantes de votre mode d'organisation du code. Le **seul** effet de ce choix est la façon dont vos projets sont composés et dont les artefacts de construction sont générés. Toutes les autres fonctionnalités, de la CLI aux modules de base en passant par les modules complémentaires, fonctionnent de la même manière dans l'un ou l'autre mode.

De plus, vous pouvez facilement passer du **mode standard** au **mode monorepo** à tout moment, ce qui vous permet de retarder cette décision jusqu'à ce que les avantages de l'une ou l'autre approche deviennent plus clairs.

#### Mode standard

Lorsque vous lancez `nest new`, un nouveau **projet** est créé pour vous en utilisant un schéma intégré. Nest effectue les opérations suivantes :

1. Créé un nouveau dossier, correspondant à l'argument `name` que vous fournissez à `nest new`
2. Remplit ce dossier avec des fichiers par défaut correspondant à une application de base minimale de Nest. Vous pouvez examiner ces fichiers dans le dépôt [typescript-starter](https://github.com/nestjs/typescript-starter).
3. Fournit des fichiers additionnels tels que `nest-cli.json`, `package.json` et `tsconfig.json` qui configurent et activent divers outils pour compiler, tester et servir votre application.

A partir de là, vous pouvez modifier les fichiers de démarrage, ajouter de nouveaux composants, ajouter des dépendances (par exemple, `npm install`), et développer votre application comme indiqué dans le reste de cette documentation.

#### Mode monorepo

Pour activer le mode monorepo, vous commencez avec une structure en _mode standard_, et vous ajoutez des **projets**. Un projet peut être une **application** complète (que vous ajoutez à l'espace de travail avec la commande `nest generate app`) ou une **bibliothèque** (que vous ajoutez à l'espace de travail avec la commande `nest generate library`). Nous discuterons des détails de ces types spécifiques de composants de projet plus loin. Le point clé à noter maintenant est que c'est **l'acte d'ajouter un projet** à une structure existante en mode standard qui **convertit** cette structure en mode monorepo. Prenons un exemple.

Si nous exécutons:

```bash
$ nest new mon-projet
```

Nous avons construit une structure en _mode standard_, avec une structure de dossiers qui ressemble à ceci :

<div class="file-tree">
  <div class="item">node_modules</div>
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">app.service.ts</div>
    <div class="item">main.ts</div>
  </div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">.eslint.config.mjs</div>
</div>

Nous pouvons convertir cette structure en mode monorepo de la manière suivante :

```bash
$ cd mon-projet
$ nest generate app mon-app
```

A ce stade, `nest` convertit la structure existante en une structure **en mode monorepo**. Cela entraîne quelques changements importants. La structure des dossiers ressemble maintenant à ceci :

<div class="file-tree">
  <div class="item">apps</div>
    <div class="children">
      <div class="item">mon-app</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">app.controller.ts</div>
          <div class="item">app.module.ts</div>
          <div class="item">app.service.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
      <div class="item">mon-projet</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">app.controller.ts</div>
          <div class="item">app.module.ts</div>
          <div class="item">app.service.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
    </div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">.eslint.config.mjs</div>
</div>

Le schéma `generate app` a réorganisé le code - en déplaçant chaque projet **application** dans le dossier `apps`, et en ajoutant un fichier `tsconfig.app.json` spécifique au projet dans le dossier racine de chaque projet. Notre application originale `mon-projet` est devenue le **projet par défaut** pour le monorepo, et est maintenant un pair de l'application `mon-app` qui vient d'être ajoutée, située dans le dossier `apps`. Nous couvrirons les projets par défaut plus loin.

> error **Attention** La conversion d'une structure de mode standard en monorepo ne fonctionne que pour les projets qui ont suivi la structure canonique du projet Nest. Spécifiquement, lors de la conversion, le schéma tente de relocaliser les dossiers `src` et `test` dans un dossier projet sous le dossier `apps` à la racine. Si un projet n'utilise pas cette structure, la conversion échouera ou produira des résultats peu fiables.

#### Projets d'espace de travail

Un monorepo utilise le concept d'espace de travail pour gérer ses entités membres. Les espaces de travail sont composés de **projets**. Un projet peut être soit :

- une **application** : une application Nest complète comprenant un fichier `main.ts` pour démarrer l'application. En dehors des considérations de compilation et de construction, un projet de type application au sein d'un espace de travail est fonctionnellement identique à une application au sein d'une structure _standard mode_.
- une **bibliothèque** : une bibliothèque est un moyen d'empaqueter un ensemble de fonctionnalités à usage général (modules, fournisseurs, contrôleurs, etc.) qui peuvent être utilisées dans d'autres projets. Une bibliothèque ne peut pas fonctionner seule, et n'a pas de fichier `main.ts`. Pour en savoir plus sur les bibliothèques [ici](/cli/libraries).

Tous les espaces de travail ont un **projet par défaut** (qui devrait être un projet de type application). Il est défini par la propriété de haut niveau `"root"` dans le fichier `nest-cli.json`, qui pointe vers la racine du projet par défaut (voir les [propriétés CLI](/cli/monorepo#propriétés-cli) ci-dessous pour plus de détails). Habituellement, il s'agit de l'application en **mode standard** avec laquelle vous avez commencé, et que vous avez ensuite convertie en monorepo en utilisant `nest generate app`. Lorsque vous suivez ces étapes, cette propriété est remplie automatiquement.

Les projets par défaut sont utilisés par les commandes `nest` comme `nest build` et `nest start` lorsqu'un nom de projet n'est pas fourni.

Par exemple, dans la structure monorepo ci-dessus, l'exécution de

```bash
$ nest start
```

lancera l'application `mon-projet`. Pour démarrer `mon-app`, nous utiliserons :

```bash
$ nest start mon-app
```

#### Applications

Les projets de type application, ou ce que nous pourrions simplement appeler de manière informelle "applications", sont des applications Nest complètes que vous pouvez exécuter et déployer. Vous générez un projet de type application avec `nest generate app`.

Cette commande génère automatiquement un squelette de projet, incluant les dossiers standards `src` et `test` du [typescript starter](https://github.com/nestjs/typescript-starter). Contrairement au mode standard, un projet d'application dans un monorepo n'a aucune dépendance de paquetage (`package.json`) ou d'autres artefacts de configuration de projet comme `.prettierrc` et `.eslint.config.mjs`. A la place, les dépendances et les fichiers de configuration de la monorepo sont utilisés.

Cependant, le schéma génère un fichier `tsconfig.app.json` spécifique au projet dans le dossier racine du projet. Ce fichier de configuration définit automatiquement les options de compilation appropriées, y compris le dossier de sortie de la compilation. Le fichier étend le fichier `tsconfig.json` de niveau supérieur (monorepo), de sorte que vous pouvez gérer les paramètres globaux à l'échelle du monorepo, mais les remplacer si nécessaire au niveau du projet.

#### Bibliothèques

Comme nous l'avons mentionné, les projets de type bibliothèque, ou simplement "bibliothèques", sont des paquets de composants Nest qui doivent être composés dans des applications pour fonctionner. Vous générez un projet de type bibliothèque avec `nest generate library`. Décider de la place d'une bibliothèque est une décision de conception architecturale. Nous discutons des bibliothèques en profondeur dans le chapitre [libraries](/cli/libraries).

#### Propriétés CLI

Nest conserve les métadonnées nécessaires à l'organisation, la construction et le déploiement des projets standard et monorepo dans le fichier `nest-cli.json`. Nest ajoute et met à jour automatiquement ce fichier au fur et à mesure que vous ajoutez des projets, de sorte que vous n'avez généralement pas besoin d'y penser ou d'éditer son contenu. Cependant, il y a certains paramètres que vous pouvez vouloir changer manuellement, il est donc utile d'avoir une vue d'ensemble de ce fichier.

Après avoir exécuté les étapes ci-dessus pour créer un monorepo, notre fichier `nest-cli.json` ressemble à ceci :

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/mon-projet/src",
  "monorepo": true,
  "root": "apps/mon-projet",
  "compilerOptions": {
    "webpack": true,
    "tsConfigPath": "apps/mon-projet/tsconfig.app.json"
  },
  "projects": {
    "mon-projet": {
      "type": "application",
      "root": "apps/mon-projet",
      "entryFile": "main",
      "sourceRoot": "apps/mon-projet/src",
      "compilerOptions": {
        "tsConfigPath": "apps/mon-projet/tsconfig.app.json"
      }
    },
    "mon-app": {
      "type": "application",
      "root": "apps/mon-app",
      "entryFile": "main",
      "sourceRoot": "apps/mon-app/src",
      "compilerOptions": {
        "tsConfigPath": "apps/mon-app/tsconfig.app.json"
      }
    }
  }
}
```

Le dossier est divisé en plusieurs sections :

- une section globale avec des propriétés de premier niveau contrôlant les paramètres standard et les paramètres à l'échelle du monorepo
- une propriété de premier niveau (`"projects"`) contenant des métadonnées sur chaque projet. Cette section n'est présente que pour les structures en mode monorepo.

Les propriétés de premier niveau sont les suivantes :

- `"collection"`: pointe sur la collection de schémas utilisés pour générer des composants ; en général, vous ne devez pas modifier cette valeur.
- `"sourceRoot"`: pointe sur la racine du code source du projet unique dans les structures en mode standard, ou sur le _projet par défaut_ dans les structures en mode monorepo
- `"compilerOptions"`: une carte avec des clés spécifiant les options du compilateur et des valeurs spécifiant le réglage de l'option ; voir les détails ci-dessous
- `"generateOptions"`: une carte dont les clés spécifient les options globales de génération et les valeurs spécifient les paramètres de l'option ; voir les détails ci-dessous
- `"monorepo"`: (monorepo uniquement) pour une structure en mode monorepo, cette valeur est toujours `vrai`.
- `"root"`: (monorepo uniquement) pointe sur la racine du _projet par défaut_.

#### Options globales du compilateur

Ces propriétés spécifient le compilateur à utiliser ainsi que diverses options qui affectent **toutes** les étapes de compilation, qu'elles fassent partie de `nest build` ou de `nest start`, et quel que soit le compilateur, qu'il s'agisse de `tsc` ou de webpack.

| Nom de la propriété | Type de valeur de la propriété | Description                                                                                                                                                                                                                                                    |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webpack`           | boolean             | Si `true`, utiliser le [compilateur webpack](https://webpack.js.org/). Si `false` ou non présent, utiliser `tsc`. En mode monorepo, la valeur par défaut est `true` (utilisation de webpack), en mode standard, la valeur par défaut est `false` (utilisation de `tsc`). Voir ci-dessous pour plus de détails. (déprécié : utiliser `builder` à la place) |
| `tsConfigPath`      | string              | (**monorepo uniquement**) Pointe vers le fichier contenant les paramètres `tsconfig.json` qui seront utilisés lorsque `nest build` ou `nest start` est appelé sans l'option `project` (par exemple, lorsque le projet par défaut est construit ou démarré).               |
| `webpackConfigPath` | string              | Pointe vers un fichier d'options webpack. S'il n'est pas spécifié, Nest recherche le fichier `webpack.config.js`. Voir ci-dessous pour plus de détails.                                                                                                                   |
| `deleteOutDir`      | boolean             | Si `true`, à chaque fois que le compilateur est invoqué, il va d'abord supprimer le répertoire de sortie de la compilation (tel que configuré dans `tsconfig.json`, où la valeur par défaut est `./dist`).                                                                |
| `assets`            | array               | Permet de distribuer automatiquement les assets non-TypeScript lorsqu'une étape de compilation commence (la distribution des assets n'a **pas** lieu lors des compilations incrémentales en mode `--watch`). Voir ci-dessous pour plus de détails.                        |
| `watchAssets`       | boolean             | Si `true`, l'exécution se fait en mode veille, en surveillant **tous** les éléments non-TypeScript. (Pour un contrôle plus fin des assets à surveiller, voir la section [Assets](cli/monorepo#ressources) ci-dessous).                                                        |
| `manualRestart`     | boolean             | Si `true`, active le raccourci `rs` pour redémarrer manuellement le serveur. La valeur par défaut est `false`.                                                                                                                                                            |
| `builder`           | string/object       | Indique au CLI quel `builder` utiliser pour compiler le projet (`tsc`, `swc`, ou `webpack`). Pour personnaliser le comportement du constructeur, vous pouvez passer un objet contenant deux attributs : `type` (`tsc`, `swc`, ou `webpack`) et `options`.                 |
| `typeCheck`         | boolean             | Si `true`, active la vérification de type pour les projets pilotés par SWC (quand `builder` est `swc`). La valeur par défaut est `false`.                                                                                                                                 |

#### Options globales de generate

Ces propriétés spécifient les options de génération par défaut à utiliser par la commande `nest generate`.

| Nom de la propriété | Type de valeur de la propriété | Description                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec`              | boolean _or_ object | Si la valeur est un booléen, une valeur de `true` active la génération de `spec` par défaut et une valeur de `false` la désactive. Un flag passé sur la ligne de commande CLI écrase ce paramètre, tout comme le paramètre `generateOptions` spécifique au projet (voir plus bas). Si la valeur est un objet, chaque clé représente un nom de schéma, et la valeur booléenne détermine si la génération de spécifications par défaut est activée / désactivée pour ce schéma spécifique. |
| `flat`              | boolean             | Si la valeur est `true`, toutes les commandes de génération généreront une structure plate.                                                                                                                                                                                                                                                                                                                                                   |

L'exemple suivant utilise une valeur booléenne pour spécifier que la génération de fichiers spec doit être désactivée par défaut pour tous les projets :

```javascript
{
  "generateOptions": {
    "spec": false
  },
  ...
}
```

L'exemple suivant utilise une valeur booléenne pour spécifier que la génération de fichiers plats doit être la valeur par défaut pour tous les projets :

```javascript
{
  "generateOptions": {
    "flat": true
  },
  ...
}
```

Dans l'exemple suivant, la génération du fichier `spec` est désactivée uniquement pour les schémas `service` (par exemple, `nest generate service...`) :

```javascript
{
  "generateOptions": {
    "spec": {
      "service": false
    }
  },
  ...
}
```

> warning **Attention** When specifying the `spec` as an object, the key for the generation schematic does not currently support automatic alias handling. This means that specifying a key as for example `service: false` and trying to generate a service via the alias `s`, the spec would still be generated. To make sure both the normal schematic name and the alias work as intended, specify both the normal command name as well as the alias, as seen below.
>
> ```javascript
> {
>   "generateOptions": {
>     "spec": {
>       "service": false,
>       "s": false
>     }
>   },
>   ...
> }
> ```

#### Project-specific generate options

In addition to providing global generate options, you may also specify project-specific generate options. The project specific generate options follow the exact same format as the global generate options, but are specified directly on each project.

Project-specific generate options override global generate options.

```javascript
{
  "projects": {
    "cats-project": {
      "generateOptions": {
        "spec": {
          "service": false
        }
      },
      ...
    }
  },
  ...
}
```

> warning **Warning** L'ordre de priorité des options de génération est le suivant. Les options spécifiées sur la ligne de commande CLI sont prioritaires sur les options spécifiques au projet. Les options spécifiques au projet ont la priorité sur les options globales.

#### Compilateur spécifié

La raison pour laquelle les compilateurs par défaut sont différents est que pour les grands projets (par exemple, plus typiques dans une monorepo) webpack peut avoir des avantages significatifs en termes de temps de construction et de production d'un fichier unique regroupant tous les composants du projet. Si vous souhaitez générer des fichiers individuels, mettez `"webpack"` à `false`, ce qui amènera le processus de construction à utiliser `tsc` (ou `swc`).

#### Options Webpack

Le fichier d'options de webpack peut contenir des [options de configuration de webpack](https://webpack.js.org/configuration/) standards. Par exemple, pour dire à webpack de regrouper les `node_modules` (qui sont exclus par défaut), ajoutez ce qui suit à `webpack.config.js` :

```javascript
module.exports = {
  externals: [],
};
```

Comme le fichier de configuration de webpack est un fichier JavaScript, vous pouvez même exposer une fonction qui prend des options par défaut et renvoie un objet modifié :

```javascript
module.exports = function (options) {
  return {
    ...options,
    externals: [],
  };
};
```

#### Ressources

La compilation TypeScript distribue automatiquement la sortie du compilateur (fichiers `.js` et `.d.ts`) dans le répertoire de sortie spécifié. Il peut aussi être pratique de distribuer des fichiers non TypeScript, tels que les fichiers `.graphql`, `images`, `.html` et d'autres ressources. Cela vous permet de considérer `nest build` (et toute étape de compilation initiale) comme une étape légère de **build de développement**, où vous pouvez éditer des fichiers non-TypeScript et effectuer des compilations et des tests itératifs.
Les ressources doivent être situées dans le dossier `src`, sinon elles ne seront pas copiées.

La valeur de la clé `assets` doit être un tableau d'éléments spécifiant les fichiers à distribuer. Les éléments peuvent être de simples chaînes de caractères avec des spécifications de fichiers de type `glob`, par exemple :

```typescript
"assets": ["**/*.graphql"],
"watchAssets": true,
```

Pour un contrôle plus fin, les éléments peuvent être des objets avec les clés suivantes :

- `"include"`: spécifications de fichiers de type `glob` pour les actifs à distribuer
- `"exclude"`: spécifications de fichiers de type `glob` pour les actifs à **exclure** de la liste `include`.
- `"outDir"`: une chaîne spécifiant le chemin (relatif au dossier racine) où les ressources doivent être distribuées. Par défaut, il s'agit du même répertoire de sortie que celui configuré pour la sortie du compilateur.
- `"watchAssets"`: booléen ; si `true`, s'exécute en mode veille en surveillant les actifs spécifiés

Par exemple :

```typescript
"assets": [
  { "include": "**/*.graphql", "exclude": "**/exclus.graphql", "watchAssets": true },
]
```

> warning **Attention** Le fait de définir `watchAssets` dans une propriété `compilerOptions` de premier niveau écrase tout réglage de `watchAssets` dans la propriété `assets`.

#### Propriétés du projet

Cet élément n'existe que pour les structures en mode monorepo. Vous ne devez généralement pas modifier ces propriétés, car elles sont utilisées par Nest pour localiser les projets et leurs options de configuration au sein du monorepo.
