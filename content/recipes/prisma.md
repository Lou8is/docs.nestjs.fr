### Prisma

[Prisma](https://www.prisma.io) est un ORM [open-source](https://github.com/prisma/prisma) pour Node.js et TypeScript. Il est utilisé comme **alternative** à l'écriture de SQL simple, ou à l'utilisation d'un autre outil d'accès à la base de données comme les constructeurs de requêtes SQL (comme [knex.js](https://knexjs.org/)) ou les ORM (comme [TypeORM](https://typeorm.io/) et [Sequelize](https://sequelize.org/)). Prisma supporte actuellement PostgreSQL, MySQL, SQL Server, SQLite, MongoDB et CockroachDB ([Voir les bases de données supportées](https://www.prisma.io/docs/reference/database-reference/supported-databases)).

Bien que Prisma puisse être utilisé avec du JavaScript simple, il embrasse TypeScript et fournit un niveau de sécurité de type qui va au-delà des garanties d'autres ORMs dans l'écosystème TypeScript. Vous pouvez trouver une comparaison approfondie des garanties de sécurité de type de Prisma et TypeORM [ici](https://www.prisma.io/docs/concepts/more/comparisons/prisma-and-typeorm#type-safety).

> info **Note** Si vous voulez avoir un aperçu rapide du fonctionnement de Prisma, vous pouvez suivre le [Quickstart](https://www.prisma.io/docs/getting-started/quickstart) ou lire l'[Introduction](https://www.prisma.io/docs/understand-prisma/introduction) dans la [documentation](https://www.prisma.io/docs/). Il existe également des exemples prêts à l'emploi pour [REST](https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest) et [GraphQL](https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest-graphql) dans le répertoire [`prisma-examples`](https://github.com/prisma/prisma-examples/).

#### Pour commencer

Dans cette recette, vous apprendrez à démarrer avec NestJS et Prisma à partir de zéro. Vous allez construire un exemple d'application NestJS avec une API REST qui peut lire et écrire des données dans une base de données.

Dans le cadre de ce guide, vous utiliserez une base de données [SQLite](https://sqlite.org/) pour éviter de devoir configurer un serveur de base de données. Notez que vous pouvez toujours suivre ce guide, même si vous utilisez PostgreSQL ou MySQL - vous trouverez des instructions supplémentaires pour l'utilisation de ces bases de données aux bons endroits.

> info **Note** Si vous avez déjà un projet existant et que vous envisagez de migrer vers Prisma, vous pouvez suivre le guide pour [ajouter Prisma à un projet existant](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project-typescript-postgres). Si vous migrez de TypeORM, vous pouvez lire le guide [Migrating from TypeORM to Prisma](https://www.prisma.io/docs/guides/migrate-to-prisma/migrate-from-typeorm).

#### Créez votre projet NestJS

Pour commencer, installez la CLI NestJS et créez votre squelette d'application avec les commandes suivantes :

```bash
$ npm install -g @nestjs/cli
$ nest new hello-prisma
```

Voir la page [Premiers pas](/first-steps) pour en savoir plus sur les fichiers de projet créés par cette commande. Notez aussi que vous pouvez maintenant lancer `npm start` pour démarrer votre application. L'API REST fonctionnant à `http://localhost:3000/` sert actuellement une seule route qui est implémentée dans `src/app.controller.ts`. Au cours de ce guide, vous allez implémenter des routes supplémentaires pour stocker et récupérer des données sur _users_ et _posts_.

#### Mise en place de Prisma

Commencez par installer la CLI Prisma en tant que dépendance de développement dans votre projet :

```bash
$ cd hello-prisma
$ npm install prisma --save-dev
```

Dans les étapes suivantes, nous utiliserons la [CLI Prisma](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-cli). Comme meilleure pratique, il est recommandé d'invoquer la CLI localement en la préfixant avec `npx` :

```bash
$ npx prisma
```

<details><summary>Développer si vous utilisez Yarn</summary>

Si vous utilisez Yarn, vous pouvez installer la CLI Prisma comme suit :

```bash
$ yarn add prisma --dev
```

Une fois installé, vous pouvez l'invoquer en le préfixant avec `yarn` :

```bash
$ yarn prisma
```

</details>

Maintenant, créez votre configuration initiale de Prisma en utilisant la commande `init` de la CLI de Prisma :

```bash
$ npx prisma init
```

Cette commande crée un nouveau répertoire `prisma` avec le contenu suivant :

- `schema.prisma`: Spécifie la connexion à la base de données et contient le schéma de la base de données.
- `.env`: Un fichier [dotenv](https://github.com/motdotla/dotenv), généralement utilisé pour stocker les informations d'identification de la base de données dans un groupe de variables d'environnement.

#### Définir la connexion à la base de données

Votre connexion à la base de données est configurée dans le bloc `datasource` de votre fichier `schema.prisma`. Par défaut, elle est définie à `postgresql`, mais puisque vous utilisez une base de données SQLite dans ce guide, vous devez ajuster le champ `provider` du bloc `datasource` à `sqlite` :

```groovy
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

Maintenant, ouvrez `.env` et ajustez la variable d'environnement `DATABASE_URL` pour qu'elle ressemble à ce qui suit :

```bash
DATABASE_URL="file:./dev.db"
```

Assurez-vous d'avoir un [ConfigModule](/techniques/configuration) configuré, sinon la variable `DATABASE_URL` ne sera pas récupérée dans `.env`.

Les bases de données SQLite sont de simples fichiers ; aucun serveur n'est nécessaire pour utiliser une base de données SQLite. Ainsi, au lieu de configurer une URL de connexion avec un _host_ et un _port_, vous pouvez simplement la faire pointer vers un fichier local qui, dans ce cas, s'appelle `dev.db`. Ce fichier sera créé dans l'étape suivante.

<details><summary>Développez si vous utilisez PostgreSQL, MySQL, MsSQL ou Azure SQL</summary>

Avec PostgreSQL et MySQL, vous devez configurer l'URL de connexion pour qu'elle pointe vers le _serveur de base de données_. Vous pouvez en savoir plus sur le format requis de l'URL de connexion [ici](https://www.prisma.io/docs/reference/database-reference/connection-urls).

**PostgreSQL**

Si vous utilisez PostgreSQL, vous devez ajuster les fichiers `schema.prisma` et `.env` comme suit :

**`schema.prisma`**

```groovy
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**`.env`**

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

Remplacez les caractères de remplacement en majuscules par les informations d'identification de votre base de données. Notez que si vous n'êtes pas sûr de ce que vous devez fournir pour l'espace réservé `SCHEMA`, c'est très probablement la valeur par défaut `public` :

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Si vous souhaitez apprendre à configurer une base de données PostgreSQL, vous pouvez suivre ce guide sur [la configuration d'une base de données PostgreSQL gratuite sur Heroku](https://dev.to/prisma/how-to-setup-a-free-postgresql-database-on-heroku-1dc1).

**MySQL**

Si vous utilisez MySQL, vous devez ajuster les fichiers `schema.prisma` et `.env` comme suit :

**`schema.prisma`**

```groovy
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**`.env`**

```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Remplacez les caractères de remplacement écrits en majuscules par les informations d'identification de votre base de données.

**Microsoft SQL Server / Azure SQL Server**

Si vous utilisez Microsoft SQL Server ou Azure SQL Server, vous devez ajuster les fichiers `schema.prisma` et `.env` comme suit :

**`schema.prisma`**

```groovy
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
```

**`.env`**

Remplacez les caractères de remplacement en majuscules par les informations d'identification de votre base de données. Notez que si vous n'êtes pas sûr de ce que vous devez fournir pour l'espace réservé `encrypt`, c'est très probablement la valeur par défaut `true` :

```bash
DATABASE_URL="sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD;encrypt=true"
```

</details>

#### Créer deux tables de base de données avec Prisma Migrate

Dans cette section, vous allez créer deux nouvelles tables dans votre base de données en utilisant [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate). Prisma Migrate génère des fichiers de migration SQL pour votre définition de modèle de données déclaratif dans le schéma Prisma. Ces fichiers de migration sont entièrement personnalisables, ce qui vous permet de configurer toutes les fonctionnalités supplémentaires de la base de données sous-jacente ou d'inclure des commandes supplémentaires, par exemple pour l'ensemencement.

Ajoutez les deux modèles suivants à votre fichier `schema.prisma` :

```groovy
model User {
  id    Int     @default(autoincrement()) @id
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @default(autoincrement()) @id
  title     String
  content   String?
  published Boolean? @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```

Avec vos modèles Prisma en place, vous pouvez générer vos fichiers de migration SQL et les exécuter contre la base de données. Exécutez les commandes suivantes dans votre terminal :

```bash
$ npx prisma migrate dev --name init
```

Cette commande `prisma migrate dev` génère des fichiers SQL et les exécute directement sur la base de données. Dans ce cas, les fichiers de migration suivants ont été créés dans le répertoire `prisma` existant :

```bash
$ tree prisma
prisma
├── dev.db
├── migrations
│   └── 20201207100915_init
│       └── migration.sql
└── schema.prisma
```

<details><summary>Développer pour visualiser les instructions SQL générées</summary>

Les tables suivantes ont été créées dans votre base de données SQLite :

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN DEFAULT false,
    "authorId" INTEGER,

    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");
```

</details>

#### Installer et générer le Prisma Client

Prisma Client est un client de base de données à sécurité de type qui est _généré_ à partir de votre définition de modèle Prisma. Grâce à cette approche, Prisma Client peut exposer des opérations [CRUD](https://www.prisma.io/docs/concepts/components/prisma-client/crud) qui sont _taillées_ spécifiquement pour vos modèles.

Pour installer Prisma Client dans votre projet, lancez la commande suivante dans votre terminal :

```bash
$ npm install @prisma/client
```

Notez que pendant l'installation, Prisma invoque automatiquement la commande `prisma generate` pour vous. Dans le futur, vous devrez lancer cette commande après _chaque_ changement dans vos modèles Prisma pour mettre à jour votre client Prisma généré.

> info **Note** La commande `prisma generate` lit votre schéma Prisma et met à jour la bibliothèque Prisma Client générée dans `node_modules/@prisma/client`.

#### Utiliser Prisma Client dans vos services NestJS

Vous êtes maintenant en mesure d'envoyer des requêtes de base de données avec Prisma Client. Si vous souhaitez en savoir plus sur la création de requêtes avec Prisma Client, consultez la [documentation API](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/crud).

Lors de la mise en place de votre application NestJS, vous voudrez abstraire l'API du client Prisma pour les requêtes de base de données à l'intérieur d'un service. Pour commencer, vous pouvez créer un nouveau `PrismaService` qui se charge d'instancier `PrismaClient` et de se connecter à votre base de données.

Dans le répertoire `src`, créez un nouveau fichier appelé `prisma.service.ts` et ajoutez-y le code suivant :

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

> info **Note** Le `onModuleInit` est optionnel - si vous l'omettez, Prisma se connectera paresseusement lors de son premier appel à la base de données.

Ensuite, vous pouvez écrire des services que vous pouvez utiliser pour faire des appels à la base de données pour les modèles `User` et `Post` de votre schéma Prisma.

Toujours dans le répertoire `src`, créez un nouveau fichier appelé `user.service.ts` et ajoutez-y le code suivant :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
```

Remarquez que vous utilisez les types générés par Prisma Client pour vous assurer que les méthodes exposées par votre service sont correctement typées. Vous évitez ainsi de taper vos modèles et de créer des fichiers d'interface ou de DTO supplémentaires.

Maintenant faites la même chose pour le modèle `Post`.

Toujours dans le répertoire `src`, créez un nouveau fichier appelé `post.service.ts` et ajoutez-y le code suivant :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Post, Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async post(
    postWhereUniqueInput: Prisma.PostWhereUniqueInput,
  ): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: postWhereUniqueInput,
    });
  }

  async posts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPost(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({
      data,
    });
  }

  async updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    const { data, where } = params;
    return this.prisma.post.update({
      data,
      where,
    });
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}
```

Vos `UserService` et `PostService` contiennent actuellement les requêtes CRUD disponibles dans Prisma Client. Dans une application réelle, le service serait également l'endroit où ajouter de la logique métier à votre application. Par exemple, vous pourriez avoir une méthode appelée `updatePassword` dans le `UserService` qui serait responsable de la mise à jour du mot de passe d'un utilisateur.

N'oubliez pas d'enregistrer les nouveaux services dans le module d'application.

##### Implémenter les routes de l'API REST dans le contrôleur principal de l'application

Enfin, vous utiliserez les services que vous avez créés dans les sections précédentes pour implémenter les différentes routes de votre application. Pour les besoins de ce guide, vous placerez toutes vos routes dans la classe `AppController` déjà existante.

Remplacez le contenu du fichier `app.controller.ts` par le code suivant :

```typescript
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PostService } from './post.service';
import { User as UserModel, Post as PostModel } from '@prisma/client';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  @Get('post/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    return this.postService.post({ id: Number(id) });
  }

  @Get('feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({
      where: { published: true },
    });
  }

  @Get('filtered-posts/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<PostModel[]> {
    return this.postService.posts({
      where: {
        OR: [
          {
            title: { contains: searchString },
          },
          {
            content: { contains: searchString },
          },
        ],
      },
    });
  }

  @Post('post')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.postService.createPost({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Post('user')
  async signupUser(
    @Body() userData: { name?: string; email: string },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @Put('publish/:id')
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('post/:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.deletePost({ id: Number(id) });
  }
}
```

Ce contrôleur met en œuvre les routes suivantes :

###### `GET`

- `/post/:id`: Récupèrer un seul message par son `id`.
- `/feed`: Récupèrer tous les articles _publiés
- `/filter-posts/:searchString`: Filtrer les messages par `title` ou `content`

###### `POST`

- `/post`: Créer un nouveau message
  - Corps :
    - `title: String` (obligatoire) : Le titre de l'article
    - `content: String` (facultatif) : Le contenu du message
    - `authorEmail: String` (obligatoire) : L'adresse électronique de l'utilisateur qui crée le message
- `/user`: Créer un nouvel utilisateur
  - Corps :
    - `email: String` (obligatoire) : L'adresse électronique de l'utilisateur
    - `name: String` (facultatif) : Le nom de l'utilisateur

###### `PUT`

- `/publish/:id`: Publier un message par son `id`

###### `DELETE`

- `/post/:id`: Supprimer un message par son `id`

#### Résumé

Dans cette recette, vous avez appris à utiliser Prisma avec NestJS pour implémenter une API REST. Le contrôleur qui implémente les routes de l'API appelle un `PrismaService` qui à son tour utilise Prisma Client pour envoyer des requêtes à une base de données pour répondre aux besoins de données des requêtes entrantes.

Si vous souhaitez en savoir plus sur l'utilisation de NestJS avec Prisma, n'hésitez pas à consulter les ressources suivantes (en anglais) :

- [NestJS & Prisma](https://www.prisma.io/nestjs)
- [Exemples de projets prêts à l'emploi pour REST et GraphQL](https://github.com/prisma/prisma-examples/)
- [Kit de démarrage prêt pour la production](https://github.com/notiz-dev/nestjs-prisma-starter#instructions)
- [Vidéo : Accéder aux bases de données avec NestJS et Prisma (5min)](https://www.youtube.com/watch?v=UlVJ340UEuk&ab_channel=Prisma) par [Marc Stammerjohann](https://github.com/marcjulian)
