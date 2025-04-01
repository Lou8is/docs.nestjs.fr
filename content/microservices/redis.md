### Redis

Le transporteur [Redis](https://redis.io/) met en œuvre le paradigme de messagerie publication/abonnement et exploite la fonctionnalité [Pub/Sub](https://redis.io/topics/pubsub) de Redis. Les messages publiés sont classés dans des canaux, sans savoir quels abonnés (s'il y en a) recevront finalement le message. Chaque microservice peut s'abonner à un nombre quelconque de canaux. En outre, il est possible de s'abonner à plus d'un canal à la fois. Les messages échangés par l'intermédiaire des canaux sont **fire-and-forget**, ce qui signifie que si un message est publié et qu'il n'y a pas d'abonnés intéressés, le message est supprimé et ne peut pas être récupéré. Vous n'avez donc aucune garantie que les messages ou les événements seront traités par au moins un service. Un même message peut être souscrit (et reçu) par plusieurs abonnés.

<figure><img class="illustrative-image" src="/assets/Redis_1.png" /></figure>

#### Installation

Pour commencer à construire des microservices basés sur Redis, installez d'abord le package requis :

```bash
$ npm i --save ioredis
```

#### Vue d'ensemble

Pour utiliser le transporteur Redis, passez l'objet d'options suivant à la méthode `createMicroservice()` :

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});
```

> info **Astuce** L'enum `Transport` est importé du package `@nestjs/microservices`.

#### Options

La propriété `options` est spécifique au transporteur choisi. Le transporteur **Redis** expose les propriétés décrites ci-dessous.

<table>
  <tr>
    <td><code>host</code></td>
    <td>URL de connexion</td>
  </tr>
  <tr>
    <td><code>port</code></td>
    <td>Port de connexion</td>
  </tr>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Nombre de tentatives d'envoi du message (par défaut : <code>0</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Délai entre les tentatives de renvoi des messages (ms) (par défaut :  <code>0</code>)</td>
  </tr>
   <tr>
    <td><code>wildcards</code></td>
    <td>Active les abonnements Redis wildcard, en demandant au transporteur d'utiliser <code>psubscribe</code>/<code>pmessage</code> sous le capot. (par défaut :  <code>false</code>)</td>
  </tr>
</table>

Toutes les propriétés supportées par le client officiel [ioredis](https://redis.github.io/ioredis/index.html#RedisOptions) sont également supportées par ce transporteur.

#### Client

Comme d'autres transporteurs de microservices, vous avez [plusieurs options](/microservices/basics#client) pour créer une instance Redis `ClientProxy`.

Une méthode pour créer une instance est d'utiliser le `ClientsModule`. Pour créer une instance de client avec le `ClientsModule`, importez-le et utilisez la méthode `register()` pour passer un objet options avec les mêmes propriétés que celles montrées ci-dessus dans la méthode `createMicroservice()`, ainsi qu'une propriété `name` à utiliser comme jeton d'injection. Apprenez en plus sur `ClientsModule` [ici](/microservices/basics#client).

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        }
      },
    ]),
  ]
  ...
})
```

D'autres options pour créer un client (soit `ClientProxyFactory` ou `@Client()`) peuvent également être utilisées. Vous pouvez en prendre connaissance [ici](/microservices/basics#client).

#### Contexte

Dans des scénarios plus complexes, vous pouvez avoir besoin d'accéder à des informations supplémentaires sur la requête entrante. Lorsque vous utilisez le transporteur Redis, vous pouvez accéder à l'objet `RedisContext`.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RedisContext) {
  console.log(`Channel: ${context.getChannel()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Channel: ${context.getChannel()}`);
}
```

> info **Astuce** `@Payload()`, `@Ctx()` et `RedisContext` sont importés du package `@nestjs/microservices`.

#### Jokers

Pour activer le support des jokers, mettez l'option `wildcards` à `true`. Cela indique au transporteur d'utiliser `psubscribe` et `pmessage` en interne.

```typescript
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: {
    // Other options
    wildcards: true,
  },
});
```

Veillez également à passer l'option `wildcards` lors de la création d'une instance de client.

Si cette option est activée, vous pouvez utiliser des caractères génériques dans vos modèles de messages et d'événements. Par exemple, pour s'abonner à tous les canaux commençant par `notifications`, vous pouvez utiliser le modèle suivant :

```typescript
@EventPattern('notifications.*')
```

#### Mises à jour de l'état de l'instance

Pour obtenir des mises à jour en temps réel sur la connexion et l'état de l'instance du pilote sous-jacent, vous pouvez vous abonner au flux `status`. Ce flux fournit des mises à jour d'état spécifiques au pilote choisi. Pour le pilote Redis, le flux `status` émet les événements `connected`, `disconnected`, et `reconnecting`.

```typescript
this.client.status.subscribe((status: RedisStatus) => {
  console.log(status);
});
```

> info **Astuce** Le type `RedisStatus` est importé du paquet `@nestjs/microservices`.

De même, vous pouvez vous abonner au flux `status` du serveur pour recevoir des notifications sur le statut du serveur.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RedisStatus) => {
  console.log(status);
});
```

#### Écouter les événements Redis

Dans certains cas, vous pouvez vouloir écouter les événements internes émis par le microservice. Par exemple, vous pourriez écouter l'événement `error` pour déclencher des opérations supplémentaires lorsqu'une erreur se produit. Pour ce faire, utilisez la méthode `on()`, comme montré ci-dessous :

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

De même, vous pouvez écouter les événements internes du serveur :

```typescript
server.on<RedisEvents>('error', (err) => {
  console.error(err);
});
```

> info **Astuce** The `RedisEvents` type is imported from the `@nestjs/microservices` package.

#### Accès au pilote sous-jacent

Pour des cas d'utilisation plus avancés, vous pouvez avoir besoin d'accéder à l'instance du pilote sous-jacent. Cela peut être utile pour des scénarios tels que la fermeture manuelle de la connexion ou l'utilisation de méthodes spécifiques au pilote. Cependant, gardez à l'esprit que dans la plupart des cas, vous **ne devriez pas avoir besoin** d'accéder directement au pilote.

Pour ce faire, vous pouvez utiliser la méthode `unwrap()`, qui renvoie l'instance du pilote sous-jacent. Le paramètre de type générique doit spécifier le type d'instance de pilote que vous attendez.

```typescript
const [pub, sub] =
  this.client.unwrap<[import('ioredis').Redis, import('ioredis').Redis]>();
```

De même, vous pouvez accéder à l'instance de pilote sous-jacente du serveur :

```typescript
const [pub, sub] =
  server.unwrap<[import('ioredis').Redis, import('ioredis').Redis]>();
```

Notez que, contrairement aux autres transporteurs, le transporteur Redis renvoie un tuple de deux instances `ioredis` : la première est utilisée pour publier des messages, et la seconde est utilisée pour s'abonner à des messages.