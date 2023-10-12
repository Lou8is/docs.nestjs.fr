### Pipes

Il n'y a pas de différence fondamentale entre les [pipes ordinaires](/pipes) et les pipes des sockets web. La seule différence est qu'au lieu de lancer `HttpException`, vous devriez utiliser `WsException`. De plus, tous les pipes ne seront appliqués qu'au paramètre `data` (parce que valider ou transformer l'instance `client` est inutile).

> info **Astuce** La classe `WsException` est exposée dans le package `@nestjs/websockets`.

#### Lier les pipes

L'exemple suivant utilise une pipe à portée de méthode instanciée manuellement. Tout comme pour les applications basées sur HTTP, vous pouvez également utiliser des pipes à l'échelle de la gateway (en préfixant la classe de la gateway avec un décorateur `@UsePipes()`).

```typescript
@@filename()
@UsePipes(new ValidationPipe())
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UsePipes(new ValidationPipe())
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```
