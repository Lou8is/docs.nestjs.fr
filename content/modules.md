### Modules

Un module est une classe annotée avec le décorateur `@Module()`. Ce décorateur fournit des métadonnées que **Nest** utilise pour organiser et gérer efficacement la structure de l'application.

<figure><img class="illustrative-image" src="/assets/Modules_1.png" /></figure>

Chaque application Nest possède au moins un module, le **module racine**, qui sert de point de départ à Nest pour construire le **graphique d'application**. Ce graphe est une structure interne que Nest utilise pour résoudre les relations et les dépendances entre les modules et les fournisseurs. Si les petites applications peuvent n'avoir qu'un module racine, ce n'est généralement pas le cas. Les modules sont **hautement recommandés** comme moyen efficace d'organiser vos composants. Pour la plupart des applications, vous aurez probablement plusieurs modules, chacun encapsulant un ensemble de **capacités** étroitement liées.

Le décorateur `@Module()` prend un objet unique avec des propriétés qui décrivent le module :

|               |                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providers`   | les fournisseurs qui seront instanciés par l'injecteur Nest et qui peuvent être partagés au moins dans ce module                                                                                          |
| `controllers` | l'ensemble des contrôleurs définis dans ce module qui doivent être instanciés                                                                                                                              |
| `imports`     | la liste des modules importés qui exportent les fournisseurs requis dans ce module                                                                                                                 |
| `exports`     | le sous-ensemble de `providers` qui sont fournis par ce module et devraient être disponibles dans d'autres modules qui importent ce module. Vous pouvez utiliser le fournisseur lui-même ou seulement son jeton (valeur `provide`) |

Le module **encapsule** les fournisseurs par défaut, ce qui signifie que vous ne pouvez injecter que des fournisseurs qui font partie du module actuel ou qui sont explicitement exportés à partir d'autres modules importés. Les fournisseurs exportés d'un module servent essentiellement d'interface publique ou d'API pour le module.

#### Modules de fonctionnalités

Dans notre exemple, le `CatsController` et le `CatsService` sont étroitement liés et servent le même domaine d'application. Il est donc logique de les regrouper dans un module de fonctionnalité. Un module de fonctionnalité organise le code qui est pertinent pour une fonctionnalité spécifique, aidant à maintenir des limites claires et une meilleure organisation. Ceci est particulièrement important au fur et à mesure que l'application ou l'équipe grandit, et s'aligne avec les principes de [SOLID](https://en.wikipedia.org/wiki/SOLID).

Ensuite, nous allons créer le `CatsModule` pour montrer comment grouper le contrôleur et le service.

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

<figure><img class="illustrative-image" src="/assets/Shared_Module_1.png" /></figure>

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

Si nous devions enregistrer directement le `CatsService` dans chaque module qui en a besoin, cela fonctionnerait en effet, mais chaque module obtiendrait sa propre instance du `CatsService`. Cela peut conduire à une augmentation de l'utilisation de la mémoire puisque de multiples instances du même service sont créées, et cela peut aussi causer un comportement inattendu, comme une incohérence d'état si le service maintient un état interne.

En encapsulant le `CatsService` dans un module, comme le `CatsModule`, et en l'exportant, nous nous assurons que la même instance de `CatsService` est réutilisée dans tous les modules qui importent `CatsModule`. Cela permet non seulement de réduire la consommation de mémoire, mais aussi d'obtenir un comportement plus prévisible, puisque tous les modules partagent la même instance, ce qui facilite la gestion des états ou des ressources partagés. C'est l'un des principaux avantages de la modularité et de l'injection de dépendances dans des frameworks comme NestJS, qui permettent de partager efficacement les services dans l'ensemble de l'application.

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

> info **Astuce** Rendre tout global n'est pas une pratique de conception recommandée. Bien que les modules globaux puissent aider à réduire la « boilerplate », il est généralement préférable d'utiliser le tableau `imports` pour rendre l'API d'un module disponible à d'autres modules d'une manière contrôlée et claire. Cette approche fournit une meilleure structure et une meilleure maintenabilité, en s'assurant que seules les parties nécessaires du module sont partagées avec d'autres, tout en évitant un couplage inutile entre des parties de l'application qui ne sont pas liées entre elles.

#### Modules dynamiques

Les modules dynamiques de Nest vous permettent de créer des modules qui peuvent être configurés au moment de l'exécution. Ceci est particulièrement utile lorsque vous avez besoin de fournir des modules flexibles et personnalisables où les fournisseurs peuvent être créés sur la base de certaines options ou configurations. Voici un bref aperçu du fonctionnement des **modules dynamiques**.

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
