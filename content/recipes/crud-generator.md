### Générateur CRUD

Tout au long de la durée de vie d'un projet, lorsque nous développons de nouvelles fonctionnalités, nous avons souvent besoin d'ajouter de nouvelles ressources à notre application. Ces ressources nécessitent généralement des opérations multiples et répétitives que nous devons répéter à chaque fois que nous définissons une nouvelle ressource.

#### Introduction

Imaginons un scénario réel, dans lequel nous devons exposer des points de terminaison CRUD pour deux entités, disons **Utilisateur** et **Produit**.
En suivant les meilleures pratiques, pour chaque entité, nous devrions effectuer plusieurs opérations, comme suit :

- Générer un module (`nest g mo`) pour garder le code organisé et établir des limites claires (regrouper les composants liés)
- Générer un contrôleur (`nest g co`) pour définir les routes CRUD (ou les requêtes/mutations pour les applications GraphQL)
- Générer un service (`nest g s`) pour implémenter et isoler la logique métier
- Générer une classe/interface d'entité pour représenter la forme des données de la ressource
- Générer des objets de transfert de données (ou des entrées pour les applications GraphQL) pour définir comment les données seront envoyées sur le réseau.

Cela fait beaucoup d'étapes !

Pour accélérer ce processus répétitif, la [CLI Nest](/cli/overview) fournit un générateur (schéma) qui génère automatiquement tout le code de base pour nous aider à éviter de faire tout cela, et rendre l'expérience du développeur beaucoup plus simple.

> info **Note** Le schéma permet de générer des contrôleurs **HTTP**, des contrôleurs **Microservice**, des résolveurs **GraphQL** (à la fois code first et schéma first) et des gateways **WebSocket**.

#### Générer une nouvelle ressource

Pour créer une nouvelle ressource, il suffit d'exécuter la commande suivante dans le répertoire racine de votre projet :

```shell
$ nest g resource
```

La commande `nest g resource` génère non seulement tous les blocs de construction de NestJS (classes de module, de service, de contrôleur) mais aussi une classe d'entité, des classes DTO ainsi que les fichiers de test (`.spec`).

Vous pouvez voir ci-dessous le fichier de contrôleur généré (pour l'API REST) :

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
```

En outre, il crée automatiquement des espaces réservés pour tous les points de terminaison CRUD (routes pour les API REST, requêtes et mutations pour GraphQL, abonnements aux messages pour les passerelles Microservices et WebSocket) - le tout sans avoir à lever le petit doigt.

> warning **Note** Les classes de service générées ne sont **pas** liées à un **ORM (ou à une source de données)** spécifique. Le générateur est donc suffisamment générique pour répondre aux besoins de n'importe quel projet. Par défaut, toutes les méthodes contiennent des espaces réservés, ce qui vous permet de les remplir avec les sources de données spécifiques à votre projet.

De même, si vous souhaitez générer des résolveurs pour une application GraphQL, sélectionnez simplement `GraphQL (code first)` (ou `GraphQL (schema first)`) comme couche de transport.

Dans ce cas, NestJS générera une classe de résolveur au lieu d'un contrôleur d'API REST :

```shell
$ nest g resource users

> ? What transport layer do you use? GraphQL (code first)
> ? Would you like to generate CRUD entry points? Yes
> CREATE src/users/users.module.ts (224 bytes)
> CREATE src/users/users.resolver.spec.ts (525 bytes)
> CREATE src/users/users.resolver.ts (1109 bytes)
> CREATE src/users/users.service.spec.ts (453 bytes)
> CREATE src/users/users.service.ts (625 bytes)
> CREATE src/users/dto/create-user.input.ts (195 bytes)
> CREATE src/users/dto/update-user.input.ts (281 bytes)
> CREATE src/users/entities/user.entity.ts (187 bytes)
> UPDATE src/app.module.ts (312 bytes)
```

> info **Astuce** Pour éviter de générer des fichiers de test, vous pouvez passer l'option `--no-spec`, comme suit : `nest g resource users --no-spec`

Nous pouvons voir ci-dessous que non seulement toutes les mutations et les requêtes ont été créées, mais que tout est lié. Nous utilisons le `UsersService`, l'entité `User` et nos DTO.

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }
}
```
