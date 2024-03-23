### Automock

Automock est une puissante bibliothèque autonome conçue pour les tests unitaires. Elle exploite l'API TypeScript Reflection en interne pour générer des objets factices, ce qui simplifie le processus de test en simulant automatiquement les dépendances externes des classes. Automock vous permet de rationaliser le développement des tests et de vous concentrer sur l'écriture de tests unitaires robustes et efficaces.

> info **Info** `Automock` est un package tiers et n'est pas géré par l'équipe NestJS.
> Veuillez rapporter tout problème trouvé avec la bibliothèque dans le [dépôt approprié](https://github.com/automock/automock).

#### Introduction

Le conteneur d'injection de dépendances (DI) est un élément fondamental du système de modules Nest, qui fait partie intégrante des phases d'exécution et de test de l'application. Dans les tests unitaires, les dépendances factices sont essentielles pour isoler et évaluer le comportement de composants spécifiques. Cependant, la configuration et la gestion manuelles de ces objets factices peuvent s'avérer complexes et sujettes aux erreurs.

Automock offre une solution rationalisée. Plutôt que d'interagir avec le conteneur Nest DI, Automock introduit un conteneur virtuel dans lequel les dépendances sont automatiquement simulées. Cette approche permet d'éviter la tâche manuelle consistant à remplacer chaque fournisseur du conteneur DI par des implémentations fictives. Avec Automock, la génération d'objets factices pour toutes les dépendances est automatisée, ce qui simplifie le processus de configuration des tests unitaires.

#### Installation

Automock supporte à la fois Jest et Sinon. Il suffit d'installer le package approprié pour le framework de test de votre choix.
De plus, vous devez installer le paquet `@automock/adapters.nestjs` (car Automock supporte d'autres adaptateurs).

```bash
$ npm i -D @automock/jest @automock/adapters.nestjs
```

Ou pour Sinon :

```bash
$ npm i -D @automock/sinon @automock/adapters.nestjs
```

#### Exemple

L'exemple fourni ici présente l'intégration d'Automock avec Jest. Cependant, les mêmes principes et fonctionnalités s'appliquent à Sinon.

Considérons la classe `CatService` suivante qui dépend d'une classe `Database` pour récupérer des chats. Nous allons simuler la classe `Database` pour tester la classe `CatsService` de manière isolée.

```typescript
@Injectable()
export class Database {
  getCats(): Promise<Cat[]> { ... }
}

@Injectable()
class CatsService {
  constructor(private database: Database) {}

  async getAllCats(): Promise<Cat[]> {
    return this.database.getCats();
  }
}
```

Mettons en place un test unitaire pour la classe `CatsService`.

Nous allons utiliser le `TestBed` du paquet `@automock/jest` pour créer notre environnement de test.

```typescript
import { TestBed } from '@automock/jest';

describe('Cats Service Unit Test', () => {
  let catsService: CatsService;
  let database: jest.Mocked<Database>;
  
  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(CatsService).compile();

    catsService = unit;
    database = unitRef.get(Database);
  });

  it('should retrieve cats from the database', async () => {
  const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];
  database.getCats.mockResolvedValue(mockCats);

  const cats = await catsService.getAllCats();
  expect(database.getCats).toHaveBeenCalled();
  expect(cats).toEqual(mockCats);

  });
});
```

Dans l'installation de test, nous :

1. Créons un environnement de test pour `CatsService` en utilisant `TestBed.create(CatsService).compile()`.
2. Obtenons l'instance réelle de `CatsService` et une instance simulée de `Database` en utilisant `unit` et `unitRef.get(Database)`, respectivement.
3. Nous simulons la méthode `getCats` de la classe `Database` pour retourner une liste prédéfinie de chats.
4. Nous appelons ensuite la méthode `getAllCats` de `CatsService` et vérifions qu'elle interagit correctement avec la classe `Database` et retourne les chats attendus.

**Ajouter un logger**

Étendons notre exemple en ajoutant une interface `Logger` et en l'intégrant dans la classe `CatsService`.

```typescript
@Injectable()
class Logger {
  log(message: string): void { ... }
}

@Injectable()
class CatsService {
  constructor(private database: Database, private logger: Logger) {}

  async getAllCats(): Promise<Cat[]> {
    this.logger.log('Fetching all cats..');
    return this.database.getCats();
  }
}
```

Maintenant, lorsque vous mettez en place votre test, vous devez également simuler la dépendance `Logger` :

```typescript
beforeAll(() => {
  let logger: jest.Mocked<Logger>;
  const { unit, unitRef } = TestBed.create(CatsService).compile();

  catsService = unit;
  database = unitRef.get(Database);
  logger = unitRef.get(Logger);
});

it('should log a message and retrieve cats from the database', async () => {
  const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];
  database.getCats.mockResolvedValue(mockCats);

  const cats = await catsService.getAllCats();

  expect(logger.log).toHaveBeenCalledWith('Fetching all cats..');
  expect(database.getCats).toHaveBeenCalled();
  expect(cats).toEqual(mockCats);
});
```

**Utilisation de `.mock().using()` pour l'implémentation de Mock**

Automock fournit une manière plus déclarative de spécifier les implémentations simulées en utilisant la chaîne de méthodes `.mock().using()`.
Cela vous permet de définir le comportement de l'objet factice directement lors de la mise en place du `TestBed`.

Voici comment vous pouvez modifier la configuration du test pour utiliser cette approche :

```typescript
beforeAll(() => {
  const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];

  const { unit, unitRef } = TestBed.create(CatsService)
    .mock(Database)
    .using({ getCats: async () => mockCats })
    .compile();
  catsService = unit;
  database = unitRef.get(Database);
});
```

Dans cette approche, nous avons éliminé le besoin de simuler manuellement la méthode `getCats` dans le corps du test.
Au lieu de cela, nous avons défini le comportement simulé directement dans la configuration du test en utilisant `.mock().using()`.

#### Références de dépendances et accès aux instances

Quand on utilise `TestBed`, la méthode `compile()` retourne un objet avec deux propriétés importantes : `unit` et `unitRef`.
Ces propriétés permettent d'accéder à l'instance de la classe testée et aux références à ses dépendances, respectivement.

`unit` - La propriété unit représente l'instance réelle de la classe testée. Dans notre exemple, elle correspond à une instance de la classe `CatsService`. Cela vous permet d'interagir directement avec la classe et d'invoquer ses méthodes au cours de vos scénarios de test.

`unitRef` - La propriété unitRef sert de référence aux dépendances de la classe testée. Dans notre exemple, elle fait référence à la dépendance `Logger` utilisée par le `CatsService`. En accédant à `unitRef`, vous pouvez récupérer l'objet factice généré automatiquement pour la dépendance. Cela vous permet de bloquer des méthodes, de définir des comportements et d'affirmer des invocations de méthodes sur l'objet factice.

#### Travailler avec différents fournisseurs
Les fournisseurs sont l'un des éléments les plus importants de Nest. Vous pouvez considérer de nombreuses classes Nest par défaut comme des fournisseurs, y compris les services, les référentiels, les usines, les helpers, et ainsi de suite. La fonction première d'un fournisseur est de prendre la forme d'une dépendance "injectable".

Considérons le `CatsService` suivant, il prend un paramètre, qui est une instance de l'interface `Logger`. de l'interface `Logger` suivante :

```typescript
export interface Logger {
  log(message: string): void;
}

@Injectable()
export class CatsService {
  constructor(private logger: Logger) {}
}
```

L'API Reflection de TypeScript ne prend pas encore en charge la réflexion sur les interfaces.
Nest résout ce problème avec des jetons d'injection basés sur des chaînes de caractères/symboles (voir [Fournisseurs personnalisés](/fundamentals/custom-providers)) :

```typescript
export const MyLoggerProvider = {
  provide: 'LOGGER_TOKEN',
  useValue: { ... },
}

@Injectable()
export class CatsService {
  constructor(@Inject('LOGGER_TOKEN') private readonly logger: Logger) {}
}
```

Automock suit cette pratique et vous permet de fournir un jeton basé sur une chaîne de caractères (ou symboles) au lieu de fournir la classe réelle dans la méthode `unitRef.get()` :

```typescript
const { unit, unitRef } = TestBed.create(CatsService).compile();

let loggerMock: jest.Mocked<Logger> = unitRef.get('LOGGER_TOKEN');
```

#### En savoir plus

Visitez le [dépôt GitHub Automock](https://github.com/automock/automock) ou le [site d'Automock](https://automock.dev) pour plus d'informations.
