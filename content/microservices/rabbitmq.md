### RabbitMQ

[RabbitMQ](https://www.rabbitmq.com/) est un broker (courtier) de messages léger et open-source qui prend en charge de nombreux protocoles de messagerie. Il peut être déployé dans des configurations distribuées et fédérées pour répondre aux exigences de haute disponibilité. En outre, il s'agit du courtier de messages le plus largement déployé, utilisé dans le monde entier par de petites startups et de grandes entreprises.

#### Installation

Pour commencer à construire des microservices basés sur RabbitMQ, il faut d'abord installer les packages nécessaires :

```bash
$ npm i --save amqplib amqp-connection-manager
```

#### Vue d'ensemble

Pour utiliser le transporteur RabbitMQ, passez l'objet d'options suivant à la méthode `createMicroservice()` :

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
```

> info **Astuce** L'enum `Transport` est importé du package `@nestjs/microservices`.

#### Options

La propriété `options` est spécifique au transporteur choisi. Le transporteur **RabbitMQ** expose les propriétés décrites ci-dessous.

<table>
  <tr>
    <td><code>urls</code></td>
    <td>Urls de connexion</td>
  </tr>
  <tr>
    <td><code>queue</code></td>
    <td>Nom de la file d'attente que votre serveur écoutera</td>
  </tr>
  <tr>
    <td><code>prefetchCount</code></td>
    <td>Définit le nombre de préchargement pour le canal</td>
  </tr>
  <tr>
    <td><code>isGlobalPrefetchCount</code></td>
    <td>Activation du préchargement par canal</td>
  </tr>
  <tr>
    <td><code>noAck</code></td>
    <td>Si <code>false</code>, mode d'accusé de réception manuel activé</td>
  </tr>
  <tr>
    <td><code>consumerTag</code></td>
    <td>Identifiant de Consumer Tag (en lire plus <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_consume" rel="nofollow" target="_blank">ici</a>)</td>
  </tr>
  <tr>
    <td><code>queueOptions</code></td>
    <td>Options supplémentaires de file d'attente (en lire plus <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_assertQueue" rel="nofollow" target="_blank">ici</a>)</td>
  </tr>
  <tr>
    <td><code>socketOptions</code></td>
    <td>Options supplémentaires de socket (en lire plus <a href="https://amqp-node.github.io/amqplib/channel_api.html#socket-options" rel="nofollow" target="_blank">ici</a>)</td>
  </tr>
  <tr>
    <td><code>headers</code></td>
    <td>En-têtes à envoyer avec chaque message</td>
  </tr>
</table>

#### Client

Comme d'autres transporteurs de microservices, vous avez [plusieurs options](/microservices/basics#client) pour créer une instance RabbitMQ `ClientProxy`.

Une méthode pour créer une instance est d'utiliser le `ClientsModule`. Pour créer une instance de client avec le `ClientsModule`, importez-le et utilisez la méthode `register()` pour passer un objet options avec les mêmes propriétés que celles montrées ci-dessus dans la méthode `createMicroservice()`, ainsi qu'une propriété `name` à utiliser comme jeton d'injection. Lisez en plus à propos de `ClientsModule` [ici](/microservices/basics#client).

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'cats_queue',
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ]
  ...
})
```

D'autres options pour créer un client (soit `ClientProxyFactory` ou `@Client()`) peuvent également être utilisées. Vous pouvez en prendre connaissance [ici](/microservices/basics#client).

#### Contexte

Dans des scénarios plus complexes, vous pouvez avoir besoin d'accéder à des informations supplémentaires sur la requête entrante. Lorsque vous utilisez le transporteur RabbitMQ, vous pouvez accéder à l'objet `RmqContext`.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(`Pattern: ${context.getPattern()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Pattern: ${context.getPattern()}`);
}
```

> info **Astuce** `@Payload()`, `@Ctx()` et `RmqContext` sont importés du package `@nestjs/microservices`.

Pour accéder au message RabbitMQ original (avec les `properties`, `fields` et `content`), utilisez la méthode `getMessage()` de l'objet `RmqContext`, comme suit :

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getMessage());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getMessage());
}
```

Pour récupérer une référence au [channel](https://www.rabbitmq.com/channels.html) RabbitMQ, utilisez la méthode `getChannelRef` de l'objet `RmqContext`, comme suit :

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getChannelRef());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getChannelRef());
}
```

#### Accusé de réception des messages

Pour s'assurer qu'un message n'est jamais perdu, RabbitMQ supporte les [accusés de réception de message](https://www.rabbitmq.com/confirms.html). Un accusé de réception est renvoyé par le consommateur pour indiquer à RabbitMQ qu'un message particulier a été reçu, traité et que RabbitMQ est libre de le supprimer. Si un consommateur meurt (son canal est fermé, sa connexion est fermée ou la connexion TCP est perdue) sans avoir envoyé d'ack, RabbitMQ comprendra qu'un message n'a pas été entièrement traité et le remettra en file d'attente.

Pour activer le mode d'acquittement manuel, fixez la propriété `noAck` à `false` :

```typescript
options: {
  urls: ['amqp://localhost:5672'],
  queue: 'cats_queue',
  noAck: false,
  queueOptions: {
    durable: false
  },
},
```

Lorsque les accusés de réception manuels sont activés, le travailleur doit envoyer un accusé de réception approprié pour signaler qu'il a terminé sa tâche.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
```

#### Constructeurs d'enregistrements

Pour configurer les options des messages, vous pouvez utiliser la classe `RmqRecordBuilder` (note : ceci est également possible pour les flux basés sur les événements). Par exemple, pour définir les propriétés `headers` et `priority`, utilisez la méthode `setOptions`, comme suit :

```typescript
const message = ':cat:';
const record = new RmqRecordBuilder(message)
  .setOptions({
    headers: {
      ['x-version']: '1.0.0',
    },
    priority: 3,
  })
  .build();

this.client.send('replace-emoji', record).subscribe(...);
```

> info **Astuce** La classe `RmqRecordBuilder` est exportée depuis le package `@nestjs/microservices`.

Vous pouvez également lire ces valeurs côté serveur, en accédant au `RmqContext`, comme suit :

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: RmqContext): string {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

#### Mises à jour de l'état de l'instance

Pour obtenir des mises à jour en temps réel sur la connexion et l'état de l'instance du pilote sous-jacent, vous pouvez vous abonner au flux `status`. Ce flux fournit des mises à jour d'état spécifiques au pilote choisi. Pour le pilote RMQ, le flux `status` émet les événements `connected` et `disconnected`.

```typescript
this.client.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

> info **Astuce** Le type `RmqStatus` est importé du paquetage `@nestjs/microservices`.

De même, vous pouvez vous abonner au flux `status` du serveur pour recevoir des notifications sur le statut du serveur.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

#### Écoute des événements RabbitMQ

Dans certains cas, vous pouvez vouloir écouter les événements internes émis par le microservice. Par exemple, vous pourriez écouter l'événement `error` pour déclencher des opérations supplémentaires lorsqu'une erreur se produit. Pour ce faire, utilisez la méthode `on()`, comme montré ci-dessous :

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

De même, vous pouvez écouter les événements internes du serveur :

```typescript
server.on<RmqEvents>('error', (err) => {
  console.error(err);
});
```

> info **Astuce** Le type `RmqEvents` est importé du paquetage `@nestjs/microservices`.

#### Accès au pilote sous-jacent

Pour des cas d'utilisation plus avancés, vous pouvez avoir besoin d'accéder à l'instance du pilote sous-jacent. Cela peut être utile pour des scénarios tels que la fermeture manuelle de la connexion ou l'utilisation de méthodes spécifiques au pilote. Cependant, gardez à l'esprit que dans la plupart des cas, vous **ne devriez pas avoir besoin** d'accéder directement au pilote.

Pour ce faire, vous pouvez utiliser la méthode `unwrap()`, qui renvoie l'instance du pilote sous-jacent. Le paramètre de type générique doit spécifier le type d'instance de pilote que vous attendez.

```typescript
const managerRef =
  this.client.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
```

De même, vous pouvez accéder à l'instance de pilote sous-jacente du serveur :

```typescript
const managerRef =
  server.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
```