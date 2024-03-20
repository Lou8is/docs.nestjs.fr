### Contrôles de santé (Terminus)

L'intégration de Terminus vous fournit des contrôles de santé **readiness/liveness**. Les contrôles de santé sont cruciaux lorsqu'il s'agit de configurations backend complexes. En bref, un contrôle de santé dans le domaine du développement web consiste généralement en une adresse spéciale, par exemple, `https://my-website.com/health/readiness`.
Un service ou un composant de votre infrastructure (par exemple, Kubernetes) vérifie cette adresse en permanence. En fonction du code d'état HTTP renvoyé par une requête `GET` à cette adresse, le service prendra des mesures lorsqu'il recevra une réponse "malsaine".
Étant donné que la définition de "sain" ou "malsain" varie selon le type de service que vous fournissez, l'intégration **Terminus** vous aide avec un ensemble d'**indicateurs de santé**.

Par exemple, si votre serveur web utilise MongoDB pour stocker ses données, il serait vital de savoir si MongoDB est toujours opérationnel. Dans ce cas, vous pouvez utiliser le `MongooseHealthIndicator`. Si elle est configurée correctement - nous y reviendrons plus tard - votre adresse de contrôle de santé renverra un code de statut HTTP sain ou malsain, selon que MongoDB est en cours d'exécution ou non.

#### Pour commencer

Pour commencer avec `@nestjs/terminus`, nous devons installer les dépendances nécessaires.

```bash
$ npm install --save @nestjs/terminus
```

#### Mise en place d'un contrôle de santé

Un contrôle de santé représente un résumé des **indicateurs de santé**. Un indicateur de santé exécute un contrôle d'un service, pour savoir s'il est dans un état sain ou malsain. Un contrôle de santé est positif si tous les indicateurs de santé assignés sont opérationnels. Parce que beaucoup d'applications auront besoin d'indicateurs de santé similaires, [`@nestjs/terminus`](https://github.com/nestjs/terminus) fournit un ensemble d'indicateurs prédéfinis, tels que :

- `HttpHealthIndicator`
- `TypeOrmHealthIndicator`
- `MongooseHealthIndicator`
- `SequelizeHealthIndicator`
- `MikroOrmHealthIndicator`
- `PrismaHealthIndicator`
- `MicroserviceHealthIndicator`
- `GRPCHealthIndicator`
- `MemoryHealthIndicator`
- `DiskHealthIndicator`

Pour commencer notre premier contrôle de santé, créons le module `HealthModule` et importons-y le module `TerminusModule` dans son tableau d'importations.

> info **Astuce** Pour créer le module à l'aide de la [CLI Nest](cli/overview), il suffit d'exécuter la commande `$ nest g module health`.

```typescript
@@filename(health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule]
})
export class HealthModule {}
```

Nos contrôles de santé peuvent être exécutés à l'aide d'un [contrôleur](/controllers), qui peut être facilement configuré à l'aide du [Nest CLI](cli/overview).

```bash
$ nest g controller health
```

> info **Info** Il est fortement recommandé d'activer les hooks d'arrêt dans votre application. L'intégration Terminus utilise cet événement du cycle de vie s'il est activé. Pour en savoir plus sur les hooks d'arrêt [ici](fundamentals/lifecycle-events#arrêt-de-lapplication).

#### Contrôle de santé HTTP

Une fois que nous avons installé `@nestjs/terminus`, importé notre `TerminusModule` et créé un nouveau contrôleur, nous sommes prêts à créer un contrôle de santé.

Le `HTTPHealthIndicator` nécessite le paquetage `@nestjs/axios`, assurez-vous donc de l'avoir installé :

```bash
$ npm i --save @nestjs/axios axios
```

Nous pouvons maintenant configurer notre `HealthController`:

```typescript
@@filename(health.controller)
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }
}
@@switch
import { Controller, Dependencies, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
@Dependencies(HealthCheckService, HttpHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private http,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ])
  }
}
```

```typescript
@@filename(health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
@@switch
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

Notre contrôle de santé va maintenant envoyer une requête _GET_ à l'adresse `https://docs.nestjs.com`. Si nous obtenons une réponse saine de cette adresse, notre route à `http://localhost:3000/health` retournera l'objet suivant avec un code de statut 200.

```json
{
  "status": "ok",
  "info": {
    "nestjs-docs": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "nestjs-docs": {
      "status": "up"
    }
  }
}
```

L'interface de cet objet de réponse est accessible depuis le paquet `@nestjs/terminus` avec l'interface `HealthCheckResult`.

|           |                                                                                                                                                                                                 |                                      |
|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------|
| `status`  | Si un indicateur de santé a échoué, le statut sera `'error'`. Si l'application NestJS s'arrête mais accepte toujours des requêtes HTTP, le contrôle de santé aura le statut `'shutting_down'`.  | `'error' \| 'ok' \| 'shutting_down'` |
| `info`    | Objet contenant des informations sur chaque indicateur de santé dont l'état est `'up'`, c'est-à-dire " sain ".                                                                                  | `object`                             |
| `error`   | Objet contenant des informations sur chaque indicateur de santé dont l'état est `'down'`, c'est-à-dire "malsain".                                                                               | `object`                             |
| `details` | Objet contenant toutes les informations relatives à chaque indicateur de santé                                                                                                                  | `object`                             |

##### Contrôle de codes de réponse HTTP spécifiques

Dans certains cas, vous pouvez vouloir contrôler des critères spécifiques et valider la réponse. Par exemple, supposons que `https://my-external-service.com` renvoie un code de réponse `204`. Avec `HttpHealthIndicator.responseCheck`, vous pouvez contrôler ce code de réponse spécifiquement et déterminer que tous les autres codes sont malsains.

Dans le cas où un autre code de réponse que `204` est retourné, l'exemple suivant serait malsain. Le troisième paramètre vous demande de fournir une fonction (sync ou async) qui retourne un booléen indiquant si la réponse est considérée comme saine (`true`) ou malsaine (`false`).


```typescript
@@filename(health.controller)
// Dans la classe `HealthController` (contrôleur de santé)

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () =>
      this.http.responseCheck(
        'my-external-service',
        'https://my-external-service.com',
        (res) => res.status === 204,
      ),
  ]);
}
```


#### Indicateur de santé TypeOrm

Terminus offre la possibilité d'ajouter des contrôles de base de données à votre contrôle de santé. Pour commencer à utiliser cet indicateur de santé, vous devez
Pour commencer à utiliser cet indicateur de santé, vous devriez lire le [chapitre Base de données](/techniques/sql) et vous assurer que la connexion à la base de données de votre application est bien établie.

> info **Astuce** Dans les coulisses, le `TypeOrmHealthIndicator` exécute simplement une commande SQL `SELECT 1` qui est souvent utilisée pour vérifier si la base de données est toujours vivante. Dans le cas où vous utilisez une base de données Oracle, il utilise `SELECT 1 FROM DUAL`.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, TypeOrmHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private db,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ])
  }
}
```

Si votre base de données est accessible, vous devriez maintenant voir le résultat JSON suivant lorsque vous demandez `http://localhost:3000/health` avec une requête `GET` :

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

Si votre application utilise [plusieurs bases de données](techniques/database#bases-de-données-multiples), vous devez injecter chaque connexion dans votre `HealthController`. dans votre `HealthController`. Ensuite, vous pouvez simplement passer la référence de la connexion au `TypeOrmHealthIndicator`.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @InjectConnection('albumsConnection')
    private albumsConnection: Connection,
    @InjectConnection()
    private defaultConnection: Connection,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('albums-database', { connection: this.albumsConnection }),
      () => this.db.pingCheck('database', { connection: this.defaultConnection }),
    ]);
  }
}
```


#### Indicateur de santé du disque

Avec le `DiskHealthIndicator` nous pouvons contrôler la quantité de stockage utilisée. Pour commencer, assurez-vous d'injecter le `DiskHealthIndicator` dans votre `HealthController`. L'exemple suivant contrôle le stockage utilisé du chemin `/` (ou sous Windows vous pouvez utiliser `C:\N-). Si cela dépasse plus de 50% de l'espace de stockage total, il répondra avec un bilan de santé malsain.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, DiskHealthIndicator)
export class HealthController {
  constructor(health, disk) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ])
  }
}
```

Avec la fonction `DiskHealthIndicator.checkStorage` vous avez aussi la possibilité de contrôler une quantité fixe d'espace. L'exemple suivant serait malsain dans le cas où le chemin `/my-app/` dépasserait 250GB.

```typescript
@@filename(health.controller)
// Dans la classe `HealthController` (contrôleur de santé)

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.disk.checkStorage('storage', {  path: '/', threshold: 250 * 1024 * 1024 * 1024, })
  ]);
}
```

#### Indicateur de santé de la mémoire

Pour s'assurer que votre processus ne dépasse pas une certaine limite de mémoire, le `MemoryHealthIndicator` peut être utilisé. 
L'exemple suivant peut être utilisé pour contrôler le volume de mémoire de votre processus.

> info **Astuce** Le heap est la partie de la mémoire où réside la mémoire allouée dynamiquement (c'est-à-dire la mémoire allouée via malloc). La mémoire allouée à partir du heap restera allouée jusqu'à ce que l'une des situations suivantes se produise :
> - La mémoire est _free_ (libérée)
> - Le programme se termine

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, MemoryHealthIndicator)
export class HealthController {
  constructor(health, memory) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ])
  }
}
```

Il est également possible de vérifier le RSS mémoire de votre processus avec `MemoryHealthIndicator.checkRSS`. Cet exemple renverrait un code de réponse malsain dans le cas où votre processus aurait plus de 150MB alloués.

> info **Astuce** RSS est la taille de l'ensemble résident (Resident Set Size) et sert à indiquer la quantité de mémoire allouée à ce processus et se trouvant dans la RAM.
> Elle n'inclut pas la mémoire qui est échangée. Elle inclut la mémoire des bibliothèques partagées tant que les pages de ces bibliothèques sont effectivement en mémoire. Elle inclut toute la mémoire de la pile et du tas (heap).


```typescript
@@filename(health.controller)
// Dans la classe `HealthController` (contrôleur de santé)

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
  ]);
}
```


#### Indicateur de santé personnalisé

Dans certains cas, les indicateurs de santé prédéfinis fournis par `@nestjs/terminus` ne couvrent pas tous vos besoins en matière de contrôle de santé. Dans ce cas, vous pouvez configurer un indicateur de santé personnalisé en fonction de vos besoins.

Commençons par créer un service qui représentera notre indicateur personnalisé. Pour comprendre comment un indicateur est structuré, nous allons créer un exemple `DogHealthIndicator`. Ce service devrait avoir l'état `'up'` si chaque objet `Dog` a le type `'goodboy'`. Si cette condition n'est pas remplie, il doit générer une erreur.

```typescript
@@filename(dog.health)
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

export interface Dog {
  name: string;
  type: string;
}

@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  private dogs: Dog[] = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;
    const result = this.getStatus(key, isHealthy, { badboys: badboys.length });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('Dogcheck failed', result);
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { HealthCheckError } from '@godaddy/terminus';

@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  dogs = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key) {
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;
    const result = this.getStatus(key, isHealthy, { badboys: badboys.length });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('Dogcheck failed', result);
  }
}
```

La prochaine chose à faire est d'enregistrer l'indicateur de santé en tant que fournisseur.

```typescript
@@filename(health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DogHealthIndicator } from './dog.health';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [DogHealthIndicator]
})
export class HealthModule { }
```

> info **Astuce** Dans une application réelle, le `DogHealthIndicator` devrait être fourni dans un module séparé, par exemple, `DogModule`, qui sera ensuite importé par le `HealthModule`.

La dernière étape nécessaire est d'ajouter l'indicateur de santé maintenant disponible dans le point de terminaison de contrôle de santé requis. Pour cela, nous retournons dans notre `HealthController` et l'ajoutons à notre fonction `check`.

```typescript
@@filename(health.controller)
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Injectable, Dependencies, Get } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private dogHealthIndicator: DogHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
@@switch
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Injectable, Get } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
@Dependencies(HealthCheckService, DogHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private dogHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
```

#### Journalisation

Terminus ne consigne que les messages d'erreur, par exemple lorsqu'un Healthcheck a échoué. Avec la méthode `TerminusModule.forRoot()` vous avez plus de contrôle sur la façon dont les erreurs sont enregistrées et vous pouvez aussi prendre complètement en charge la journalisation elle-même.

Dans cette section, nous allons vous expliquer comment créer un logger personnalisé `TerminusLogger`. Ce logger étend le logger intégré.
Vous pouvez donc choisir la partie du logger que vous souhaitez écraser.

> info **Info** Si vous souhaitez en savoir plus sur les loggers personnalisés dans NestJS, vous pouvez [en lire plus ici](/techniques/logger#injection-dun-logger-personnalisé).


```typescript
@@filename(terminus-logger.service)
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class TerminusLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: any[]): void;
  error(
    message: unknown,
    stack?: unknown,
    context?: unknown,
    ...rest: unknown[]
  ): void {
    // Remplacer ici la façon dont les messages d'erreur doivent être enregistrés
  }
}
```

Une fois que vous avez créé votre logger personnalisé, tout ce que vous avez à faire est de le passer dans le `TerminusModule.forRoot()` comme tel.

```typescript
@@filename(health.module)
@Module({
imports: [
  TerminusModule.forRoot({
    logger: TerminusLogger,
  }),
],
})
export class HealthModule {}
```

Pour supprimer complètement les messages de journal provenant de Terminus, y compris les messages d'erreur, configurez Terminus comme tel.

```typescript
@@filename(health.module)
@Module({
imports: [
  TerminusModule.forRoot({
    logger: false,
  }),
],
})
export class HealthModule {}
```

Terminus vous permet de configurer l'affichage des erreurs de Healthcheck dans vos journaux.

| Style du journal d'erreurs | Description                                                                                                                                       | Example                                                              |
|:---------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------|
| `json`  (par défaut)       | Affiche un résumé du résultat du contrôle de santé en cas d'erreur sous la forme d'un objet JSON.                                                 | <figure><img src="/assets/Terminus_Error_Log_Json.png" /></figure>   |
| `pretty`                   | Affiche un résumé du résultat du contrôle de santé en cas d'erreur dans des cases formatées et met en évidence les résultats positifs ou erronés. | <figure><img src="/assets/Terminus_Error_Log_Pretty.png" /></figure> |

Vous pouvez changer le style du journal en utilisant l'option de configuration `errorLogStyle` comme dans l'extrait suivant.

```typescript
@@filename(health.module)
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
  ]
})
export class HealthModule {}
```

#### Délai d'arrêt en douceur

Si votre application nécessite de reporter son processus d'arrêt, Terminus peut s'en charger pour vous.
Ce paramètre peut s'avérer particulièrement bénéfique lorsque vous travaillez avec un orchestrateur tel que Kubernetes.
En définissant un délai légèrement plus long que l'intervalle de contrôle de l'état de préparation, vous pouvez obtenir un temps d'arrêt nul lors de l'arrêt des conteneurs.

```typescript
@@filename(health.module)
@Module({
  imports: [
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 1000,
    }),
  ]
})
export class HealthModule {}
```

#### Plus d'exemples

D'autres exemples pratiques sont disponibles [ici](https://github.com/nestjs/terminus/tree/master/sample).
