### Fournisseurs personnalisés

Dans les chapitres précédents, nous avons abordé divers aspects de **l'injection de dépendances (ID)** et la façon dont elle est utilisée dans Nest. Un exemple est l'injection de dépendance [basée sur le constructeur](/providers#injection-de-dépendance) utilisée pour injecter des instances (souvent des fournisseurs de services) dans les classes. Vous ne serez pas surpris d'apprendre que l'injection de dépendances est intégrée de manière fondamentale dans le noyau de Nest. Jusqu'à présent, nous n'avons exploré qu'un seul modèle principal. Au fur et à mesure que votre application se complexifie, vous aurez peut-être besoin de tirer parti de toutes les fonctionnalités du système d'injection de dépendances, alors explorons-les plus en détail.

#### Principes de base de l'ID

L'injection de dépendances est une technique [d'inversion de contrôle (IoC)](https://en.wikipedia.org/wiki/Inversion_of_control) dans laquelle vous déléguez l'instanciation des dépendances au conteneur IoC (dans notre cas, le système d'exécution NestJS), au lieu de le faire impérativement dans votre propre code. Examinons ce qui se passe dans cet exemple tiré du chapitre sur les [fournisseurs](https://docs.nestjs.com/providers).

Tout d'abord, nous définissons un fournisseur. Le décorateur `@Injectable()` marque la classe `CatsService` comme fournisseur.

```typescript
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

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

  findAll() {
    return this.cats;
  }
}
```

Ensuite, nous demandons à Nest d'injecter le fournisseur dans notre classe de contrôleur :

```typescript
@@filename(cats.controller)
import { Controller, Get } from '@nestjs/common';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
@@switch
import { Controller, Get, Bind, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}
```

Enfin, nous enregistrons le fournisseur auprès du conteneur Nest IoC :

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

Que se passe-t-il exactement en coulisses pour que cela fonctionne ? Il y a trois étapes clés dans le processus :

1. Dans `cats.service.ts`, le décorateur `@Injectable()` déclare la classe `CatsService` comme une classe qui peut être gérée par le conteneur IoC Nest.
2. Dans `cats.controller.ts`, `CatsController` déclare une dépendance sur le jeton `CatsService` avec injection de constructeur :

```typescript
  constructor(private catsService: CatsService)
```

3. Dans `app.module.ts`, nous associons le jeton `CatsService` avec la classe `CatsService` du fichier `cats.service.ts`. Nous allons <a href="/fundamentals/custom-providers#fournisseurs-standards">voir ci-dessous</a> comment cette association (aussi appelée _enregistrement_) se produit.

Quand le conteneur Nest IoC instancie un `CatsController`, il recherche d'abord les dépendances. Quand il trouve la dépendance `CatsService`, il effectue une recherche sur le jeton `CatsService`, qui retourne la classe `CatsService`, selon l'étape d'enregistrement (#3 ci-dessus). En supposant une portée `SINGLETON` (le comportement par défaut), Nest va alors soit créer une instance de `CatsService`, la mettre en cache, et la retourner, ou si une instance est déjà mise en cache, retourner l'instance existante.

\*Cette explication est un peu simplifiée pour illustrer le propos. Un point important que nous avons négligé est que le processus d'analyse du code pour les dépendances est très sophistiqué et se déroule pendant l'amorçage de l'application. Une caractéristique clé est que l'analyse des dépendances (ou "création du graphe des dépendances") est **transitive**. Dans l'exemple ci-dessus, si le `CatsService` lui-même avait des dépendances, celles-ci seraient également résolues. Le graphe de dépendance garantit que les dépendances sont résolues dans le bon ordre - essentiellement "de bas en haut". Ce mécanisme évite au développeur d'avoir à gérer des graphes de dépendances aussi complexes.

<app-banner-courses></app-banner-courses>

#### Fournisseurs standards

Regardons de plus près le décorateur `@Module()`. Dans `app.module`, nous déclarons :

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
```

La propriété `providers` prend une liste de `providers`. Jusqu'à présent, nous avons fourni ces fournisseurs via une liste de noms de classes. En fait, la syntaxe `providers : [CatsService]` est un raccourci pour la syntaxe plus complète :

```typescript
providers: [
  {
    provide: CatsService,
    useClass: CatsService,
  },
];
```

Maintenant que nous voyons cette construction explicite, nous pouvons comprendre le processus d'enregistrement. Ici, nous associons clairement le jeton `CatsService` à la classe `CatsService`. La notation abrégée est simplement une commodité pour simplifier le cas d'utilisation le plus courant, où le jeton est utilisé pour requérir une instance d'une classe portant le même nom.

#### Fournisseurs personnalisés

Que se passe-t-il lorsque vos besoins vont au-delà de ce que proposent les _fournisseurs standard_ ? Voici quelques exemples :

- Vous souhaitez créer une instance personnalisée au lieu de demander à Nest d'instancier (ou de renvoyer une instance mise en cache) une classe.
- Vous souhaitez réutiliser une classe existante dans une deuxième dépendance
- Vous souhaitez remplacer une classe par une version factice à des fins de test.

Nest vous permet de définir des fournisseurs personnalisés pour traiter ces cas. Il existe plusieurs façons de définir des fournisseurs personnalisés. Passons-les en revue.

> info **Astuce** Si vous avez des problèmes avec la résolution des dépendances, vous pouvez définir la variable d'environnement `NEST_DEBUG` et obtenir des logs supplémentaires de résolution des dépendances pendant le démarrage.

#### Fournisseurs de valeur : `useValue`

La syntaxe `useValue` est utile pour injecter une valeur constante, mettre une bibliothèque externe dans le conteneur Nest, ou remplacer une implémentation réelle par un objet factice. Supposons que vous souhaitiez forcer Nest à utiliser un simulacre de `CatsService` à des fins de test.

```typescript
import { CatsService } from './cats.service';

const mockCatsService = {
  /* implémentation factice
  ...
  */
};

@Module({
  imports: [CatsModule],
  providers: [
    {
      provide: CatsService,
      useValue: mockCatsService,
    },
  ],
})
export class AppModule {}
```

Dans cet exemple, le jeton `CatsService` résoudra l'objet factice `mockCatsService`. `useValue` requiert une valeur - dans ce cas un objet littéral qui a la même interface que la classe `CatsService` qu'il remplace. Grâce au [typage structurel](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) de TypeScript , vous pouvez utiliser n'importe quel objet ayant une interface compatible, y compris un objet littéral ou une instance de classe instanciée avec `new`.

#### Jetons de fournisseur non basés sur une classe

Jusqu'à présent, nous avons utilisé des noms de classe comme jetons de fournisseur (la valeur de la propriété `provide` d'un fournisseur listé dans le tableau `providers`). Ceci correspond au modèle standard utilisé avec l'[injection basée sur le constructeur](/providers#injection-de-dépendance), où le jeton est également un nom de classe. ( Voir <a href="/fundamentals/custom-providers#principes-de-base-de-lid">Principes de base de l'ID</a> pour un rappel sur les tokens si ce concept n'est pas tout à fait clair). Parfois, nous pouvons souhaiter avoir la possibilité d'utiliser des chaînes ou des symboles comme jeton ID. Par exemple :

```typescript
import { connection } from './connection';

@Module({
  providers: [
    {
      provide: 'CONNECTION',
      useValue: connection,
    },
  ],
})
export class AppModule {}
```

Dans cet exemple, nous associons un jeton à valeur de chaîne (`'CONNECTION'`) à un objet `connection' préexistant que nous avons importé d'un fichier externe.

> warning **Remarque** Outre l'utilisation de chaînes comme valeurs de jeton, vous pouvez également utiliser des [symboles JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) ou des [enums TypeScript](https://www.typescriptlang.org/docs/handbook/enums.html).

Nous avons vu précédemment comment injecter un fournisseur en utilisant le modèle standard d'[injection basée sur le constructeur](https://docs.nestjs.com/providers#dependency-injection). Ce schéma **exige** que la dépendance soit déclarée avec un nom de classe. Le fournisseur personnalisé `'CONNECTION'` utilise une chaîne de caractères. Voyons comment injecter un tel fournisseur. Pour ce faire, nous utilisons le décorateur `@Inject()`. Ce décorateur prend un seul argument - le jeton.

```typescript
@@filename()
@Injectable()
export class CatsRepository {
  constructor(@Inject('CONNECTION') connection: Connection) {}
}
@@switch
@Injectable()
@Dependencies('CONNECTION')
export class CatsRepository {
  constructor(connection) {}
}
```

> info **Astuce** Le décorateur `@Inject()` est importé du package `@nestjs/common`.

Bien que nous utilisions directement la chaîne `'CONNECTION'` dans les exemples ci-dessus à des fins d'illustration, pour une organisation propre du code, il est préférable de définir les tokens dans un fichier séparé, tel que `constants.ts`. Traitez-les comme vous le feriez avec des symboles ou des enums qui sont définis dans leur propre fichier et importés là où c'est nécessaire.

#### Fournisseurs de classe : `useClass`

La syntaxe `useClass` vous permet de déterminer dynamiquement une classe à laquelle un jeton doit être résolu. Par exemple, supposons que nous ayons une classe abstraite (ou par défaut) `ConfigService`. En fonction de l'environnement actuel, nous voulons que Nest fournisse une implémentation différente du service de configuration. Le code suivant implémente une telle stratégie.

```typescript
const configServiceProvider = {
  provide: ConfigService,
  useClass:
    process.env.NODE_ENV === 'development'
      ? DevelopmentConfigService
      : ProductionConfigService,
};

@Module({
  providers: [configServiceProvider],
})
export class AppModule {}
```

Examinons quelques détails de cet exemple de code. Vous remarquerez que nous définissons `configServiceProvider` avec un objet littéral d'abord, puis nous le passons dans la propriété `providers` du décorateur de module. C'est juste un peu d'organisation de code, mais c'est fonctionnellement équivalent aux exemples que nous avons utilisés jusqu'à présent dans ce chapitre.

De plus, nous avons utilisé le nom de la classe `ConfigService` comme token. Pour toute classe qui dépend de `ConfigService`, Nest injectera une instance de la classe fournie (`DevelopmentConfigService` ou `ProductionConfigService`) en remplaçant toute implémentation par défaut qui aurait pu être déclarée ailleurs (par exemple, un `ConfigService` déclaré avec un décorateur `@Injectable()`).

#### Fournisseurs de factory : `useFactory`

La syntaxe `useFactory` permet de créer des fournisseurs **dynamiquement**. Le fournisseur réel sera fourni par la valeur renvoyée par une fonction "factory". La fonction factory peut être aussi simple ou complexe que nécessaire. Une fabrique simple ne peut dépendre d'aucun autre fournisseur. Une fabrique plus complexe peut elle-même injecter d'autres fournisseurs dont elle a besoin pour calculer son résultat. Dans ce dernier cas, la syntaxe du fournisseur d'usine dispose d'une paire de mécanismes connexes :

1. La fonction factory peut accepter des arguments (facultatifs).
2. La propriété (optionnelle) `inject` accepte un tableau de fournisseurs que Nest va résoudre et passer comme arguments à la fonction factory pendant le processus d'instanciation. De plus, ces fournisseurs peuvent être marqués comme optionnels. Les deux listes doivent être corrélées : Nest passera les instances de la liste `inject` comme arguments à la fonction factory dans le même ordre. L'exemple ci-dessous le démontre.

```typescript
@@filename()
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider, optionalProvider?: string) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \_____________/            \__________________/
  //        Ce fournisseur         Le fournisseur avec ce jeton
  //       est obligatoire        peut être résolu en `undefined`.
};

@Module({
  providers: [
    connectionProvider,
    OptionsProvider,
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
@@switch
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider, optionalProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \_____________/            \__________________/
  //        Ce fournisseur         Le fournisseur avec ce jeton
  //       est obligatoire        peut être résolu en `undefined`.
};

@Module({
  providers: [
    connectionProvider,
    OptionsProvider,
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
```

#### Fournisseurs d'alias : `useExisting`

La syntaxe `useExisting` vous permet de créer des alias pour des fournisseurs existants. Cela crée deux façons d'accéder au même fournisseur. Dans l'exemple ci-dessous, le jeton (basé sur une chaîne) `'AliasedLoggerService'` est un alias pour le jeton (basé sur une classe) `LoggerService`. Supposons que nous ayons deux dépendances différentes, une pour `'AliasedLoggerService'' et une pour `LoggerService`. Si les deux dépendances sont spécifiées avec la portée `SINGLETON`, elles seront toutes deux résolues dans la même instance.

```typescript
@Injectable()
class LoggerService {
  /* implementation details */
}

const loggerAliasProvider = {
  provide: 'AliasedLoggerService',
  useExisting: LoggerService,
};

@Module({
  providers: [LoggerService, loggerAliasProvider],
})
export class AppModule {}
```

#### Fournisseurs non basés sur les services

Si les fournisseurs proposent souvent des services, ils ne sont pas limités à cet usage. Un fournisseur peut fournir **n'importe quelle** valeur. Par exemple, un fournisseur peut fournir un tableau d'objets de configuration basés sur l'environnement actuel, comme indiqué ci-dessous :

```typescript
const configFactory = {
  provide: 'CONFIG',
  useFactory: () => {
    return process.env.NODE_ENV === 'development' ? devConfig : prodConfig;
  },
};

@Module({
  providers: [configFactory],
})
export class AppModule {}
```

#### Exporter un fournisseur personnalisé

Comme tout fournisseur, un fournisseur personnalisé est limité au module qui le déclare. Pour qu'il soit visible par d'autres modules, il doit être exporté. Pour exporter un fournisseur personnalisé, nous pouvons utiliser son jeton ou l'objet complet du fournisseur.

L'exemple suivant montre l'exportation à l'aide du jeton :

```typescript
@@filename()
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
@@switch
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
```

Il est également possible d'exporter avec l'objet complet du fournisseur :

```typescript
@@filename()
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
@@switch
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
```
