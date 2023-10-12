### Intercepteurs

Il n'y a pas de différence entre les [intercepteurs ordinaires](/intercepteurs) et les intercepteurs de sockets web. L'exemple suivant utilise un intercepteur à portée de méthode instancié manuellement. Tout comme pour les applications basées sur HTTP, vous pouvez également utiliser des intercepteurs à l'échelle de la gateway (c'est-à-dire préfixer la classe de la gateway avec un décorateur `@UseInterceptors()`)).

```typescript
@@filename()
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```
