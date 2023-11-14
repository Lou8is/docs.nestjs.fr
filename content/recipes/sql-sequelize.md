### SQL (Sequelize)

##### Ce chapitre ne s'applique uniquement à TypeScript

> **Attention** Dans cet article, vous apprendrez comment créer un `DatabaseModule` basé sur le paquet **Sequelize** à partir de zéro en utilisant des composants personnalisés. En conséquence, cette technique contient beaucoup de surcharge que vous pouvez éviter en utilisant le package dédié et prêt à l'emploi `@nestjs/sequelize`. Pour en savoir plus, voir [ici](/techniques/database#intégration-sequelize).

[Sequelize](https://github.com/sequelize/sequelize) est un ORM (Object Relational Mapper) populaire écrit en JavaScript classique, mais il existe un [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) wrapper TypeScript qui fournit un ensemble de décorateurs et d'autres extras pour le sequelize de base.

#### Pour commencer

Pour commencer l'aventure avec cette bibliothèque, nous devons installer les dépendances suivantes :

```bash
$ npm install --save sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
```

La première étape est de créer une instance **Sequelize** avec un objet options passé dans le constructeur. Nous devons également ajouter tous les modèles (l'alternative est d'utiliser la propriété `modelPaths`) et `sync()` nos tables de base de données.

```typescript
@@filename(database.providers)
import { Sequelize } from 'sequelize-typescript';
import { Cat } from '../cats/cat.entity';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'motdepasse',
        database: 'nest',
      });
      sequelize.addModels([Cat]);
      await sequelize.sync();
      return sequelize;
    },
  },
];
```

> info **Astuce** En suivant les meilleures pratiques, nous avons déclaré le fournisseur personnalisé dans le fichier séparé qui a un suffixe `*.providers.ts`.

Ensuite, nous devons exporter ces fournisseurs pour les rendre **accessibles** pour le reste de l'application.

```typescript
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

Maintenant nous pouvons injecter l'objet `Sequelize` en utilisant le décorateur `@Inject()`. Chaque classe qui dépendrait du fournisseur asynchrone `Sequelize` attendra jusqu'à ce qu'une `Promise` soit résolue.

#### Injection de modèle

Dans [Sequelize](https://github.com/sequelize/sequelize), le **Modèle** définit une table dans la base de données. Les instances de cette classe représentent une ligne de la base de données. Tout d'abord, nous avons besoin d'au moins une entité :

```typescript
@@filename(cat.entity)
import { Table, Column, Model } from 'sequelize-typescript';

@Table
export class Cat extends Model {
  @Column
  name: string;

  @Column
  age: number;

  @Column
  breed: string;
}
```

L'entité `Cat` appartient au répertoire `cats`. Ce répertoire représente le module `Cats`. Il est maintenant temps de créer un fournisseur **Repository** :

```typescript
@@filename(cats.providers)
import { Cat } from './cat.entity';

export const catsProviders = [
  {
    provide: 'CATS_REPOSITORY',
    useValue: Cat,
  },
];
```

> warning **Attention** Dans les applications réelles, vous devriez éviter les **magic strings**. `CATS_REPOSITORY` et `SEQUELIZE` doivent être conservés dans le fichier `constants.ts` séparé.

Dans Sequelize, nous utilisons des méthodes statiques pour manipuler les données, et nous avons donc créé un **alias** ici.

Maintenant nous pouvons injecter le `CATS_REPOSITORY` dans le `CatsService` en utilisant le décorateur `@Inject()` :

```typescript
@@filename(cats.service)
import { Injectable, Inject } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './cat.entity';

@Injectable()
export class CatsService {
  constructor(
    @Inject('CATS_REPOSITORY')
    private catsRepository: typeof Cat
  ) {}

  async findAll(): Promise<Cat[]> {
    return this.catsRepository.findAll<Cat>();
  }
}
```

La connexion à la base de données est **asynchrone**, mais Nest rend ce processus complètement invisible pour l'utilisateur final. Le fournisseur `CATS_REPOSITORY` attend la connexion à la base de données, et le `CatsService` est retardé jusqu'à ce que le référentiel soit prêt à être utilisé. L'application entière peut démarrer lorsque chaque classe est instanciée.

Voici la version finale de `CatsModule` :

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { catsProviders } from './cats.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CatsController],
  providers: [
    CatsService,
    ...catsProviders,
  ],
})
export class CatsModule {}
```

> info **Astuce** N'oubliez pas d'importer le `CatsModule` dans la racine `AppModule`.
