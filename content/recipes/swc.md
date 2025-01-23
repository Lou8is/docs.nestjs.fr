### SWC

[SWC](https://swc.rs/) (Speedy Web Compiler) est une plateforme extensible basée sur Rust qui peut être utilisée à la fois pour la compilation et le bundling.
L'utilisation de SWC avec Nest CLI est un moyen simple et efficace d'accélérer considérablement votre processus de développement.

> info **Astuce** SWC est environ **x20 fois plus rapide** que le compilateur TypeScript par défaut.

#### Installation

Pour commencer, installez d'abord quelques packages :

```bash
$ npm i --save-dev @swc/cli @swc/core
```

#### Pour commencer

Une fois le processus d'installation terminé, vous pouvez utiliser le constructeur `swc` avec Nest CLI, comme suit :

```bash
$ nest start -b swc
# OU nest start --builder swc
```

> info **Astuce** Si votre dépôt est un monorepo, consultez [cette section](/recipes/swc#monorepo).

Au lieu de passer le drapeau `-b`, vous pouvez également définir la propriété `compilerOptions.builder` à `"swc"` dans votre fichier `nest-cli.json`, comme ceci:

```json
{
  "compilerOptions": {
    "builder": "swc"
  }
}
```

Pour personnaliser le comportement du constructeur, vous pouvez lui passer un objet contenant deux attributs, `type` (`"swc"`) et `options`, comme suit :

```json
"compilerOptions": {
  "builder": {
    "type": "swc",
    "options": {
      "swcrcPath": "infrastructure/.swcrc",
    }
  }
}
```

Pour exécuter l'application en mode veille, utilisez la commande suivante :

```bash
$ nest start -b swc -w
# OU nest start --builder swc --watch
```

#### Vérification de type

SWC n'effectue pas de vérification de type lui-même (contrairement au compilateur TypeScript par défaut), donc pour l'activer, vous devez utiliser l'option `--type-check` :

```bash
$ nest start -b swc --type-check
```

Cette commande demandera au CLI de Nest d'exécuter `tsc` en mode `noEmit` en même temps que SWC, qui effectuera la vérification de type de manière asynchrone. Encore une fois, au lieu de passer le drapeau `--type-check`, vous pouvez aussi simplement mettre la propriété `compilerOptions.typeCheck` à `true` dans votre fichier `nest-cli.json`, comme ceci : 

```json
{
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

#### Plugins CLI (SWC)

L'option `--type-check` exécutera automatiquement les plugins **NestJS CLI** et produira un fichier de métadonnées sérialisé qui pourra être chargé par l'application au moment de l'exécution.

#### SWC configuration

SWC builder est préconfiguré pour répondre aux exigences des applications NestJS. Cependant, vous pouvez personnaliser la configuration en créant un fichier `.swcrc` dans le répertoire racine et en modifiant les options comme vous le souhaitez.

```json
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

#### Monorepo

Si votre dépôt est un monorepo, alors au lieu d'utiliser le constructeur `swc`, vous devez configurer `webpack` pour utiliser `swc-loader`.

Tout d'abord, installons le package nécessaire :

```bash
$ npm i --save-dev swc-loader
```

Une fois l'installation terminée, créez un fichier `webpack.config.js` dans le répertoire racine de votre application avec le contenu suivant :

```js
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: swcDefaultConfig,
        },
      },
    ],
  },
};
```

#### Monorepo et plugins CLI

Maintenant, si vous utilisez des plugins CLI, `swc-loader` ne les chargera pas automatiquement. A la place, vous devez créer un fichier séparé qui les chargera manuellement. Pour ce faire, il faut
déclarez un fichier `generate-metadata.ts` près du fichier `main.ts` avec le contenu suivant :

```ts
import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins';
import { ReadonlyVisitor } from '@nestjs/swagger/dist/plugin';

const generator = new PluginMetadataGenerator();
generator.generate({
  visitors: [new ReadonlyVisitor({ introspectComments: true, pathToSource: __dirname })],
  outputDir: __dirname,
  watch: true,
  tsconfigPath: 'apps/<name>/tsconfig.app.json',
});
```

> info **Astuce** Dans cet exemple, nous avons utilisé le plugin `@nestjs/swagger`, mais vous pouvez utiliser n'importe quel plugin de votre choix.

La méthode `generate()` accepte les options suivantes :

|                    |                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `watch`            | S'il faut surveiller les changements dans le projet.                                                 |
| `tsconfigPath`     | Chemin vers le fichier `tsconfig.json`. Relatif au répertoire de travail courant (`process.cwd()`).  |
| `outputDir`        | Chemin d'accès au répertoire dans lequel le fichier de métadonnées sera enregistré.                  |
| `visitors`         | Tableau des visiteurs qui seront utilisés pour générer des métadonnées.                              |
| `filename`         | Le nom du fichier de métadonnées. La valeur par défaut est `metadata.ts`.                            |
| `printDiagnostics` | Indique s'il faut imprimer les diagnostics dans le terminal. La valeur par défaut est `true`.        |

Enfin, vous pouvez exécuter le script `generate-metadata` dans une fenêtre de terminal séparée avec la commande suivante :

```bash
$ npx ts-node src/generate-metadata.ts
# OU npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

#### Pièges courants

Si vous utilisez TypeORM/MikroORM ou tout autre ORM dans votre application, vous pouvez rencontrer des problèmes d'importation circulaire. SWC ne gère pas bien les **importations circulaires**, vous devez donc utiliser la solution de contournement suivante :

```typescript
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>; // <--- remarquez le type "Relation<>" ici au lieu de "Profil".
}
```

> info **Astuce** Le type `Relation` est exporté du package `typeorm`.

Cela évite que le type de la propriété ne soit enregistré dans le code transposé dans les métadonnées de la propriété, évitant ainsi les problèmes de dépendance circulaire.

Si votre ORM ne propose pas de solution similaire, vous pouvez définir vous-même le type de l'enveloppe :

```typescript
/**
 * Type wrapper utilisé pour contourner le problème de dépendance circulaire des modules ESM 
 * causé par les métadonnées de réflexion qui sauvegardent le type de la propriété.
 */
export type WrapperType<T> = T; // WrapperType === Relation
```

Pour toutes les [injections de dépendances circulaires](/fundamentals/circular-dependency) de votre projet, vous devrez également utiliser le type de wrapper personnalisé décrit ci-dessus :

```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => ProfileService))
    private readonly profileService: WrapperType<ProfileService>,
  ) {};
}
```

### Jest + SWC

Pour utiliser SWC avec Jest, vous devez installer les packages suivants :

```bash
$ npm i --save-dev jest @swc/core @swc/jest
```

Une fois l'installation terminée, mettez à jour le fichier `package.json`/`jest.config.js` (en fonction de votre configuration) avec le contenu suivant :

```json
{
  "jest": {
    "transform": {
      "^.+\\.(t|j)s?$": ["@swc/jest"]
    }
  }
}
```

De plus, vous devrez ajouter les propriétés `transform` suivantes à votre fichier `.swcrc` : `legacyDecorator`, `decoratorMetadata` :

```json
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

Si vous utilisez des plugins NestJS CLI dans votre projet, vous devrez exécuter `PluginMetadataGenerator` manuellement. Naviguez vers [cette section](/recipes/swc#monorepo-et-plugins-cli) pour en savoir plus.

### Vitest

[Vitest](https://vitest.dev/) est un programme de test rapide et léger conçu pour fonctionner avec Vite. Il fournit une solution de test moderne, rapide et facile à utiliser qui peut être intégrée aux projets NestJS.

#### Installation

Pour commencer, installez d'abord les packages nécessaires :

```bash
$ npm i --save-dev vitest unplugin-swc @swc/core @vitest/coverage-v8
```

#### Configuration

Créez un fichier `vitest.config.ts` dans le répertoire racine de votre application avec le contenu suivant :

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
  },
  plugins: [
    // Ceci est nécessaire pour construire les fichiers de test avec SWC
    swc.vite({
      // Définissez explicitement le type de module pour éviter d'hériter de cette valeur à partir d'un fichier de configuration `.swcrc`.
      module: { type: 'es6' },
    }),
  ],
});
```

Ce fichier de configuration définit l'environnement Vitest, le répertoire racine et le plugin SWC. Vous devez également créer un fichier de configuration pour les tests e2e, avec un champ `include` supplémentaire qui spécifie l'expression rationnelle du chemin d'accès au test :

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
  },
  plugins: [swc.vite()],
});
```

De plus, vous pouvez définir les options `alias` pour supporter les chemins TypeScript dans vos tests :

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    alias: {
      '@src': './src',
      '@test': './test',
    },
    root: './',
  },
  resolve: {
    alias: {
      '@src': './src',
      '@test': './test',
    },
  },
  plugins: [swc.vite()],
});
```

#### Mise à jour des imports dans les tests E2E

Changez toutes les importations de tests E2E utilisant `import * as request from 'supertest'` en `import request from 'supertest'`. Ceci est nécessaire car Vitest, lorsqu'il est intégré à Vite, attend un import par défaut pour supertest. L'utilisation d'un import d'espace de noms peut causer des problèmes dans cette configuration spécifique.

Enfin, mettez à jour les scripts de test dans votre fichier package.json avec ce qui suit :

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:debug": "vitest --inspect-brk --inspect --logHeapUsage --threads=false",
    "test:e2e": "vitest run --config ./vitest.config.e2e.ts"
  }
}
```

Ces scripts configurent Vitest pour l'exécution des tests, l'observation des modifications, la génération de rapports sur la couverture du code et le débogage. Le script test:e2e est spécifiquement destiné à l'exécution de tests E2E avec un fichier de configuration personnalisé.

Avec cette configuration, vous pouvez maintenant profiter des avantages de l'utilisation de Vitest dans votre projet NestJS, y compris une exécution plus rapide des tests et une expérience de test plus moderne.

> info **Astuce** Vous pouvez consulter un exemple concret dans ce [dépôt](https://github.com/TrilonIO/nest-vitest).
