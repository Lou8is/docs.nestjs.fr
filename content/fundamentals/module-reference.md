### Référence de module

Nest fournit la classe `ModuleRef` pour naviguer dans la liste interne des fournisseurs et obtenir une référence à n'importe quel fournisseur en utilisant son jeton d'injection comme clé de recherche. La classe `ModuleRef` fournit également un moyen d'instancier dynamiquement des fournisseurs statiques et à portée. La classe `ModuleRef` peut être injectée dans une classe de la manière habituelle :

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(private moduleRef: ModuleRef) {}
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }
}
```

> info **Astuce** La classe `ModuleRef` est importée du package `@nestjs/core`.

#### Récupérer des instances

L'instance `ModuleRef` (ci-après nous nous y référerons en tant que **référence de module**) a une méthode `get()`. Cette méthode récupère un fournisseur, un contrôleur ou un objet injectable (par exemple, une garde, un intercepteur, etc.) qui existe (a été instancié) dans le module **actuel** en utilisant son jeton d'injection/nom de classe.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private service: Service;
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}
```

> warning **Attention** Vous ne pouvez pas récupérer les fournisseurs à portée (transient ou request) avec la méthode `get()`. Utilisez plutôt la technique décrite <a href="/fundamentals/module-ref#résoudre-les-fournisseurs-à-portée-réduite">ci-dessous</a>. Apprenez à contrôler les portées [ici](/fundamentals/injection-scopes).

Pour récupérer un fournisseur dans le contexte global (par exemple, si le fournisseur a été injecté dans un module différent), passez l'option `{{ '{' }} strict : false {{ '}' }}` comme second argument de `get()`.

```typescript
this.moduleRef.get(Service, { strict: false });
```

#### Résoudre les fournisseurs à portée réduite

Pour résoudre dynamiquement un fournisseur à portée (transient ou à request), utilisez la méthode `resolve()`, en passant le jeton d'injection du fournisseur comme argument.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private transientService: TransientService;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
```

La méthode `resolve()` renvoie une instance unique du fournisseur, à partir de sa propre **sous-arborescence de conteneur DI**. Chaque sous-arbre a un **identifiant de contexte** unique. Par conséquent, si vous appelez cette méthode plus d'une fois et comparez les références des instances, vous verrez qu'elles ne sont pas égales.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService),
      this.moduleRef.resolve(TransientService),
    ]);
    console.log(transientServices[0] === transientServices[1]); // false
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService),
      this.moduleRef.resolve(TransientService),
    ]);
    console.log(transientServices[0] === transientServices[1]); // false
  }
}
```

Pour générer une seule instance à travers plusieurs appels à `resolve()`, et s'assurer qu'ils partagent le même sous-arbre de conteneur ID généré, vous pouvez passer un identifiant de contexte à la méthode `resolve()`. Utilisez la classe `ContextIdFactory` pour générer un identifiant de contexte. Cette classe fournit une méthode `create()` qui retourne un identifiant unique approprié.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    const contextId = ContextIdFactory.create();
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService, contextId),
      this.moduleRef.resolve(TransientService, contextId),
    ]);
    console.log(transientServices[0] === transientServices[1]); // true
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    const contextId = ContextIdFactory.create();
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService, contextId),
      this.moduleRef.resolve(TransientService, contextId),
    ]);
    console.log(transientServices[0] === transientServices[1]); // true
  }
}
```

> info **Astuce** La classe `ContextIdFactory` est importée du package `@nestjs/core`.

#### Enregistrement du fournisseur `REQUEST`.

Les identifiants de contexte générés manuellement (avec `ContextIdFactory.create()`) représentent des sous-arbres ID dans lesquels le fournisseur `REQUEST` est `indéfini` car ils ne sont pas instanciés et gérés par le système d'injection de dépendances de Nest.

Pour enregistrer un objet `REQUEST` personnalisé pour un sous-arbre ID créé manuellement, utilisez la méthode `ModuleRef#registerRequestByContextId()`, comme suit :

```typescript
const contextId = ContextIdFactory.create();
this.moduleRef.registerRequestByContextId(/* YOUR_REQUEST_OBJECT */, contextId);
```

#### Obtenir la sous-arborescence actuelle

Il peut arriver que vous souhaitiez résoudre une instance d'un fournisseur à portée de requête dans un **contexte de requête**. Disons que `CatsService` est à portée de requête et que vous voulez résoudre l'instance de `CatsRepository` qui est aussi marquée comme un fournisseur à portée de requête. Afin de partager le même sous-arbre du conteneur ID, vous devez obtenir l'identifiant du contexte actuel au lieu d'en générer un nouveau (par exemple, avec la fonction `ContextIdFactory.create()`, comme montré ci-dessus). Pour obtenir l'identifiant du contexte actuel, commencez par injecter l'objet de requête en utilisant le décorateur `@Inject()`.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    @Inject(REQUEST) private request: Record<string, unknown>,
  ) {}
}
@@switch
@Injectable()
@Dependencies(REQUEST)
export class CatsService {
  constructor(request) {
    this.request = request;
  }
}
```

> info **Astuce** Pour en savoir plus sur le fournisseur de la requête [ici](/fundamentals/injection-scopes#requête-au-fournisseur).

Maintenant, utilisez la méthode `getByRequest()` de la classe `ContextIdFactory` pour créer un identifiant de contexte basé sur l'objet de requête, et passez-le à l'appel `resolve()` :

```typescript
const contextId = ContextIdFactory.getByRequest(this.request);
const catsRepository = await this.moduleRef.resolve(CatsRepository, contextId);
```

#### Instancier des classes personnalisées de manière dynamique

Pour instancier dynamiquement une classe qui **n'a pas été préalablement enregistrée** en tant que **fournisseur**, utilisez la méthode `create()` de la référence du module.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private catsFactory: CatsFactory;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.catsFactory = await this.moduleRef.create(CatsFactory);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    this.catsFactory = await this.moduleRef.create(CatsFactory);
  }
}
```

Cette technique permet d'instancier de manière conditionnelle différentes classes en dehors du conteneur du framework.

<app-banner-devtools></app-banner-devtools>
