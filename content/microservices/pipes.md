### Pipes

Il n'y a pas de différence fondamentale entre les [pipes ordinaires](/pipes) et les pipes microservices. La seule différence est qu'au lieu de lancer `HttpException`, vous devriez utiliser `RpcException`.

> info **Astuce** La classe `RpcException` est exposée dans le package `@nestjs/microservices`.

#### Lier les pipes

L'exemple suivant utilise un pipe à portée de méthode instancié manuellement. Tout comme pour les applications basées sur HTTP, vous pouvez également utiliser des pipes à l'échelle du contrôleur (c'est-à-dire préfixer la classe du contrôleur avec un décorateur `@UsePipes()`).

```typescript
@@filename()
@UsePipes(new ValidationPipe())
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@UsePipes(new ValidationPipe())
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```
