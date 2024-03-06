### Kafka

[Kafka](https://kafka.apache.org/) est une plateforme de diffusion en continu distribuée, à code source ouvert, qui présente trois caractéristiques essentielles :

- Publier des flux d'enregistrements et s'y abonner, à l'instar d'une file d'attente de messages ou d'un système de messagerie d'entreprise.
- Stocker les flux d'enregistrements de manière durable et tolérante aux pannes.
- Traiter les flux d'enregistrements au fur et à mesure qu'ils se produisent.

Le projet Kafka vise à fournir une plateforme unifiée, à haut débit et à faible latence pour traiter les flux de données en temps réel. Il s'intègre très bien avec Apache Storm et Spark pour l'analyse des données en temps réel.

#### Installation

Pour commencer à construire des microservices basés sur Kafka, installez d'abord le package requis :

```bash
$ npm i --save kafkajs
```

#### Vue d'ensemble

Comme pour les autres implémentations de la couche de transport des microservices Nest, vous sélectionnez le mécanisme de transport Kafka en utilisant la propriété `transport` de l'objet options passé à la méthode `createMicroservice()`, ainsi qu'une propriété optionnelle `options`, comme indiqué ci-dessous :

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
```

> info **Astuce** L'enum `Transport` est importé du package `@nestjs/microservices`.

#### Options

La propriété `options` est spécifique au transporteur choisi. Le transporteur **Kafka** expose les propriétés décrites ci-dessous.

<table>
  <tr>
    <td><code>client</code></td>
    <td>Options de configuration du client (en lire plus
      <a
        href="https://kafka.js.org/docs/configuration"
        rel="nofollow"
        target="blank"
        >ici</a
      >)</td>
  </tr>
  <tr>
    <td><code>consumer</code></td>
    <td>Options de configuration du consommateur (en lire plus
      <a
        href="https://kafka.js.org/docs/consuming#a-name-options-a-options"
        rel="nofollow"
        target="blank"
        >ici</a
      >)</td>
  </tr>
  <tr>
    <td><code>run</code></td>
    <td>Options de configuration d'exécution (en lire plus
      <a
        href="https://kafka.js.org/docs/consuming"
        rel="nofollow"
        target="blank"
        >ici</a
      >)</td>
  </tr>
  <tr>
    <td><code>subscribe</code></td>
    <td>Options de configuration des abonnements (en lire plus
      <a
        href="https://kafka.js.org/docs/consuming#frombeginning"
        rel="nofollow"
        target="blank"
        >ici</a
      >)</td>
  </tr>
  <tr>
    <td><code>producer</code></td>
    <td>Options de configuration des producteurs (en lire plus
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >ici</a
      >)</td>
  </tr>
  <tr>
    <td><code>send</code></td>
    <td>Options de configuration de l'envoi (en lire plus
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >ici</a
      >)</td>
  </tr>
  <tr>
    <td><code>producerOnlyMode</code></td>
    <td>Indicateur de fonctionnalité permettant d'ignorer l'enregistrement d'un groupe de consommateurs et d'agir uniquement en tant que producteur (<code>boolean</code>)</td>
  </tr>
  <tr>
    <td><code>postfixId</code></td>
    <td>Modifier le suffixe de la valeur clientId (<code>string</code>)</td>
  </tr>
</table>

#### Client

Il y a une petite différence entre Kafka et les autres transporteurs de microservices. Au lieu de la classe `ClientProxy`, nous utilisons la classe `ClientKafka`.

Comme d'autres transporteurs de microservices, vous avez [plusieurs options](/microservices/basics#client) pour créer une instance `ClientKafka`.

Une méthode pour créer une instance est d'utiliser le `ClientsModule`. Pour créer une instance de client avec le `ClientsModule`, importez-le et utilisez la méthode `register()` pour passer un objet options avec les mêmes propriétés que celles montrées ci-dessus dans la méthode `createMicroservice()`, ainsi qu'une propriété `name` à utiliser comme jeton d'injection. Lisez-en plus à propos du `ClientsModule` [ici](/microservices/basics#client).

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'HERO_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'hero',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'hero-consumer'
          }
        }
      },
    ]),
  ]
  ...
})
```

D'autres options pour créer un client (soit `ClientProxyFactory` ou `@Client()`) peuvent également être utilisées. Vous pouvez lire à leur sujet [ici](/microservices/basics#client).

Utilisez le décorateur `@Client()` comme suit :

```typescript
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer'
    }
  }
})
client: ClientKafka;
```

#### Modèle de message

Le modèle de message de microservice Kafka utilise deux sujets pour les canaux de demande et de réponse. Le modèle `ClientKafka#send()` envoie des messages avec une [adresse de retour](https://www.enterpriseintegrationpatterns.com/patterns/messaging/ReturnAddress.html) en associant un [identifiant de corrélation](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html), un sujet de réponse et une partition de réponse au message de demande. Cela nécessite que l'instance `ClientKafka` soit abonnée au sujet de réponse et assignée à au moins une partition avant d'envoyer un message.

Par la suite, vous devez avoir au moins une partition de sujet de réponse pour chaque application Nest en cours d'exécution. Par exemple, si vous exécutez 4 applications Nest mais que le sujet de réponse n'a que 3 partitions, alors une des applications Nest échouera lorsqu'elle essaiera d'envoyer un message.

Lorsque de nouvelles instances `ClientKafka` sont lancées, elles rejoignent le groupe de consommateurs et s'abonnent à leurs sujets respectifs. Ce processus déclenche un rééquilibrage des partitions de sujets attribuées aux consommateurs du groupe de consommateurs.

Normalement, les partitions thématiques sont attribuées à l'aide du système de partitionnement à la ronde, qui attribue les partitions thématiques à une collection de consommateurs triés par noms de consommateurs qui sont définis de manière aléatoire lors du lancement de l'application. Toutefois, lorsqu'un nouveau consommateur rejoint le groupe de consommateurs, il peut être positionné n'importe où dans la collection de consommateurs. Il s'ensuit que des consommateurs préexistants peuvent se voir attribuer des partitions différentes lorsque le consommateur préexistant est placé après le nouveau consommateur. Par conséquent, les consommateurs auxquels sont attribuées des partitions différentes perdront les messages de réponse des requêtes envoyées avant le rééquilibrage.

Pour éviter que les consommateurs `ClientKafka` ne perdent des messages de réponse, un partitionneur personnalisé intégré spécifique à Nest est utilisé. Ce partitionneur personnalisé attribue des partitions à une collection de consommateurs triés par des horodatages à haute résolution (`process.hrtime()`) qui sont définis au lancement de l'application.

#### Abonnement aux réponses aux messages

> warning **Note** Cette section n'est pertinente que si vous utilisez le style de message [requête-réponse](/microservices/basics#request-response) (avec le décorateur `@MessagePattern` et la méthode `ClientKafka#send`). L'abonnement au sujet de réponse n'est pas nécessaire pour la communication [basée sur les événements](/microservices/basics#event-based) (décorateur `@EventPattern` et méthode `@ClientKafka#emit`).

La classe `ClientKafka` fournit la méthode `subscribeToResponseOf()`. La méthode `subscribeToResponseOf()` prend le nom du sujet d'une requête comme argument et ajoute le nom du sujet de réponse dérivé à une collection de sujets de réponse. Cette méthode est nécessaire lors de l'implémentation du modèle de message.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
}
```

Si l'instance `ClientKafka` est créée de manière asynchrone, la méthode `subscribeToResponseOf()` doit être appelée avant d'appeler la méthode `connect()`.

```typescript
@@filename(heroes.controller)
async onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
  await this.client.connect();
}
```

#### Messages entrants

Nest reçoit les messages Kafka entrants sous la forme d'un objet avec les propriétés `key`, `value` et `headers` qui ont des valeurs de type `Buffer`. Nest analyse ensuite ces valeurs en transformant les tampons en chaînes de caractères. Si la chaîne est "semblable à un objet", Nest tente d'analyser la chaîne en tant que `JSON`. La `value` est alors transmise au gestionnaire qui lui est associé.

#### Messages sortants

Nest envoie des messages Kafka sortants après un processus de sérialisation lors de la publication d'événements ou de l'envoi de messages. Cela se produit sur les arguments passés aux méthodes `emit()` et `send()` de `ClientKafka` ou sur les valeurs renvoyées par une méthode `@MessagePattern`. Cette sérialisation "stringifie" les objets qui ne sont pas des chaînes ou des tampons en utilisant `JSON.stringify()` ou la méthode prototype `toString()`.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const dragonId = message.dragonId;
    const items = [
      { id: 1, name: 'Épée mythique' },
      { id: 2, name: 'Clé du donjon' },
    ];
    return items;
  }
}
```

> info **AStuce** `@Payload()` est importé du package `@nestjs/microservices`.

Les messages sortants peuvent également être codés en passant un objet avec les propriétés `key` et `value`. L'attribution d'une clé aux messages est importante pour répondre à [l'exigence de copartition](https://docs.confluent.io/current/ksql/docs/developer-guide/partition-data.html#co-partitioning-requirements).

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Épée mythique' },
      { id: 2, name: 'Clé du donjon' },
    ];

    return {
      headers: {
        realm
      },
      key: heroId,
      value: items
    }
  }
}
```

De plus, les messages passés dans ce format peuvent également contenir des en-têtes personnalisés définis dans la propriété de hachage `headers`. Les valeurs de la propriété de hachage des en-têtes doivent être de type `string` ou de type `Buffer`.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Épée mythique' },
      { id: 2, name: 'Clé du donjon' },
    ];

    return {
      headers: {
        kafka_nestRealm: realm
      },
      key: heroId,
      value: items
    }
  }
}
```

#### Basé sur les événements

Si la méthode requête-réponse est idéale pour l'échange de messages entre services, elle l'est moins lorsque votre style de message est basé sur les événements (ce qui est idéal pour Kafka) - lorsque vous souhaitez simplement publier des événements **sans attendre de réponse**. Dans ce cas, vous ne voulez pas de la surcharge requise par la méthode requête-réponse pour maintenir deux sujets.

Pour en savoir plus, consultez les deux sections suivantes : [Vue d'ensemble : basée sur les événements](/microservices/basics#messagerie-événementielle) et [Vue d'ensemble : publier des événements](/microservices/basics#publication-dévénements).

#### Contexte

Dans des scénarios plus sophistiqués, vous pouvez vouloir accéder à plus d'informations sur la requête entrante. Lorsque vous utilisez le transporteur Kafka, vous pouvez accéder à l'objet `KafkaContext`.

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

> info **Astuce** `@Payload()`, `@Ctx()` et `KafkaContext` sont importés du package `@nestjs/microservices`.

Pour accéder à l'objet Kafka `IncomingMessage` original, utilisez la méthode `getMessage()` de l'objet `KafkaContext`, comme suit :

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
```

Le `IncomingMessage` remplit l'interface suivante :

```typescript
interface IncomingMessage {
  topic: string;
  partition: number;
  timestamp: string;
  size: number;
  attributes: number;
  offset: string;
  key: any;
  value: any;
  headers: Record<string, any>;
}
```

Si votre handler implique un temps de traitement lent pour chaque message reçu, vous devriez envisager d'utiliser le callback `heartbeat`. Pour récupérer la fonction `heartbeat`, utilisez la méthode `getHeartbeat()` du `KafkaContext`, comme suit :

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
async killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const heartbeat = context.getHeartbeat();

  // Effectuer un traitement lent
  await doWorkPart1();

  // Envoi d'un heartbeat pour ne pas dépasser le sessionTimeout
  await heartbeat();

  // Effectuer à nouveau un traitement lent
  await doWorkPart2();
}
```

#### Conventions de nommage

Les composants de microservices Kafka ajoutent une description de leur rôle respectif aux options `client.clientId` et `consumer.groupId` pour éviter les collisions entre les composants clients et serveurs des microservices Nest. Par défaut, les composants `ClientKafka` ajoutent `-client` et les composants `ServerKafka` ajoutent `-server` à ces deux options. Notez comment les valeurs fournies ci-dessous sont transformées de cette manière (comme indiqué dans les commentaires).

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-server
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-server
    },
  }
});
```

Et pour le client :

```typescript
@@filename(heroes.controller)
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-client
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-client
    }
  }
})
client: ClientKafka;
```

> info **Astuce** Les conventions de nommage des clients et des consommateurs Kafka peuvent être personnalisées en étendant `ClientKafka` et `KafkaServer` dans votre propre fournisseur personnalisé et en surchargeant le constructeur.

Puisque le modèle de message de microservice Kafka utilise deux sujets pour les canaux de demande et de réponse, un modèle de réponse doit être dérivé du sujet de demande. Par défaut, le nom du sujet de réponse est le composite du nom du sujet de demande avec `.reply` ajouté.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.get'); // hero.get.reply
}
```

> info **Astuce** Les conventions de nommage des sujets de réponse Kafka peuvent être personnalisées en étendant `ClientKafka` dans votre propre fournisseur personnalisé et en surchargeant la méthode `getResponsePatternName`.

#### Exceptions récupérables

Comme pour les autres transporteurs, toutes les exceptions non gérées sont automatiquement enveloppées dans une `RpcException` et converties dans un format "convivial". Cependant, il y a des cas où vous voudrez contourner ce mécanisme et laisser les exceptions être consommées par le pilote `kafkajs` à la place. Lancer une exception lors du traitement d'un message demande à `kafkajs` de **retry** (le livrer à nouveau), ce qui signifie que même si le gestionnaire de message (ou d'événement) a été déclenché, le décalage ne sera pas enregistré dans Kafka.

> warning **Attention** Pour les gestionnaires d'événements (communication basée sur les événements), toutes les exceptions non gérées sont considérées par défaut comme des **exceptions récupérables**.

Pour cela, vous pouvez utiliser une classe dédiée appelée `KafkaRetriableException`, comme suit :

```typescript
throw new KafkaRetriableException('...');
```

> info **Astuce** La classe `KafkaRetriableException` est exportée depuis le package `@nestjs/microservices`.

#### Validation des décalages

La validation des décalages est essentielle lorsque l'on travaille avec Kafka. Par défaut, les messages sont automatiquement validés après un certain temps. Pour plus d'informations, visitez [KafkaJS docs](https://kafka.js.org/docs/consuming#autocommit). `ClientKafka` offre un moyen de valider manuellement les décalages qui fonctionnent comme [l'implémentation native de KafkaJS](https://kafka.js.org/docs/consuming#manual-committing).

```typescript
@@filename()
@EventPattern('user.created')
async handleUserCreated(@Payload() data: IncomingMessage, @Ctx() context: KafkaContext) {
  // logique métier
  
  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  await this.client.commitOffsets([{ topic, partition, offset }])
}
@@switch
@Bind(Payload(), Ctx())
@EventPattern('user.created')
async handleUserCreated(data, context) {
  // logique métier

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  await this.client.commitOffsets([{ topic, partition, offset }])
}
```

Pour désactiver la validation automatique des messages, mettez `autoCommit : false` dans la configuration `run`, comme suit :

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
```
