### NATS

[NATS](https://nats.io) est un système de messagerie open source simple, sécurisé et performant pour les applications natives du cloud, la messagerie IoT et les architectures microservices. Le serveur NATS est écrit dans le langage de programmation Go, mais des bibliothèques clientes pour interagir avec le serveur sont disponibles pour des dizaines de langages de programmation majeurs. NATS prend en charge les livraisons **At Most Once** (au plus une fois) et **At Least Once** (au moins une fois). Il peut fonctionner n'importe où, depuis les grands serveurs et les instances cloud, en passant par les gateways de périphérie et même les appareils de l'Internet des objets.

#### Installation

Pour commencer à construire des microservices basés sur les NATS, il faut d'abord installer le package requis :

```bash
$ npm i --save nats
```

#### Vue d'ensemble

Pour utiliser le transporteur NATS, passez l'objet d'options suivant à la méthode `createMicroservice()` :

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
```

> info **Astuce** L'enum `Transport` est importé du package `@nestjs/microservices`.

#### Options

L'objet `options` est spécifique au transporteur choisi. Le transporteur **NATS** expose les propriétés décrites [ici](https://github.com/nats-io/node-nats#connection-options) ainsi que les propriétés suivantes :

<table>
  <tr>
    <td><code>queue</code></td>
    <td>File d'attente à laquelle votre serveur doit s'abonner (laissez <code>undefined</code> pour ignorer ce paramètre). Lisez en plus sur les groupes de files d'attente NATS <a href="/microservices/nats#groupes-de-files-dattente">ci-dessous</a>.
    </td> 
  </tr>
  <tr>
    <td><code>gracefulShutdown</code></td>
    <td>Permet d'activer l'arrêt progressif (graceful shutdown). Lorsque cette option est activée, le serveur se désabonne d'abord de tous les canaux avant de fermer la connexion. La valeur par défaut est <code>false</code>.
  </tr>
  <tr>
    <td><code>gracePeriod</code></td>
    <td>Temps en millisecondes pour attendre le serveur après s'être désabonné de tous les canaux. La valeur par défaut est <code>10000</code> ms.
  </tr>
</table>

#### Client

Comme d'autres transporteurs de microservices, vous avez [plusieurs options](/microservices/basics#client) pour créer une instance NATS `ClientProxy`.

Une méthode pour créer une instance est d'utiliser le `ClientsModule`. Pour créer une instance de client avec le `ClientsModule`, importez-le et utilisez la méthode `register()` pour passer un objet options avec les mêmes propriétés que celles montrées ci-dessus dans la méthode `createMicroservice()`, ainsi qu'une propriété `name` à utiliser comme jeton d'injection. Pour en savoir plus sur `ClientsModule` [ici](/microservices/basics#client).

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
        }
      },
    ]),
  ]
  ...
})
```

D'autres options pour créer un client (soit `ClientProxyFactory` ou `@Client()`) peuvent également être utilisées. Vous pouvez en prendre connaissance [ici](/microservices/basics#client).

#### Requête-réponse

Pour le style de message **requête-réponse** ([en lire plus](/microservices/basics#requête-réponse)), le transporteur NATS n'utilise pas le mécanisme NATS intégré [Request-Reply](https://docs.nats.io/nats-concepts/reqreply). Au lieu de cela, une "requête" est publiée sur un sujet donné en utilisant la méthode `publish()` avec un nom de sujet de réponse unique, et les répondeurs écoutent sur ce sujet et envoient des réponses au sujet de réponse. Les sujets de réponse sont renvoyés dynamiquement au demandeur, indépendamment de l'emplacement de l'une ou l'autre des parties.

#### Basé sur les événements

Pour le style de message **basé sur les événements** ([lire la suite](/microservices/basics#event-based)), le transporteur NATS utilise le mécanisme [Publish-Subscribe](https://docs.nats.io/nats-concepts/pubsub) intégré au NATS. Un éditeur envoie un message sur un sujet et tout abonné actif écoutant sur ce sujet reçoit le message. Les abonnés peuvent également manifester leur intérêt pour des sujets génériques qui fonctionnent un peu comme des expressions régulières. Ce modèle "un pour plusieurs" est parfois appelé "fan-out".

#### Groupes de files d'attente

Le NATS fournit une fonction intégrée d'équilibrage de la charge appelée [files d'attente distribuées](https://docs.nats.io/nats-concepts/queue). Pour créer un abonnement à une file d'attente, utilisez la propriété `queue` comme suit :

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
    queue: 'cats_queue',
  },
});
```

#### Contexte

Dans des scénarios plus complexes, vous pouvez avoir besoin d'accéder à des informations supplémentaires sur la requête entrante. Lorsque vous utilisez le transporteur NATS, vous pouvez accéder à l'objet `NatsContext`.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Subject: ${context.getSubject()}`);
}
```

> info **Astuce** `@Payload()`, `@Ctx()` et `NatsContext` sont importés du package `@nestjs/microservices`.

#### Caractères génériques

Un abonnement peut porter sur un sujet explicite ou inclure des caractères génériques.

```typescript
@@filename()
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // par exemple "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // par exemple "time.us.east"
  return new Date().toLocaleTimeString(...);
}
```

#### Constructeurs d'enregistrements

Pour configurer les options du message, vous pouvez utiliser la classe `NatsRecordBuilder` (note : ceci est également possible pour les flux basés sur les évènements). Par exemple, pour ajouter l'en-tête `x-version`, utilisez la méthode `setHeaders`, comme suit :

```typescript
import * as nats from 'nats';

// quelque part dans votre code
const headers = nats.headers();
headers.set('x-version', '1.0.0');

const record = new NatsRecordBuilder(':cat:').setHeaders(headers).build();
this.client.send('replace-emoji', record).subscribe(...);
```

> info **Astuce** La classe `NatsRecordBuilder` est exportée du package `@nestjs/microservices`.

Vous pouvez également lire ces en-têtes côté serveur, en accédant au `NatsContext`, comme suit :

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: NatsContext): string {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

Dans certains cas, vous pouvez vouloir configurer des en-têtes pour plusieurs requêtes, vous pouvez les passer en tant qu'options à la `ClientProxyFactory` :

```typescript
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.NATS,
          options: {
            servers: ['nats://localhost:4222'],
            headers: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
```

#### Mises à jour de l'état de l'instance

Pour obtenir des mises à jour en temps réel sur la connexion et l'état de l'instance du pilote sous-jacent, vous pouvez vous abonner au flux `status`. Ce flux fournit des mises à jour d'état spécifiques au pilote choisi. Pour le pilote NATS, le flux `status` émet les événements `connected`, `disconnected`, et `reconnecting`.

```typescript
this.client.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
```

> info **Astuce** Le type `NatsStatus` est importé du paquet `@nestjs/microservices`.

De même, vous pouvez vous abonner au flux `status` du serveur pour recevoir des notifications sur le statut du serveur.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
```

#### Écouter les événements Nats

Dans certains cas, vous pouvez vouloir écouter les événements internes émis par le microservice. Par exemple, vous pourriez écouter l'événement `error` pour déclencher des opérations supplémentaires lorsqu'une erreur se produit. Pour ce faire, utilisez la méthode `on()`, comme montré ci-dessous :

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

De même, vous pouvez écouter les événements internes du serveur :

```typescript
server.on<NatsEvents>('error', (err) => {
  console.error(err);
});
```

#### Accès au pilote sous-jacent

Pour des cas d'utilisation plus avancés, vous pouvez avoir besoin d'accéder à l'instance du pilote sous-jacent. Cela peut être utile pour des scénarios tels que la fermeture manuelle de la connexion ou l'utilisation de méthodes spécifiques au pilote. Cependant, gardez à l'esprit que dans la plupart des cas, vous **ne devriez pas avoir besoin** d'accéder directement au pilote.

Pour ce faire, vous pouvez utiliser la méthode `unwrap()`, qui renvoie l'instance du pilote sous-jacent. Le paramètre de type générique doit spécifier le type d'instance de pilote que vous attendez.

```typescript
const natsConnection = this.client.unwrap<import('nats').NatsConnection>();
```

De même, vous pouvez accéder à l'instance de pilote sous-jacente du serveur :

```typescript
const natsConnection = server.unwrap<import('nats').NatsConnection>();
``