### Automock

Automock est une bibliothèque autonome pour les tests unitaires. En utilisant l'API TypeScript Reflection
TypeScript (`reflect-metadata`) pour produire des objets fictifs, Automock rationalise le
développement des tests en simulant automatiquement les dépendances externes des classes.
> info **Info** `Automock` est un package tiers et n'est pas géré par l'équipe NestJS.
> Veuillez rapporter tout problème trouvé avec la bibliothèque dans le [dépôt approprié](https://github.com/omermorad/automock).

#### Introduction

Le conteneur d'injection de dépendances (DI) est un composant essentiel du système de modules Nest.
Ce conteneur est utilisé à la fois pendant les tests et pendant l'exécution de l'application.
Les tests unitaires diffèrent des autres types de tests, tels que les tests d'intégration, en ce sens qu'ils doivent surcharger entièrement les fournisseurs/services dans le conteneur DI. Les dépendances de classes externes (fournisseurs) de ce que l'on appelle l'"unité" doivent être totalement isolées. En d'autres termes, toutes les dépendances dans le conteneur DI doivent être remplacées par des objets fictifs.
Par conséquent, le chargement du module cible et le remplacement des fournisseurs à l'intérieur de celui-ci est un processus qui se répète en boucle. Automock s'attaque à ce problème en simulant automatiquement tous les fournisseurs externes de la classe ce qui permet d'isoler totalement l'unité testée.

#### Installation

```bash
$ npm i -D @automock/jest
```

Automock ne nécessite aucune installation supplémentaire.

> info **Info** Jest est le seul framework de test actuellement pris en charge par Automock.
"Sinon" sera bientôt disponible.

#### Exemple

Considérons le service `cats` suivant, qui prend trois paramètres de construction :

```ts
@@filename(cats.service)
import { Injectable } from '@nestjs/core';

@Injectable()
export class CatsService {
  constructor(
    private logger: Logger,
    private httpService: HttpService,
    private catsDal: CatsDal,
  ) {}

  async getAllCats() {
    const cats = await this.httpService.get('http://localhost:3000/api/cats');
    this.logger.log('Tous les chats ont été récupérés avec succès');
    
    this.catsDal.saveCats(cats);
  }
}
```

Le service contient une méthode publique, `getAllCats`, qui est la méthode
que nous utilisons comme exemple pour le test unitaire suivant :

```ts
@@filename(cats.service.spec)
import { TestBed } from '@automock/jest';
import { CatsService } from './cats.service';

describe('CatsService unit spec', () => {
  let underTest: CatsService;
  let logger: jest.Mocked<Logger>;
  let httpService: jest.Mocked<HttpService>;
  let catsDal: jest.Mocked<CatsDal>;
  
  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(CatsService)
      .mock(HttpService)
      .using({ get: jest.fn() })
      .mock(Logger)
      .using({ log: jest.fn() })
      .mock(CatsDal)
      .using({ saveCats: jest.fn() })
      .compile();

    underTest = unit;

    logger = unitRef.get(Logger);
    httpService = unitRef.get(HttpService);
    catsDal = unitRef.get(CatsDal);
  });

  describe('lors de l\'obtention de tous les chats', () => {
    test('répondre à certaines attentes', async () => {
      httpService.get.mockResolvedValueOnce([{ id: 1, name: 'Catty' }]);
      await catsService.getAllCats();

      expect(logger.log).toBeCalled();
      expect(catsDal).toBeCalledWith([{ id: 1, name: 'Catty' }]);
    });
  });
});
```

> info **Info** L'utilitaire jest.Mocked<Source> renvoie le type Source
> enveloppée avec les définitions de type de la fonction Jest mock. ([référence](https://jestjs.io/docs/mock-function-api/#jestmockedsource))

#### À propos de `unit` et `unitRef`

Examinons le code suivant :

```typescript
const { unit, unitRef } = TestBed.create(CatsService).compile();
```

L'appel à `.compile()` renvoie un objet avec deux propriétés, `unit`, et `unitRef`.

**`unit`** est l'unité testée, c'est une instance réelle de la classe testée.

**`unitRef`** est la "référence de l'unité", où les dépendances simulées de la classe testée sont stockées dans un petit conteneur. La méthode `.get()` du conteneur renvoie la dépendance simulée avec toutes ses méthodes automatiquement mises en attente (en utilisant `jest.fn()`) :

```typescript
const { unit, unitRef } = TestBed.create(CatsService).compile();

let httpServiceMock: jest.Mocked<HttpService> = unitRef.get(HttpService);
```

> info **Info** La méthode `.get()` peut accepter comme argument une `chaîne` ou une classe réelle (`Type`).
> Cela dépend essentiellement de la manière dont le fournisseur est injecté dans la classe testée.

#### Travailler avec différents fournisseurs
Les fournisseurs sont l'un des éléments les plus importants de Nest. Vous pouvez considérer de nombreuses classes Nest par défaut comme des fournisseurs, y compris les services, les référentiels, les usines, les helpers, et ainsi de suite. La fonction première d'un fournisseur est de prendre la forme d'une dépendance "injectable".

Considérons le `CatsService` suivant, il prend un paramètre, qui est une instance de l'interface `Logger`. de l'interface `Logger` suivante :

```typescript
export interface Logger {
  log(message: string): void;
}

export class CatsService {
  constructor(private logger: Logger) {}
}
```

L'API Reflection de TypeScript ne prend pas encore en charge la réflexion sur les interfaces.
Nest résout ce problème avec des jetons d'injection basés sur des chaînes de caractères (voir [Fournisseurs personnalisés](/fundamentals/custom-providers)) :

```typescript
export const MyLoggerProvider = {
  provide: 'MY_LOGGER_TOKEN',
  useValue: { ... },
}

export class CatsService {
  constructor(@Inject('MY_LOGGER_TOKEN') private readonly logger: Logger) {}
}
```

Automock suit cette pratique et vous permet de fournir un jeton basé sur une chaîne de caractères au lieu de fournir la classe réelle dans la méthode `unitRef.get()` :

```typescript
const { unit, unitRef } = TestBed.create(CatsService).compile();

let loggerMock: jest.Mocked<Logger> = unitRef.get('MY_LOGGER_TOKEN');
```

#### En savoir plus

Visitez le [dépôt GitHub Automock](https://github.com/omermorad/automock) pour plus d'informations.
