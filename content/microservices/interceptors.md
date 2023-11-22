### Intercepteurs

Il n'y a pas de différence entre les [intercepteurs ordinaires](/intercepteurs) et les intercepteurs de microservices. L'exemple suivant utilise un intercepteur à portée de méthode instancié manuellement. Tout comme pour les applications basées sur HTTP, vous pouvez également utiliser des intercepteurs à l'échelle du contrôleur (c'est-à-dire préfixer la classe du contrôleur avec un décorateur `@UseInterceptors()`).

```typescript
@@filename()
@UseInterceptors(new TransformInterceptor())
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@UseInterceptors(new TransformInterceptor())
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```
