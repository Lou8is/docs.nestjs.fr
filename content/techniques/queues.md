### Files d'attente

Les files d'attente sont un puissant modèle de conception qui vous aide à relever les défis courants en matière de mise à l'échelle et de performance des applications. Voici quelques exemples de problèmes que les files d'attente peuvent vous aider à résoudre :

- Lisser les pics de traitement. Par exemple, si les utilisateurs peuvent lancer des tâches gourmandes en ressources à des moments arbitraires, vous pouvez ajouter ces tâches à une file d'attente au lieu de les exécuter de manière synchrone. Vous pouvez ensuite demander aux processus de travail d'extraire les tâches de la file d'attente de manière contrôlée. Vous pouvez facilement ajouter de nouveaux consommateurs de file d'attente pour augmenter la gestion des tâches en arrière-plan au fur et à mesure que l'application évolue.
- Décomposer les tâches monolithiques qui risquent de bloquer la boucle événementielle de Node.js. Par exemple, si une demande d'utilisateur nécessite un travail intensif au niveau du processeur, comme le transcodage audio, vous pouvez déléguer cette tâche à d'autres processus, libérant ainsi les processus orientés vers l'utilisateur pour qu'ils restent réactifs.
- Fournir un canal de communication fiable entre les différents services. Par exemple, vous pouvez mettre en file d'attente des tâches (jobs) dans un processus ou un service, et les consommer dans un autre. Vous pouvez être informé (en écoutant les événements d'état) de l'achèvement, de l'erreur ou d'autres changements d'état dans le cycle de vie du travail à partir de n'importe quel processus ou service. Lorsque les producteurs ou les consommateurs de la file d'attente tombent en panne, leur état est préservé et le traitement des tâches peut reprendre automatiquement lorsque les nœuds sont redémarrés.

Nest fournit le package `@nestjs/bullmq` pour l'intégration de BullMQ et le package `@nestjs/bull` pour l'intégration de Bull. Les deux packages sont des abstractions/wrappers au-dessus de leurs bibliothèques respectives, qui ont été développées par la même équipe. Bull est actuellement en mode maintenance, l'équipe se concentrant sur la correction des bugs, tandis que BullMQ est activement développé, avec une implémentation TypeScript moderne et un ensemble différent de fonctionnalités. Si Bull répond à vos besoins, il reste un choix fiable et éprouvé. Les packages Nest permettent d'intégrer facilement BullMQ ou Bull Queues dans votre application Nest.

Both BullMQ and Bull utilise [Redis](https://redis.io/) pour conserver les données des travaux, vous devez donc avoir installé Redis sur votre système. Parce qu'ils sont soutenus par Redis, votre architecture de file d'attente peut être complètement distribuée et indépendante de la plate-forme. Par exemple, certains <a href="techniques/queues#producteurs">producteurs</a>, <a href="techniques/queues#consommateurs">consommateurs</a> et <a href="techniques/queues#auditeurs">auditeurs</a> de files d'attente peuvent être exécutés dans Nest sur un (ou plusieurs) nœuds, et d'autres producteurs, consommateurs et auditeurs peuvent être exécutés sur d'autres plates-formes Node.js sur d'autres nœuds du réseau.

Ce chapitre couvre les packages `@nestjs/bullmq` et `@nestjs/bull`. Nous recommandons également la lecture des documentations [BullMQ](https://docs.bullmq.io/) et [Bull](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md) pour plus de détails sur le contexte et l'implémentation.

#### Installation BullMQ

Pour commencer à utiliser BullMQ, nous devons d'abord installer les dépendances nécessaires.

```bash
$ npm install --save @nestjs/bullmq bullmq
```

Une fois le processus d'installation terminé, nous pouvons importer le `BullModule` dans la racine `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

La méthode `forRoot()` est utilisée pour enregistrer un objet de configuration du paquet `bullmq` qui sera utilisé par toutes les files d'attente enregistrées dans l'application (sauf indication contraire). Pour votre référence, voici quelques-unes des propriétés d'un objet de configuration :

- `connection : ConnectionOptions` - Options pour configurer la connexion Redis. Voir [Connections](https://docs.bullmq.io/guide/connections) pour plus d'informations. Optionnel.
- `prefix : string` - Préfixe pour toutes les clés de file d'attente. Facultatif.
- `defaultJobOptions : JobOpts` - Options pour contrôler les paramètres par défaut des nouveaux travaux. Voir [JobOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd) pour plus d'informations. Facultatif.
- `settings : AdvancedSettings` - Paramètres de configuration avancée de la file d'attente. Ces paramètres ne doivent généralement pas être modifiés. Voir [AdvancedSettings](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) pour plus d'informations. Facultatif.

Toutes les options sont optionnelles, fournissant un contrôle détaillé sur le comportement de la file d'attente. Elles sont passées directement au constructeur de BullMQ `Queue`. Pour en savoir plus sur ces options et d'autres [ici](https://api.docs.bullmq.io/interfaces/v4.QueueOptions.html).

Pour enregistrer une file d'attente, importez le module dynamique `BullModule.registerQueue()` comme suit :

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **Astuce** Créez plusieurs files d'attente en passant plusieurs objets de configuration séparés par des virgules à la méthode `registerQueue()`.

La méthode `registerQueue()` est utilisée pour instancier et/ou enregistrer des files d'attente. Les files d'attente sont partagées entre les modules et les processus qui se connectent à la même base de données Redis sous-jacente avec les mêmes informations d'identification. Chaque file d'attente est unique par sa propriété name. Le nom d'une file d'attente est utilisé à la fois comme jeton d'injection (pour injecter la file d'attente dans les contrôleurs/fournisseurs) et comme argument pour les décorateurs afin d'associer les classes de consommateurs et les auditeurs aux files d'attente.

Vous pouvez également remplacer certaines des options préconfigurées pour une file d'attente spécifique, comme suit :

```typescript
BullModule.registerQueue({
  name: 'audio',
  connection: {
    port: 6380,
  },
});
```

BullMQ prend également en charge les relations parent-enfant entre les tâches. Cette fonctionnalité permet de créer des flux où les tâches sont les nœuds d'arbres de profondeur arbitraire. Pour en savoir plus, consultez [ici](https://docs.bullmq.io/guide/flows).

Pour ajouter un flux, vous pouvez procéder comme suit :

```typescript
BullModule.registerFlowProducer({
  name: 'flowProducerName',
});
```

Puisque les travaux sont conservés dans Redis, chaque fois qu'une file d'attente spécifique est instanciée (par exemple, lorsqu'une application est démarrée/redémarrée), elle tente de traiter tous les anciens travaux qui peuvent exister à partir d'une session précédente inachevée.

Chaque file d'attente peut avoir un ou plusieurs producteurs, consommateurs et auditeurs. Les consommateurs récupèrent les travaux de la file d'attente dans un ordre spécifique : FIFO (par défaut), LIFO ou selon les priorités. Le contrôle de l'ordre de traitement des files d'attente est abordé <a href="techniques/queues#consommateurs">ici</a>.

<app-banner-enterprise></app-banner-enterprise>

#### Configurations nommées

Si vos files d'attente se connectent à plusieurs instances Redis différentes, vous pouvez utiliser une technique appelée **configurations nommées**. Cette fonctionnalité vous permet d'enregistrer plusieurs configurations sous des clés spécifiques, auxquelles vous pouvez ensuite vous référer dans les options de la file d'attente.

Par exemple, en supposant que vous ayez une instance Redis supplémentaire (en plus de celle par défaut) utilisée par quelques files d'attente enregistrées dans votre application, vous pouvez enregistrer sa configuration comme suit :

```typescript
BullModule.forRoot('alternative-config', {
  connection: {
    port: 6381,
  },
});
```

Dans l'exemple ci-dessus, `'alternative-config'` est juste une clé de configuration (elle peut être n'importe quelle chaîne arbitraire).

Avec ceci en place, vous pouvez maintenant pointer vers cette configuration dans l'objet d'options `registerQueue()` :

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### Producteurs

Les producteurs de travaux ajoutent des travaux aux files d'attente. Les producteurs sont généralement des services d'application (Nest [providers](/providers)). Pour ajouter des travaux à une file d'attente, il faut d'abord injecter la file d'attente dans le service comme suit :

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **Astuce** Le décorateur `@InjectQueue()` identifie la file d'attente par son nom, tel qu'il est fourni dans l'appel à la méthode `registerQueue()` (par exemple, `'audio'`).

Maintenant, ajoutez un travail en appelant la méthode `add()` de la file d'attente, en passant un objet de travail défini par l'utilisateur. Les travaux sont représentés comme des objets JavaScript sérialisables (puisque c'est ainsi qu'ils sont stockés dans la base de données Redis). La forme du job que vous passez est arbitraire ; utilisez-la pour représenter la sémantique de votre objet job. Vous devez également lui donner un nom. Cela vous permet de créer des <a href="techniques/queues#consommateurs">consommateurs</a> spécialisés qui ne traiteront que les travaux portant un nom donné.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

#### Options de tâches

Les tâches peuvent être associées à des options supplémentaires. Passez un objet options après l'argument `job` dans la méthode `Queue.add()`. Voici quelques-unes des propriétés des options du travail :

- `priority` : `number` - Valeur de priorité optionnelle. Elle va de 1 (priorité la plus élevée) à MAX_INT (priorité la plus basse). Notez que l'utilisation des priorités a un léger impact sur les performances, donc utilisez-les avec précaution.
- `delay` : `number` - Temps d'attente (en millisecondes) avant que ce travail puisse être traité. Notez que pour des délais précis, le serveur et les clients doivent avoir leurs horloges synchronisées.
- `attempts` : `number` - Le nombre total de tentatives pour essayer le travail jusqu'à ce qu'il se termine.
- `repeat` : `RepeatOpts` - Répéter le travail selon une spécification cron. Voir [RepeatOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `backoff` : `number | BackoffOpts` - Paramètre de backoff pour les tentatives automatiques en cas d'échec du travail. Voir [BackoffOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `lifo` : `boolean` - Si true, ajoute le job à l'extrémité droite de la file d'attente au lieu de l'extrémité gauche (default false).
- `jobId` : `number` | `string` - Surcharge l'ID du travail - par défaut, l'ID du travail est un entier unique, mais vous pouvez utiliser ce paramètre pour le surcharger. Si vous utilisez cette option, c'est à vous de vous assurer que l'ID du travail est unique. Si vous essayez d'ajouter un travail avec un identifiant qui existe déjà, il ne sera pas ajouté.
- `removeOnComplete` : `boolean | number` - Si true, supprime le job lorsqu'il se termine avec succès. Un nombre spécifie le nombre de travaux à conserver. Le comportement par défaut est de conserver le travail dans l'ensemble des travaux terminés.
- `removeOnFail` : `boolean | number` - Si true, supprime le travail lorsqu'il échoue après toutes les tentatives. Un nombre spécifie le nombre de travaux à conserver. Le comportement par défaut est de conserver le travail dans l'ensemble des échecs.
- `stackTraceLimit` : `number` - Limite le nombre de lignes de trace de pile qui seront enregistrées dans la trace de pile.

Voici quelques exemples de personnalisation des tâches avec les options de tâches.

Pour retarder le démarrage d'un job, utilisez la propriété de configuration `delay`.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3 seconds delayed
);
```

Pour ajouter un travail à l'extrémité droite de la file d'attente (traiter le travail comme **LIFO** (Last In First Out)), définissez la propriété `lifo` de l'objet de configuration à `true`.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

Pour classer un travail par ordre de priorité, utilisez la propriété `priority`.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

Pour une liste complète des options, consultez la documentation de l'API [ici](https://api.docs.bullmq.io/types/v4.JobsOptions.html) et [ici](https://api.docs.bullmq.io/interfaces/v4.BaseJobOptions.html).

#### Consommateurs

Un consommateur est une **classe** définissant des méthodes qui traitent les travaux ajoutés à la file d'attente, ou qui écoutent les événements de la file d'attente, ou les deux. Déclarez une classe de consommateur en utilisant le décorateur `@Processor()` comme suit :

```typescript
import { Processor } from '@nestjs/bullmq';

@Processor('audio')
export class AudioConsumer {}
```

> info **Astuce** Les consommateurs doivent être enregistrés en tant que `providers` pour que le paquet `@nestjs/bullmq` puisse les récupérer.

Où l'argument chaîne du décorateur (par exemple, `'audio'`) est le nom de la file d'attente à associer aux méthodes de la classe.

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    let progress = 0;
    for (i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.progress(progress);
    }
    return {};
  }
}
```

La méthode process est appelée chaque fois que le worker est inactif et qu'il y a des travaux à traiter dans la file d'attente. Cette méthode de traitement reçoit l'objet `job` comme seul argument. La valeur retournée par la méthode handler est stockée dans l'objet job et peut être accédée ultérieurement, par exemple dans un écouteur pour l'événement completed.

Les objets `Job` ont plusieurs méthodes qui vous permettent d'interagir avec leur état. Par exemple, le code ci-dessus utilise la méthode `progress()` pour mettre à jour la progression du travail. Voir [ici](https://api.docs.bullmq.io/classes/v4.Job.html) pour la référence complète de l'API de l'objet `Job`.

Dans l'ancienne version, Bull, vous pouviez indiquer qu'une méthode de gestion des jobs ne traiterait que les jobs d'un certain type (les jobs avec un `nom` spécifique) en passant ce `nom` au décorateur `@Process()` comme indiqué ci-dessous.

> warning **Attention** Cela ne fonctionne pas avec BullMQ, continuez à lire.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

Ce comportement n'est pas supporté par BullMQ en raison des confusions qu'il génère. Au lieu de cela, vous avez besoin de switch cases pour appeler différents services ou logiques pour chaque nom de job :

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'transcode': {
        let progress = 0;
        for (i = 0; i < 100; i++) {
          await doSomething(job.data);
          progress += 1;
          await job.progress(progress);
        }
        return {};
      }
      case 'concatenate': {
        await doSomeLogic2();
        break;
      }
    }
  }
}
```

Ceci est couvert dans la section [named processor](https://docs.bullmq.io/patterns/named-processor) de la documentation de BullMQ.

#### Consommateurs à l'échelle de la requête

Lorsqu'un consommateur est marqué comme étant à portée de requête (en savoir plus sur les portées d'injection [ici](/fundamentals/injection-scopes#provider-scope)), une nouvelle instance de la classe sera créée exclusivement pour chaque tâche. L'instance sera ramassée une fois le travail terminé.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

Puisque les classes de consommateurs à portée de requête sont instanciées dynamiquement et à portée d'un seul travail, vous pouvez injecter un `JOB_REF` à travers le constructeur en utilisant une approche standard.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **Astuce** Le jeton `JOB_REF` est importé du paquetage `@nestjs/bullmq`.

#### Écouteurs d'événements

BullMQ génère un ensemble d'événements utiles lorsque des changements d'état de la file d'attente et/ou du travail se produisent. On peut s'abonner à ces événements au niveau du travailleur en utilisant le décorateur `@OnWorkerEvent(event)`, ou au niveau de la file d'attente avec une classe d'écoute dédiée et le décorateur `@OnQueueEvent(event)`.

Les événements Worker doivent être déclarés dans une classe <a href="techniques/queues#consumers">consumer</a> (c'est-à-dire dans une classe décorée avec le décorateur `@Processor()`). Pour écouter un événement, utilisez le décorateur `@OnWorkerEvent(event)` avec l'événement que vous voulez gérer. Par exemple, pour écouter l'événement émis lorsqu'un travail entre dans l'état actif dans la file d'attente `audio`, utilisez la construction suivante :

```typescript
import { Processor, Process, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer {
  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  // ...
}
```

Vous pouvez consulter la liste complète des événements et de leurs arguments en tant que propriétés de WorkerListener [ici](https://api.docs.bullmq.io/interfaces/v4.WorkerListener.html).

Les auditeurs de QueueEvent doivent utiliser le décorateur `@QueueEventsListener(queue)` et étendre la classe `QueueEventsHost` fournie par `@nestjs/bullmq`. Pour écouter un événement, utilisez le décorateur `@OnQueueEvent(event)` avec l'événement que vous voulez gérer. Par exemple, pour écouter l'événement émis lorsqu'un travail entre dans l'état actif dans la file d'attente `audio`, utilisez la construction suivante :

```typescript
import {
  QueueEventsHost,
  QueueEventsListener,
  OnQueueEvent,
} from '@nestjs/bullmq';

@QueueEventsListener('audio')
export class AudioEventsListener extends QueueEventsHost {
  @OnQueueEvent('active')
  onActive(job: { jobId: string; prev?: string }) {
    console.log(`Processing job ${job.jobId}...`);
  }

  // ...
}
```

> info **Astuce** Les QueueEvent Listeners doivent être enregistrés en tant que `providers` pour que le paquetage `@nestjs/bullmq` puisse les récupérer.

Vous pouvez consulter la liste complète des événements et de leurs arguments en tant que propriétés de QueueEventsListener [ici](https://api.docs.bullmq.io/interfaces/v4.QueueEventsListener.html).

#### Gestion des files d'attente

Les files d'attente disposent d'une API qui vous permet d'exécuter des fonctions de gestion telles que la mise en pause et la reprise, la récupération du nombre de travaux dans différents états, et bien d'autres encore. Vous pouvez trouver l'API complète des files d'attente [ici](https://api.docs.bullmq.io/classes/v4.Queue.html). Invoquez n'importe laquelle de ces méthodes directement sur l'objet `Queue`, comme illustré ci-dessous avec les exemples de pause/reprise.

Mettre en pause une file d'attente avec l'appel de la méthode `pause()`. Une file d'attente mise en pause ne traitera pas de nouveaux travaux jusqu'à ce qu'elle reprenne, mais les travaux en cours de traitement continueront jusqu'à ce qu'ils soient finalisés.

```typescript
await audioQueue.pause();
```

Pour reprendre une file d'attente en pause, utilisez la méthode `resume()`, comme suit :

```typescript
await audioQueue.resume();
```

#### Processus séparés

Les gestionnaires de tâches peuvent également être exécutés dans un processus séparé (forké) ([source](https://docs.bullmq.io/guide/workers/sandboxed-processors)). Cela présente plusieurs avantages :

- Le processus est protégé par un bac à sable, de sorte que s'il tombe en panne, cela n'affecte pas le travailleur.
- Vous pouvez exécuter du code bloquant sans affecter la file d'attente (les travaux ne se bloquent pas).
- Meilleure utilisation des processeurs multi-cœurs.
- Moins de connexions à redis.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

> warning **Attention** Veuillez noter qu'étant donné que votre fonction est exécutée dans un processus forké, l'injection de dépendance (et le conteneur IoC) ne sera pas disponible. Cela signifie que la fonction de votre processeur devra contenir (ou créer) toutes les instances de dépendances externes dont elle a besoin.

#### Configuration asynchrone

Vous pouvez vouloir passer des options `bullmq` de manière asynchrone plutôt que statique. Dans ce cas, utilisez la méthode `forRootAsync()` qui fournit plusieurs façons de gérer la configuration asynchrone. De même, si vous voulez passer des options de file d'attente de manière asynchrone, utilisez la méthode `registerQueueAsync()`.

Une approche consiste à utiliser une fonction d'usine :

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

Notre fabrique se comporte comme n'importe quel autre [fournisseur asynchrone](/fundamentals/async-providers) (par exemple, il peut être `async` et il est capable d'injecter des dépendances via `inject`).

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    connection: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
```

Vous pouvez également utiliser la syntaxe `useClass` :

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

La construction ci-dessus instanciera `BullConfigService` dans `BullModule` et l'utilisera pour fournir un objet d'options en appelant `createSharedConfiguration()`. Notez que cela signifie que le `BullConfigService` doit implémenter l'interface `SharedBullConfigurationFactory`, comme montré ci-dessous :

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

Afin d'éviter la création de `BullConfigService` dans `BullModule` et d'utiliser un fournisseur importé d'un module différent, vous pouvez utiliser la syntaxe `useExisting`.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Cette construction fonctionne de la même manière que `useClass` avec une différence essentielle - `BullModule` va chercher dans les modules importés pour réutiliser un `ConfigService` existant au lieu d'en instancier un nouveau.

De même, si vous voulez passer des options de file d'attente de manière asynchrone, utilisez la méthode `registerQueueAsync()`, en n'oubliant pas de spécifier l'attribut `name` à l'extérieur de la fonction factory.

```typescript
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

#### Installation Bull 

> warning **Note** Si vous avez décidé d'utiliser BullMQ, sautez cette section et les chapitres suivants.
> 
Pour commencer à utiliser Bull, nous installons d'abord les dépendances nécessaires.

```bash
$ npm install --save @nestjs/bull bull
```

Une fois le processus d'installation terminé, nous pouvons importer le `BullModule` dans la racine `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

La méthode `forRoot()` est utilisée pour enregistrer un objet de configuration du paquet `bull` qui sera utilisé par toutes les files d'attente enregistrées dans l'application (sauf indication contraire). Un objet de configuration est constitué des propriétés suivantes :

- `limiter: RateLimiter` - Options permettant de contrôler la vitesse à laquelle les travaux de la file d'attente sont traités. Voir [RateLimiter](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) pour plus d'informations. Optionnel.
- `redis: RedisOpts` - Options pour configurer la connexion Redis. Voir [RedisOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) pour plus d'informations. Optionnel.
- `prefix: string` - Préfixe pour toutes les clés de file d'attente. Optionnel.
- `defaultJobOptions: JobOpts` - Options permettant de contrôler les paramètres par défaut des nouveaux travaux. Voir [JobOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd) pour plus d'informations. Optionnel.
- `settings: AdvancedSettings` - Paramètres avancés de configuration de la file d'attente. Ils ne doivent généralement pas être modifiés. Voir [AdvancedSettings](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) pour plus d'informations. Optionnel.

Toutes les options sont optionnelles et permettent un contrôle détaillé du comportement de la file d'attente. Elles sont passées directement au constructeur de Bull `Queue`. Pour en savoir plus sur ces options, cliquez [ici](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue).

Pour enregistrer une file d'attente, importez le module dynamique `BullModule.registerQueue()`, comme suit :

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **Astuce** Créez plusieurs files d'attente en passant plusieurs objets de configuration séparés par des virgules à la méthode `registerQueue()`.

La méthode `registerQueue()` est utilisée pour instancier et/ou enregistrer des files d'attente. Les files d'attente sont partagées entre les modules et les processus qui se connectent à la même base de données Redis sous-jacente avec les mêmes informations d'identification. Chaque file d'attente est unique par sa propriété name. Le nom d'une file d'attente est utilisé à la fois comme jeton d'injection (pour injecter la file d'attente dans les contrôleurs/fournisseurs) et comme argument pour les décorateurs afin d'associer les classes de consommateurs et les auditeurs aux files d'attente.

Vous pouvez également remplacer certaines des options préconfigurées pour une file d'attente spécifique, comme suit :

```typescript
BullModule.registerQueue({
  name: 'audio',
  redis: {
    port: 6380,
  },
});
```

Comme les travaux sont conservés dans Redis, chaque fois qu'une file d'attente spécifique est instanciée (par exemple, lorsqu'une application est démarrée/redémarrée), elle tente de traiter tous les anciens travaux qui peuvent exister à partir d'une session précédente inachevée.

Chaque file d'attente peut avoir un ou plusieurs producteurs, consommateurs et auditeurs. Les consommateurs récupèrent les travaux de la file d'attente dans un ordre spécifique : FIFO ( par défaut), LIFO, ou en fonction des priorités. Le contrôle de l'ordre de traitement des files d'attente est abordé [ici](techniques/queues#consommateurs)

<app-banner-enterprise></app-banner-enterprise>

#### Configurations nommées

Si vos files d'attente se connectent à plusieurs instances Redis, vous pouvez utiliser une technique appelée **configurations nommées**. Cette fonctionnalité vous permet d'enregistrer plusieurs configurations sous des clés spécifiques, auxquelles vous pouvez ensuite vous référer dans les options de la file d'attente.

Par exemple, si vous avez une instance Redis supplémentaire (en plus de l'instance par défaut) utilisée par quelques files d'attente enregistrées dans votre application, vous pouvez enregistrer sa configuration comme suit :

```typescript
BullModule.forRoot('alternative-config', {
  redis: {
    port: 6381,
  },
});
```

Dans l'exemple ci-dessus, `'alternative-config'` est juste une clé de configuration (elle peut être n'importe quelle chaîne arbitraire).

Avec ceci en place, vous pouvez maintenant pointer vers cette configuration dans l'objet d'options `registerQueue()` :

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### Producteurs

Les producteurs de travaux ajoutent des travaux aux files d'attente. Les producteurs sont généralement des services d'application ([fournisseurs](/providers) Nest). Pour ajouter des travaux à une file d'attente, il faut d'abord injecter la file d'attente dans le service comme suit :

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **Astuce** Le décorateur `@InjectQueue()` identifie la file d'attente par son nom, tel qu'il est fourni dans l'appel à la méthode `registerQueue()` (par exemple, `'audio'`).

Maintenant, ajoutez un travail en appelant la méthode `add()` de la file d'attente, en passant un objet de travail défini par l'utilisateur. Les travaux sont représentés comme des objets JavaScript sérialisables (puisque c'est ainsi qu'ils sont stockés dans la base de données Redis). La forme du job que vous passez est arbitraire ; utilisez-la pour représenter la sémantique de votre objet job.

```typescript
const job = await this.audioQueue.add({
  foo: 'bar',
});
```

#### Travaux nommés

Les travaux peuvent avoir des noms uniques. Cela vous permet de créer des [consommateurs](techniques/queues#consommateurs) spécialisés qui ne traiteront que les travaux portant un nom donné.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

> Warning **Attention** Lorsque vous utilisez des travaux nommés, vous devez créer des processeurs pour chaque nom unique ajouté à une file d'attente, sinon la file d'attente se plaindra qu'il manque un processeur pour le travail en question. Voir [ici](techniques/queues#consommateurs) pour plus d'informations sur l'utilisation des travaux nommés.

#### Options de travaux

Les jobs peuvent être associés à des options supplémentaires. Passez un objet options après l'argument `job` dans la méthode `Queueue.add()`. Les propriétés des options des jobs sont les suivantes :

- `priority`: `number` - Valeur de priorité facultative. Elle est comprise entre 1 (priorité la plus élevée) et MAX_INT (priorité la plus faible). Notez que l'utilisation des priorités a un léger impact sur les performances, il convient donc de les utiliser avec précaution.
- `delay`: `number` - Temps d'attente (en millisecondes) jusqu'à ce que ce travail puisse être traité. Pour obtenir des délais précis, le serveur et les clients doivent avoir leurs horloges synchronisées.
- `attempts`: `number` - Nombre total de tentatives pour essayer le travail jusqu'à ce qu'il s'achève.
- `repeat`: `RepeatOpts` - Répéter un travail selon une spécification cron. Voir [RepeatOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `backoff`: `number | BackoffOpts` - Paramètre de temporisation pour les nouvelles tentatives automatiques en cas d'échec du travail. Voir [BackoffOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `lifo`: `boolean` - Si true, ajoute le travail à l'extrémité droite de la file d'attente au lieu de l'extrémité gauche (false par défaut).
- `timeout`: `number` - Nombre de millisecondes après lequel le travail doit échouer avec une erreur de dépassement de délai.
- `jobId`: `number` | `string` - Remplace l'identifiant du travail - par défaut, l'identifiant du travail est un numéro unique.
  integer, mais vous pouvez utiliser ce paramètre pour le remplacer. Si vous utilisez cette option, il vous appartient de vous assurer que l'identifiant du travail est unique. Si vous tentez d'ajouter un travail avec un identifiant qui existe déjà, il ne sera pas ajouté.
- `removeOnComplete`: `boolean | number` - Si true, le travail est supprimé lorsqu'il s'achève avec succès. Un nombre indique le nombre de travaux à conserver. Par défaut, le travail est conservé dans l'ensemble des travaux terminés.
- `removeOnFail`: `boolean | number` - Si true, supprime le travail lorsqu'il échoue après toutes les tentatives. Un nombre indique le nombre de tâches à conserver. Le comportement par défaut est de conserver le travail dans l'ensemble des échecs.
- `stackTraceLimit`: `number` - Limite le nombre de lignes de la stacktrace qui seront enregistrées dans la stacktrace.

Voici quelques exemples de personnalisation de travaux à l'aide d'options de travaux.

Pour retarder le démarrage d'un travail, utilisez la propriété de configuration `delay`.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { delay: 3000 }, //3 secondes de délai
);
```

Pour ajouter un travail à l'extrémité droite de la file d'attente (traiter le travail comme **LIFO** (Last In First Out)), définissez la propriété `lifo` de l'objet de configuration à `true`.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

Pour classer un travail par ordre de priorité, utilisez la propriété `priority`.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

#### Consommateurs

Un consommateur est une **classe** définissant des méthodes qui traitent les travaux ajoutés à la file d'attente, ou qui écoutent les événements de la file d'attente, ou les deux. Déclarez une classe de consommateur en utilisant le décorateur `@Processor()` comme suit :

```typescript
import { Processor } from '@nestjs/bull';

@Processor('audio')
export class AudioConsumer {}
```

> info **Astuce** Les consommateurs doivent être enregistrés en tant que `providers` pour que le paquet `@nestjs/bull` puisse les récupérer.

Où l'argument chaîne du décorateur (par exemple, `'audio'`) est le nom de la file d'attente à associer aux méthodes de la classe.

Dans une classe de consommateur, déclarez des gestionnaires de tâches en décorant les méthodes de gestionnaire avec le décorateur `@Process()`.

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {
  @Process()
  async transcode(job: Job<unknown>) {
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.progress(progress);
    }
    return {};
  }
}
```

La méthode décorée (par exemple, `transcode()`) est appelée chaque fois que le worker est inactif et qu'il y a des jobs à traiter dans la file d'attente. Cette méthode handler reçoit l'objet `job` comme seul argument. La valeur retournée par la méthode handler est stockée dans l'objet job et peut être accédée ultérieurement, par exemple dans un écouteur pour l'événement completed.

Les objets `Job` ont plusieurs méthodes qui vous permettent d'interagir avec leur état. Par exemple, le code ci-dessus utilise la méthode `progress()` pour mettre à jour la progression du job. Voir [ici](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#job) pour la référence complète de l'API de l'objet `Job`.

Vous pouvez indiquer qu'une méthode de gestion des travaux ne traitera **que** les travaux d'un certain type (les travaux avec un `nom` spécifique) en passant ce `nom` au décorateur `@Process()` comme indiqué ci-dessous. Vous pouvez avoir plusieurs gestionnaires `@Process()` dans une classe de consommateur donnée, correspondant à chaque type de travail (`nom`). Lorsque vous utilisez des travaux nommés, assurez-vous d'avoir un gestionnaire correspondant à chaque nom.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

> warning **Attention** Lors de la définition de plusieurs consommateurs pour la même file d'attente, l'option `concurrency` dans `@Process({{ '{' }} concurrency : 1 {{ '}' }})` ne sera pas prise en compte. La `concurrency` minimale correspondra au nombre de consommateurs définis. Ceci s'applique même si les gestionnaires `@Process()` utilisent un `nom` différent pour gérer les travaux nommés.

#### Consommateurs à portée de requête

Lorsqu'un consommateur est marqué comme étant à portée de requête (en savoir plus sur les portées d'injection [ici](/fundamentals/injection-scopes#portée-du-fournisseur)), une nouvelle instance de la classe sera créée exclusivement pour chaque tâche. L'instance sera ramassée une fois le travail terminé.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

Puisque les classes de consommateurs à portée de requête sont instanciées dynamiquement et à portée d'un seul travail, vous pouvez injecter un `JOB_REF` à travers le constructeur en utilisant une approche standard.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **Astuce** Le jeton `JOB_REF` est importé du paquet `@nestjs/bull`.

#### Auditeurs

Bull génère un ensemble d'événements utiles lorsque des changements d'état de la file d'attente et/ou du travail se produisent. Nest fournit un ensemble de décorateurs qui permettent de s'abonner à un ensemble d'événements standards. Ceux-ci sont exportés depuis le package `@nestjs/bull`.

Les récepteurs d'événements doivent être déclarés dans une classe <a href="techniques/queues#consumers">consommateur</a> (c'est-à-dire dans une classe décorée avec le décorateur `@Processor()`). Pour écouter un événement, utilisez l'un des décorateurs du tableau ci-dessous pour déclarer un gestionnaire pour l'événement. Par exemple, pour écouter l'événement émis lorsqu'un travail entre dans l'état actif dans la file d'attente `audio`, utilisez la construction suivante :

```typescript
import { Processor, Process, OnQueueActive } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }
  ...
```

Bull fonctionnant dans un environnement distribué (multi-nœuds), il définit le concept de localité des événements. Ce concept reconnaît que les événements peuvent être déclenchés soit entièrement dans un seul processus, soit sur des files d'attente partagées par différents processus. Un événement **local** est produit lorsqu'une action ou un changement d'état est déclenché sur une file d'attente dans le processus local. En d'autres termes, lorsque vos producteurs et consommateurs d'événements sont locaux à un seul processus, tous les événements se produisant sur les files d'attente sont locaux.

Lorsqu'une file d'attente est partagée entre plusieurs processus, nous rencontrons la possibilité d'événements **globaux**. Pour qu'un auditeur d'un processus reçoive une notification d'événement déclenchée par un autre processus, il doit s'enregistrer pour un événement global.

Les gestionnaires d'événements sont invoqués chaque fois que l'événement correspondant est émis. Le gestionnaire est appelé avec la signature indiquée dans le tableau ci-dessous, ce qui lui permet d'accéder aux informations relatives à l'événement. Nous examinons ci-dessous une différence essentielle entre les signatures locales et globales des gestionnaires d'événements.

<table>
  <tr>
    <th>Auditeurs d'événements locaux</th>
    <th>Auditeurs d'événements globaux</th>
    <th>Signature de la méthode du gestionnaire / Lors de l'exécution</th>
  </tr>
  <tr>
    <td><code>@OnQueueError()</code></td><td><code>@OnGlobalQueueError()</code></td><td><code>handler(error: Error)</code> - Une erreur s'est produite. <code>error</code> contient l'erreur qui a déclenché le message.</td>
  </tr>
  <tr>
    <td><code>@OnQueueWaiting()</code></td><td><code>@OnGlobalQueueWaiting()</code></td><td><code>handler(jobId: number | string)</code> - Un travail attend d'être traité dès qu'un travailleur est au repos. <code>jobId</code> contient l'identifiant du travail qui est entré dans cet état.</td>
  </tr>
  <tr>
    <td><code>@OnQueueActive()</code></td><td><code>@OnGlobalQueueActive()</code></td><td><code>handler(job: Job)</code> - Le travail <code>job</code>a débuté. </td>
  </tr>
  <tr>
    <td><code>@OnQueueStalled()</code></td><td><code>@OnGlobalQueueStalled()</code></td><td><code>handler(job: Job)</code> - Le travail <code>job</code> a été marqué comme étant bloqué. Ceci est utile pour débugger les travailleurs qui se plantent ou qui mettent en pause la boucle d'événements.</td>
  </tr>
  <tr>
    <td><code>@OnQueueProgress()</code></td><td><code>@OnGlobalQueueProgress()</code></td><td><code>handler(job: Job, progress: number)</code> - La progression du travail <code>job</code> a été mise à jour à la valeur <code>progress</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCompleted()</code></td><td><code>@OnGlobalQueueCompleted()</code></td><td><code>handler(job: Job, result: any)</code> Le travail <code>job</code> s'est achevé avec succès, avec un résultat <code>result</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueueFailed()</code></td><td><code>@OnGlobalQueueFailed()</code></td><td><code>handler(job: Job, err: Error)</code> Le travail <code>job</code> a échoué avec la raison <code>err</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueuePaused()</code></td><td><code>@OnGlobalQueuePaused()</code></td><td><code>handler()</code> La file d'attente a été mise en pause.</td>
  </tr>
  <tr>
    <td><code>@OnQueueResumed()</code></td><td><code>@OnGlobalQueueResumed()</code></td><td><code>handler(job: Job)</code> La file d'attente a été reprise.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCleaned()</code></td><td><code>@OnGlobalQueueCleaned()</code></td><td><code>handler(jobs: Job[], type: string)</code> Les anciens travaux ont été supprimés de la file d'attente. <code>jobs</code> est un tableau de travaux nettoyés, et <code>type</code> est le type des travaux nettoyés.</td>
  </tr>
  <tr>
    <td><code>@OnQueueDrained()</code></td><td><code>@OnGlobalQueueDrained()</code></td><td><code>handler()</code> Émis lorsque la file d'attente a traité tous les travaux en attente (même s'il peut y avoir des travaux retardés qui n'ont pas encore été traités).</td>
  </tr>
  <tr>
    <td><code>@OnQueueRemoved()</code></td><td><code>@OnGlobalQueueRemoved()</code></td><td><code>handler(job: Job)</code> Le travail <code>job</code> a été supprimée avec succès.</td>
  </tr>
</table>

Lors de l'écoute d'événements globaux, les signatures de méthodes peuvent être légèrement différentes de leur contrepartie locale. Spécifiquement, toute signature de méthode qui reçoit des objets `job` dans la version locale, reçoit à la place un `jobId` (`numéro`) dans la version globale. Pour obtenir une référence à l'objet `job` dans un tel cas, utilisez la méthode `Queueue#getJob`. Cet appel doit être attendu, et donc le gestionnaire doit être déclaré `async`. Par exemple :

```typescript
@OnGlobalQueueCompleted()
async onGlobalCompleted(jobId: number, result: any) {
  const job = await this.immediateQueue.getJob(jobId);
  console.log('(Global) on completed: job ', job.id, ' -> result: ', result);
}
```

> info **Astuce** Pour accéder à l'objet `Queue` (pour faire un appel à `getJob()`), vous devez bien sûr l'injecter. De plus, la file d'attente doit être enregistrée dans le module où vous l'injectez.

En plus des décorateurs d'auditeurs d'événements spécifiques, vous pouvez également utiliser le décorateur générique `@OnQueueEvent()` en combinaison avec les enums `BullQueueEvents` ou `BullQueueueGlobalEvents`. Pour en savoir plus sur les événements [ici](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#events).

#### Gestion des files d'attente

Les files d'attente disposent d'une API qui vous permet d'exécuter des fonctions de gestion telles que la mise en pause et la reprise, la récupération du nombre de travaux dans différents états, et bien d'autres encore. Vous pouvez trouver l'API complète de la file d'attente [ici](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue). Invoquez n'importe laquelle de ces méthodes directement sur l'objet `Queue`, comme illustré ci-dessous avec les exemples de pause/reprise.

Mettez en pause une file d'attente avec l'appel de la méthode `pause()`. Une file d'attente mise en pause ne traitera pas de nouveaux travaux jusqu'à ce qu'elle reprenne, mais les travaux en cours de traitement continueront jusqu'à ce qu'ils soient finalisés.

```typescript
await audioQueue.pause();
```

Pour reprendre une file d'attente en pause, utilisez la méthode `resume()`, comme suit :

```typescript
await audioQueue.resume();
```

#### Processus distincts

Les gestionnaires de tâches peuvent également être exécutés dans un processus séparé (forké) ([source](https://github.com/OptimalBits/bull#separate-processes)). Cela présente plusieurs avantages :

- Le processus est placé dans une sandbox, de sorte que s'il échoue, cela n'affecte pas le travailleur.
- Vous pouvez exécuter du code bloquant sans affecter la file d'attente (les tâches ne seront pas bloquées).
- Une meilleure utilisation des processeurs multi-cœurs.
- Moins de connexions à redis.

```ts
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

Veuillez noter qu'étant donné que votre fonction est exécutée dans un processus forké, l'injection de dépendance (et le conteneur IoC) ne sera pas disponible. Cela signifie que la fonction de votre processeur devra contenir (ou créer) toutes les instances de dépendances externes dont elle a besoin.

```ts
@@filename(processor)
import { Job, DoneCallback } from 'bull';

export default function (job: Job, cb: DoneCallback) {
  console.log(`[${process.pid}] ${JSON.stringify(job.data)}`);
  cb(null, 'It works');
}
```

#### Configuration asynchrone

Vous pouvez vouloir passer des options `bull` de manière asynchrone plutôt que statique. Dans ce cas, utilisez la méthode `forRootAsync()` qui fournit plusieurs façons de gérer la configuration asynchrone.

Une approche consiste à utiliser une fonction d'usine :

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

Notre fabrique se comporte comme n'importe quel autre [fournisseur asynchrone](https://docs.nestjs.com/fundamentals/async-providers) (par exemple, il peut être `async` et il est capable d'injecter des dépendances via `inject`).

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` syntax:

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

La construction ci-dessus instanciera `BullConfigService` dans `BullModule` et l'utilisera pour fournir un objet d'options en appelant `createSharedConfiguration()`. Notez que cela signifie que le `BullConfigService` doit implémenter l'interface `SharedBullConfigurationFactory`, comme montré ci-dessous :

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

Afin d'éviter la création de `BullConfigService` dans `BullModule` et d'utiliser un fournisseur importé d'un module différent, vous pouvez utiliser la syntaxe `useExisting`.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Cette construction fonctionne de la même manière que `useClass` avec une différence essentielle - `BullModule` va chercher dans les modules importés pour réutiliser un `ConfigService` existant au lieu d'en instancier un nouveau.

De même, si vous voulez passer des options de file d'attente de manière asynchrone, utilisez la méthode `registerQueueAsync()`, en n'oubliant pas de spécifier l'attribut `name` à l'extérieur de la fonction usine.

```typescript
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/26-queues).
