### Fournisseurs

Les fournisseurs sont un concept central de Nest. De nombreuses classes de base de Nest, telles que les services, les répertoires, les usines et les helpers, peuvent être considérées comme des fournisseurs. L'idée clé d'un fournisseur est qu'il peut être **injecté** en tant que dépendance, ce qui permet aux objets d'établir diverses relations entre eux. La responsabilité du « câblage » de ces objets est largement prise en charge par le système d'exécution Nest.

<figure><img class="illustrative-image" src="/assets/Components_1.png" /></figure>

Dans le chapitre précédent, nous avons construit un simple `CatsController`. Les contrôleurs doivent gérer les requêtes HTTP et déléguer les tâches plus complexes à des **fournisseurs**. Les fournisseurs sont des classes JavaScript simples qui sont déclarées comme `providers` dans un module NestJS. Pour plus d'informations, lisez le chapitre ["Modules"](/modules).

> info **Astuce** Étant donné que Nest permet de concevoir et d'organiser les dépendances d'une manière plus orientée-objet, nous recommandons vivement de suivre les principes [SOLID](https://en.wikipedia.org/wiki/SOLID).

#### Services

Commençons par créer un simple `CatsService`. Ce service s'occupera du stockage et de la récupération des données, et sera utilisé par le `CatsController`. En raison de son rôle dans la gestion de la logique de l'application, c'est un candidat idéal pour être défini comme fournisseur.

```typescript
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: Cat) {
    this.cats.push(cat);
  }

  findAll(): Cat[] {
    return this.cats;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  constructor() {
    this.cats = [];
  }

  create(cat) {
    this.cats.push(cat);
  }

  findAll() {
    return this.cats;
  }
}
```

> info **Astuce** Pour créer un service à l'aide de la CLI, il suffit d'exécuter la commande `$ nest g service cats`.

Notre `CatsService` est une classe basique avec une propriété et deux méthodes. L'ajout clé ici est le décorateur `@Injectable()`. Ce décorateur attache des métadonnées à la classe, signalant que `CatsService` est une classe qui peut être gérée par le conteneur Nest [IoC](https://en.wikipedia.org/wiki/Inversion_of_control).

De plus, cet exemple utilise l'interface `Cat`, qui ressemble vraisemblablement à quelque chose comme ceci :

```typescript
@@filename(interfaces/cat.interface)
export interface Cat {
  name: string;
  age: number;
  breed: string;
}
```

Maintenant que nous avons une classe de service pour récupérer les chats, utilisons-la dans le `CatsController` :

```typescript
@@filename(cats.controller)
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
@@switch
import { Controller, Get, Post, Body, Bind, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Post()
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}
```

Le `CatsService` est **injecté** à travers le constructeur de la classe. Notez l'utilisation du mot-clé `private`. Ce raccourci nous permet de déclarer et d'initialiser le membre `catsService` immédiatement à la même ligne, simplifiant le processus.

#### Injection de dépendance

Nest est construit autour du modèle de conception communément appelé **Injection de dépendance**. Nous vous recommandons vivement de lire un excellent article sur ce concept dans la documentation officielle [Angular](https://angular.dev/guide/di).

Dans Nest, grâce aux capacités de TypeScript, la gestion des dépendances est simple car elles sont résolues en fonction de leur type. Dans l'exemple ci-dessous, Nest va résoudre la dépendance `catsService` en créant et en retournant une instance de `CatsService` (ou, dans le cas d'un singleton, en retournant l'instance existante si elle a déjà été demandée ailleurs). Cette dépendance est ensuite injectée dans le constructeur de votre contrôleur (ou assignée à la propriété spécifiée) :

```typescript
constructor(private catsService: CatsService) {}
```

#### Portées

Les fournisseurs ont généralement une durée de vie (« scope ») qui correspond au cycle de vie de l'application. Lorsque l'application est démarrée, chaque dépendance doit être résolue, ce qui signifie que chaque fournisseur est instancié. De même, lorsque l'application est arrêtée, tous les fournisseurs sont détruits. Cependant, il est également possible de rendre un fournisseur **à portée de requête**, ce qui signifie que sa durée de vie est liée à une requête spécifique plutôt qu'au cycle de vie de l'application. Pour en savoir plus sur ces techniques, consultez le chapitre [Portées d'injection](/fundamentals/injection-scopes).

<app-banner-courses></app-banner-courses>

#### Fournisseurs personnalisés

Nest est livré avec un conteneur d'inversion de contrôle (« IoC ») intégré qui gère les relations entre les fournisseurs. Cette fonctionnalité est la base de l'injection de dépendances, mais elle est en fait beaucoup plus puissante que ce que nous avons couvert jusqu'à présent. Il existe plusieurs façons de définir un fournisseur : vous pouvez utiliser des valeurs simples, des classes et des usines asynchrones ou synchrones. Pour plus d'exemples de définition de fournisseurs, consultez le chapitre [Injection de dépendances](/fondamentaux/injection de dépendances).

#### Fournisseurs optionnels

Parfois, vous pouvez avoir des dépendances qui n'ont pas toujours besoin d'être résolues. Par exemple, votre classe peut dépendre d'un **objet de configuration**, mais si aucun n'est fourni, les valeurs par défaut doivent être utilisées. Dans ce cas, la dépendance est considérée comme optionnelle et l'absence du fournisseur de configuration ne doit pas entraîner d'erreur.

Pour marquer un fournisseur comme optionnel, utilisez le décorateur `@Optional()` dans la signature du constructeur.

```typescript
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient: T) {}
}
```

Dans l'exemple ci-dessus, nous utilisons un fournisseur personnalisé, c'est pourquoi nous incluons le **token** personnalisé `HTTP_OPTIONS`. Les exemples précédents ont démontré l'injection basée sur le constructeur, où une dépendance est indiquée à travers une classe dans le constructeur. Pour plus de détails sur les fournisseurs personnalisés et le fonctionnement des jetons qui leur sont associés, consultez le chapitre [Fournisseurs personnalisés](/fundamentals/custom-providers).

#### Injection basée sur les propriétés

La technique que nous avons utilisée jusqu'à présent est appelée injection basée sur le constructeur, où les fournisseurs sont injectés à travers la méthode du constructeur. Dans certains cas spécifiques, l'injection basée sur les propriétés peut être utile. Par exemple, si votre classe de premier niveau dépend d'un ou plusieurs fournisseurs, les faire remonter par `super()` dans les sous-classes peut devenir encombrant. Pour éviter cela, vous pouvez utiliser le décorateur `@Inject()` directement au niveau de la propriété.

```typescript
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}
```

> warning **Attention** Si votre classe n'étend pas une autre classe, il est généralement préférable d'utiliser l'injection basée sur le constructeur. Le constructeur spécifie clairement quelles dépendances sont requises, offrant une meilleure visibilité et rendant le code plus facile à comprendre par rapport aux propriétés de classe annotées avec `@Inject`.

#### Enregistrement des fournisseurs

Maintenant que nous avons défini un fournisseur (`CatsService`), et que nous avons un consommateur de ce service (`CatsController`), nous devons enregistrer le service avec Nest pour qu'il puisse s'occuper de l'injection. Cela se fait en éditant le fichier de module (`app.module.ts`) et en ajoutant le service à la liste des `providers` du décorateur `@Module()`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
```

Nest sera maintenant capable de résoudre les dépendances de la classe `CatsController`.

À ce stade, la structure de notre répertoire devrait ressembler à ceci :

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
<div class="item">cats.service.ts</div>
</div>
<div class="item">app.module.ts</div>
<div class="item">main.ts</div>
</div>
</div>

#### Instanciation manuelle

Jusqu'à présent, nous avons vu comment Nest gère automatiquement la plupart des détails de la résolution des dépendances. Dans certaines circonstances, il peut être nécessaire de sortir du système d'injection de dépendances intégré et de récupérer ou d'instancier manuellement des fournisseurs. Nous abordons brièvement deux de ces sujets ci-dessous.

- Pour récupérer des instances existantes ou instancier des fournisseurs dynamiquement, vous pouvez utiliser la [Référence de module](/fundamentals/module-ref).
- Pour obtenir des fournisseurs dans la fonction `bootstrap()` (par exemple, pour les applications autonomes ou pour utiliser un service de configuration pendant le bootstrapping), consultez la partie [Applications indépendantes](/standalone-applications).
