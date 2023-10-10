### Préfixe global

Pour définir un préfixe pour **chaque route** enregistrée dans une application HTTP, utilisez la méthode `setGlobalPrefix()` de l'instance `INestApplication`.

```typescript
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('v1');
```

Vous pouvez exclure des routes du préfixe global en utilisant la construction suivante :

```typescript
app.setGlobalPrefix('v1', {
  exclude: [{ path: 'health', method: RequestMethod.GET }],
});
```

Vous pouvez également spécifier la route sous la forme d'une chaîne (elle s'appliquera à toutes les méthodes de requête) :

```typescript
app.setGlobalPrefix('v1', { exclude: ['cats'] });
```

> info **Astuce** La propriété `path` supporte les paramètres joker en utilisant le package [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters). Note : ceci n'accepte pas les astérisques `*`. A la place, vous devez utiliser des paramètres (par exemple, `(.*)`, `:splat*`).
