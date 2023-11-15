### Async Local Storage

`AsyncLocalStorage` est une [API Node.js](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage) (basée sur l'API `async_hooks`) qui fournit un moyen alternatif de propager l'état local à travers l'application sans avoir besoin de le passer explicitement en tant que paramètre de fonction. Il est similaire au stockage local des threads dans d'autres langages.

L'idée principale du stockage local asynchrone est que nous pouvons _envelopper_ un appel de fonction avec l'appel `AsyncLocalStorage#run`. Tout le code invoqué dans l'appel enveloppé a accès au même `store`, qui sera unique à chaque chaîne d'appel.

Dans le contexte de NestJS, cela signifie que si nous pouvons trouver un endroit dans le cycle de vie de la requête où nous pouvons envelopper le reste du code de la requête, nous serons en mesure d'accéder et de modifier l'état visible uniquement pour cette requête, ce qui peut servir d'alternative aux fournisseurs à portée de requête et à certaines de leurs limitations.

Par ailleurs, nous pouvons utiliser l'ALS pour propager le contexte pour une partie seulement du système (par exemple l'objet _transaction_) sans le transmettre explicitement entre les services, ce qui peut améliorer l'isolation et l'encapsulation.

#### Implémentation personnalisée

NestJS lui-même ne fournit pas d'abstraction intégrée pour `AsyncLocalStorage`, donc nous allons voir comment nous pourrions l'implémenter nous-mêmes pour le cas HTTP le plus simple afin d'avoir une meilleure compréhension de l'ensemble du concept :

> info **Info** Pour un [package dédié](recipes/async-local-storage#nestjs-cls) prêt à l'emploi , continuez à lire ci-dessous.

1. Tout d'abord, créez une nouvelle instance de `AsyncLocalStorage` dans un fichier source partagé. Puisque nous utilisons NestJS, transformons-le également en module avec un fournisseur personnalisé.

```ts
@@filename(als.module)
@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage(),
    },
  ],
  exports: [AsyncLocalStorage],
})
export class AlsModule {}
```
>  info **Astuce** `AsyncLocalStorage` est importé de `async_hooks`.

2. Nous ne sommes concernés que par HTTP, alors utilisons un middleware pour envelopper la fonction `next` avec `AsyncLocalStorage#run`. Puisque le middleware est la première chose que la requête atteint, cela rendra le `store` disponible dans tous les améliorateurs et le reste du système.

```ts
@@filename(app.module)
@Module({
  imports: [AlsModule]
  providers: [CatService],
  controllers: [CatController],
})
export class AppModule implements NestModule {
  constructor(
    // injecte l'AsyncLocalStorage dans le constructeur du module,
    private readonly als: AsyncLocalStorage
  ) {}

  configure(consumer: MiddlewareConsumer) {
    // lie le middleware,
    consumer
      .apply((req, res, next) => {
        // remplit le magasin avec des valeurs par défaut
        // en fonction de la requête,
        const store = {
          userId: req.headers['x-user-id'],
        };
        // et passe la fonction "next" comme callback
        // à la méthode "als.run" avec le magasin.
        this.als.run(store, () => next());
      })
      // et l'enregistre pour toutes les routes (dans le cas de Fastify, utiliser '(.*)')
      .forRoutes('*');
  }
}
@@switch
@Module({
  imports: [AlsModule]
  providers: [CatService],
  controllers: [CatController],
})
@Dependencies(AsyncLocalStorage)
export class AppModule {
  constructor(als) {
    // injecte l'AsyncLocalStorage dans le constructeur du module,
    this.als = als
  }

  configure(consumer) {
    // lie le middleware,
    consumer
      .apply((req, res, next) => {
        // remplit le magasin avec des valeurs par défaut
        // en fonction de la requête,
        const store = {
          userId: req.headers['x-user-id'],
        };
        // et passe la fonction "next" comme callback
        // à la méthode "als.run" avec le magasin.
        this.als.run(store, () => next());
      })
      // et l'enregistre pour toutes les routes (dans le cas de Fastify, utiliser '(.*)')
      .forRoutes('*');
  }
}
```

3. Désormais, à n'importe quel moment du cycle de vie d'une requête, nous pouvons accéder à l'instance du magasin local.

```ts
@@filename(cat.service)
@Injectable()
export class CatService {
  constructor(
    // Nous pouvons injecter l'instance ALS fournie.
    private readonly als: AsyncLocalStorage,
    private readonly catRepository: CatRepository,
  ) {}

  getCatForUser() {
    // La méthode "getStore" renvoie toujours
    // l'instance de magasin associée à la requête donnée.
    const userId = this.als.getStore()["userId"] as number;
    return this.catRepository.getForUser(userId);
  }
}
@@switch
@Injectable()
@Dependencies(AsyncLocalStorage, CatRepository)
export class CatService {
  constructor(als, catRepository) {
    // Nous pouvons injecter l'instance ALS fournie.
    this.als = als
    this.catRepository = catRepository
  }

  getCatForUser() {
    // La méthode "getStore" renvoie toujours
    // l'instance de magasin associée à la requête donnée.
    const userId = this.als.getStore()["userId"] as number;
    return this.catRepository.getForUser(userId);
  }
}
```

4. Voilà, c'est fait. Nous avons maintenant un moyen de partager l'état lié à la requête sans avoir besoin d'injecter l'objet `REQUEST` entier.

> warning **Attention** Sachez que si cette technique est utile dans de nombreux cas, elle obscurcit intrinsèquement le flux de code (en créant un contexte implicite). Il convient donc de l'utiliser de manière responsable et d'éviter tout particulièrement de créer des "[objets Dieu](https://en.wikipedia.org/wiki/God_object)" contextuels.

### NestJS CLS

Le package [nestjs-cls](https://github.com/Papooch/nestjs-cls) fournit plusieurs améliorations DX par rapport à l'utilisation du simple `AsyncLocalStorage` (`CLS` est une abréviation du terme _continuation-local storage_). Il abstrait l'implémentation dans un `ClsModule` qui offre différentes manières d'initialiser le `store` pour différents transports (pas seulement HTTP), ainsi qu'un support de typage fort.

Il est alors possible d'accéder au magasin à l'aide d'un `ClsService` injectable, ou de s'abstraire entièrement de la logique commerciale en utilisant des [Proxy Providers](https://www.npmjs.com/package/nestjs-cls#proxy-providers).

> info **Info** `nestjs-cls` est un package tiers et n'est pas géré par l'équipe NestJS. Veuillez rapporter tout problème trouvé avec la bibliothèque dans le [dépôt approprié](https://github.com/Papooch/nestjs-cls/issues).

#### Installation

En dehors d'une dépendance sur les librairies `@nestjs`, il n'utilise que l'API intégrée de Node.js. Installez-le comme n'importe quel autre package.

```bash
npm i nestjs-cls
```

#### Usage

Une fonctionnalité similaire à celle décrite [ci-dessus](#implémentation-personnalisée) peut être implémentée en utilisant `nestjs-cls` comme suit :

1. Importer le `ClsModule` dans le module racine.

```ts
@@filename(app.module)
@Module({
  imports: [
    // Enregistre le ClsModule,
    ClsModule.forRoot({
      middleware: {
        // monte automatiquement le module
        // ClsMiddleware pour toutes les routes
        mount: true,
        // et utilise la méthode setup pour
        // fournir des valeurs par défaut
        setup: (cls, req) => {
          cls.set('userId', req.headers['x-user-id']);
        },
      },
    }),
  ],
  providers: [CatService],
  controllers: [CatController],
})
export class AppModule {}
```

2. On peut ensuite utiliser le `ClsService` pour accéder aux valeurs du magasin.

```ts
@@filename(cat.service)
@Injectable()
export class CatService {
  constructor(
    // Nous pouvons injecter l'instance de ClsService fournie,
    private readonly cls: ClsService,
    private readonly catRepository: CatRepository,
  ) {}

  getCatForUser() {
    // et utiliser la méthode "get" pour récupérer toute valeur stockée.
    const userId = this.cls.get('userId');
    return this.catRepository.getForUser(userId);
  }
}
@@switch
@Injectable()
@Dependencies(AsyncLocalStorage, CatRepository)
export class CatService {
  constructor(cls, catRepository) {
    // Nous pouvons injecter l'instance de ClsService fournie,
    this.cls = cls
    this.catRepository = catRepository
  }

  getCatForUser() {
    // et utiliser la méthode "get" pour récupérer toute valeur stockée.
    const userId = this.cls.get('userId');
    return this.catRepository.getForUser(userId);
  }
}
```

3. Pour obtenir un typage fort des valeurs du magasin gérées par le `ClsService` (et également obtenir des suggestions automatiques des clés de chaîne), nous pouvons utiliser un paramètre de type optionnel `ClsService<MyClsStore>` lors de l'injection.

```ts
export interface MyClsStore extends ClsStore {
  userId: number;
}
```

> info **Astuce** Il est également possible de laisser le package générer automatiquement un identifiant de requête et d'y accéder plus tard avec `cls.getId()`, ou d'obtenir l'objet de requête complet en utilisant `cls.get(CLS_REQ)`.

#### Tester

Puisque le `ClsService` est juste un autre fournisseur injectable, il peut être entièrement simulé dans les tests unitaires.

Cependant, dans certains tests d'intégration, nous pourrions toujours vouloir utiliser l'implémentation réelle de `ClsService`. Dans ce cas, nous devrons envelopper le morceau de code contextuel avec un appel à `ClsService#run` ou `ClsService#runWith`.

```ts
describe('CatService', () => {
  let service: CatService
  let cls: ClsService
  const mockCatRepository = createMock<CatRepository>()

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      // Met en place la majeure partie du module de test comme nous le ferions normalement.
      providers: [
        CatService,
        {
          provide: CatRepository
          useValue: mockCatRepository
        }
      ],
      imports: [
        // Importe la version statique de ClsModule qui fournit seulement
        // le ClsService, mais ne configure en aucune façon le magasin.
        ClsModule
      ],
    }).compile()

    service = module.get(CatService)

    // Récupère également le ClsService pour une utilisation ultérieure.
    cls = module.get(ClsService)
  })

  describe('getCatForUser', () => {
    it('retrieves cat based on user id', async () => {
      const expectedUserId = 42
      mockCatRepository.getForUser.mockImplementationOnce(
        (id) => ({ userId: id })
      )

      // Enveloppe l'appel au test dans la méthode `runWith`.
      // dans lequel nous pouvons passer des valeurs de magasin créées à la main.
      const cat = await cls.runWith(
        { userId: expectedUserId },
        () => service.getCatForUser()
      )

      expect(cat.userId).toEqual(expectedUserId)
    })
  })
})
```

#### En savoir plus

Visitez la [Page GitHub NestJS CLS](https://github.com/Papooch/nestjs-cls) pour obtenir la documentation complète de l'API et d'autres exemples de code.
