### Rechargement à chaud

L'impact le plus important sur le processus de démarrage de votre application est la **compilation de TypeScript**. Heureusement, avec [webpack](https://github.com/webpack/webpack) HMR (Hot-Module Replacement), nous n'avons pas besoin de recompiler l'ensemble du projet à chaque fois qu'un changement se produit. Cela réduit considérablement le temps nécessaire à l'instanciation de votre application, et rend le développement itératif beaucoup plus facile.

> warning **Attention** Notez que `webpack` ne copiera pas automatiquement vos actifs (par exemple les fichiers `graphql`) dans le dossier `dist`. De même, `webpack` n'est pas compatible avec les chemins statiques globaux (par exemple, la propriété `entities` dans `TypeOrmModule`).

### Avec la CLI

Si vous utilisez la [CLI Nest](https://docs.nestjs.com/cli/overview), le processus de configuration est assez simple. La CLI intègre `webpack`, qui permet d'utiliser le plugin `HotModuleReplacementPlugin`.

#### Installation

Installez d'abord les packages nécessaires :

```bash
$ npm i --save-dev webpack-node-externals run-script-webpack-plugin webpack
```

> info **Astuce** Si vous utilisez **Yarn Berry** (pas Yarn classique), installez le package `webpack-pnp-externals` au lieu du package `webpack-node-externals`.

#### Configuration

Une fois l'installation terminée, créez un fichier `webpack-hmr.config.js` dans le répertoire racine de votre application.

```typescript
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename, autoRestart: false }),
    ],
  };
};
```

> info **Astuce** Avec **Yarn Berry** (pas Yarn classique), au lieu d'utiliser les `nodeExternals` dans la propriété de configuration `externals`, utilisez les `WebpackPnpExternals` du package `webpack-pnp-externals` : `WebpackPnpExternals({{ '{' }} exclude : ['webpack/hot/poll?100'] {{ '}' }})`.

Cette fonction prend l'objet original contenant la configuration webpack par défaut comme premier argument, et la référence au package `webpack` sous-jacent utilisé par la CLI Nest comme second argument. De plus, elle retourne une configuration webpack modifiée avec les plugins `HotModuleReplacementPlugin`, `WatchIgnorePlugin`, et `RunScriptWebpackPlugin`.

#### Hot-Module Replacement (Remplacement des modules à chaud)

Pour activer le **HMR**, ouvrez le fichier d'entrée de l'application (`main.ts`) et ajoutez les instructions suivantes relatives au webpack :

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

Pour simplifier le processus d'exécution, ajoutez un script à votre fichier `package.json`.

```json
"start:dev": "nest build --webpack --webpackPath webpack-hmr.config.js --watch"
```

Ouvrez maintenant votre ligne de commande et exécutez la commande suivante :

```bash
$ npm run start:dev
```

### Sans la CLI

Si vous n'utilisez pas la [CLI Nest](https://docs.nestjs.com/cli/overview), la configuration sera légèrement plus complexe (elle nécessitera plus d'étapes manuelles).

#### Installation

Installez d'abord les packages nécessaires :

```bash
$ npm i --save-dev webpack webpack-cli webpack-node-externals ts-loader run-script-webpack-plugin
```

> info **Astuce** Si vous utilisez **Yarn Berry** (pas Yarn classique), installez le package `webpack-pnp-externals` au lieu du package `webpack-node-externals`.

#### Configuration

Une fois l'installation terminée, créez un fichier `webpack.config.js` dans le répertoire racine de votre application.

```typescript
const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = {
  entry: ['webpack/hot/poll?100', './src/main.ts'],
  target: 'node',
  externals: [
    nodeExternals({
      allowlist: ['webpack/hot/poll?100'],
    }),
  ],
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new RunScriptWebpackPlugin({ name: 'server.js', autoRestart: false }),
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
  },
};
```

> info **Astuce** Avec **Yarn Berry** (pas Yarn classique), au lieu d'utiliser les `nodeExternals` dans la propriété de configuration `externals`, utilisez les `WebpackPnpExternals` du package `webpack-pnp-externals` : `WebpackPnpExternals({{ '{' }} exclude : ['webpack/hot/poll?100'] {{ '}' }})`.

Cette configuration indique à webpack quelques informations essentielles sur votre application : l'emplacement du fichier d'entrée, le répertoire à utiliser pour contenir les fichiers **compilés** et le type de chargeur à utiliser pour compiler les fichiers sources. En général, vous devriez pouvoir utiliser ce fichier tel quel, même si vous ne comprenez pas toutes les options.

#### Hot-Module Replacement (Remplacement des modules à chaud)

Pour activer le **HMR**, ouvrez le fichier d'entrée de l'application (`main.ts`) et ajoutez les instructions suivantes relatives au webpack :

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

Pour simplifier le processus d'exécution, ajoutez un script à votre fichier `package.json`.

```json
"start:dev": "webpack --config webpack.config.js --watch"
```

Ouvrez maintenant votre ligne de commande et exécutez la commande suivante :

```bash
$ npm run start:dev
```

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/08-webpack).
