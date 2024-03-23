### Modules

Un module est une classe annotée avec un décorateur `@Module()`. Le décorateur `@Module()` fournit des métadonnées que **Nest** utilise pour organiser la structure de l'application.

<figure><img src="/assets/Modules_1.png" /></figure>

Chaque application possède au moins un module, un **module racine**. Le module racine est le point de départ que Nest utilise pour construire le **graphe de l'application** - la structure de données interne que Nest utilise pour résoudre les relations et les dépendances entre les modules et les fournisseurs. Bien que de très petites applications puissent théoriquement n'avoir qu'un module racine, ce n'est pas le cas typique. Nous tenons à souligner que les modules sont **fortement** recommandés comme moyen efficace d'organiser vos composants. Ainsi, pour la plupart des applications, l'architecture résultante utilisera plusieurs modules, chacun encapsulant un ensemble de **capacités** étroitement liées.

Le décorateur `@Module()` prend un objet unique dont les propriétés décrivent le module :

|               |                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providers`   | les fournisseurs qui seront instanciés par l'injecteur Nest et qui peuvent être partagés au moins dans ce module                                                                                          |
| `controllers` | l'ensemble des contrôleurs définis dans ce module qui doivent être instanciés                                                                                                                              |
| `imports`     | la liste des modules importés qui exportent les fournisseurs requis dans ce module                                                                                                                 |
| `exports`     | le sous-ensemble de `providers` qui sont fournis par ce module et devraient être disponibles dans d'autres modules qui importent ce module. Vous pouvez utiliser le fournisseur lui-même ou seulement son jeton (valeur `provide`) |

Le module **encapsule** les fournisseurs par défaut. Cela signifie qu'il est impossible d'injecter des fournisseurs qui ne font pas directement partie du module actuel ou qui ne sont pas exportés par les modules importés. Ainsi, vous pouvez considérer les fournisseurs exportés d'un module comme l'interface publique du module, ou API.

#### Modules de fonctionnalités

Le `CatsController` et le `CatsService` appartiennent au même domaine d'application. Comme ils sont étroitement liés, il est logique de les déplacer dans un module de fonctionnalité. Un module de fonctionnalité organise simplement le code pertinent pour une fonctionnalité spécifique, en gardant le code organisé et en établissant des limites claires. Cela nous aide à gérer la complexité et à développer selon les principes [SOLID](https://en.wikipedia.org/wiki/SOLID), en particulier lorsque la taille de l'application et/ou de l'équipe augmente.

Pour le démontrer, nous allons créer le `CatsModule`.

```typescript
@@filename(cats/cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

> info **Astuce** Pour créer un module à l'aide de l'interface de programmation, il suffit d'exécuter la commande `$ nest g module cats`.

Ci-dessus, nous avons défini le `CatsModule` dans le fichier `cats.module.ts`, et déplacé tout ce qui est lié à ce module dans le répertoire `cats`. La dernière chose que nous devons faire est d'importer ce module dans le module racine (`AppModule`, défini dans le fichier `app.module.ts`).

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {}
```

Voici à quoi ressemble désormais la structure de notre répertoire :

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">cats</div>
    <div class="children">
      <div class="item">dto</div>
      <div class="children">
        <div class="item">create-cat.dto.ts</div>
      </div>
      <div class="item">interfaces</div>
      <div class="children">
        <div class="item">cat.interface.ts</div>
      </div>
      <div class="item">cats.controller.ts</div>
      <div class="item">cats.module.ts</div>
      <div class="item">cats.service.ts</div>
    </div>
    <div class="item">app.module.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

#### Modules partagés

Dans Nest, les modules sont des **singletons** par défaut, et vous pouvez donc partager la même instance d'un fournisseur entre plusieurs modules sans effort.

<figure><img src="/assets/Shared_Module_1.png" /></figure>

Chaque module est automatiquement un **module partagé**. Une fois créé, il peut être réutilisé par n'importe quel module. Imaginons que nous voulions partager une instance de `CatsService` entre plusieurs autres modules. Pour ce faire, nous devons d'abord **exporter** le fournisseur `CatsService` en l'ajoutant au tableau `exports` du module, comme montré ci-dessous :

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService]
})
export class CatsModule {}
```

Maintenant, tout module qui importe le `CatsModule` a accès au `CatsService` et partagera la même instance avec tous les autres modules qui l'importent également.

<app-banner-devtools></app-banner-devtools>

#### Réexportation de modules

Comme nous l'avons vu plus haut, les modules peuvent exporter leurs fournisseurs internes. De plus, ils peuvent réexporter les modules qu'ils importent. Dans l'exemple ci-dessous, le `CommonModule` est à la fois importé dans **et** exporté depuis le `CoreModule`, ce qui le rend disponible pour les autres modules qui l'importent.

```typescript
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```

#### Injection de dépendances

Une classe de module peut également **injecter** des fournisseurs (par exemple, à des fins de configuration) :

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {
  constructor(private catsService: CatsService) {}
}
@@switch
import { Module, Dependencies } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
@Dependencies(CatsService)
export class CatsModule {
  constructor(catsService) {
    this.catsService = catsService;
  }
}
```

Cependant, les classes de modules elles-mêmes ne peuvent pas être injectées en tant que fournisseurs en raison de la [dépendance circulaire](/fondamentaux/dépendance circulaire).

#### Modules globaux

Si vous devez importer le même ensemble de modules partout, cela peut devenir fastidieux. Contrairement à Nest, les `providers` [Angular](https://angular.dev) sont enregistrés dans la portée globale. Une fois définis, ils sont disponibles partout. Nest, cependant, encapsule les fournisseurs dans la portée du module. Vous ne pouvez pas utiliser les providers d'un module ailleurs sans importer d'abord le module d'encapsulation.

Lorsque vous voulez fournir un ensemble de fournisseurs qui devraient être disponibles partout prêts à l'emploi (par exemple, les helpers, les connexions aux bases de données, etc.), rendez le module **global** avec le décorateur `@Global()`.

```typescript
import { Module, Global } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

Le décorateur `@Global()` rend le module global. Les modules globaux ne devraient être enregistrés **qu'une seule fois**, généralement par le module racine ou le module principal. Dans l'exemple ci-dessus, le fournisseur `CatsService` sera omniprésent, et les modules qui souhaitent injecter le service n'auront pas besoin d'importer le `CatsModule` dans leur liste d'importations.

> info **Hint** Rendre tout global n'est pas une bonne décision de conception. Les modules globaux sont disponibles pour réduire la quantité d'éléments de base nécessaires. La liste `imports` est généralement le moyen préféré pour rendre l'API du module disponible aux consommateurs.

#### Modules dynamiques

Le système de modules Nest comprend une fonction puissante appelée **modules dynamiques**. Cette fonction vous permet de créer facilement des modules personnalisables qui peuvent enregistrer et configurer les fournisseurs de manière dynamique. Les modules dynamiques sont traités en détail [ici](/fundamentals/dynamic-modules). Dans ce chapitre, nous donnerons un bref aperçu pour compléter l'introduction aux modules.

Voici un exemple de définition de module dynamique pour un `DatabaseModule` :

```typescript
@@filename()
import { Module, DynamicModule } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
@@switch
import { Module } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options) {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
```

> info **Astuce** La méthode `forRoot()` peut retourner un module dynamique de manière synchrone ou asynchrone (c'est-à-dire via une `Promise`).

Ce module définit le fournisseur `Connection` par défaut (dans les métadonnées du décorateur `@Module()`), mais en plus - selon les objets `entities` et `options` passés dans la méthode `forRoot()` - expose une collection de fournisseurs, par exemple, les répertoires. Notez que les propriétés retournées par le module dynamique **étendent** (plutôt que de surcharger) les métadonnées du module de base définies dans le décorateur `@Module()`. C'est ainsi que le fournisseur `Connection` déclaré statiquement **et** les fournisseurs de référentiels générés dynamiquement sont exportés du module.

Si vous voulez enregistrer un module dynamique dans le périmètre global, mettez la propriété `global` à `true`.

```typescript
{
  global: true,
  module: DatabaseModule,
  providers: providers,
  exports: providers,
}
```

> warning **Attention** Comme indiqué ci-dessus, le fait de tout globaliser **n'est pas une bonne décision de conception**.

Le module `DatabaseModule` peut être importé et configuré de la manière suivante :

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [DatabaseModule.forRoot([User])],
})
export class AppModule {}
```

Si vous souhaitez réexporter à votre tour un module dynamique, vous pouvez omettre l'appel à la méthode `forRoot()` dans le tableau des exportations :

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [DatabaseModule.forRoot([User])],
  exports: [DatabaseModule],
})
export class AppModule {}
```

Le chapitre [Modules dynamiques](/fundamentals/dynamic-modules) couvre ce sujet plus en détail et inclut un [exemple de travail](https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules).

> info **Astuce** Apprenez à construire des modules dynamiques hautement personnalisables avec l'utilisation de `ConfigurableModuleBuilder` dans [ce chapitre](/fundamentals/dynamic-modules#configurable-module-builder).
