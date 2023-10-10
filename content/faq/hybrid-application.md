### Application hybride

Une application hybride est une application qui écoute les requêtes provenant de deux ou plusieurs sources différentes. Cela peut combiner un serveur HTTP avec un microservice listener ou même simplement plusieurs microservices listeners différents. La méthode par défaut `createMicroservice` ne permet pas de créer plusieurs serveurs, donc dans ce cas, chaque microservice doit être créé et démarré manuellement. Pour ce faire, l'instance `INestApplication` peut être connectée avec les instances `INestMicroservice` à travers la méthode `connectMicroservice()`.

```typescript
const app = await NestFactory.create(AppModule);
const microservice = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
});

await app.startAllMicroservices();
await app.listen(3001);
```

> info **Astuce** la méthode `app.listen(port)` démarre un serveur HTTP à l'adresse spécifiée. Si votre application ne gère pas de requêtes HTTP, vous devriez utiliser la méthode `app.init()` à la place.

Pour connecter plusieurs instances de microservices, il faut appeler `connectMicroservice()` pour chaque microservice :

```typescript
const app = await NestFactory.create(AppModule);
// microservice #1
const microserviceTcp = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
  options: {
    port: 3001,
  },
});
// microservice #2
const microserviceRedis = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});

await app.startAllMicroservices();
await app.listen(3001);
```

Pour lier `@MessagePattern()` à une seule stratégie de transport (par exemple, MQTT) dans une application hybride avec plusieurs microservices, nous pouvons passer le second argument de type `Transport` qui est une enum avec toutes les stratégies de transport intégrées définies.

```typescript
@@filename()
@MessagePattern('time.us.*', Transport.NATS)
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(@Payload() data: number[]) {
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*', Transport.NATS)
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@Bind(Payload(), Ctx())
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(data, context) {
  return new Date().toLocaleTimeString(...);
}
```

> info **Astuce** `@Payload()`, `@Ctx()`, `Transport` et `NatsContext` sont importés depuis `@nestjs/microservices`.

#### Partager la configuration

Par défaut, une application hybride n'hérite pas des pipes globaux, des intercepteurs, des guards et des filtres configurés pour l'application principale (basée sur HTTP).
Pour hériter de ces propriétés de configuration de l'application principale, définissez la propriété `inheritAppConfig` dans le second argument (un objet optionnel d'options) de l'appel `connectMicroservice()`, comme suit :

```typescript
const microservice = app.connectMicroservice<MicroserviceOptions>(
  {
    transport: Transport.TCP,
  },
  { inheritAppConfig: true },
);
```
