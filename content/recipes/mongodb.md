### MongoDB (Mongoose)

> **Attention** Dans cet article, vous apprendrez comment créer un `DatabaseModule` basé sur le package **Mongoose** à partir de zéro en utilisant des composants personnalisés. En conséquence, cette solution contient beaucoup de surcharge que vous pouvez omettre en utilisant le package dédié `@nestjs/mongoose` prêt à l'emploi et disponible prêt à l'emploi. Pour en savoir plus, voir [ici](/techniques/mongodb).

[Mongoose](https://mongoosejs.com) est l'outil de modélisation d'objets [MongoDB](https://www.mongodb.org/) le plus populaire.

#### Pour commencer

Pour commencer l'aventure avec cette bibliothèque, nous devons installer toutes les dépendances nécessaires :

```typescript
$ npm install --save mongoose
```

La première étape est d'établir une connexion avec notre base de données en utilisant la fonction `connect()`. La fonction `connect()` retourne une `Promise`, et donc nous devons créer un [async provider](/fundamentals/async-components).

```typescript
@@filename(database.providers)
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect('mongodb://localhost/nest'),
  },
];
@@switch
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: () => mongoose.connect('mongodb://localhost/nest'),
  },
];
```

> info **Astuce** En suivant les meilleures pratiques, nous avons déclaré le fournisseur personnalisé dans le fichier séparé qui a un suffixe `*.providers.ts`.

Ensuite, nous devons exporter ces fournisseurs pour les rendre **accessibles** pour le reste de l'application.

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

Maintenant nous pouvons injecter l'objet `Connection` en utilisant le décorateur `@Inject()`. Chaque classe qui dépendrait du fournisseur asynchrone `Connection` attendra jusqu'à ce qu'une `Promise` soit résolue.

#### Injection de modèle

Avec Mongoose, tout est dérivé d'un [Schema](https://mongoosejs.com/docs/guide.html). Définissons le `CatSchema` :

```typescript
@@filename(schemas/cat.schema)
import * as mongoose from 'mongoose';

export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
```

Le `CatsSchema` appartient au répertoire `cats`. Ce répertoire représente le `CatsModule`.

Il est maintenant temps de créer un fournisseur **Model** :

```typescript
@@filename(cats.providers)
import { Connection } from 'mongoose';
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CAT_MODEL',
    useFactory: (connection: Connection) => connection.model('Cat', CatSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
@@switch
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CAT_MODEL',
    useFactory: (connection) => connection.model('Cat', CatSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
```

> warning **Attention** Dans les applications réelles, vous devriez éviter les **magic strings**. Le `CAT_MODEL` et le `DATABASE_CONNECTION` doivent être conservés dans le fichier `constants.ts` séparé.

Maintenant nous pouvons injecter le `CAT_MODEL` dans le `CatsService` en utilisant le décorateur `@Inject()` :

```typescript
@@filename(cats.service)
import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(
    @Inject('CAT_MODEL')
    private catModel: Model<Cat>,
  ) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies('CAT_MODEL')
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }

  async create(createCatDto) {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll() {
    return this.catModel.find().exec();
  }
}
```

Dans l'exemple ci-dessus, nous avons utilisé l'interface `Cat`. Cette interface étend l'interface `Document` du package mongoose :

```typescript
import { Document } from 'mongoose';

export interface Cat extends Document {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
```

La connexion à la base de données est **asynchrone**, mais Nest rend ce processus complètement invisible pour l'utilisateur final. La classe `CatModel` attend la connexion à la base de données, et le `CatsService` est retardé jusqu'à ce que le modèle soit prêt à être utilisé. L'application entière peut démarrer lorsque chaque classe est instanciée.

Voici un dernier `CatsModule` :

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

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/14-mongoose-base).