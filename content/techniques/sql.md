### Base de données

Nest est agnostique en matière de bases de données, ce qui vous permet de l'intégrer facilement à n'importe quelle base de données SQL ou NoSQL. Vous disposez d'un certain nombre d'options, en fonction de vos préférences. Au niveau le plus général, connecter Nest à une base de données consiste simplement à charger un pilote Node.js approprié pour la base de données, comme vous le feriez avec [Express](https://expressjs.com/en/guide/database-integration.html) ou Fastify.

Vous pouvez également utiliser directement n'importe quelle **bibliothèque** d'intégration de base de données Node.js ou ORM, comme [MikroORM](https://mikro-orm.io/) (voir [MikroORM recipe](/recipes/mikroorm)), [Sequelize](https://sequelize.org/) (voir l'[intégration Sequelize](/techniques/database#intégration-sequelize)), [Knex.js](https://knexjs.org/) (voir le [tutoriel Knex.js](https://dev.to/nestjs/build-a-nestjs-module-for-knex-js-or-other-resource-based-libraries-in-5-minutes-12an)), [TypeORM](https://github.com/typeorm/typeorm), et [Prisma](https://www.github.com/prisma/prisma) (voir la [Recette Prisma](/recipes/prisma)), pour opérer à un niveau d'abstraction plus élevé.

Par commodité, Nest fournit une intégration étroite avec TypeORM et Sequelize avec les packages `@nestjs/typeorm` et `@nestjs/sequelize` respectivement, que nous couvrirons dans le chapitre actuel, et Mongoose avec `@nestjs/mongoose`, qui est couvert dans [cet autre chapitre](/techniques/mongodb). Ces intégrations fournissent des fonctionnalités supplémentaires spécifiques à NestJS, telles que l'injection de modèle/référentiel, la testabilité, et la configuration asynchrone pour rendre l'accès à la base de données choisie encore plus facile.

### Intégration TypeORM

Pour l'intégration avec les bases de données SQL et NoSQL, Nest fournit le package `@nestjs/typeorm`. [TypeORM](https://github.com/typeorm/typeorm) est l'ORM (Object Relational Mapper) le plus mature disponible pour TypeScript. Comme il est écrit en TypeScript, il s'intègre bien au framework Nest.

Pour commencer à l'utiliser, nous installons d'abord les dépendances nécessaires. Dans ce chapitre, nous allons démontrer l'utilisation du populaire SGBD relationnel [MySQL](https://www.mysql.com/), mais TypeORM fournit un support pour de nombreuses bases de données relationnelles, telles que PostgreSQL, Oracle, Microsoft SQL Server, SQLite, et même des bases de données NoSQL comme MongoDB. La procédure décrite dans ce chapitre est la même pour toutes les bases de données supportées par TypeORM. Vous devrez simplement installer les bibliothèques API client associées à la base de données que vous avez sélectionnée.

```bash
$ npm install --save @nestjs/typeorm typeorm mysql2
```

Une fois le processus d'installation terminé, nous pouvons importer le `TypeOrmModule` dans la racine `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

> warning **Attention** Le paramètre `synchronize : true` ne doit pas être utilisé en production - sinon vous pouvez perdre des données de production.

La méthode `forRoot()` supporte toutes les propriétés de configuration exposées par le constructeur `DataSource` du package [TypeORM](https://typeorm.io/data-source-options#common-data-source-options). En outre, il existe plusieurs propriétés de configuration supplémentaires décrites ci-dessous.

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Nombre de tentatives de connexion à la base de données (par défaut : <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Délai entre les tentatives de reconnexion (ms) (par défaut : <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadEntities</code></td>
    <td>Si <code>true</code>, les entités seront chargées automatiquement (par défaut : <code>false</code>)</td>
  </tr>
</table>

> info **Astuce** Apprenez-en plus sur les options de source de données [ici](https://typeorm.io/data-source-options).

Une fois cela fait, les objets TypeORM `DataSource` et `EntityManager` seront disponibles pour être injectés dans l'ensemble du projet (sans avoir besoin d'importer des modules), par exemple :

```typescript
@@filename(app.module)
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
@@switch
import { DataSource } from 'typeorm';

@Dependencies(DataSource)
@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }
}
```

#### Modèle de répertoire

[TypeORM](https://github.com/typeorm/typeorm) prend en charge le **modèle de conception de répertoire**, de sorte que chaque entité dispose de son propre répertoire. Ces répertoires peuvent être obtenus à partir de la source de données de la base de données.

Pour continuer l'exemple, nous avons besoin d'au moins une entité. Définissons l'entité `User`.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;
}
```

> info **Astuce** Pour en savoir plus sur les entités, consultez la [documentation TypeORM](https://typeorm.io/#/entities).

Le fichier d'entité `User` se trouve dans le répertoire `users`. Ce répertoire contient tous les fichiers relatifs au module `Users`. Vous pouvez décider de l'endroit où vous voulez garder vos fichiers de modèle, cependant, nous recommandons de les créer près de leur **domaine**, dans le répertoire du module correspondant.

Pour commencer à utiliser l'entité `User`, nous devons la faire connaître à TypeORM en l'insérant dans le tableau `entities` dans les options de la méthode `forRoot()` du module (à moins que vous n'utilisiez un chemin global statique) :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [User],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

Ensuite, regardons le module `UsersModule` :

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

Ce module utilise la méthode `forFeature()` pour définir quels référentiels sont enregistrés dans le scope courant. Avec cela en place, nous pouvons injecter le `UsersRepository` dans le `UsersService` en utilisant le décorateur `@InjectRepository()` :

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
@Dependencies(getRepositoryToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id) {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id) {
    await this.usersRepository.delete(id);
  }
}
```

> warning **Remarque** N'oubliez pas d'importer le module `UsersModule` dans le module racine `AppModule`.

Si vous voulez utiliser le référentiel en dehors du module qui importe `TypeOrmModule.forFeature`, vous devrez réexporter les fournisseurs générés par ce module.
Vous pouvez le faire en exportant le module entier, comme ceci :

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule]
})
export class UsersModule {}
```

Maintenant, si nous importons `UsersModule` dans `UserHttpModule`, nous pouvons utiliser `@InjectRepository(User)` dans les fournisseurs de ce dernier module.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
```

#### Relations

Les relations sont des associations établies entre deux ou plusieurs tables. Les relations sont basées sur des champs communs à chaque table, impliquant souvent des clés primaires et étrangères.

Il existe trois types de relations :

<table>
  <tr>
    <td><code>One-to-one</code></td>
    <td>Chaque ligne de la table primaire a une et une seule ligne associée dans la table étrangère. Utilisez le décorateur <code>@OneToOne()</code> pour définir ce type de relation.</td>
  </tr>
  <tr>
    <td><code>One-to-many / Many-to-one</code></td>
    <td>Chaque ligne de la table primaire a une ou plusieurs lignes liées dans la table étrangère. Utilisez les décorateurs <code>@OneToMany()</code> et <code>@ManyToOne()</code> pour définir ce type de relation.</td>
  </tr>
  <tr>
    <td><code>Many-to-many</code></td>
    <td>Chaque ligne de la table primaire a plusieurs lignes apparentées dans la table étrangère, et chaque enregistrement de la table étrangère a plusieurs lignes apparentées dans la table primaire. Utilisez le décorateur <code>@ManyToMany()</code> pour définir ce type de relation.</td>
  </tr>
</table>

Pour définir des relations dans les entités, utilisez les **décorateurs** correspondants. Par exemple, pour définir que chaque `User` peut avoir plusieurs photos, utilisez le décorateur `@OneToMany()`.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Photo } from '../photos/photo.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(type => Photo, photo => photo.user)
  photos: Photo[];
}
```

> info **Astuce** Pour en savoir plus sur les relations au sein de TypeORM, visitez le [TypeORM documentation](https://typeorm.io/#/relations).

#### Chargement automatique des entités

L'ajout manuel d'entités au tableau `entities` des options de la source de données peut être fastidieux. En outre, le référencement des entités à partir du module racine ne respecte pas les limites du domaine d'application et provoque des fuites de détails d'implémentation vers d'autres parties de l'application. Pour résoudre ce problème, une solution alternative est fournie. Pour charger automatiquement les entités, définissez la propriété `autoLoadEntities` de l'objet de configuration (passé dans la méthode `forRoot()`) à `true`, comme montré ci-dessous :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

Si cette option est spécifiée, chaque entité enregistrée par la méthode `forFeature()` sera automatiquement ajoutée au tableau `entities` de l'objet de configuration.

> warning **Attention** Notez que les entités qui ne sont pas enregistrées via la méthode `forFeature()`, mais qui sont seulement référencées à partir de l'entité (via une relation), ne seront pas incluses par le biais du paramètre `autoLoadEntities`.

#### Séparation de la définition de l'entité

Vous pouvez définir une entité et ses colonnes directement dans le modèle, en utilisant des décorateurs. Mais certaines personnes préfèrent définir les entités et leurs colonnes dans des fichiers séparés en utilisant les  [" schémas d'entité "](https://typeorm.io/#/separating-entity-definition).

```typescript
import { EntitySchema } from 'typeorm';
import { User } from './user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  relations: {
    photos: {
      type: 'one-to-many',
      target: 'Photo', // le nom du PhotoSchema
    },
  },
});
```

> warning error **Attention** Si vous fournissez l'option `target`, la valeur de l'option `name` doit être la même que le nom de la classe cible.
> Si vous ne fournissez pas de `target`, vous pouvez utiliser n'importe quel nom.

Nest vous permet d'utiliser une instance de `EntitySchema` partout où une `Entity` est attendue, par exemple :

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSchema])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

#### Transactions TypeORM

Une transaction de base de données symbolise une unité de travail effectuée au sein d'un système de gestion de base de données par rapport à une base de données, et traitée de manière cohérente et fiable, indépendamment des autres transactions. Une transaction représente généralement toute modification apportée à une base de données ([en savoir plus](https://en.wikipedia.org/wiki/Database_transaction)).

Il existe de nombreuses stratégies différentes pour gérer les [transactions TypeORM](https://typeorm.io/#/transactions). Nous recommandons d'utiliser la classe `QueryRunner` car elle donne un contrôle total sur la transaction.

Tout d'abord, nous devons injecter l'objet `DataSource` dans une classe de la manière habituelle :

```typescript
@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}
}
```

> info **Astuce** La classe `DataSource` est importée du package `typeorm`.

Nous pouvons maintenant utiliser cet objet pour créer une transaction.

```typescript
async createMany(users: User[]) {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(users[0]);
    await queryRunner.manager.save(users[1]);

    await queryRunner.commitTransaction();
  } catch (err) {
    // Puisque nous avons des erreurs, revenons sur les changements que nous avons effectués.
    await queryRunner.rollbackTransaction();
  } finally {
    // Vous devez libérer un queryRunner qui a été instancié manuellement
    await queryRunner.release();
  }
}
```

> info **Astuce** Notez que la `dataSource` n'est utilisée que pour créer le `QueryRunner`. Cependant, pour tester cette classe, il faudrait simuler l'objet `DataSource` entier (qui expose plusieurs méthodes). Ainsi, nous recommandons d'utiliser une classe fabrique d'aide (par exemple, `QueryRunnerFactory`) et de définir une interface avec un ensemble limité de méthodes nécessaires pour maintenir les transactions. Cette technique rend l'utilisation de ces méthodes assez simple.

<app-banner-devtools></app-banner-devtools>

Vous pouvez également utiliser une approche de type callback avec la méthode `transaction` de l'objet `DataSource` ([lire la suite](https://typeorm.io/#/transactions/creating-and-using-transactions)).

```typescript
async createMany(users: User[]) {
  await this.dataSource.transaction(async manager => {
    await manager.save(users[0]);
    await manager.save(users[1]);
  });
}
```

#### Abonnés

Avec les [abonnés TypeORM](https://typeorm.io/#/listeners-and-subscribers/what-is-a-subscriber), vous pouvez écouter des événements spécifiques de l'entité.

```typescript
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log(`BEFORE USER INSERTED: `, event.entity);
  }
}
```

> error **Attention** Les abonnés aux événements ne peuvent pas être [à portée de requête](/fundamentals/injection-scopes).

Maintenant, ajoutez la classe `UserSubscriber` au tableau `providers` :

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSubscriber } from './user.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserSubscriber],
  controllers: [UsersController],
})
export class UsersModule {}
```

> info **Astuce** Apprenez-en plus sur les abonnés de l'entité [ici](https://typeorm.io/#/listeners-and-subscribers/what-is-a-subscriber).

#### Migrations

Les [migrations](https://typeorm.io/#/migrations) permettent de mettre à jour de manière incrémentale le schéma de la base de données afin de le maintenir en phase avec le modèle de données de l'application tout en préservant les données existantes dans la base de données. Pour générer, exécuter et inverser les migrations, TypeORM fournit une [CLI dédiée](https://typeorm.io/#/migrations/creating-a-new-migration).

Les classes de migration sont distinctes du code source de l'application Nest. Leur cycle de vie est géré par le CLI TypeORM. Par conséquent, vous n'êtes pas en mesure de tirer parti de l'injection de dépendance et d'autres fonctionnalités spécifiques à Nest avec les migrations. Pour en savoir plus sur les migrations, suivez le guide dans la [documentation TypeORM](https://typeorm.io/#/migrations/creating-a-new-migration).

#### Bases de données multiples

Certains projets nécessitent des connexions multiples à des bases de données. Ce module permet également d'y parvenir. Pour travailler avec des connexions multiples, il faut d'abord créer les connexions. Dans ce cas, le nom de la source de données devient **obligatoire**.

Supposons que vous ayez une entité `Album` stockée dans sa propre base de données.

```typescript
const defaultOptions = {
  type: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      entities: [User],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      entities: [Album],
    }),
  ],
})
export class AppModule {}
```

> warning **Remarque** Si vous ne définissez pas le `name` d'une source de données, son nom sera fixé à `default`. Notez que vous ne devriez pas avoir plusieurs connexions sans nom, ou avec le même nom, sinon elles seront écrasées.

> warning **Remarque** Si vous utilisez `TypeOrmModule.forRootAsync`, vous devez **également** définir le nom de la source de données en dehors de `useFactory`. Par exemple :
>
> ```typescript
> TypeOrmModule.forRootAsync({
>   name: 'albumsConnection',
>   useFactory: ...,
>   inject: ...,
> }),
> ```
>
> Voir [cette issue](https://github.com/nestjs/typeorm/issues/86) pour plus de détails.

A ce stade, vous avez les entités `User` et `Album` enregistrées avec leur propre source de données. Avec cette configuration, vous devez indiquer à la méthode `TypeOrmModule.forFeature()` et au décorateur `@InjectRepository()` quelle source de données doit être utilisée. Si vous ne passez pas de nom de source de données, la source de données `default` est utilisée.

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

Vous pouvez également injecter le `DataSource` ou le `EntityManager` pour une source de données donnée :

```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectDataSource('albumsConnection')
    private dataSource: DataSource,
    @InjectEntityManager('albumsConnection')
    private entityManager: EntityManager,
  ) {}
}
```

Il est également possible d'injecter n'importe quelle `DataSource` dans les fournisseurs :

```typescript
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsConnection: DataSource) => {
        return new AlbumsService(albumsConnection);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
```

#### Tests

Lorsqu'il s'agit de tester une application de manière unitaire, nous voulons généralement éviter d'établir une connexion à la base de données, afin que nos suites de tests restent indépendantes et que leur processus d'exécution soit aussi rapide que possible. Mais nos classes peuvent dépendre de référentiels qui sont tirés de l'instance de la source de données (connexion). Comment gérer cela ? La solution consiste à créer des référentiels fictifs. Pour ce faire, nous mettons en place des [fournisseurs personnalisés](/fundamentals/custom-providers). Chaque référentiel enregistré est automatiquement représenté par un jeton `<EntityName>Repository`, où `EntityName` est le nom de votre classe d'entité.

Le package `@nestjs/typeorm` expose la fonction `getRepositoryToken()` qui retourne un jeton préparé basé sur une entité donnée.

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
  ],
})
export class UsersModule {}
```

Maintenant un substitut `mockRepository` sera utilisé comme `UsersRepository`. Chaque fois qu'une classe demandera le `UsersRepository` en utilisant un décorateur `@InjectRepository()`, Nest utilisera l'objet `mockRepository` enregistré.

#### Configuration asynchrone

Vous pouvez vouloir passer les options de votre module de dépôt de manière asynchrone plutôt que statique. Dans ce cas, utilisez la méthode `forRootAsync()`, qui fournit plusieurs façons de gérer la configuration asynchrone.

Une approche consiste à utiliser une fonction factory :

```typescript
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [],
    synchronize: true,
  }),
});
```

Notre fabrique se comporte comme n'importe quel autre [fournisseur asynchrone](/fundamentals/async-providers) (par exemple, il peut être `async` et il est capable d'injecter des dépendances via `inject`).

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  inject: [ConfigService],
});
```

Vous pouvez également utiliser la syntaxe `useClass` :

```typescript
TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
});
```

La construction ci-dessus instanciera `TypeOrmConfigService` dans `TypeOrmModule` et l'utilisera pour fournir un objet d'options en appelant `createTypeOrmOptions()`. Notez que cela signifie que le `TypeOrmConfigService` doit implémenter l'interface `TypeOrmOptionsFactory`, comme montré ci-dessous :

```typescript
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    };
  }
}
```

Afin d'éviter la création de `TypeOrmConfigService` dans `TypeOrmModule` et d'utiliser un fournisseur importé d'un module différent, vous pouvez utiliser la syntaxe `useExisting`.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Cette construction fonctionne de la même manière que `useClass` avec une différence essentielle - `TypeOrmModule` va chercher dans les modules importés pour réutiliser un `ConfigService` existant au lieu d'en instancier un nouveau.

> info **Astuce** Assurez-vous que la propriété `name` est définie au même niveau que la propriété `useFactory`, `useClass`, ou `useValue`. Cela permettra à Nest d'enregistrer correctement la source de données sous le jeton d'injection approprié.

#### Factory de sources de données personnalisées

En conjonction avec la configuration asynchrone utilisant `useFactory`, `useClass`, ou `useExisting`, vous pouvez optionnellement spécifier une fonction `dataSourceFactory` qui vous permettra de fournir votre propre source de données TypeORM plutôt que d'autoriser `TypeOrmModule` à créer la source de données.

`dataSourceFactory` reçoit les `DataSourceOptions` TypeORM configurées lors de la configuration asynchrone avec `useFactory`, `useClass`, ou `useExisting` et retourne une `Promesse` qui résout une `DataSource` TypeORM.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  // Utilisez useFactory, useClass, ou useExisting
  // pour configurer les DataSourceOptions.
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  // dataSource reçoit les DataSourceOptions configurées
  // et renvoie une Promise<DataSource>.
  dataSourceFactory: async (options) => {
    const dataSource = await new DataSource(options).initialize();
    return dataSource;
  },
});
```

> info **Astuce** La classe `DataSource` est importée du package `typeorm`.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/05-sql-typeorm).

<app-banner-enterprise></app-banner-enterprise>

### Intégration Sequelize

Une alternative à l'utilisation de TypeORM est d'utiliser l'ORM [Sequelize](https://sequelize.org/) avec le package `@nestjs/sequelize`. De plus, nous nous appuyons sur le package [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) qui fournit un ensemble de décorateurs supplémentaires pour définir les entités de manière déclarative.

Pour commencer à l'utiliser, nous devons d'abord installer les dépendances nécessaires. Dans ce chapitre, nous utiliserons le populaire SGBD relationnel [MySQL](https://www.mysql.com/), mais Sequelize prend en charge de nombreuses bases de données relationnelles, telles que PostgreSQL, MySQL, Microsoft SQL Server, SQLite et MariaDB. La procédure décrite dans ce chapitre est la même pour toutes les bases de données prises en charge par Sequelize. Vous devrez simplement installer les bibliothèques API client associées à la base de données que vous avez sélectionnée.

```bash
$ npm install --save @nestjs/sequelize sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
```

Une fois le processus d'installation terminé, nous pouvons importer le module `SequelizeModule` dans le module racine `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    }),
  ],
})
export class AppModule {}
```

La méthode `forRoot()` supporte toutes les propriétés de configuration exposées par le constructeur Sequelize ([lire la suite](https://sequelize.org/v5/manual/getting-started.html#setting-up-a-connection)). En outre, il existe plusieurs propriétés de configuration supplémentaires décrites ci-dessous.

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Nombre de tentatives de connexion à la base de données (par défaut : <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Délai entre les tentatives de reconnexion (ms) (par défaut : <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadModels</code></td>
    <td>Si <code>true</code>, les modèles seront chargés automatiquement (par défaut : <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>keepConnectionAlive</code></td>
    <td>Si <code>true</code>, la connexion ne sera pas fermée lors de l'arrêt de l'application (par défaut : <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>synchronize</code></td>
    <td>Si <code>true</code>, les modèles chargés automatiquement seront synchronisés (par défaut : <code>true</code>)</td>
  </tr>
</table>

Une fois cela fait, l'objet `Sequelize` sera disponible pour être injecté dans l'ensemble du projet (sans avoir besoin d'importer des modules), par exemple :

```typescript
@@filename(app.service)
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AppService {
  constructor(private sequelize: Sequelize) {}
}
@@switch
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Dependencies(Sequelize)
@Injectable()
export class AppService {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }
}
```

#### Modèles

Sequelize met en œuvre le modèle Active Record. Avec ce modèle, vous utilisez directement les classes de modèle pour interagir avec la base de données. Pour continuer l'exemple, nous avons besoin d'au moins un modèle. Définissons le modèle `User`.

```typescript
@@filename(user.model)
import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;
}
```

> info **Astuce** Apprenez-en plus sur les décorateurs disponibles [ici](https://github.com/RobinBuschmann/sequelize-typescript#column).

Le fichier modèle `User` se trouve dans le répertoire `users`. Ce répertoire contient tous les fichiers relatifs au module `Users`. Vous pouvez décider de l'emplacement de vos fichiers de modèle, cependant, nous recommandons de les créer près de leur **domaine**, dans le répertoire du module correspondant.

Pour commencer à utiliser le modèle `User`, nous devons le faire connaître à Sequelize en l'insérant dans le tableau `models` dans les options de la méthode `forRoot()` du module :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users/user.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [User],
    }),
  ],
})
export class AppModule {}
```

Ensuite, regardons le module `UsersModule` :

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

Ce module utilise la méthode `forFeature()` pour définir quels modèles sont enregistrés dans la portée courante. Avec cela en place, nous pouvons injecter le `UserModel` dans le `UsersService` en utilisant le décorateur `@InjectModel()` :

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  findOne(id: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
@Dependencies(getModelToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async findAll() {
    return this.userModel.findAll();
  }

  findOne(id) {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id) {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
```

> warning **Remarque** N'oubliez pas d'importer le module `UsersModule` dans le module racine `AppModule`.

Si vous voulez utiliser le répertoire en dehors du module qui importe `SequelizeModule.forFeature`, vous devrez réexporter les fournisseurs générés par ce module.
Vous pouvez le faire en exportant le module entier, comme ceci :

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.entity';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  exports: [SequelizeModule]
})
export class UsersModule {}
```

Maintenant, si nous importons `UsersModule` dans `UserHttpModule`, nous pouvons utiliser `@InjectModel(User)` dans les fournisseurs de ce dernier module.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
```

#### Relations

Les relations sont des associations établies entre deux ou plusieurs tables. Les relations sont basées sur des champs communs à chaque table, impliquant souvent des clés primaires et étrangères.

Il existe trois types de relations :

<table>
  <tr>
    <td><code>One-to-one</code></td>
    <td>Chaque ligne de la table primaire a une et une seule ligne associée dans la table étrangère.</td>
  </tr>
  <tr>
    <td><code>One-to-many / Many-to-one</code></td>
    <td>Chaque ligne de la table primaire a une ou plusieurs lignes apparentées dans la table étrangère.</td>
  </tr>
  <tr>
    <td><code>Many-to-many</code></td>
    <td>Chaque ligne de la table primaire a plusieurs lignes apparentées dans la table étrangère, et chaque enregistrement de la table étrangère a plusieurs lignes apparentées dans la table primaire.</td>
  </tr>
</table>

Pour définir des relations dans les entités, utilisez les **décorateurs** correspondants. Par exemple, pour définir que chaque `User` peut avoir plusieurs photos, utilisez le décorateur `@HasMany()`.

```typescript
@@filename(user.entity)
import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Photo } from '../photos/photo.model';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;

  @HasMany(() => Photo)
  photos: Photo[];
}
```

> info **Astuce** Pour en savoir plus sur les associations dans Sequelize, lisez [ce chapitre](https://github.com/RobinBuschmann/sequelize-typescript#model-association).

#### Chargement automatique des modèles

Ajouter manuellement des modèles au tableau `models` des options de connexion peut être fastidieux. De plus, référencer des modèles à partir du module racine brise les frontières du domaine d'application et provoque des fuites de détails d'implémentation vers d'autres parties de l'application. Pour résoudre ce problème, chargez automatiquement les modèles en définissant les propriétés `autoLoadModels` et `synchronize` de l'objet de configuration (passé dans la méthode `forRoot()`) à `true`, comme montré ci-dessous :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...
      autoLoadModels: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

Si cette option est spécifiée, chaque modèle enregistré par la méthode `forFeature()` sera automatiquement ajouté au tableau `models` de l'objet de configuration.

> warning **Attention** Notez que les modèles qui ne sont pas enregistrés via la méthode `forFeature()`, mais qui sont seulement référencés à partir du modèle (via une association), ne seront pas inclus.

#### Transactions Sequelize

Une transaction de base de données symbolise une unité de travail effectuée au sein d'un système de gestion de base de données par rapport à une base de données, et traitée de manière cohérente et fiable, indépendamment des autres transactions. Une transaction représente généralement toute modification apportée à une base de données ([en savoir plus](https://en.wikipedia.org/wiki/Database_transaction)).

Il existe de nombreuses stratégies différentes pour gérer les [transactions Sequelize](https://sequelize.org/v5/manual/transactions.html). Vous trouverez ci-dessous un exemple de mise en œuvre d'une transaction gérée (auto-callback).

Tout d'abord, nous devons injecter l'objet `Sequelize` dans une classe de la manière habituelle :

```typescript
@Injectable()
export class UsersService {
  constructor(private sequelize: Sequelize) {}
}
```

> info **Astuce** La classe `Sequelize` est importée du package `sequelize-typescript`.

Nous pouvons maintenant utiliser cet objet pour créer une transaction.

```typescript
async createMany() {
  try {
    await this.sequelize.transaction(async t => {
      const transactionHost = { transaction: t };

      await this.userModel.create(
          { firstName: 'Abraham', lastName: 'Lincoln' },
          transactionHost,
      );
      await this.userModel.create(
          { firstName: 'John', lastName: 'Boothe' },
          transactionHost,
      );
    });
  } catch (err) {
    // La transaction a été annulée
    // err est le rejet de la chaîne de promesses renvoyée au callback de la transaction
  }
}
```

> info **Astuce** Notez que l'instance `Sequelize` n'est utilisée que pour démarrer la transaction. Cependant, pour tester cette classe, il faudrait simuler l'objet `Sequelize` entier (qui expose plusieurs méthodes). Nous recommandons donc d'utiliser une classe factory d'aide (par exemple, `TransactionRunner`) et de définir une interface avec un ensemble limité de méthodes nécessaires pour maintenir les transactions. Cette technique rend l'utilisation de ces méthodes assez simple.

#### Migrations

Les [Migrations](https://sequelize.org/v5/manual/migrations.html) permettent de mettre à jour de manière incrémentale le schéma de la base de données afin de le maintenir en phase avec le modèle de données de l'application tout en préservant les données existantes dans la base de données. Pour générer, exécuter et inverser les migrations, Sequelize fournit une [CLI](https://sequelize.org/v5/manual/migrations.html#the-cli) dédié.

Les classes de migration sont distinctes du code source de l'application Nest. Leur cycle de vie est géré par l'interface de programmation Sequelize. Par conséquent, vous n'êtes pas en mesure de tirer parti de l'injection de dépendances et d'autres fonctionnalités spécifiques à Nest avec les migrations. Pour en savoir plus sur les migrations, suivez le guide dans la [documentation Sequelize](https://sequelize.org/v5/manual/migrations.html#the-cli).

<app-banner-courses></app-banner-courses>

#### Bases de données multiples

Certains projets nécessitent des connexions multiples à des bases de données. Ce module permet également d'y parvenir. Pour travailler avec plusieurs connexions, il faut d'abord créer les connexions. Dans ce cas, le nom de la connexion devient **obligatoire**.

Supposons que vous ayez une entité `Album` stockée dans sa propre base de données.

```typescript
const defaultOptions = {
  dialect: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      models: [User],
    }),
    SequelizeModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      models: [Album],
    }),
  ],
})
export class AppModule {}
```

> warning **Remarque** Si vous ne définissez pas le `name` d'une connexion, son nom sera fixé à `default`. Notez que vous ne devriez pas avoir plusieurs connexions sans nom, ou avec le même nom, sinon elles seront écrasées.

A ce stade, vous avez les modèles `User` et `Album` enregistrés avec leur propre connexion. Avec cette configuration, vous devez indiquer à la méthode `SequelizeModule.forFeature()` et au décorateur `@InjectModel()` quelle connexion doit être utilisée. Si vous ne passez pas de nom de connexion, la connexion `default` est utilisée.

```typescript
@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    SequelizeModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

Vous pouvez également injecter l'instance `Sequelize` pour une connexion donnée :

```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectConnection('albumsConnection')
    private sequelize: Sequelize,
  ) {}
}
```

Il est également possible d'injecter n'importe quelle instance de `Sequelize` dans les fournisseurs :

```typescript
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsSequelize: Sequelize) => {
        return new AlbumsService(albumsSequelize);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
```

#### Tests

Lorsqu'il s'agit de tester une application de manière unitaire, nous voulons généralement éviter d'établir une connexion à la base de données, afin que nos suites de tests restent indépendantes et que leur processus d'exécution soit aussi rapide que possible. Mais nos classes peuvent dépendre de modèles qui sont tirés de l'instance de connexion. Comment gérer cela ? La solution consiste à créer des modèles fictifs. Pour ce faire, nous mettons en place des [fournisseurs personnalisés](/fundamentals/custom-providers). Chaque modèle enregistré est automatiquement représenté par un jeton `<ModelName>Model`, où `ModelName` est le nom de votre classe de modèle.

Le package `@nestjs/sequelize` expose la fonction `getModelToken()` qui retourne un jeton préparé basé sur un modèle donné.

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getModelToken(User),
      useValue: mockModel,
    },
  ],
})
export class UsersModule {}
```

Maintenant, un substitut `mockModel` sera utilisé comme `UserModel`. Chaque fois qu'une classe demandera le `ModèleUtilisateur` en utilisant un décorateur `@InjectModel()`, Nest utilisera l'objet `mockModel` enregistré.

#### Configuration asynchrone

Vous pouvez vouloir passer vos options `SequelizeModule` de manière asynchrone plutôt que statique. Dans ce cas, utilisez la méthode `forRootAsync()`, qui fournit plusieurs façons de gérer la configuration asynchrone.

Une approche consiste à utiliser une fonction d'usine :

```typescript
SequelizeModule.forRootAsync({
  useFactory: () => ({
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    models: [],
  }),
});
```

Notre factory se comporte comme n'importe quel autre [fournisseur asynchrone](/fundamentals/async-providers) (par exemple, il peut être `async` et il est capable d'injecter des dépendances via `inject`).

```typescript
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    dialect: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    models: [],
  }),
  inject: [ConfigService],
});
```

Vous pouvez également utiliser la syntaxe `useClass` :

```typescript
SequelizeModule.forRootAsync({
  useClass: SequelizeConfigService,
});
```

La construction ci-dessus instanciera `SequelizeConfigService` dans `SequelizeModule` et l'utilisera pour fournir un objet d'options en appelant `createSequelizeOptions()`. Notez que cela signifie que le `SequelizeConfigService` doit implémenter l'interface `SequelizeOptionsFactory`, comme montré ci-dessous :

```typescript
@Injectable()
class SequelizeConfigService implements SequelizeOptionsFactory {
  createSequelizeOptions(): SequelizeModuleOptions {
    return {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    };
  }
}
```

Afin d'éviter la création de `SequelizeConfigService` dans `SequelizeModule` et d'utiliser un fournisseur importé d'un module différent, vous pouvez utiliser la syntaxe `useExisting`.

```typescript
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Cette construction fonctionne de la même manière que `useClass` avec une différence essentielle - `SequelizeModule` va chercher dans les modules importés pour réutiliser un `ConfigService` existant au lieu d'en instancier un nouveau.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/07-sequelize).
