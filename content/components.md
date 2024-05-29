### Fournisseurs

Les fournisseurs sont un concept fondamental de Nest. De nombreuses classes de base de Nest peuvent être considérées comme des fournisseurs : services, répertoires, usines, aides, etc. L'idée principale d'un fournisseur est qu'il peut être **injecté** en tant que dépendance ; cela signifie que les objets peuvent créer diverses relations les uns avec les autres et que la fonction de "câblage" de ces objets peut être largement déléguée au système d'exécution Nest.

<figure><img src="/assets/Components_1.png" /></figure>

Dans le chapitre précédent, nous avons construit un simple `CatsController`. Les contrôleurs doivent gérer les requêtes HTTP et déléguer les tâches plus complexes à des **fournisseurs**. Les fournisseurs sont des classes JavaScript simples qui sont déclarées comme `providers` dans un [module](/modules).

> info **Astuce** Étant donné que Nest offre la possibilité de concevoir et d'organiser les dépendances d'une manière plus OO, nous recommandons vivement de suivre les principes [SOLID](https://en.wikipedia.org/wiki/SOLID).

#### Services

Commençons par créer un simple `CatsService`. Ce service sera responsable du stockage et de la récupération des données, et est conçu pour être utilisé par le `CatsController`, c'est donc un bon candidat pour être défini en tant que fournisseur.

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

Notre `CatsService` est une classe basique avec une propriété et deux méthodes. La seule nouveauté est qu'elle utilise le décorateur `@Injectable()`. Le décorateur `@Injectable()` attache des métadonnées, qui déclarent que `CatsService` est une classe qui peut être gérée par le conteneur Nest [IoC](https://en.wikipedia.org/wiki/Inversion_of_control). D'ailleurs, cet exemple utilise aussi une interface `Cat`, qui ressemble probablement à quelque chose comme ça :

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

Le `CatsService` est **injecté** à travers le constructeur de la classe. Notez l'utilisation de la syntaxe `private`. Ce raccourci nous permet de déclarer et d'initialiser le membre `catsService` immédiatement au même endroit.

#### Injection de dépendance

Nest est construit autour du modèle de conception communément appelé **Injection de dépendance**. Nous vous recommandons de lire un excellent article sur ce concept dans la documentation officielle [Angular](https://angular.dev/guide/di).

Dans Nest, grâce aux capacités de TypeScript, il est extrêmement facile de gérer les dépendances parce qu'elles sont résolues simplement par type. Dans l'exemple ci-dessous, Nest va résoudre la dépendance `catsService` en créant et en retournant une instance de `CatsService` (ou, dans le cas normal d'un singleton, en retournant l'instance existante si elle a déjà été demandée ailleurs). Cette dépendance est résolue et passée au constructeur de votre contrôleur (ou assignée à la propriété indiquée) :

```typescript
constructor(private catsService: CatsService) {}
```

#### Portées

Les fournisseurs ont normalement une durée de vie ("portée") synchronisée avec le cycle de vie de l'application. Lorsque l'application est démarrée, chaque dépendance doit être résolue et, par conséquent, chaque fournisseur doit être instancié. De même, lorsque l'application s'arrête, chaque fournisseur est détruit. Cependant, il existe des moyens de rendre la durée de vie de votre fournisseur **limitée à une requête**. Vous pouvez en savoir plus sur ces techniques [ici](/fundamentals/injection-scopes).

<app-banner-courses></app-banner-courses>

#### Fournisseurs personnalisés

Nest dispose d'un conteneur d'inversion de contrôle ("IoC") intégré qui résout les relations entre les fournisseurs. Cette fonction sous-tend la fonction d'injection de dépendance décrite ci-dessus, mais elle est en fait beaucoup plus puissante que ce que nous avons décrit jusqu'à présent. Il existe plusieurs façons de définir un fournisseur : vous pouvez utiliser des valeurs simples, des classes et des factories asynchrones ou synchrones. D'autres exemples sont fournis [ici](/fundamentals/dependency-injection).

#### Fournisseurs optionnels

Occasionnellement, vous pouvez avoir des dépendances qui ne doivent pas nécessairement être résolues. Par exemple, votre classe peut dépendre d'un **objet de configuration**, mais si aucun n'est fourni, les valeurs par défaut doivent être utilisées. Dans ce cas, la dépendance devient facultative, car l'absence du fournisseur de configuration n'entraîne pas d'erreurs.

Pour indiquer qu'un fournisseur est optionnel, utilisez le décorateur `@Optional()` dans la signature du constructeur.

```typescript
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient: T) {}
}
```

Notez que dans l'exemple ci-dessus, nous utilisons un fournisseur personnalisé, ce qui est la raison pour laquelle nous incluons le **jeton** personnalisé `HTTP_OPTIONS`. Les exemples précédents montraient une injection basée sur un constructeur, indiquant une dépendance à travers une classe dans le constructeur. Pour en savoir plus sur les fournisseurs personnalisés et leurs jetons associés, cliquez [ici](/fundamentals/custom-providers).

#### Injection basée sur les propriétés

La technique que nous avons utilisée jusqu'à présent est appelée injection basée sur le constructeur, car les fournisseurs sont injectés via la méthode du constructeur. Dans certains cas très spécifiques, **l'injection basée sur les propriétés** peut s'avérer utile. Par exemple, si votre classe de premier niveau dépend d'un ou de plusieurs fournisseurs, les faire remonter en appelant `super()` dans les sous-classes à partir du constructeur peut être très fastidieux. Pour éviter cela, vous pouvez utiliser le décorateur `@Inject()` au niveau de la propriété.

```typescript
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}
```

> warning **Attention** Si votre classe n'étend pas une autre classe, vous devriez toujours préférer d'utiliser l'injection basée sur le constructeur. Le constructeur décrit explicitement les dépendances requises et offre une meilleure visibilité que les attributs de classe annotés avec `@Inject`.

#### Enregistrement des fournisseurs

Maintenant que nous avons défini un fournisseur (`CatsService`), et que nous avons un consommateur de ce service (`CatsController`), nous devons enregistrer le service avec Nest pour qu'il puisse effectuer l'injection. Nous faisons cela en éditant notre fichier de module (`app.module.ts`) et en ajoutant le service à la liste des `providers` du décorateur `@Module()`.

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

Voici à quoi devrait ressembler la structure de notre répertoire :

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

Pour obtenir des instances existantes ou instancier des fournisseurs de manière dynamique, vous pouvez utiliser la [Référence de module](/fundamentals/module-ref).

Pour obtenir des fournisseurs dans la fonction `bootstrap()` (par exemple pour les applications autonomes sans contrôleurs, ou pour utiliser un service de configuration pendant le bootstrapping), voir [Applications indépendantes](/standalone-applications).
