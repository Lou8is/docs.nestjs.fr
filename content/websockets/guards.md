### Gardes

Il n'y a pas de différence fondamentale entre les gardes de sockets web et les [gardes d'applications HTTP ordinaires](/guards). La seule différence est qu'au lieu de lancer `HttpException`, vous devriez utiliser `WsException`.

> info **Astuce** La classe `WsException` est exposée dans le package `@nestjs/websockets`.

#### Lier les gardes

L'exemple suivant utilise un garde à l'échelle de la méthode. Comme pour les applications basées sur HTTP, vous pouvez également utiliser des protections au niveau de la gateway (en préfixant la classe de la gateway avec un décorateur `@UseGuards()`).

```typescript
@@filename()
@UseGuards(AuthGuard)
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UseGuards(AuthGuard)
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```
