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

Dans des scénarios plus sophistiqués, vous pouvez vouloir accéder à plus d'informations sur la requête entrante. Lorsque vous utilisez le transporteur Redis, vous pouvez accéder à l'objet `RedisContext`.

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
