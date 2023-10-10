### Adaptateur HTTP

Il peut arriver que vous souhaitiez accéder au serveur HTTP sous-jacent, soit dans le contexte de l'application Nest, soit depuis l'extérieur.

Chaque instance de serveur/bibliothèque HTTP natif (spécifique à une plate-forme) (par exemple, Express et Fastify) est enveloppée dans un **adaptateur**. L'adaptateur est enregistré comme un fournisseur globalement disponible qui peut être récupéré dans le contexte de l'application, ainsi qu'injecté dans d'autres fournisseurs.

#### Stratégie externe au contexte de l'application

Pour obtenir une référence au `HttpAdapter` en dehors du contexte de l'application, appelez la méthode `getHttpAdapter()`.

```typescript
@@filename()
const app = await NestFactory.create(AppModule);
const httpAdapter = app.getHttpAdapter();
```

#### Stratégie interne

Pour obtenir une référence au `HttpAdapterHost` depuis le contexte de l'application, injectez-le en utilisant la même technique que n'importe quel autre fournisseur existant (par exemple, en utilisant l'injection de constructeur).

```typescript
@@filename()
export class CatsService {
  constructor(private adapterHost: HttpAdapterHost) {}
}
@@switch
@Dependencies(HttpAdapterHost)
export class CatsService {
  constructor(adapterHost) {
    this.adapterHost = adapterHost;
  }
}
```

> info **Astuce** `HttpAdapterHost` est importé du paquet `@nestjs/core`.

Le `HttpAdapterHost` n'est **pas** un véritable `HttpAdapter`. Pour obtenir l'instance réelle de `HttpAdapter`, il suffit d'accéder à la propriété `httpAdapter`.

```typescript
const adapterHost = app.get(HttpAdapterHost);
const httpAdapter = adapterHost.httpAdapter;
```

Le `httpAdapter` est l'instance réelle de l'adaptateur HTTP utilisé par le framework sous-jacent. C'est une instance de `ExpressAdapter` ou de `FastifyAdapter` (les deux classes étendent `AbstractHttpAdapter`).

L'objet adaptateur expose plusieurs méthodes utiles pour interagir avec le serveur HTTP. Cependant, si vous voulez accéder directement à l'instance de la bibliothèque (par exemple, l'instance Express), appelez la méthode `getInstance()`.

```typescript
const instance = httpAdapter.getInstance();
```
