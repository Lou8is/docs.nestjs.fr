### Erreurs fréquentes

Au cours de votre développement avec NestJS, il se peut que vous rencontriez diverses erreurs au fur et à mesure que vous apprenez à utiliser le framework.

#### Erreur "Cannot resolve dependency"

> info **Astuce** Consultez les [NestJS Devtools](/devtools/overview#investigating-the-cannot-resolve-dependency-error) qui peuvent vous aider à résoudre l'erreur "Cannot resolve dependency" sans effort.

Le message d'erreur le plus courant concerne probablement l'impossibilité pour Nest de résoudre les dépendances d'un fournisseur. Le message d'erreur ressemble généralement à ceci :

```bash
Nest can't resolve dependencies of the <provider> (?). Please make sure that the argument <unknown_token> at index [<index>] is available in the <module> context.

Potential solutions:
- Is <module> a valid NestJS module?
- If <unknown_token> is a provider, is it part of the current <module>?
- If <unknown_token> is exported from a separate @Module, is that module imported within <module>?
  @Module({
    imports: [ /* the Module containing <unknown_token> */ ]
  })
```

La cause la plus fréquente de cette erreur est l'absence de `<provider>` dans le tableau `providers` du module. Veuillez vous assurer que le fournisseur est bien dans le tableau `providers` et qu'il respecte les [pratiques standards de NestJS en matière de fournisseurs](/fundamentals/custom-providers#principes-de-base-de-lid).

Il y a quelques problèmes, qui sont courants. Un de ces problèmes est de mettre un fournisseur dans un tableau `imports`. Si c'est le cas, l'erreur contiendra le nom du fournisseur à la place de `<module>`.

Si vous rencontrez cette erreur lors de votre développement, jetez un coup d'œil au module mentionné dans le message d'erreur et regardez ses `providers`. Pour chaque fournisseur dans le tableau `providers`, assurez-vous que le module a accès à toutes les dépendances. Souvent, les `providers` sont dupliqués dans un "Feature Module" et un "Root Module", ce qui signifie que Nest essaiera d'instancier le provider deux fois. Plus que probablement, le module contenant le `<provider>` dupliqué devrait être ajouté dans le tableau `imports` du "Root Module" à la place.

Si le `<unknown_token>` ci-dessus est la chaîne `dependency`, il se peut que vous ayez une importation circulaire de fichiers. Ceci est différent de la [dépendance circulaire](/faq/common-errors#erreur-circular-dependency) ci-dessous car au lieu d'avoir des fournisseurs qui dépendent l'un de l'autre dans leurs constructeurs, cela signifie simplement que deux fichiers finissent par s'importer l'un l'autre. Un cas courant serait un fichier de module déclarant un token et important un fournisseur, et le fournisseur important la constante du token à partir du fichier de module. Si vous utilisez des "barrel files", veillez à ce que vos importations de "barrel" ne finissent pas par créer ces importations circulaires.

Si le `<unknown_token>` ci-dessus est la chaîne `Object`, cela signifie que vous injectez en utilisant un type/interface sans un token de fournisseur approprié. Pour corriger cela, assurez-vous que vous importez la référence de la classe ou utilisez un token personnalisé avec le décorateur `@Inject()`. Lisez la [page des fournisseurs personnalisés](/fundamentals/custom-providers).

De plus, assurez-vous que vous n'avez pas injecté le provider sur lui-même car les auto-injections ne sont pas autorisées dans NestJS. Dans ce cas, `<unknown_token>` sera probablement égal à `<provider>`.

<app-banner-devtools></app-banner-devtools>

Si vous êtes dans une configuration **monorepo**, vous pouvez rencontrer la même erreur que ci-dessus mais pour le fournisseur de base appelé `ModuleRef` en tant que `<unknown_token>` :

```bash
Nest can't resolve dependencies of the <provider> (?).
Please make sure that the argument ModuleRef at index [<index>] is available in the <module> context.
...
```

Cela se produit probablement lorsque votre projet charge deux modules Node du paquet `@nestjs/core`, comme ceci :

```text
.
├── package.json
├── apps
│   └── api
│       └── node_modules
│           └── @nestjs/bull
│               └── node_modules
│                   └── @nestjs/core
└── node_modules
    ├── (other packages)
    └── @nestjs/core
```

Solutions :

- Pour les espaces de travail **Yarn**, utilisez la fonctionnalité [nohoist](https://classic.yarnpkg.com/blog/2018/02/15/nohoist) pour empêcher le package `@nestjs/core` d'être remonté.
- Pour les espaces de travail **pnpm**, définissez `@nestjs/core` comme peerDependencies dans votre autre module et `"dependenciesMeta" : {{ '{' }} "other-module-name" : {{ '{' }} "injected" : true{{ '}}'". }}` dans le package.json de l'application où le module est importé. voir : [dependenciesmetainjected](https://pnpm.io/package_json#dependenciesmetainjected)

#### Erreur "Circular dependency"

Il vous sera parfois difficile d'éviter les [dépendances circulaires] (https://docs.nestjs.com/fundamentals/circular-dependency) dans votre application. Vous devrez prendre des mesures pour aider Nest à les résoudre. Les erreurs dues à des dépendances circulaires ressemblent à ceci :

```bash
Nest cannot create the <module> instance.
The module at index [<index>] of the <module> "imports" array is undefined.

Potential causes:
- A circular dependency between modules. Use forwardRef() to avoid it. Read more: https://docs.nestjs.com/fundamentals/circular-dependency
- The module at index [<index>] is of type "undefined". Check your import statements and the type of the module.

Scope [<module_import_chain>]
# example chain AppModule -> FooModule
```

Les dépendances circulaires peuvent résulter du fait que les fournisseurs dépendent les uns des autres, ou que les fichiers de script dépendent les uns des autres pour les constantes, comme l'exportation de constantes à partir d'un fichier de module et leur importation dans un fichier de service. Dans ce dernier cas, il est conseillé de créer un fichier séparé pour vos constantes. Dans le premier cas, veuillez suivre le guide sur les dépendances circulaires et assurez-vous que les modules **et** les fournisseurs sont marqués avec `forwardRef`.

#### Débugger les erreurs de dépendance

En plus de vérifier manuellement que vos dépendances sont correctes, à partir de Nest 8.1.0, vous pouvez définir la variable d'environnement `NEST_DEBUG` à une chaîne qui se résout comme étant "truthy", et obtenir des informations de journalisation supplémentaires pendant que Nest résout toutes les dépendances pour l'application.

<figure><img src="/assets/injector_logs.png" /></figure>

Dans l'image ci-dessus, la chaîne en jaune est la classe hôte de la dépendance injectée, la chaîne en bleu est le nom de la dépendance injectée, ou son jeton d'injection, et la chaîne en violet est le module dans lequel la dépendance est recherchée. En utilisant cela, vous pouvez généralement remonter la résolution de la dépendance pour savoir ce qui se passe et pourquoi vous avez des problèmes d'injection de dépendance.

#### Le message "File change detected" tourne en boucle

Les utilisateurs de Windows qui utilisent TypeScript version 4.9 et plus peuvent rencontrer ce problème.
Cela se produit lorsque vous essayez d'exécuter votre application en mode veille, par exemple `npm run start:dev` et que vous voyez une boucle sans fin de messages de log :

```bash
XX:XX:XX AM - File change detected. Starting incremental compilation...
XX:XX:XX AM - Found 0 errors. Watching for file changes.
```

Lorsque vous utilisez le CLI NestJS pour démarrer votre application en mode veille, cela se fait en appelant `tsc --watch`, et à partir de la version 4.9 de TypeScript, une [nouvelle stratégie](https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/#file-watching-now-uses-file-system-events) pour détecter les changements de fichiers est utilisée, ce qui est probablement la cause de ce problème.
Afin de corriger ce problème, vous devez ajouter un paramètre à votre fichier tsconfig.json après l'option `"compilerOptions"` comme suit :

```bash
  "watchOptions": {
    "watchFile": "fixedPollingInterval"
  }
```

Cette option indique à TypeScript d'utiliser la méthode de sondage pour vérifier les changements de fichiers au lieu des événements du système de fichiers (la nouvelle méthode par défaut), ce qui peut causer des problèmes sur certaines machines.
Vous pouvez en savoir plus sur l'option `"watchFile"` dans la [documentation TypeScript](https://www.typescriptlang.org/tsconfig#watch-watchDirectory).
