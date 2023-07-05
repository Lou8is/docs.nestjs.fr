### CORS

Cross-origin resource sharing (CORS) (littéralement " partage de ressources entre origines multiples ") est un mécanisme qui permet de demander des ressources à un autre domaine. Sous le capot, Nest utilise le package Express [cors](https://github.com/expressjs/cors). Ce package fournit diverses options que vous pouvez personnaliser en fonction de vos besoins.

#### Pour commencer

Pour activer CORS, appelez la méthode `enableCors()` sur l'objet d'application Nest.

```typescript
const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(3000);
```

La méthode `enableCors()` prend en argument un objet de configuration optionnel. Les propriétés disponibles de cet objet sont décrites dans la documentation officielle [CORS](https://github.com/expressjs/cors#configuration-options). Une autre solution consiste à passer une [fonction callback](https://github.com/expressjs/cors#configuring-cors-asynchronously) qui vous permet de définir l'objet de configuration de manière asynchrone en fonction de la requête (à la volée).

Alternativement, activez CORS via l'objet options de la méthode `create()`. Mettez la propriété `cors` à `true` pour activer CORS avec les paramètres par défaut.
Ou bien, passez un [objet de configuration CORS](https://github.com/expressjs/cors#configuration-options) ou une [fonction callback](https://github.com/expressjs/cors#configuring-cors-asynchronously) comme valeur de la propriété `cors` pour personnaliser son comportement.

```typescript
const app = await NestFactory.create(AppModule, { cors: true });
await app.listen(3000);
```
