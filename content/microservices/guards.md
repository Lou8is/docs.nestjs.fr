### Gardes

Il n'y a pas de différence fondamentale entre les gardes microservices et les [gardes d'application HTTP ordinaires](/guards).
La seule différence est qu'au lieu de lancer `HttpException`, vous devriez utiliser `RpcException`.

> info **Astuce** La classe `RpcException` est exposée dans le package `@nestjs/microservices`.

#### Lier les gardes

L'exemple suivant utilise une garde à l'échelle de la méthode. Tout comme pour les applications basées sur HTTP, vous pouvez également utiliser des protections au niveau du contrôleur (c'est-à-dire préfixer la classe du contrôleur avec un décorateur `@UseGuards()`).

```typescript
@@filename()
@UseGuards(AuthGuard)
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@UseGuards(AuthGuard)
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```
