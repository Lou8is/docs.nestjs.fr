### Fournisseurs asynchrones

Parfois, le démarrage de l'application doit être retardé jusqu'à ce qu'une ou plusieurs **tâches asynchrones** soient terminées. Par exemple, il se peut que vous ne souhaitiez pas commencer à accepter des requêtes tant que la connexion avec la base de données n'a pas été établie. Vous pouvez y parvenir en utilisant des fournisseurs asynchrones.

La syntaxe pour cela est d'utiliser `async/await` avec la syntaxe `useFactory`. La factory renvoie une `Promise`, et la fonction factory peut `await` les tâches asynchrones. Nest attendra la résolution de la promesse avant d'instancier toute classe qui dépend d'un tel fournisseur (qui l'injecte).

```typescript
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection(options);
    return connection;
  },
}
```

> info **Astuce** Apprenez-en plus sur la syntaxe des fournisseurs personnalisés [ici](/fundamentals/custom-providers).

#### Injection

Les fournisseurs asynchrones sont injectés dans d'autres composants par leurs jetons, comme n'importe quel autre fournisseur. Dans l'exemple ci-dessus, vous utiliseriez la construction `@Inject('ASYNC_CONNECTION')`.

#### Exemple

[The TypeORM recipe](/recipes/sql-typeorm) présente un exemple plus substantiel de fournisseur asynchrone.
