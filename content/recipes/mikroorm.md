### MikroORM

Cette recette a pour but d'aider les utilisateurs à démarrer avec MikroORM dans Nest. MikroORM est l'ORM TypeScript pour Node.js basé sur les patterns Data Mapper, Unit of Work et Identity Map. C'est une excellente alternative à TypeORM et la migration depuis TypeORM devrait être assez facile. La documentation complète sur MikroORM est disponible [ici](https://mikro-orm.io/docs).

> info **Info** `@mikro-orm/nestjs` est un package tiers et n'est pas géré par l'équipe NestJS. Veuillez rapporter tout problème trouvé avec la bibliothèque dans le [dépôt approprié](https://github.com/mikro-orm/nestjs).

#### Installation

La manière la plus simple d'intégrer MikroORM à Nest est d'utiliser le module [`@mikro-orm/nestjs`](https://github.com/mikro-orm/nestjs).
Il suffit de l'installer à côté de Nest, MikroORM et du pilote sous-jacent :

```bash
$ npm i @mikro-orm/core @mikro-orm/nestjs @mikro-orm/sqlite
```

MikroORM supporte également `postgres`, `sqlite`, et `mongo`. Voir la [documentation officielle](https://mikro-orm.io/docs/usage-with-sql/) pour tous les pilotes.

Une fois le processus d'installation terminé, nous pouvons importer le `MikroOrmModule` dans le `AppModule` racine.

```typescript
import { SqliteDriver } from '@mikro-orm/sqlite';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['./dist/entities'],
      entitiesTs: ['./src/entities'],
      dbName: 'my-db-name.sqlite3',
      driver: SqliteDriver,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
```

La méthode `forRoot()` accepte le même objet de configuration que `init()` du package MikroORM. Consultez [cette page](https://mikro-orm.io/docs/configuration) pour obtenir la documentation complète sur la configuration.

Nous pouvons également [configurer la CLI](https://mikro-orm.io/docs/installation#setting-up-the-commandline-tool) en créant un fichier de configuration `mikro-orm.config.ts` et en appelant la fonction `forRoot()` sans aucun argument.

```typescript
@Module({
  imports: [
    MikroOrmModule.forRoot(),
  ],
  ...
})
export class AppModule {}
```

Mais cela ne fonctionnera pas si vous utilisez un outil de construction qui utilise la méthode du tree shaking, pour cela il est préférable de fournir la configuration de manière explicite :

```typescript
import config from './mikro-orm.config'; // votre configuration ORM

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
  ],
  ...
})
export class AppModule {}
```

Par la suite, le `EntityManager` sera disponible pour être injecté dans l'ensemble du projet (sans importer aucun module ailleurs).

```ts
// Importez EntityManager depuis votre package de pilote ou `@mikro-orm/knex`
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';

@Injectable()
export class MyService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
  ) {}
}
```

> info **Info** Notez que le `EntityManager` est importé depuis le package `@mikro-orm/driver`, où driver est `mysql`, `sqlite`, `postgres` ou tout autre driver que vous utilisez. Dans le cas où vous avez `@mikro-orm/knex` installé comme dépendance, vous pouvez aussi importer le `EntityManager` à partir de là.

#### Repository pattern

MikroORM prend en charge le Repository pattern. Pour chaque entité, nous pouvons créer un Repository. Lisez la documentation complète sur les Repositories [ici](https://mikro-orm.io/docs/repositories). Pour définir quels Repositories doivent être enregistrés dans la portée courante, vous pouvez utiliser la méthode `forFeature()`. Par exemple, de cette façon :

> info **Info** Vous ne devriez **pas** enregistrer vos entités de base via `forFeature()`, car il n'y a pas de Repository pour celles-ci. D'un autre côté, les entités de base doivent faire partie de la liste dans `forRoot()` (ou dans la configuration de l'ORM en général).

```typescript
// photo.module.ts
@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

et l'importer dans la racine `AppModule` :

```typescript
// app.module.ts
@Module({
  imports: [MikroOrmModule.forRoot(...), PhotoModule],
})
export class AppModule {}
```

De cette façon, nous pouvons injecter le `PhotoRepository` dans le `PhotoService` en utilisant le décorateur `@InjectRepository()` :

```typescript
@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: EntityRepository<Photo>,
  ) {}
}
```

#### Utilisation de Repositories personnalisés

Lors de l'utilisation de référentiels personnalisés, nous n'avons plus besoin du décorateur `@InjectRepository()`, car l'ID de Nest est résolue sur la base des références de la classe.

```ts
// `**./author.entity.ts**`
@Entity({ repository: () => AuthorRepository })
export class Author {
  // pour permettre l'inférence dans `em.getRepository()`
  [EntityRepositoryType]?: AuthorRepository;
}

// `**./author.repository.ts**`
export class AuthorRepository extends EntityRepository<Author> {
  // vos méthodes personnalisées...
}
```

Comme le nom du Repository personnalisé est le même que celui que `getRepositoryToken()` retournerait, nous n'avons plus besoin du décorateur `@InjectRepository()`.

```ts
@Injectable()
export class MyService {
  constructor(private readonly repo: AuthorRepository) {}
}
```

#### Chargement automatique des entités

L'ajout manuel d'entités au tableau d'entités des options de connexion peut s'avérer fastidieux. En outre, le référencement d'entités à partir du module racine ne respecte pas les limites du domaine d'application et entraîne des fuites de détails d'implémentation vers d'autres parties de l'application. Pour résoudre ce problème, il est possible d'utiliser des chemins globaux statiques.

Notez cependant que les chemins globaux ne sont pas supportés par webpack, donc si vous construisez votre application dans une monorepo, vous ne pourrez pas les utiliser. Pour résoudre ce problème, une solution alternative est fournie. Pour charger automatiquement les entités, mettez la propriété `autoLoadEntities` de l'objet de configuration (passé dans la méthode `forRoot()`) à `true`, comme montré ci-dessous :

```ts
@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

Si cette option est spécifiée, chaque entité enregistrée via la méthode `forFeature()` sera automatiquement ajoutée au tableau des entités de l'objet configuration.

> info **Info** Notez que les entités qui ne sont pas enregistrées via la méthode `forFeature()`, mais qui sont seulement référencées à partir de l'entité (via une relation), ne seront pas incluses par le biais du paramètre `autoLoadEntities`.

> info **Info** L'utilisation de `autoLoadEntities` n'a pas non plus d'effet sur le CLI de MikroORM - pour cela nous avons toujours besoin de la configuration du CLI avec la liste complète des entités. D'un autre côté, nous pouvons utiliser des globs, car le CLI ne passera pas par webpack.

#### Sérialisation

> warning **Note** MikroORM enveloppe chaque relation d'entité dans un objet `Reference<T>` ou `Collection<T>`, afin de fournir une meilleure sécurité de type. Cela rendra [le sérialiseur intégré de Nest](/techniques/serialization) aveugle à toutes les relations enveloppées. En d'autres termes, si vous renvoyez des entités MikroORM à partir de vos gestionnaires HTTP ou WebSocket, toutes leurs relations ne seront PAS sérialisées.

Heureusement, MikroORM fournit une [API de sérialisation](https://mikro-orm.io/docs/serializing) qui peut être utilisée à la place de `ClassSerializerInterceptor`.

```typescript
@Entity()
export class Book {
  @Property({ hidden: true }) // Équivalent du transformateur de classe `@Exclude`
  hiddenField = Date.now();

  @Property({ persist: false }) // Similaire à la fonction `@Expose()` du transformateur de classe. N'existera qu'en mémoire et sera sérialisé.
  count?: number;

  @ManyToOne({
    serializer: (value) => value.name,
    serializedName: 'authorName',
  }) // Équivalent du transformateur de classe `@Transform()`
  author: Author;
}
```

#### Gestionnaires de requêtes dans les files d'attente

Comme mentionné dans les [docs](https://mikro-orm.io/docs/identity-map), nous avons besoin d'un état propre pour chaque requête. Cela est géré automatiquement grâce à l'aide `RequestContext` enregistrée par le middleware.

Mais les middlewares ne sont exécutés que pour les requêtes HTTP normales, que se passe-t-il si nous avons besoin d'une méthode à portée de requête en dehors de cela ? Les gestionnaires de file d'attente ou les tâches planifiées en sont un exemple.

Nous pouvons utiliser le décorateur `@CreateRequestContext()`. Il vous faut d'abord injecter l'instance `MikroORM` dans le contexte courant, elle sera ensuite utilisée pour créer le contexte pour vous. Sous le capot, le décorateur va enregistrer un nouveau contexte de requête pour votre méthode et l'exécuter à l'intérieur du contexte.

```ts
@Injectable()
export class MyService {
  constructor(private readonly orm: MikroORM) {}

  @CreateRequestContext()
  async doSomething() {
    // cette opération sera exécutée dans un contexte distinct
  }
}
```

> warning **Note** Comme son nom l'indique, ce décorateur crée toujours un nouveau contexte, contrairement à son alternative `@EnsureRequestContext` qui ne le crée que s'il n'est pas déjà à l'intérieur d'un autre.

#### Tests

Le package `@mikro-orm/nestjs` expose la fonction `getRepositoryToken()` qui renvoie un jeton préparé basé sur une entité donnée pour permettre de simuler le dépôt.

```typescript
@Module({
  providers: [
    PhotoService,
    {
      // ou lorsque vous avez un répertoire personnalisé : `provide : PhotoRepository`
      provide: getRepositoryToken(Photo),
      useValue: mockedRepository,
    },
  ],
})
export class PhotoModule {}
```

#### Exemple

Un exemple concret de NestJS avec MikroORM est disponible [ici](https://github.com/mikro-orm/nestjs-realworld-example-app)
