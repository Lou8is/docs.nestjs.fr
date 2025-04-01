### MQTT

[MQTT](https://mqtt.org/) (Message Queuing Telemetry Transport) est un protocole de messagerie léger et open source, optimisé pour une faible latence. Ce protocole offre un moyen évolutif et économique de connecter des appareils en utilisant un modèle **publish/subscribe**. Un système de communication basé sur MQTT se compose d'un serveur de publication, d'un courtier (broker) et d'un ou plusieurs clients. Il est conçu pour les appareils limités et les réseaux à faible largeur de bande, à forte latence ou peu fiables.

#### Installation

Pour commencer à construire des microservices basés sur MQTT, il faut d'abord installer le package requis :

```bash
$ npm i --save mqtt
```

#### Vue d'ensemble

Pour utiliser le transporteur MQTT, passez l'objet d'options suivant à la méthode `createMicroservice()` :

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
```

> info **Astuce** L'enum `Transport` est importé du package `@nestjs/microservices`.

#### Options

L'objet `options` est spécifique au transporteur choisi. Le transporteur **MQTT** expose les propriétés décrites [ici](https://github.com/mqttjs/MQTT.js/#mqttclientstreambuilder-options).

#### Client

Comme d'autres transporteurs de microservices, vous avez [plusieurs options](/microservices/basics#client) pour créer une instance MQTT `ClientProxy`.

Une méthode pour créer une instance est d'utiliser le `ClientsModule`. Pour créer une instance de client avec le `ClientsModule`, importez-le et utilisez la méthode `register()` pour passer un objet options avec les mêmes propriétés que celles montrées ci-dessus dans la méthode `createMicroservice()`, ainsi qu'une propriété `name` à utiliser comme jeton d'injection. Pour en savoir plus sur `ClientsModule` [ici](/microservices/basics#client).

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.MQTT,
        options: {
          url: 'mqtt://localhost:1883',
        }
      },
    ]),
  ]
  ...
})
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them [here](/microservices/basics#client).

#### Contexte

ans des scénarios plus complexes, vous pouvez avoir besoin d'accéder à des informations supplémentaires sur la requête entrante. Lorsque vous utilisez le transporteur MQTT, vous pouvez accéder à l'objet `MqttContext`.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

> info **Astuce** `@Payload()`, `@Ctx()` et `MqttContext` sont importés du package `@nestjs/microservices`.

Pour accéder au [paquet](https://github.com/mqttjs/mqtt-packet) mqtt original , utilisez la méthode `getPacket()` de l'objet `MqttContext`, comme suit :

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(context.getPacket());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getPacket());
}
```

#### Caractères génériques

Un abonnement peut porter sur un sujet explicite ou inclure des caractères génériques. Deux caractères génériques sont disponibles, `+` et `#`. `+` est un caractère générique à un seul niveau, tandis que `#` est un caractère générique à plusieurs niveaux qui couvre plusieurs niveaux de sujets.

```typescript
@@filename()
@MessagePattern('sensors/+/temperature/+')
getTemperature(@Ctx() context: MqttContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Ctx())
@MessagePattern('sensors/+/temperature/+')
getTemperature(context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

#### Qualité de Service (QoS)

Tout abonnement créé avec les décorateurs `@MessagePattern` ou `@EventPattern` s'abonnera avec la QoS 0. Si une QoS plus élevée est requise, elle peut être définie globalement en utilisant le bloc `subscribeOptions` lors de l'établissement de la connexion comme suit :

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
```

Si une qualité de service spécifique à un thème est nécessaire, il convient d'envisager la création d'un [transporteur personnalisé](/microservices/custom-transport).

#### Constructeurs d'enregistrements

Pour configurer les options du message (ajuster le niveau de QoS, définir les drapeaux Retain ou DUP, ou ajouter des propriétés supplémentaires à la charge utile), vous pouvez utiliser la classe `MqttRecordBuilder`. Par exemple, pour régler `QoS` sur `2`, utilisez la méthode `setQoS`, comme suit :

```typescript
const userProperties = { 'x-version': '1.0.0' };
const record = new MqttRecordBuilder(':cat:')
  .setProperties({ userProperties })
  .setQoS(1)
  .build();
client.send('replace-emoji', record).subscribe(...);
```

> info **Astuce** La classe `MqttRecordBuilder` est exportée du package `@nestjs/microservices`.

Vous pouvez également lire ces options côté serveur, en accédant au `MqttContext`.

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: MqttContext): string {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

Dans certains cas, vous pouvez vouloir configurer les propriétés de l'utilisateur pour plusieurs requêtes, vous pouvez passer ces options à la `ClientProxyFactory`.

```typescript
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.MQTT,
          options: {
            url: 'mqtt://localhost:1833',
            userProperties: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
```

#### Mises à jour de l'état de l'instance

Pour obtenir des mises à jour en temps réel sur la connexion et l'état de l'instance du pilote sous-jacent, vous pouvez vous abonner au flux `status`. Ce flux fournit des mises à jour d'état spécifiques au pilote choisi. Pour le pilote MQTT, le flux `status` émet les événements `connected`, `disconnected`, `reconnecting`, et `closed`.

```typescript
this.client.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
```

> info **Astuce** Le type `MqttStatus` est importé du package `@nestjs/microservices`.

De même, vous pouvez vous abonner au flux `status` du serveur pour recevoir des notifications sur le statut du serveur.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
```

#### Écoute des événements MQTT

Dans certains cas, vous pouvez vouloir écouter les événements internes émis par le microservice. Par exemple, vous pourriez écouter l'événement `error` pour déclencher des opérations supplémentaires lorsqu'une erreur se produit. Pour ce faire, utilisez la méthode `on()`, comme montré ci-dessous :

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

De même, vous pouvez écouter les événements internes du serveur :

```typescript
server.on<MqttEvents>('error', (err) => {
  console.error(err);
});
```

> info **Astuce** Le type `MqttEvents` est importé du paquetage `@nestjs/microservices`.

#### Accès au pilote sous-jacent

Pour des cas d'utilisation plus avancés, vous pouvez avoir besoin d'accéder à l'instance du pilote sous-jacent. Cela peut être utile pour des scénarios tels que la fermeture manuelle de la connexion ou l'utilisation de méthodes spécifiques au pilote. Cependant, gardez à l'esprit que dans la plupart des cas, vous **ne devriez pas avoir besoin** d'accéder directement au pilote.

Pour ce faire, vous pouvez utiliser la méthode `unwrap()`, qui renvoie l'instance du pilote sous-jacent. Le paramètre de type générique doit spécifier le type d'instance de pilote que vous attendez.

```typescript
const mqttClient = this.client.unwrap<import('mqtt').MqttClient>();
```

De même, vous pouvez accéder à l'instance de pilote sous-jacente du serveur :

```typescript
const mqttClient = server.unwrap<import('mqtt').MqttClient>();
```