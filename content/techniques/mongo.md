### Mongo

Nest prend en charge deux méthodes d'intégration avec la base de données [MongoDB](https://www.mongodb.com/). Vous pouvez soit utiliser le module intégré [TypeORM](https://github.com/typeorm/typeorm) décrit [ici](/techniques/database), qui possède un connecteur pour MongoDB, soit utiliser [Mongoose](https://mongoosejs.com), l'outil de modélisation d'objets MongoDB le plus populaire. Dans ce chapitre, nous allons décrire ce dernier, en utilisant le package dédié `@nestjs/mongoose`.

Commencez par installer les [dépendances requises](https://github.com/Automattic/mongoose) :

```bash
$ npm i @nestjs/mongoose mongoose
```

Une fois le processus d'installation terminé, nous pouvons importer le module `MongooseModule` dans le module racine `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest')],
})
export class AppModule {}
```

La méthode `forRoot()` accepte le même objet de configuration que `mongoose.connect()` du package Mongoose, comme décrit [ici](https://mongoosejs.com/docs/connections.html).

#### Injection de modèle

Avec Mongoose, tout est dérivé d'un [Schema](http://mongoosejs.com/docs/guide.html). Chaque schéma correspond à une collection MongoDB et définit la forme des documents au sein de cette collection. Les schémas sont utilisés pour définir les [Modèles](https://mongoosejs.com/docs/models.html). Les modèles sont responsables de la création et de la lecture des documents à partir de la base de données MongoDB sous-jacente.

Les schémas peuvent être créés à l'aide de décorateurs NestJS ou manuellement avec Mongoose. L'utilisation de décorateurs pour créer des schémas permet de réduire considérablement le nombre de lignes de code et d'améliorer la lisibilité globale du code.

Définissons le `CatSchema` :

```typescript
@@filename(schemas/cat.schema)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Cat>;

@Schema()
export class Cat {
  @Prop()
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
```

> info **Astuce** Notez que vous pouvez aussi générer une définition de schéma brute en utilisant la classe `DefinitionsFactory` (de `nestjs/mongoose`). Cela vous permet de modifier manuellement la définition de schéma générée en fonction des métadonnées que vous avez fournies. C'est utile pour certains cas où il peut être difficile de tout représenter avec des décorateurs.

Le décorateur `@Schema()` marque une classe comme une définition de schéma. Il fait correspondre notre classe `Cat` à une collection MongoDB du même nom, mais avec un "s" supplémentaire à la fin - donc le nom final de la collection MongoDB sera `cats`. Ce décorateur accepte un seul argument optionnel qui est un objet d'options de schéma. Pensez-y comme l'objet que vous passeriez normalement comme second argument du constructeur de la classe `mongoose.Schema` (e.g., `new mongoose.Schema(_, options)`)). Pour en savoir plus sur les options de schéma disponibles, voir [ce chapitre](https://mongoosejs.com/docs/guide.html#options).

Le décorateur `@Prop()` définit une propriété dans le document. Par exemple, dans la définition du schéma ci-dessus, nous avons défini trois propriétés : `name`, `age`, et `breed`. Les [types de schéma](https://mongoosejs.com/docs/schematypes.html) de ces propriétés sont automatiquement déduits grâce aux capacités de métadonnées (et de réflexivité) de TypeScript. Cependant, dans des scénarios plus complexes dans lesquels les types ne peuvent pas être implicitement déduits (par exemple, les tableaux ou les structures d'objets imbriqués), les types doivent être indiqués explicitement, comme suit :

```typescript
@Prop([String])
tags: string[];
```

Alternativement, le décorateur `@Prop()` accepte un argument objet options ([en savoir plus](https://mongoosejs.com/docs/schematypes.html#schematype-options) sur les options disponibles). Vous pouvez ainsi indiquer si une propriété est obligatoire ou non, spécifier une valeur par défaut ou la marquer comme immuable. Par exemple, le décorateur

```typescript
@Prop({ required: true })
name: string;
```

Si vous souhaitez spécifier une relation avec un autre modèle, vous pouvez également utiliser le décorateur `@Prop()`. Par exemple, si `Cat` a `Owner` qui est stocké dans une collection différente appelée `owners`, la propriété doit avoir un type et une ref. Par exemple, le décorateur

```typescript
import * as mongoose from 'mongoose';
import { Owner } from '../owners/schemas/owner.schema';

// dans la définition de la classe
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
owner: Owner;
```

S'il y a plusieurs owners, la configuration de votre propriété doit être la suivante :

```typescript
@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }] })
owners: Owner[];
```

Cela permet de s'assurer que Vitest résout correctement les importations de modules, évitant ainsi les erreurs liées à des dépendances manquantes.

```typescript
@Prop({ type: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' } })
// Cela permet de s'assurer que le champ n'est pas confondu avec une référence remplie.
owner: mongoose.Types.ObjectId;
```

Ensuite, lorsque vous devez l'alimenter de manière sélective, vous pouvez utiliser une fonction de dépôt qui spécifie le type correct :

```typescript
import { Owner } from './schemas/owner.schema';

// par exemple, à l'intérieur d'un service ou d'un référentiel
async findAllPopulated() {
  return this.catModel.find().populate<{ owner: Owner }>("owner");
}
```

> info **Astuce** S'il n'y a pas de document étranger à remplir, le type peut être `Owner | null`, en fonction de votre [configuration Mongoose](https://mongoosejs.com/docs/populate.html#doc-not-found). Alternativement, il peut y avoir une erreur, dans ce cas le type sera `Owner`.

Enfin, la définition **brute** du schéma peut également être transmise au décorateur. Ceci est utile lorsque, par exemple, une propriété représente un objet imbriqué qui n'est pas défini comme une classe. Pour cela, utilisez la fonction `raw()` du package `@nestjs/mongoose`, comme suit :

```typescript
@Prop(raw({
  firstName: { type: String },
  lastName: { type: String }
}))
details: Record<string, any>;
```

Si vous préférez **ne pas utiliser de décorateurs**, vous pouvez définir un schéma manuellement. Par exemple, vous pouvez définir un schéma manuellement :

```typescript
export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
```

Le fichier `cat.schema` réside dans un dossier du répertoire `cats`, où nous définissons également le `CatsModule`. Bien que vous puissiez stocker les fichiers de schéma où vous le souhaitez, nous recommandons de les stocker près des objets **domaine** qui leur sont associés, dans le répertoire du module approprié.

Examinons le module `CatsModule` :

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { Cat, CatSchema } from './schemas/cat.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

Le module `MongooseModule` fournit la méthode `forFeature()` pour configurer le module, y compris la définition des modèles qui doivent être enregistrés dans le champ d'application actuel. Si vous voulez aussi utiliser les modèles dans un autre module, ajoutez MongooseModule à la section `exports` de `CatsModule` et importez `CatsModule` dans l'autre module.

Une fois le schéma enregistré, vous pouvez injecter un modèle `Cat` dans le `CatsService` en utilisant le décorateur `@InjectModel()` :

```typescript
@@filename(cats.service)
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
@@switch
import { Model } from 'mongoose';
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';

@Injectable()
@Dependencies(getModelToken(Cat.name))
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

#### Connexion

Il peut arriver que vous ayez besoin d'accéder à l'objet natif [Mongoose Connection](https://mongoosejs.com/docs/api.html#Connection). Par exemple, vous pouvez vouloir faire des appels API natifs sur l'objet connexion. Vous pouvez injecter la connexion Mongoose en utilisant le décorateur `@InjectConnection()` comme suit :

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private connection: Connection) {}
}
```

#### Sessions

Pour démarrer une session avec Mongoose, il est recommandé d'injecter la connexion à la base de données en utilisant `@InjectConnection` plutôt que d'appeler directement `mongoose.startSession()`. Cette approche permet une meilleure intégration avec le système d'injection de dépendances de NestJS, assurant une bonne gestion des connexions.

Voici un exemple de démarrage d'une session :

```typescript
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async startTransaction() {
    const session = await this.connection.startSession();
    session.startTransaction();
    // Your transaction logic here
  }
}
```

Dans cet exemple, `@InjectConnection()` est utilisé pour injecter la connexion Mongoose dans le service. Une fois la connexion injectée, vous pouvez utiliser `connection.startSession()` pour démarrer une nouvelle session. Cette session peut être utilisée pour gérer les transactions de la base de données, en garantissant des opérations atomiques sur plusieurs requêtes. Après avoir démarré la session, n'oubliez pas de valider ou d'annuler la transaction en fonction de votre logique.

#### Bases de données multiples

Certains projets nécessitent plusieurs connexions à des bases de données. Ce module permet également d'y parvenir. Pour travailler avec des connexions multiples, il faut d'abord créer les connexions. Dans ce cas, le nom de la connexion devient **obligatoire**.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionName: 'cats',
    }),
    MongooseModule.forRoot('mongodb://localhost/users', {
      connectionName: 'users',
    }),
  ],
})
export class AppModule {}
```

> warning **Remarque** Veuillez noter que vous ne devez pas avoir plusieurs connexions sans nom ou avec le même nom, sinon elles seront remplacées.

Avec cette configuration, vous devez indiquer à la fonction `MongooseModule.forFeature()` quelle connexion doit être utilisée.

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }], 'cats'),
  ],
})
export class CatsModule {}
```

Vous pouvez également injecter la `Connection` pour une connexion donnée :

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection('cats') private connection: Connection) {}
}
```

Pour injecter une `Connection` donnée dans un fournisseur personnalisé (par exemple, un fournisseur factory), utilisez la fonction `getConnectionToken()` en passant le nom de la connexion en tant qu'argument.

```typescript
{
  provide: CatsService,
  useFactory: (catsConnection: Connection) => {
    return new CatsService(catsConnection);
  },
  inject: [getConnectionToken('cats')],
}
```

Si vous souhaitez simplement injecter le modèle à partir d'une base de données nommée, vous pouvez utiliser le nom de la connexion comme second paramètre du décorateur `@InjectModel()`.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name, 'cats') private catModel: Model<Cat>) {}
}
@@switch
@Injectable()
@Dependencies(getModelToken(Cat.name, 'cats'))
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }
}
```

#### Hooks (middleware)

Les middleware (également appelés pre et post hooks) sont des fonctions auxquelles on passe le contrôle pendant l'exécution de fonctions asynchrones. Le middleware est spécifié au niveau du schéma et est utile pour écrire des plugins ([source](https://mongoosejs.com/docs/middleware.html)). Appeler `pre()` ou `post()` après avoir compilé un modèle ne fonctionne pas dans Mongoose. Pour enregistrer un hook **avant** l'enregistrement du modèle, utilisez la méthode `forFeatureAsync()` du `MongooseModule` avec un fournisseur de fabrique (i.e., `useFactory`). Avec cette technique, vous pouvez accéder à un objet schéma, puis utiliser la méthode `pre()` ou `post()` pour enregistrer un hook sur ce schéma. Voir l'exemple ci-dessous :

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatsSchema;
          schema.pre('save', function () {
            console.log('Bonjour depuis pre save');
          });
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

Comme les autres [fournisseurs d'usine](/fundamentals/custom-providers#fournisseurs-de-factory--usefactory), notre fonction d'usine peut être `async` et peut injecter des dépendances via `inject`.

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const schema = CatsSchema;
          schema.pre('save', function() {
            console.log(
              `${configService.get('APP_NAME')}: Bonjour dpeuis pre save`,
            ),
          });
          return schema;
        },
        inject: [ConfigService],
      },
    ]),
  ],
})
export class AppModule {}
```

#### Plugins

Pour enregistrer un [plugin](https://mongoosejs.com/docs/plugins.html) pour un schéma donné, utilisez la méthode `forFeatureAsync()`.

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatsSchema;
          schema.plugin(require('mongoose-autopopulate'));
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

Pour enregistrer un plugin pour tous les schémas à la fois, appelez la méthode `.plugin()` de l'objet `Connection`. Vous devez accéder à la connexion avant que les modèles ne soient créés ; pour cela, utilisez l'objet `connectionFactory` :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionFactory: (connection) => {
        connection.plugin(require('mongoose-autopopulate'));
        return connection;
      }
    }),
  ],
})
export class AppModule {}
```

#### Discriminants

Les [discriminants](https://mongoosejs.com/docs/discriminators.html) sont un mécanisme d'héritage de schéma. Ils vous permettent d'avoir plusieurs modèles avec des schémas qui se chevauchent au-dessus de la même collection MongoDB sous-jacente.

Supposons que vous souhaitiez suivre différents types d'événements dans une seule collection. Chaque événement aura un horodatage.

```typescript
@@filename(event.schema)
@Schema({ discriminatorKey: 'kind' })
export class Event {
  @Prop({
    type: String,
    required: true,
    enum: [ClickedLinkEvent.name, SignUpEvent.name],
  })
  kind: string;

  @Prop({ type: Date, required: true })
  time: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
```

> info **Astuce** La façon dont Mongoose fait la différence entre les différents modèles de discriminants est par la "clé du discriminant", qui est `__t` par défaut. Mongoose ajoute une chaîne de caractères appelée `__t` à vos schémas qu'il utilise pour savoir de quel discriminateur ce document est une instance.
> Vous pouvez également utiliser l'option `discriminatorKey` pour définir le chemin pour le discriminant.

Les instances `SignedUpEvent` et `ClickedLinkEvent` seront stockées dans la même collection que les événements génériques.

Définissons maintenant la classe `ClickedLinkEvent`, comme suit :

```typescript
@@filename(click-link-event.schema)
@Schema()
export class ClickedLinkEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  url: string;
}

export const ClickedLinkEventSchema = SchemaFactory.createForClass(ClickedLinkEvent);
```

Et la classe `SignUpEvent` :

```typescript
@@filename(sign-up-event.schema)
@Schema()
export class SignUpEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  user: string;
}

export const SignUpEventSchema = SchemaFactory.createForClass(SignUpEvent);
```

Avec ceci en place, utilisez l'option `discriminators` pour enregistrer un discriminant pour un schéma donné. Cela fonctionne à la fois sur `MongooseModule.forFeature` et `MongooseModule.forFeatureAsync` :

```typescript
@@filename(event.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: ClickedLinkEvent.name, schema: ClickedLinkEventSchema },
          { name: SignUpEvent.name, schema: SignUpEventSchema },
        ],
      },
    ]),
  ]
})
export class EventsModule {}
```

#### Tests

Lors des tests unitaires d'une application, nous souhaitons généralement éviter toute connexion à la base de données, afin de simplifier la mise en place de nos suites de tests et d'en accélérer l'exécution. Mais nos classes peuvent dépendre de modèles tirés de l'instance de connexion. Comment résoudre ces classes ? La solution consiste à créer des modèles fictifs.

Pour rendre cela plus facile, le package `@nestjs/mongoose` expose une fonction `getModelToken()` qui retourne un [jeton d'injection préparé](/fundamentals/custom-providers#principes-de-base-de-lid) basé sur un nom de jeton. En utilisant ce jeton, vous pouvez facilement fournir une implémentation fictive en utilisant n'importe laquelle des techniques standard de [fournisseurs personnalisés](/fundamentals/custom-providers), y compris `useClass`, `useValue`, et `useFactory`. Par exemple :

```typescript
@Module({
  providers: [
    CatsService,
    {
      provide: getModelToken(Cat.name),
      useValue: catModel,
    },
  ],
})
export class CatsModule {}
```

Dans cet exemple, un `catModel` (instance d'objet) codé en dur sera fourni chaque fois qu'un consommateur injectera un `Model<Cat>` en utilisant un décorateur `@InjectModel()`.

<app-banner-courses></app-banner-courses>

#### Configuration asynchrone

Lorsque vous avez besoin de passer des options de module de manière asynchrone plutôt que statique, utilisez la méthode `forRootAsync()`. Comme pour la plupart des modules dynamiques, Nest fournit plusieurs techniques pour gérer la configuration asynchrone.

Une technique consiste à utiliser une fonction factory :

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/nest',
  }),
});
```

Comme les autres [fournisseurs de factory](/fundamentals/custom-providers#fournisseurs-de-factory--usefactory), notre fonction factory peut être `async` et peut injecter des dépendances via `inject`.

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URI'),
  }),
  inject: [ConfigService],
});
```

Alternativement, vous pouvez configurer le `MongooseModule` en utilisant une classe au lieu d'une factory, comme montré ci-dessous :

```typescript
MongooseModule.forRootAsync({
  useClass: MongooseConfigService,
});
```

La construction ci-dessus instancie `MongooseConfigService` à l'intérieur de `MongooseModule`, en l'utilisant pour créer l'objet d'options requis. Notez que dans cet exemple, le `MongooseConfigService` doit implémenter l'interface `MongooseOptionsFactory`, comme montré ci-dessous. Le `MongooseModule` appellera la méthode `createMongooseOptions()` sur l'objet instancié de la classe fournie.

```typescript
@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: 'mongodb://localhost/nest',
    };
  }
}
```

Si vous voulez réutiliser un fournisseur d'options existant au lieu de créer une copie privée à l'intérieur du `MongooseModule`, utilisez la syntaxe `useExisting`.

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

#### Événements de connexion

Vous pouvez écouter les [événements de connexion de Mongoose](https://mongoosejs.com/docs/connections.html#connection-events) en utilisant l'option de configuration `onConnectionCreate`. Cela vous permet d'implémenter une logique personnalisée chaque fois qu'une connexion est établie. Par exemple, vous pouvez enregistrer des récepteurs d'événements pour les événements `connected`, `open`, `disconnected`, `reconnected`, et `disconnecting`, comme démontré ci-dessous :

```typescript
MongooseModule.forRoot('mongodb://localhost/test', {
  onConnectionCreate: (connection: Connection) => {
    connection.on('connected', () => console.log('connected'));
    connection.on('open', () => console.log('open'));
    connection.on('disconnected', () => console.log('disconnected'));
    connection.on('reconnected', () => console.log('reconnected'));
    connection.on('disconnecting', () => console.log('disconnecting'));

    return connection;
  },
}),
```

Dans cet extrait de code, nous établissons une connexion à une base de données MongoDB à l'adresse `mongodb://localhost/test`. L'option `onConnectionCreate` vous permet de mettre en place des récepteurs d'événements spécifiques pour surveiller l'état de la connexion :

- `connected` : Déclenché lorsque la connexion est établie avec succès.
- `open` : Se déclenche lorsque la connexion est complètement ouverte et prête à être utilisée.
- `disconnected` : Appelé lorsque la connexion est perdue.
- `reconnected` : Invoqué lorsque la connexion est rétablie après avoir été déconnectée.
- `disconnecting` : Se produit lorsque la connexion est en train de se fermer.

Vous pouvez également incorporer la propriété `onConnectionCreate` dans les configurations asynchrones créées avec `MongooseModule.forRootAsync()` :

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/test',
    onConnectionCreate: (connection: Connection) => {
      // Register event listeners here
      return connection;
    },
  }),
}),
```

Il s'agit d'un moyen souple de gérer les événements de connexion, ce qui vous permet de gérer efficacement les changements d'état de la connexion.

#### Sous-documents

Pour imbriquer des sous-documents dans un document parent, vous pouvez définir vos schémas comme suit :

```typescript
@@filename(name.schema)
@Schema()
export class Name {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;
}

export const NameSchema = SchemaFactory.createForClass(Name);
```

Il faut ensuite référencer le sous-document dans le schéma parent :

```typescript
@@filename(person.schema)
@Schema()
export class Person {
  @Prop(NameSchema)
  name: Name;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.Subdocument<Types.ObjectId> & Name;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
```

Si vous souhaitez inclure plusieurs sous-documents, vous pouvez utiliser un tableau de sous-documents. Il est important de modifier le type de la propriété en conséquence :

```typescript
@@filename(name.schema)
@Schema()
export class Person {
  @Prop([NameSchema])
  name: Name[];
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.DocumentArray<Name>;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
```

#### Propriétés virtuelles

Dans Mongoose, une propriété **virtuelle** est une propriété qui existe sur un document mais qui n'est pas persistée dans MongoDB. Elle n'est pas stockée dans la base de données mais est calculée dynamiquement à chaque fois qu'on y accède. Les propriétés virtuelles sont généralement utilisées pour les valeurs dérivées ou calculées, comme la combinaison de champs (par exemple, la création d'une propriété `fullName` en concaténant `firstName` et `lastName`), ou pour la création de propriétés qui s'appuient sur des données existantes dans le document.

```typescript
class Person {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Virtual({
    get: function (this: Person) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  fullName: string;
}
```

> info **Astuce**  
Le décorateur `@Virtual()` est importé du paquetage `@nestjs/mongoose`.

Dans cet exemple, la propriété virtuelle `fullName` est dérivée de `firstName` et `lastName`. Même si elle se comporte comme une propriété normale lorsqu'on y accède, elle n'est jamais sauvegardée dans le document MongoDB.

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/06-mongoose).
