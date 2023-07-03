### Modules dynamiques

Le [chapitre Modules](/modules) couvre les bases des modules Nest et comprend une brève introduction aux [modules dynamiques](https://docs.nestjs.com/modules#dynamic-modules). Ce chapitre développe le sujet des modules dynamiques. À l'issue de ce chapitre, vous devriez avoir une bonne compréhension de ce que sont les modules dynamiques, ainsi que de la manière et du moment de les utiliser.

#### Introduction

La plupart des exemples de code d'application présentés dans la section **Aperçu** de la documentation utilisent des modules réguliers ou statiques. Les modules définissent des groupes de composants tels que les [fournisseurs](/providers) et les [contrôleurs](/controllers) qui s'intègrent en tant que partie modulaire d'une application globale. Ils fournissent un contexte d'exécution, ou champ d'application, pour ces composants. Par exemple, les fournisseurs définis dans un module sont visibles par les autres membres du module sans qu'il soit nécessaire de les exporter. Lorsqu'un fournisseur doit être visible en dehors d'un module, il est d'abord exporté de son module hôte, puis importé dans son module consommateur.

Prenons un exemple familier.

Tout d'abord, nous allons définir un `UsersModule` pour fournir et exporter un `UsersService`. `UsersModule` est le module **hôte** de `UsersService`.

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Ensuite, nous allons définir un `AuthModule`, qui importe `UsersModule`, rendant les fournisseurs exportés par `UsersModule` disponibles dans `AuthModule` :

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

Ces constructions nous permettent d'injecter `UsersService` dans, par exemple, le `AuthService` qui est hébergé dans `AuthModule` :

```typescript
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}
  /*
    Implémentation qui utilise this.usersService
  */
}
```

C'est ce que nous appellerons la liaison **statique** des modules. Toutes les informations dont Nest a besoin pour relier les modules entre eux ont déjà été déclarées dans les modules hôte et consommateur. Décortiquons ce qui se passe durant ce processus. Nest rend `UsersService` disponible dans `AuthModule` par :

1. L'instanciation de `UsersModule`, y compris l'importation transitive d'autres modules que `UsersModule` consomme lui-même, et la résolution transitive de toutes les dépendances (voir les [fournisseurs personnalisés](https://docs.nestjs.com/fundamentals/custom-providers)).
2. L'instanciation de `AuthModule`, et la mise à disposition des fournisseurs exportés de `UsersModule` aux composants de `AuthModule` (comme s'ils avaient été déclarés dans `AuthModule`).
3. L'injection d'une instance de `UsersService` dans `AuthService`.

#### Cas d'utilisation d'un module dynamique

Avec la liaison statique des modules, le module consommateur n'a pas la possibilité d'influer sur la configuration des fournisseurs du module hôte. En quoi cela est-il important ? Prenons le cas d'un module à usage général qui doit se comporter différemment selon les cas d'utilisation. Ce cas est analogue au concept de "plugin" dans de nombreux systèmes, où une fonction générique nécessite une certaine configuration avant de pouvoir être utilisée par un consommateur.

Un bon exemple avec Nest est un **module de configuration**. De nombreuses applications trouvent utile d'externaliser les détails de la configuration en utilisant un module de configuration. Cela facilite la modification dynamique des paramètres de l'application dans différents déploiements : par exemple, une base de données de développement pour les développeurs, une base de données de mise en scène pour l'environnement de mise en scène/de test, etc. En déléguant la gestion des paramètres de configuration à un module de configuration, le code source de l'application reste indépendant des paramètres de configuration.

Le problème est que le module de configuration lui-même, puisqu'il est générique (semblable à un "plugin"), doit être personnalisé par le module qui le consomme. C'est là que les _modules dynamiques_ entrent en jeu. En utilisant les caractéristiques des modules dynamiques, nous pouvons rendre notre module de configuration **dynamique** afin que le module consommateur puisse utiliser une API pour contrôler la façon dont le module de configuration est personnalisé au moment où il est importé.

En d'autres termes, les modules dynamiques fournissent une API permettant d'importer un module dans un autre et de personnaliser les propriétés et le comportement de ce module lorsqu'il est importé, contrairement aux liaisons statiques que nous avons vues jusqu'à présent.

<app-banner-devtools></app-banner-devtools>

#### Exemple de module de configuration

Nous utiliserons la version de base du code d'exemple du [chapitre sur la configuration](https://docs.nestjs.com/techniques/configuration#service) pour cette section. La version complétée à la fin de ce chapitre est disponible sous la forme d'un [exemple ici](https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules).

Notre exigence est de faire en sorte que `ConfigModule` accepte un objet `options` pour le personnaliser. Voici la fonctionnalité que nous voulons supporter. L'exemple de base code en dur l'emplacement du fichier `.env` dans le dossier racine du projet. Supposons que nous voulions rendre cela configurable, de sorte que vous puissiez gérer vos fichiers `.env` dans n'importe quel dossier de votre choix. Par exemple, imaginez que vous vouliez stocker vos différents fichiers `.env` dans un dossier sous la racine du projet appelé `config` (c'est-à-dire un dossier frère de `src`). Vous aimeriez pouvoir choisir des dossiers différents lorsque vous utilisez le module `ConfigModule` dans différents projets.

Les modules dynamiques nous donnent la possibilité de passer des paramètres au module importé afin de modifier son comportement. Voyons comment cela fonctionne. Il est utile de partir de l'objectif final, c'est à dire de la façon dont cela peut se présenter du point de vue du module consommateur, et de travailler ensuite en sens inverse. Tout d'abord, revoyons rapidement l'exemple de l'importation _statique_ du `ConfigModule` (c'est à dire une approche qui n'a aucune capacité à influencer le comportement du module importé). Portez une attention particulière au tableau `imports` dans le décorateur `@Module()` :

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Considérons ce à quoi pourrait ressembler un import de _module dynamique_, où nous passons un objet de configuration. Comparez la différence dans le tableau `imports` entre ces deux exemples :

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Voyons ce qui se passe dans l'exemple dynamique ci-dessus. Quelles-en sont les parties mobiles ?

1. `ConfigModule` est une classe normale, nous pouvons donc en déduire qu'elle doit avoir une **méthode statique** appelée `register()`. Nous savons qu'elle est statique parce que nous l'appelons sur la classe `ConfigModule`, et non sur une **instance** de la classe. Note : cette méthode, que nous allons créer bientôt, peut avoir n'importe quel nom arbitraire, mais par convention nous devrions l'appeler soit `forRoot()` soit `register()`.
2. La méthode `register()` est définie par nous, donc nous pouvons accepter n'importe quel argument d'entrée. Dans ce cas, nous allons accepter un simple objet `options` avec les propriétés appropriées, ce qui est le cas typique.
3. Nous pouvons en déduire que la méthode `register()` doit retourner quelque chose comme un `module` puisque sa valeur de retour apparaît dans la liste familière `imports`, qui, comme nous l'avons vu jusqu'à présent, inclut une liste de modules.

En fait, ce que notre méthode `register()` retournera est un `DynamicModule`. Un module dynamique n'est rien d'autre qu'un module créé à l'exécution, avec les mêmes propriétés qu'un module statique, plus une propriété supplémentaire appelée `module`. Passons rapidement en revue un exemple de déclaration de module statique, en prêtant une attention particulière aux options de module passées au décorateur :

```typescript
@Module({
  imports: [DogsModule],
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService]
})
```

Les modules dynamiques doivent renvoyer un objet ayant exactement la même interface, plus une propriété supplémentaire appelée `module`. La propriété `module` sert de nom au module et doit être identique au nom de la classe du module, comme le montre l'exemple ci-dessous.

> info **Astuce** Pour un module dynamique, toutes les propriétés de l'objet module options sont optionnelles **sauf** `module`.

Qu'en est-il de la méthode statique `register()` ? Nous pouvons maintenant voir que son rôle est de retourner un objet qui possède l'interface `DynamicModule`. Lorsque nous l'appelons, nous fournissons effectivement un module à la liste `imports`, de la même manière que nous le ferions dans le cas statique en listant le nom de la classe du module. En d'autres termes, l'API de module dynamique retourne simplement un module, mais plutôt que de fixer les propriétés dans le décorateur `@Module`, nous les spécifions programmatiquement.

Il reste encore quelques détails à couvrir pour que le tout soit bien complet :

1. Nous pouvons maintenant affirmer que la propriété `@Module()` du décorateur `@imports` peut prendre non seulement un nom de classe de module (par exemple, `imports : [UsersModule]`), mais aussi une fonction **renvoyant** un module dynamique (par exemple, `imports : [ConfigModule.register(...)]`).
2. Un module dynamique peut lui-même importer d'autres modules. Nous ne le ferons pas dans cet exemple, mais si le module dynamique dépend de fournisseurs d'autres modules, vous les importerez en utilisant la propriété optionnelle `imports`. Encore une fois, c'est exactement analogue à la façon dont vous déclareriez des métadonnées pour un module statique en utilisant le décorateur `@Module()`.

Forts de cette compréhension, nous pouvons maintenant voir à quoi doit ressembler notre déclaration dynamique `ConfigModule`. Essayons de le faire.

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(): DynamicModule {
    return {
      module: ConfigModule,
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}
```

Il devrait maintenant être clair de quelle manière les différents éléments s'articulent entre eux. L'appel à `ConfigModule.register(...)` renvoie un objet `DynamicModule` avec des propriétés qui sont essentiellement les mêmes que celles que, jusqu'à présent, nous avons fournies comme métadonnées via le décorateur `@Module()`.

> info **Astuce** Importez `DynamicModule` depuis `@nestjs/common`.

Notre module dynamique n'est pas encore très intéressant, cependant, car nous n'avons pas introduit de capacité à **configurer** le module comme nous avons dit que nous aimerions le faire. Nous allons y remédier.

#### Configuration du module

La solution évidente pour personnaliser le comportement du `ConfigModule` est de lui passer un objet `options` dans la méthode statique `register()`, comme nous l'avons deviné plus haut. Regardons encore une fois la propriété `imports` de notre module de consommation :

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Cela permet de passer un objet `options` à notre module dynamique. Comment utiliser ensuite cet objet `options` dans le `Module de Configuration` ? Réfléchissons-y un instant. Nous savons que notre `ConfigModule` est fondamentalement un hôte pour fournir et exporter un service injectable - le `ConfigService` - pour qu'il soit utilisé par d'autres fournisseurs. C'est en fait notre `ConfigService` qui a besoin de lire l'objet `options` pour personnaliser son comportement. Supposons pour l'instant que nous sachions comment obtenir les `options` de la méthode `register()` dans le `ConfigService`. Avec cette supposition, nous pouvons faire quelques changements au service pour personnaliser son comportement basé sur les propriétés de l'objet `options`. (**Remarque** : pour l'instant, puisque nous n'avons pas encore déterminé comment le passer, nous allons coder en dur `options`. Nous corrigerons cela dans une minute).

```typescript
import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { EnvConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor() {
    const options = { folder: './config' };

    const filePath = `${process.env.NODE_ENV || 'development'}.env`;
    const envFile = path.resolve(__dirname, '../../', options.folder, filePath);
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
```

Maintenant notre `ConfigService` sait comment trouver le fichier `.env` dans le dossier que nous avons spécifié dans `options`.

Notre tâche restante est d'injecter d'une manière ou d'une autre l'objet `options` de l'étape `register()` dans notre `ConfigService`. Et bien sûr, nous allons utiliser l'injection de dépendance pour le faire. C'est un point clé, alors assurez-vous de bien le comprendre. Notre `ConfigModule` fournit `ConfigService`. Le `ConfigService` dépend à son tour de l'objet `options` qui n'est fourni qu'à l'exécution. Donc, à l'exécution, nous devrons d'abord lier l'objet `options` au conteneur IoC de Nest, et ensuite l'injecter dans notre `ConfigService`. Rappelez-vous du chapitre **Fournisseurs personnalisés** que les fournisseurs peuvent [inclure n'importe quelle valeur](https://docs.nestjs.com/fundamentals/custom-providers#fournisseurs-non-basés-sur-les-services) et pas seulement les services, donc nous pouvons utiliser l'injection de dépendances pour gérer un simple objet `options`.

Commençons par lier l'objet options au conteneur IoC. Nous le faisons dans notre méthode statique `register()`. Souvenez-vous que nous construisons dynamiquement un module, et qu'une des propriétés d'un module est sa liste de fournisseurs. Nous devons donc définir notre objet options comme un fournisseur. Cela le rendra injectable dans le `ConfigService`, ce dont nous profiterons dans l'étape suivante. Dans le code ci-dessous, faites attention à la liste `providers` :

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(options: Record<string, any>): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}
```

Maintenant nous pouvons terminer le processus en injectant le fournisseur `'CONFIG_OPTIONS'` dans le `ConfigService`. Rappelons que lorsque nous définissons un fournisseur en utilisant un jeton qui n'est pas une classe, nous devons utiliser le décorateur `@Inject()` [comme décrit ici](https://docs.nestjs.com/fundamentals/custom-providers#jetons-de-fournisseur-non-basés-sur-une-classe).

```typescript
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Inject } from '@nestjs/common';
import { EnvConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(@Inject('CONFIG_OPTIONS') private options: Record<string, any>) {
    const filePath = `${process.env.NODE_ENV || 'development'}.env`;
    const envFile = path.resolve(__dirname, '../../', options.folder, filePath);
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
```

Une dernière note : pour des raisons de simplicité, nous avons utilisé un jeton d'injection basé sur une chaîne de caractères (`'CONFIG_OPTIONS'`) ci-dessus, mais la meilleure pratique est de le définir comme une constante (ou `Symbol`) dans un fichier séparé, et d'importer ce fichier. Par exemple :

```typescript
export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';
```

#### Exemple

Un exemple complet du code de ce chapitre est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules).

#### Lignes directrices pour la communauté

Vous avez peut-être vu l'utilisation de méthodes comme `forRoot`, `register`, et `forFeature` dans certains des packages `@nestjs/` et vous vous demandez peut-être quelle est la différence entre toutes ces méthodes. Il n'y a pas de règle stricte à ce sujet, mais les packages `@nestjs/` essaient de suivre ces lignes directrices :

Lors de la création d'un module avec :

- `register`, vous vous attendez à configurer un module dynamique avec une configuration spécifique qui ne sera utilisée que par le module appelant. Par exemple, avec Nest `@nestjs/axios` : `HttpModule.register({{ '{' }} baseUrl : 'someUrl' {{ '}' }})`. Si, dans un autre module, vous utilisez `HttpModule.register({{ '{' }} baseUrl : 'somewhere else' {{ '}' }})`, il aura une configuration différente. Vous pouvez faire cela pour autant de modules que vous le souhaitez.

- `forRoot`, vous vous attendez à configurer un module dynamique une seule fois et à réutiliser cette configuration à de multiples endroits (bien qu'à votre insu puisque c'est abstrait). C'est pourquoi vous avez un `GraphQLModule.forRoot()`, un `TypeOrmModule.forRoot()`, etc.

- `forFeature`, vous vous attendez à utiliser la configuration d'un module dynamique `forRoot` mais vous devez modifier une configuration spécifique aux besoins du module appelant (par exemple, le référentiel auquel ce module doit avoir accès, ou le contexte qu'un logger doit utiliser).

Tous ces éléments ont généralement leur équivalent `async`, `registerAsync`, `forRootAsync`, et `forFeatureAsync`, qui signifient la même chose, mais qui utilisent l'injection de dépendance de Nest pour la configuration.

#### Constructeur de modules configurables

Comme la création manuelle de modules dynamiques hautement configurables qui exposent des méthodes `async` (`registerAsync`, `forRootAsync`, etc.) est assez compliquée, en particulier pour les nouveaux venus, Nest expose la classe `ConfigurableModuleBuilder` qui facilite ce processus et vous permet de construire un " plan " de module en seulement quelques lignes de code.

For example, let's take the example we used above (`ConfigModule`) and convert it to use the `ConfigurableModuleBuilder`. Before we start, let's make sure we create a dedicated interface that represents what options our `ConfigModule` takes in.

```typescript
export interface ConfigModuleOptions {
  folder: string;
}
```

Avec ceci en place, créez un nouveau fichier dédié (à côté du fichier `config.module.ts` existant) et nommez-le `config.module-definition.ts`. Dans ce fichier, utilisons le `ConfigurableModuleBuilder` pour construire la définition du `ConfigModule`.

```typescript
@@filename(config.module-definition)
import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ConfigModuleOptions } from './interfaces/config-module-options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().build();
@@switch
import { ConfigurableModuleBuilder } from '@nestjs/common';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().build();
```

Maintenant, ouvrons le fichier `config.module.ts` et modifions son implémentation pour tirer parti de la `ConfigurableModuleClass` auto-générée :

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigurableModuleClass } from './config.module-definition';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule extends ConfigurableModuleClass {}
```

L'extension de la classe `ConfigurableModuleClass` signifie que `ConfigModule` fournit maintenant non seulement la méthode `register` (comme précédemment avec l'implémentation personnalisée), mais aussi la méthode `registerAsync` qui permet aux consommateurs de configurer ce module de manière asynchrone, par exemple, en fournissant des factories asynchrones :

```typescript
@Module({
  imports: [
    ConfigModule.register({ folder: './config' }),
    // or alternatively:
    // ConfigModule.registerAsync({
    //   useFactory: () => {
    //     return {
    //       folder: './config',
    //     }
    //   },
    //   inject: [...any extra dependencies...]
    // }),
  ],
})
export class AppModule {}
```

Enfin, mettons à jour la classe `ConfigService` pour injecter le fournisseur d'options du module généré au lieu de `'CONFIG_OPTIONS'` que nous avons utilisé jusqu'à présent.

```typescript
@Injectable()
export class ConfigService {
  constructor(@Inject(MODULE_OPTIONS_TOKEN) private options: ConfigModuleOptions) { ... }
}
```

#### Clé de méthode personnalisée

La classe `ConfigurableModuleClass` fournit par défaut les méthodes `register` et son équivalent `registerAsync`. Pour utiliser un nom de méthode différent, utilisez la méthode `ConfigurableModuleBuilder#setClassMethodName`, comme suit :

```typescript
@@filename(config.module-definition)
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().setClassMethodName('forRoot').build();
@@switch
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().setClassMethodName('forRoot').build();
```

Cette construction demandera à `ConfigurableModuleBuilder` de générer une classe qui expose `forRoot` et `forRootAsync` à la place. Exemple :

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ folder: './config' }), // <-- note the use of "forRoot" instead of "register"
    // or alternatively:
    // ConfigModule.forRootAsync({
    //   useFactory: () => {
    //     return {
    //       folder: './config',
    //     }
    //   },
    //   inject: [...any extra dependencies...]
    // }),
  ],
})
export class AppModule {}
```

#### Classe usine d'options personnalisées

Puisque la méthode `registerAsync` (ou `forRootAsync` ou tout autre nom, selon la configuration) permet au consommateur de passer une définition de fournisseur qui résout la configuration du module, un consommateur de bibliothèque pourrait potentiellement fournir une classe à utiliser pour construire l'objet de configuration.

```typescript
@Module({
  imports: [
    ConfigModule.registerAsync({
      useClass: ConfigModuleOptionsFactory,
    }),
  ],
})
export class AppModule {}
```

Cette classe, par défaut, doit fournir la méthode `create()` qui retourne un objet de configuration de module. Cependant, si votre bibliothèque suit une convention de nommage différente, vous pouvez changer ce comportement et indiquer à `ConfigurableModuleBuilder` de s'attendre à une méthode différente, par exemple, `createConfigOptions`, en utilisant la méthode `ConfigurableModuleBuilder#setFactoryMethodName` :

```typescript
@@filename(config.module-definition)
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().setFactoryMethodName('createConfigOptions').build();
@@switch
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().setFactoryMethodName('createConfigOptions').build();
```

Désormais, la classe `ConfigModuleOptionsFactory` doit exposer la méthode `createConfigOptions` (au lieu de `create`) :

```typescript
@Module({
  imports: [
    ConfigModule.registerAsync({
      useClass: ConfigModuleOptionsFactory, // <-- this class must provide the "createConfigOptions" method
    }),
  ],
})
export class AppModule {}
```

#### Options supplémentaires

Il y a des cas limites où votre module peut avoir besoin de prendre des options supplémentaires qui déterminent comment il est supposé se comporter (un bon exemple d'une telle option est le drapeau `isGlobal` - ou juste `global`) qui, en même temps, ne devrait pas être inclus dans le fournisseur `MODULE_OPTIONS_TOKEN` (car ils ne sont pas pertinents pour les services/fournisseurs enregistrés dans ce module, par exemple, `ConfigService` n'a pas besoin de savoir si son module hôte est enregistré en tant que module global).

Dans ce cas, la méthode `ConfigurableModuleBuilder#setExtras` peut être utilisée. Voir l'exemple suivant :

```typescript
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<ConfigModuleOptions>()
  .setExtras(
    {
      isGlobal: true,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .build();
```

Dans l'exemple ci-dessus, le premier argument passé à la méthode `setExtras` est un objet contenant les valeurs par défaut des propriétés "extra". Le second argument est une fonction qui prend une définition de module auto-générée (avec `provider`, `exports`, etc.) et l'objet `extras` qui représente les propriétés supplémentaires (soit spécifiées par le consommateur, soit par défaut). La valeur retournée par cette fonction est une définition de module modifiée. Dans cet exemple spécifique, nous prenons la propriété `extras.isGlobal` et l'assignons à la propriété `global` de la définition du module (qui à son tour détermine si un module est global ou non, en savoir plus [ici](/modules#modules-dynamiques)).

Maintenant, lorsque l'on consomme ce module, le drapeau supplémentaire `isGlobal` peut être passé, comme suit :

```typescript
@Module({
  imports: [
    ConfigModule.register({
      isGlobal: true,
      folder: './config',
    }),
  ],
})
export class AppModule {}
```

Cependant, puisque `isGlobal` est déclarée comme une propriété "extra", elle ne sera pas disponible dans le fournisseur `MODULE_OPTIONS_TOKEN` :

```typescript
@Injectable()
export class ConfigService {
  constructor(@Inject(MODULE_OPTIONS_TOKEN) private options: ConfigModuleOptions) {
    // L'objet "options" n'aura pas la propriété "isGlobal".
    // ...
  }
}
```

#### Étendre les méthodes générées automatiquement

Les méthodes statiques auto-générées (`register`, `registerAsync`, etc.) peuvent être étendues si nécessaire, comme suit :

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigurableModuleClass, ASYNC_OPTIONS_TYPE, OPTIONS_TYPE } from './config.module-definition';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule extends ConfigurableModuleClass {
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    return {
      // votre logique personnalisée ici
      ...super.register(options),
    };
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return {
      // votre logique personnalisée ici
      ...super.registerAsync(options),
    };
  }
}
```

Notez l'utilisation des types `OPTIONS_TYPE` et `ASYNC_OPTIONS_TYPE` qui doivent être exportés depuis le fichier de définition du module :

```typescript
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder<ConfigModuleOptions>().build();
```
