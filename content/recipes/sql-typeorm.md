### SQL (TypeORM)

##### Ce chapitre ne s'applique uniquement à TypeScript

> **Warning** **Attention** Dans cet article, vous apprendrez comment créer un `DatabaseModule` basé sur le paquet **TypeORM** package à partir de zéro en utilisant un mécanisme de fournisseurs personnalisés. En conséquence, cette technique contient beaucoup de surcharge que vous pouvez éviter en utilisant le package dédié et prêt à l'emploi `@nestjs/typeorm`. Pour en savoir plus, voir [ici](/techniques/sql).

[TypeORM] (https://github.com/typeorm/typeorm) est sans aucun doute l'ORM (Object Relational Mapper) le plus mature disponible dans le monde node.js. Comme il est écrit en TypeScript, il fonctionne très bien avec le framework Nest.

#### Pour commencer

Pour commencer l'aventure avec cette bibliothèque, nous devons installer toutes les dépendances nécessaires :

```bash
$ npm install --save typeorm mysql2
```

La première étape que nous devons faire est d'établir la connexion avec notre base de données en utilisant la classe `new DataSource().initialize()` importée du package `typeorm`. La fonction `initialize()` retourne une `Promise`, et donc nous devons créer un [fournisseur async](/fundamentals/async-components).

```typescript
@@filename(database.providers)
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'root',
        database: 'test',
        entities: [
            __dirname + '/../**/*.entity{.ts,.js}',
        ],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
```

> warning **Attention** Le paramètre `synchronize : true` ne doit pas être utilisé en production - sinon vous pouvez perdre des données de production.

> info **Astuce** En suivant les meilleures pratiques, nous avons déclaré le fournisseur personnalisé dans le fichier séparé qui a un suffixe `*.providers.ts`.

Ensuite, nous devons exporter ces fournisseurs pour les rendre **accessibles** au reste de l'application.

```typescript
@@filename(database.module)
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

Maintenant nous pouvons injecter l'objet `DATA_SOURCE` en utilisant le décorateur `@Inject()`. Chaque classe qui dépendrait du fournisseur asynchrone `DATA_SOURCE` attendra jusqu'à ce qu'une `Promise` soit résolue.

#### Repository pattern

Le [TypeORM](https://github.com/typeorm/typeorm) prend en charge le Repository pattern, de sorte que chaque entité dispose de son propre Repository. Ces Repositorys peuvent être obtenus à partir de la connexion à la base de données.

Mais tout d'abord, nous avons besoin d'au moins une entité. Nous allons réutiliser l'entité `Photo` de la documentation officielle.

```typescript
@@filename(photo.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column('text')
  description: string;

  @Column()
  filename: string;

  @Column('int')
  views: number;

  @Column()
  isPublished: boolean;
}
```

L'entité `Photo` appartient au répertoire `photo`. Ce répertoire représente le `PhotoModule`. Maintenant, créons un fournisseur **Repository** :

```typescript
@@filename(photo.providers)
import { DataSource } from 'typeorm';
import { Photo } from './photo.entity';

export const photoProviders = [
  {
    provide: 'PHOTO_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Photo),
    inject: ['DATA_SOURCE'],
  },
];
```

> warning **Attention** Dans les applications réelles, vous devriez éviter les **magic strings**. Les deux fichiers `PHOTO_REPOSITORY` et `DATA_SOURCE` doivent être conservés dans le fichier séparé `constants.ts`.

Nous pouvons maintenant injecter le `Repository<Photo>` dans le `PhotoService` en utilisant le décorateur `@Inject()` :

```typescript
@@filename(photo.service)
import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
  ) {}

  async findAll(): Promise<Photo[]> {
    return this.photoRepository.find();
  }
}
```

La connexion à la base de données est **asynchrone**, mais Nest rend ce processus complètement invisible pour l'utilisateur final. Le `PhotoRepository` attend la connexion à la base de données, et le `PhotoService` est retardé jusqu'à ce que le repository soit prêt à être utilisé. L'application entière peut démarrer lorsque chaque classe est instanciée.

Voici un `PhotoModule` final :

```typescript
@@filename(photo.module)
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { photoProviders } from './photo.providers';
import { PhotoService } from './photo.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    ...photoProviders,
    PhotoService,
  ],
})
export class PhotoModule {}
```

> info **Astuce** N'oubliez pas d'importer le `PhotoModule` dans la racine `AppModule`.
