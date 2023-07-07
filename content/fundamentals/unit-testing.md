### Tests

L'automatisation des tests est considérée comme un élément essentiel de tout effort sérieux de développement de logiciels. L'automatisation permet de répéter facilement et rapidement des tests individuels ou des suites de tests au cours du développement. Cela permet de s'assurer que les versions répondent aux objectifs de qualité et de performance. L'automatisation permet d'augmenter la couverture et de fournir un retour d'information plus rapide aux développeurs. L'automatisation augmente la productivité des développeurs et garantit que les tests sont exécutés à des moments critiques du cycle de développement, tels que le contrôle du code source, l'intégration des fonctionnalités et la sortie de la version.

Ces tests couvrent souvent une variété de types, y compris les tests unitaires, les tests de bout en bout (e2e), les tests d'intégration, etc. Si les avantages sont incontestables, leur mise en place peut s'avérer fastidieuse. Nest s'efforce de promouvoir les meilleures pratiques de développement, y compris des tests efficaces, et inclut donc des fonctionnalités telles que les suivantes pour aider les développeurs et les équipes à créer et à automatiser des tests. Nest :

- met automatiquement en place des tests unitaires par défaut pour les composants et des tests e2e pour les applications
- fournit des outils par défaut (tels qu'un lanceur de tests qui construit un module isolé/un chargeur d'application)
- fournit une intégration avec [Jest](https://github.com/facebook/jest) et [Supertest](https://github.com/visionmedia/supertest) prête à l'emploi, tout en restant agnostique aux outils de test
- rend le système d'injection de dépendances Nest disponible dans l'environnement de test pour faciliter l'imitation des composants

Comme indiqué, vous pouvez utiliser n'importe quel **framework de test**, car Nest n'impose pas d'outil spécifique. Remplacez simplement les éléments nécessaires (comme le runner de test), et vous profiterez toujours des avantages des outils de test prêts à l'emploi de Nest.

#### Installation

Pour commencer, installez d'abord le package requis :

```bash
$ npm i --save-dev @nestjs/testing
```

#### Tests unitaires

Dans l'exemple suivant, nous testons deux classes : `CatsController` et `CatsService`. Comme mentionné, [Jest](https://github.com/facebook/jest) est fourni comme framework de test par défaut. Il sert d'exécuteur de tests et fournit également des fonctions assert et des utilitaires test-double qui aident à l'imitation, à l'espionnage, etc. Dans le test de base suivant, nous instancions manuellement ces classes et nous nous assurons que le contrôleur et le service remplissent leur contrat d'API.

```typescript
@@filename(cats.controller.spec)
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

> info **Astuce** Gardez vos fichiers de test à proximité des classes qu'ils testent. Les fichiers de test doivent avoir un suffixe `.spec` ou `.test`.

Parce que l'exemple ci-dessus est trivial, nous ne testons rien de spécifique à Nest. En effet, nous n'utilisons même pas l'injection de dépendance (remarquez que nous passons une instance de `CatsService` à notre `catsController`). Cette forme de test - où nous instancions manuellement les classes testées - est souvent appelée **test isolé** car elle est indépendante du framework. Nous allons présenter quelques fonctionnalités plus avancées qui vous aideront à tester des applications qui font un usage plus intensif des fonctionnalités de Nest.

#### Utilitaires de test

Le package `@nestjs/testing` fournit un ensemble d'utilitaires qui permettent un processus de test plus robuste. Réécrivons l'exemple précédent en utilisant la classe intégrée `Test` :

```typescript
@@filename(cats.controller.spec)
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get<CatsService>(CatsService);
    catsController = moduleRef.get<CatsController>(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get(CatsService);
    catsController = moduleRef.get(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

La classe `Test` est utile pour fournir un contexte d'exécution d'application qui simule essentiellement le runtime complet de Nest, mais vous donne des hooks qui facilitent la gestion des instances de classe, y compris le mocking et la surcharge. La classe `Test` a une méthode `createTestingModule()` qui prend un objet de métadonnées de module comme argument (le même objet que vous passez au décorateur `@Module()`). Cette méthode retourne une instance de `TestingModule` qui fournit à son tour quelques méthodes. Pour les tests unitaires, la plus importante est la méthode `compile()`. Cette méthode démarre un module avec ses dépendances (de la même manière qu'une application est démarrée dans le fichier `main.ts` conventionnel en utilisant `NestFactory.create()`), et renvoie un module qui est prêt à être testé.

> info **Astuce** La méthode `compile()` est **asynchrone** et doit donc être attendue. Une fois que le module est compilé, vous pouvez récupérer toutes les instances **statiques** qu'il déclare (contrôleurs et fournisseurs) en utilisant la méthode `get()`.

`TestingModule` hérite de la classe [référence de module](/fundamentals/module-ref), et donc de sa capacité à résoudre dynamiquement les fournisseurs scopés (transient ou request). Faites-le avec la méthode `resolve()` (la méthode `get()` ne peut récupérer que des instances statiques).

```typescript
const moduleRef = await Test.createTestingModule({
  controllers: [CatsController],
  providers: [CatsService],
}).compile();

catsService = await moduleRef.resolve(CatsService);
```

> warning **Attention** La méthode `resolve()` renvoie une instance unique du fournisseur, à partir de sa propre sous-arborescence de **conteneur ID**. Chaque sous-arbre a un identifiant de contexte unique. Par conséquent, si vous appelez cette méthode plus d'une fois et comparez les références des instances, vous verrez qu'elles ne sont pas égales.

> info **Astuce** Pour en savoir plus sur les caractéristiques de référence du module [ici](/fundamentals/module-ref).

Au lieu d'utiliser la version de production d'un fournisseur, vous pouvez le remplacer par un [fournisseur personnalisé](/fundamentals/custom-providers) à des fins de test. Par exemple, vous pouvez simuler un service de base de données au lieu de vous connecter à une base de données réelle. Nous aborderons les surcharges dans la section suivante, mais elles sont également disponibles pour les tests unitaires.

<app-banner-courses></app-banner-courses>

#### Auto mocking

Nest vous permet également de définir une factory mock à appliquer à toutes vos dépendances manquantes. C'est utile dans les cas où vous avez un grand nombre de dépendances dans une classe et que les simuler toutes prendrait beaucoup de temps et de configuration. Pour utiliser cette fonctionnalité, la méthode `createTestingModule()` devra être enchaînée avec la méthode `useMocker()`, en passant une fabrique pour vos mocks de dépendances. Cette fabrique peut prendre un jeton optionnel, qui est un jeton d'instance, n'importe quel jeton qui est valide pour un fournisseur de Nid, et retourne une implémentation fictive. Voici un exemple de création d'un mocker générique utilisant [`jest-mock`](https://www.npmjs.com/package/jest-mock) et d'un mocker spécifique pour `CatsService` utilisant `jest.fn()`.

```typescript
// ...
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('CatsController', () => {
  let controller: CatsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CatsController],
    })
      .useMocker((token) => {
        const results = ['test1', 'test2'];
        if (token === CatsService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(CatsController);
  });
});
```

Vous pouvez également récupérer ces mocks hors du conteneur de test comme vous le feriez normalement avec des fournisseurs personnalisés, `moduleRef.get(CatsService)`.

> info **Astuce** Une factory de mock générale, comme `createMock` de [`@golevelup/ts-jest`](https://github.com/golevelup/nestjs/tree/master/packages/testing) peut aussi être passée directement.

> info **Astuce** Les fournisseurs `REQUEST` et `INQUIRER` ne peuvent pas être auto-mockés car ils sont déjà prédéfinis dans le contexte. Cependant, ils peuvent être _remplacés_ en utilisant la syntaxe des fournisseurs personnalisés ou en utilisant la méthode `.overrideProvider`.

#### Tests de bout en bout

Contrairement aux tests unitaires, qui se concentrent sur des modules et des classes individuels, les tests de bout en bout (e2e) couvrent l'interaction des classes et des modules à un niveau plus global - plus proche du type d'interaction que les utilisateurs finaux auront avec le système de production. Au fur et à mesure qu'une application se développe, il devient difficile de tester manuellement le comportement de bout en bout de chaque point de terminaison de l'API. Les tests automatisés de bout en bout nous aident à nous assurer que le comportement global du système est correct et répond aux exigences du projet. Pour effectuer des tests e2e, nous utilisons une configuration similaire à celle que nous venons d'aborder dans **les tests unitaires**. En outre, Nest facilite l'utilisation de la bibliothèque [Supertest](https://github.com/visionmedia/supertest) pour simuler des requêtes HTTP.

```typescript
@@filename(cats.e2e-spec)
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
@@switch
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

> info **Astuce** Si vous utilisez [Fastify](/techniques/performance) comme adaptateur HTTP, il nécessite une configuration légèrement différente et dispose de capacités de test intégrées :
>
> ```ts
> let app: NestFastifyApplication;
>
> beforeAll(async () => {
>   app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
>
>   await app.init();
>   await app.getHttpAdapter().getInstance().ready();
> });
>
> it(`/GET cats`, () => {
>   return app
>     .inject({
>       method: 'GET',
>       url: '/cats',
>     })
>     .then((result) => {
>       expect(result.statusCode).toEqual(200);
>       expect(result.payload).toEqual(/* expectedPayload */);
>     });
> });
>
> afterAll(async () => {
>   await app.close();
> });
> ```

Dans cet exemple, nous nous appuyons sur certains des concepts décrits précédemment. En plus de la méthode `compile()` que nous avons utilisée précédemment, nous utilisons maintenant la méthode `createNestApplication()` pour instancier un environnement d'exécution Nest complet. Nous sauvegardons une référence à l'application en cours d'exécution dans notre variable `app` afin de pouvoir l'utiliser pour simuler des requêtes HTTP.

Nous simulons des tests HTTP en utilisant la fonction `request()` de Supertest. Nous voulons que ces requêtes HTTP soient dirigées vers notre application Nest en cours d'exécution, donc nous passons à la fonction `request()` une référence à l'auditeur HTTP qui sous-tend Nest (qui, à son tour, peut être fourni par la plateforme Express). D'où la construction `request(app.getHttpServer())`. L'appel à `request()` nous donne un serveur HTTP enveloppé, maintenant connecté à l'application Nest, qui expose des méthodes pour simuler une requête HTTP réelle. Par exemple, l'utilisation de `request(...).get('/cats')` lancera une requête vers l'application Nest qui est identique à une **réelle** requête HTTP comme `get '/cats'` arrivant par le réseau.

Dans cet exemple, nous fournissons également une implémentation alternative (test-double) de `CatsService` qui retourne simplement une valeur codée en dur que nous pouvons tester. Utilisez `overrideProvider()` pour fournir une telle implémentation alternative. De la même manière, Nest fournit des méthodes pour surcharger les modules, les gardes, les intercepteurs, les filtres et les pipes avec les méthodes `overrideModule()`, `overrideGuard()`, `overrideInterceptor()`, `overrideFilter()`, et `overridePipe()` respectivement.

Chacune des méthodes de remplacement (à l'exception de `overrideModule()`) renvoie un objet avec 3 méthodes différentes qui reflètent celles décrites pour les [fournisseurs personnalisés](/fundamentals/custom-providers) :

- `useClass` : vous fournissez une classe qui sera instanciée pour fournir l'instance permettant de surcharger l'objet ( fournisseur, garde, etc.).
- `useValue` : vous fournissez une instance qui remplacera l'objet.
- `useFactory` : vous fournissez une fonction qui renvoie une instance qui remplacera l'objet.

D'autre part, `overrideModule()` renvoie un objet avec la méthode `useModule()`, que vous pouvez utiliser pour fournir un module qui surchargera le module original, comme suit :

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideModule(CatsModule)
  .useModule(AlternateCatsModule)
  .compile();
```

Chaque type de méthode de surcharge, à son tour, renvoie l'instance `TestingModule`, et peut donc être enchaîné avec d'autres méthodes dans le [style fluide](https://en.wikipedia.org/wiki/Fluent_interface). Vous devriez utiliser `compile()` à la fin d'une telle chaîne pour que Nest instancie et initialise le module.

De plus, vous pouvez parfois vouloir fournir un logger personnalisé, par exemple lorsque les tests sont exécutés (par exemple, sur un serveur CI). Utilisez la méthode `setLogger()` et passez un objet qui remplit l'interface `LoggerService` pour indiquer au `TestModuleBuilder` comment journaliser pendant les tests (par défaut, seuls les logs "error" seront journalisés sur la console).

> warning **Attention** Le package `@nestjs/core` expose des jetons de fournisseur uniques avec le préfixe `APP_` pour aider à définir des améliorateurs globaux. Ces jetons ne peuvent pas être surchargés car ils peuvent représenter plusieurs fournisseurs. Vous ne pouvez donc pas utiliser `.overrideProvider(APP_GUARD)` (et ainsi de suite). Si vous souhaitez remplacer un améliorateur global, suivez [cette solution de contournement](https://github.com/nestjs/nest/issues/4053#issuecomment-585612462).

Le module compilé dispose de plusieurs méthodes utiles, décrites dans le tableau suivant :

<table>
  <tr>
    <td>
      <code>createNestApplication()</code>
    </td>
    <td>
      Crée et renvoie une application Nest (instance <code>INestApplication</code>) basée sur le module donné.  
      Notez que vous devez initialiser manuellement l'application à l'aide de la méthode <code>init()</code>.
    </td>
  </tr>
  <tr>
    <td>
      <code>createNestMicroservice()</code>
    </td>
    <td>
      Crée et renvoie un microservice Nest (instance <code>INestMicroservice</code>) basé sur le module donné.
    </td>
  </tr>
  <tr>
    <td>
      <code>get()</code>
    </td>
    <td>
      Récupère une instance statique d'un contrôleur ou d'un fournisseur (y compris les gardes, les filtres, etc.) disponible dans le contexte de l'application. Héritée de la classe <a href="/fundamentals/module-ref">référence de module</a>.
    </td>
  </tr>
  <tr>
     <td>
      <code>resolve()</code>
    </td>
    <td>
      Récupère une instance à portée créée dynamiquement (requête ou transitoire) d'un contrôleur ou d'un fournisseur (y compris les gardes, les filtres, etc.) disponible dans le contexte de l'application. Héritée de la classe <a href="/fundamentals/module-ref">référence de module</a>.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      Navigue dans le graphe de dépendance du module ; peut être utilisé pour récupérer une instance spécifique du module sélectionné (utilisé avec le mode strict (<code>strict: true</code>) dans la méthode <code>get()</code>).
    </td>
  </tr>
</table>

> info **Astuce** Gardez vos fichiers de test e2e dans le répertoire `test`. Les fichiers de test doivent avoir un suffixe `.e2e-spec`.

#### Remplacer les améliorateurs globaux

Si vous avez une garde (ou une pipe, un intercepteur ou un filtre) enregistrée au niveau mondial, vous devez prendre quelques mesures supplémentaires pour remplacer cet améliorateur. Pour récapituler, l'enregistrement original ressemble à ceci :

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

Il s'agit d'enregistrer le gardien comme un fournisseur " multiple " à travers le jeton `APP_*`. Pour pouvoir remplacer le `JwtAuthGuard` ici, l'enregistrement doit utiliser un fournisseur existant :

```typescript
providers: [
  {
    provide: APP_GUARD,
    useExisting: JwtAuthGuard,
    // ^^^^^^^^ notice the use of 'useExisting' instead of 'useClass'
  },
  JwtAuthGuard,
],
```

> info **Astuce** : Changez `useClass` en `useExisting` pour référencer un fournisseur enregistré au lieu d'avoir Nest qui l'instancie derrière le token.

Maintenant, le `JwtAuthGuard` est visible par Nest comme un fournisseur normal qui peut être surchargé lors de la création du `TestingModule` :

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(JwtAuthGuard)
  .useClass(MockAuthGuard)
  .compile();
```

Maintenant, tous vos tests utiliseront le `MockAuthGuard` sur chaque requête.

#### Test des instances à portée de requête

Les fournisseurs [à portée de requête](/fundamentals/injection-scopes) sont créés de manière unique pour chaque **requête** entrante. L'instance est recyclée une fois que la requête a été traitée. Cela pose un problème, car nous ne pouvons pas accéder à un sous-arbre d'injection de dépendances généré spécifiquement pour une requête testée.

Nous savons (d'après les sections ci-dessus) que la méthode `resolve()` peut être utilisée pour récupérer une classe dynamiquement instanciée. De plus, comme décrit <a href="/fundamentals/module-ref#résoudre-les-fournisseurs-à-portée-réduite">ici</a>, nous savons que nous pouvons passer un identifiant de contexte unique pour contrôler le cycle de vie d'un sous-arbre de conteneur ID. Comment tirer parti de cette possibilité dans un contexte de test ?

La stratégie consiste à générer au préalable un identifiant de contexte et à forcer Nest à utiliser cet identifiant particulier pour créer une sous-arborescence pour toutes les requêtes entrantes. De cette manière, nous pourrons récupérer les instances créées pour une requête testée.

Pour cela, utilisez `jest.spyOn()` sur le `ContextIdFactory` :

```typescript
const contextId = ContextIdFactory.create();
jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);
```

Nous pouvons maintenant utiliser le `contextId` pour accéder à un seul sous-arbre de conteneur ID généré pour toute requête ultérieure.

```typescript
catsService = await moduleRef.resolve(CatsService, contextId);
```
