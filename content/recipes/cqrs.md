### CQRS

Le flux des applications simples [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (Créer, Lire, Mettre à jour et Supprimer) peut être décrit comme suit :

1. La couche des contrôleurs traite les demandes HTTP et délègue les tâches à la couche des services.
2. C'est dans la couche des services que se trouve la majeure partie de la logique d'entreprise.
3. Les services utilisent des référentiels / DAO pour modifier / maintenir les entités.
4. Les entités agissent comme des conteneurs pour les valeurs, avec des setters et des getters.

Si ce modèle est généralement suffisant pour les applications de petite et moyenne taille, il n'est pas forcément le meilleur choix pour les applications plus importantes et plus complexes. Dans ce cas, le modèle **CQRS** (Command and Query Responsibility Segregation) peut être plus approprié et plus évolutif (en fonction des exigences de l'application). Les avantages de ce modèle sont les suivants

- **Séparation des préoccupations**. Le modèle sépare les opérations de lecture et d'écriture dans des modèles distincts.
- **Évolutivité**. Les opérations de lecture et d'écriture peuvent être mises à l'échelle indépendamment.
- **Flexibilité**. Le modèle permet d'utiliser différents magasins de données pour les opérations de lecture et d'écriture.
- **Performance**. Le modèle permet d'utiliser différents magasins de données optimisés pour les opérations de lecture et d'écriture.

Pour faciliter ce modèle, Nest fournit un [module CQRS](https://github.com/nestjs/cqrs) léger . Ce chapitre décrit comment l'utiliser.

#### Installation

Installez d'abord le package requis :

```bash
$ npm install --save @nestjs/cqrs
```

#### Commandes

Les commandes sont utilisées pour modifier l'état de l'application. Elles doivent être basées sur des tâches plutôt que sur des données. Lorsqu'une commande est envoyée, elle est traitée par un **Gestionnaire de commande** correspondant. Le gestionnaire est responsable de la mise à jour de l'état de l'application.

```typescript
@@filename(heroes-game.service)
@Injectable()
export class HeroesGameService {
  constructor(private commandBus: CommandBus) {}

  async killDragon(heroId: string, killDragonDto: KillDragonDto) {
    return this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}
@@switch
@Injectable()
@Dependencies(CommandBus)
export class HeroesGameService {
  constructor(commandBus) {
    this.commandBus = commandBus;
  }

  async killDragon(heroId, killDragonDto) {
    return this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}
```

Dans l'extrait de code ci-dessus, nous instancions la classe `KillDragonCommand` et la passons à la méthode `execute()` du `CommandBus`. C'est la classe de commande démontrée :

```typescript
@@filename(kill-dragon.command)
export class KillDragonCommand {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
@@switch
export class KillDragonCommand {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

Le `CommandBus` représente un **flux** de commandes. Il est responsable de l'envoi des commandes aux gestionnaires appropriés. La méthode `execute()` renvoie une promesse, qui se résout en la valeur renvoyée par le gestionnaire.

Créons un gestionnaire pour la commande `KillDragonCommand`.

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(private repository: HeroRepository) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);
  }
}
@@switch
@CommandHandler(KillDragonCommand)
@Dependencies(HeroRepository)
export class KillDragonHandler {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(command) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);
  }
}
```

Ce handler récupère l'entité `Hero` dans le repository, appelle la méthode `killEnemy()`, puis persiste les changements. La classe `KillDragonHandler` implémente l'interface `ICommandHandler`, qui requiert l'implémentation de la méthode `execute()`. La méthode `execute()` reçoit l'objet commande comme argument.

#### Requêtes

Les requêtes sont utilisées pour extraire des données de l'état de l'application. Elles doivent être centrées sur les données plutôt que sur les tâches. Lorsqu'une requête est envoyée, elle est traitée par un **Gestionnaire de requêtes** correspondant. Le gestionnaire est responsable de l'extraction des données.

Le `QueryBus` suit le même modèle que le `CommandBus`. Les gestionnaires de requêtes doivent implémenter l'interface `IQueryHandler` et être annotés avec le décorateur `@QueryHandler()`.

#### Evénements

Les événements sont utilisés pour notifier les autres parties de l'application des changements dans l'état de l'application. Ils sont envoyés par les **modèles** ou directement en utilisant le `EventBus`. Lorsqu'un événement est envoyé, il est traité par les **Gestionnaires d'événements** correspondants. Les gestionnaires peuvent alors, par exemple, mettre à jour le modèle de lecture.

À des fins de démonstration, créons une classe d'événements :

```typescript
@@filename(hero-killed-dragon.event)
export class HeroKilledDragonEvent {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
@@switch
export class HeroKilledDragonEvent {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

Maintenant, alors que les événements peuvent être distribués directement en utilisant la méthode `EventBus.publish()`, nous pouvons aussi les distribuer depuis le modèle. Mettons à jour le modèle `Hero` pour dispatcher l'événement `HeroKilledDragonEvent` lorsque la méthode `killEnemy()` est appelée.

```typescript
@@filename(hero.model)
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
  }

  killEnemy(enemyId: string) {
    // Logique métier
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
@@switch
export class Hero extends AggregateRoot {
  constructor(id) {
    super();
    this.id = id;
  }

  killEnemy(enemyId) {
    // Logique métier
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
```

La méthode `apply()` est utilisée pour distribuer les événements. Elle accepte un objet événement comme argument. Cependant, comme notre modèle ne connaît pas le `EventBus`, nous devons l'associer au modèle. Nous pouvons le faire en utilisant la classe `EventPublisher`.

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private repository: HeroRepository,
    private publisher: EventPublisher,
  ) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();
  }
}
@@switch
@CommandHandler(KillDragonCommand)
@Dependencies(HeroRepository, EventPublisher)
export class KillDragonHandler {
  constructor(repository, publisher) {
    this.repository = repository;
    this.publisher = publisher;
  }

  async execute(command) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();
  }
}
```

La méthode `EventPublisher#mergeObjectContext` fusionne l'éditeur d'événements dans l'objet fourni, ce qui signifie que l'objet pourra désormais publier des événements dans le flux d'événements.

Notez que dans cet exemple, nous appelons également la méthode `commit()` sur le modèle. Cette méthode est utilisée pour distribuer les événements en cours. Pour distribuer automatiquement les événements, nous pouvons mettre la propriété `autoCommit` à `true` :

```typescript
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
    this.autoCommit = true;
  }
}
```

Dans le cas où nous voulons fusionner l'éditeur d'événements dans un objet inexistant, mais plutôt dans une classe, nous pouvons utiliser la méthode `EventPublisher#mergeClassContext` :

```typescript
const HeroModel = this.publisher.mergeClassContext(Hero);
const hero = new HeroModel('id'); // <-- HeroModel est une classe
```

Maintenant, chaque instance de la classe `HeroModel` sera capable de publier des événements sans utiliser la méthode `mergeObjectContext()`.

De plus, nous pouvons émettre des événements manuellement en utilisant `EventBus` :

```typescript
this.eventBus.publish(new HeroKilledDragonEvent());
```

> info **Astuce** Le `EventBus` est une classe injectable.

Chaque événement peut avoir plusieurs **gestionnaires d'événements**.

```typescript
@@filename(hero-killed-dragon.handler)
@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler implements IEventHandler<HeroKilledDragonEvent> {
  constructor(private repository: HeroRepository) {}

  handle(event: HeroKilledDragonEvent) {
    // Logique métier
  }
}
```

> info **Astuce** Sachez que lorsque vous commencez à utiliser des gestionnaires d'événements, vous sortez du contexte web HTTP traditionnel.
>
> - Les erreurs dans les `CommandHandlers` peuvent toujours être capturées par les [filtres d'exception](/exception-filters) intégrés.
> - Les erreurs dans les `EventHandlers` ne peuvent pas être capturées par les filtres d'exception : vous devrez les gérer manuellement. Soit par un simple `try/catch`, soit en utilisant [Sagas](/recipes/cqrs#sagas) en déclenchant un événement compensatoire, ou toute autre solution que vous choisirez.
> - Les réponses HTTP dans les `CommandHandlers` peuvent toujours être renvoyées au client.
> - Les réponses HTTP dans les `EventHandlers` ne le peuvent pas. Si vous voulez envoyer des informations au client, vous pouvez utiliser [WebSocket](/websockets/gateways), [SSE](/techniques/server-sent-events), ou toute autre solution de votre choix.

#### Sagas

Saga est un processus de longue durée qui écoute les événements et peut déclencher de nouvelles commandes. Elle est généralement utilisée pour gérer des flux de travail complexes dans l'application. Par exemple, lorsqu'un utilisateur s'inscrit, une saga peut écouter l'événement `UserRegisteredEvent` et envoyer un e-mail de bienvenue à l'utilisateur.

Les sagas sont un outil extrêmement puissant. Une seule saga peut écouter 1..\* événements. En utilisant la bibliothèque [RxJS](https://github.com/ReactiveX/rxjs), nous pouvons filtrer, mapper, forker et fusionner des flux d'événements pour créer des flux de travail sophistiqués. Chaque saga renvoie un Observable qui produit une instance de commande. Cette commande est ensuite distribuée de manière **asynchrone** par le `CommandBus`.

Créons une saga qui écoute le `HeroKilledDragonEvent` et envoie la commande `DropAncientItemCommand`.

```typescript
@@filename(heroes-game.saga)
@Injectable()
export class HeroesGameSagas {
  @Saga()
  dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(HeroKilledDragonEvent),
      map((event) => new DropAncientItemCommand(event.heroId, fakeItemID)),
    );
  }
}
@@switch
@Injectable()
export class HeroesGameSagas {
  @Saga()
  dragonKilled = (events$) => {
    return events$.pipe(
      ofType(HeroKilledDragonEvent),
      map((event) => new DropAncientItemCommand(event.heroId, fakeItemID)),
    );
  }
}
```

> info **Astuce** L'opérateur `ofType` et le décorateur `@Saga()` sont exportés depuis le package `@nestjs/cqrs`.

Le décorateur `@Saga()` marque la méthode comme une saga. L'argument `events$` est un flux Observable de tous les événements. L'opérateur `ofType` filtre le flux par le type d'événement spécifié. L'opérateur `map` fait correspondre l'événement à une nouvelle instance de commande.

Dans cet exemple, nous faisons correspondre l'événement `HeroKilledDragonEvent` à la commande `DropAncientItemCommand`. La commande `DropAncientItemCommand` est alors distribuée automatiquement par le `CommandBus`.

#### Mise en place

Pour résumer, nous devons enregistrer tous les gestionnaires de commandes, les gestionnaires d'événements et les sagas dans le `HeroesGameModule` :

```typescript
@@filename(heroes-game.module)
export const CommandHandlers = [KillDragonHandler, DropAncientItemHandler];
export const EventHandlers =  [HeroKilledDragonHandler, HeroFoundItemHandler];

@Module({
  imports: [CqrsModule],
  controllers: [HeroesGameController],
  providers: [
    HeroesGameService,
    HeroesGameSagas,
    ...CommandHandlers,
    ...EventHandlers,
    HeroRepository,
  ]
})
export class HeroesGameModule {}
```

#### Exceptions non gérées

Les gestionnaires d'événements sont exécutés de manière asynchrone. Cela signifie qu'ils doivent toujours gérer toutes les exceptions afin d'éviter que l'application n'entre dans un état incohérent. Cependant, si une exception n'est pas gérée, le `EventBus` va créer l'objet `UnhandledExceptionInfo` et le pousser dans le flux `UnhandledExceptionBus`. Ce flux est un `Observable` qui peut être utilisé pour traiter les exceptions non gérées.

```typescript
private destroy$ = new Subject<void>();

constructor(private unhandledExceptionsBus: UnhandledExceptionBus) {
  this.unhandledExceptionsBus
    .pipe(takeUntil(this.destroy$))
    .subscribe((exceptionInfo) => {
      // Traiter l'exception ici
      // par exemple, l'envoyer à un service externe, mettre fin au processus ou publier un nouvel événement.
    });
}

onModuleDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

Pour filtrer les exceptions, nous pouvons utiliser l'opérateur `ofType`, comme suit :

```typescript
this.unhandledExceptionsBus.pipe(takeUntil(this.destroy$), UnhandledExceptionBus.ofType(TransactionNotAllowedException)).subscribe((exceptionInfo) => {
  // Traiter l'exception ici
});
```

Where `TransactionNotAllowedException` is the exception we want to filter out.

The `UnhandledExceptionInfo` object contains the following properties:

```typescript
export interface UnhandledExceptionInfo<Cause = IEvent | ICommand, Exception = any> {
  /**
   * L'exception qui a été levée.
   */
  exception: Exception;
  /**
   * La cause de l'exception (événement ou référence de commande).
   */
  cause: Cause;
}
```

#### S'abonner à tous les événements

`CommandBus`, `QueryBus` et `EventBus` sont tous des **Observables**. Cela signifie que nous pouvons nous abonner à l'ensemble du flux et, par exemple, traiter tous les événements. Par exemple, nous pouvons enregistrer tous les événements dans la console, ou les sauvegarder dans le magasin d'événements.

```typescript
private destroy$ = new Subject<void>();

constructor(private eventBus: EventBus) {
  this.eventBus
    .pipe(takeUntil(this.destroy$))
    .subscribe((event) => {
      // Enregistrer les événements dans la base de données
    });
}

onModuleDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

#### Exemple

Un exemple concret est disponible [ici](https://github.com/kamilmysliwiec/nest-cqrs-example).
