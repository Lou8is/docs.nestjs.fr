### HTTPS

Pour créer une application qui utilise le protocole HTTPS, définissez la propriété `httpsOptions` dans l'objet options passé à la méthode `create()` de la classe `NestFactory` :

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};
const app = await NestFactory.create(AppModule, {
  httpsOptions,
});
await app.listen(3000);
```

Si vous utilisez l'adaptateur `FastifyAdapter`, créez l'application comme suit :

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ https: httpsOptions }),
);
```

#### Plusieurs serveurs simultanés

La recette suivante montre comment instancier une application Nest qui écoute simultanément sur plusieurs ports (par exemple, sur un port non-HTTPS et sur un port HTTPS).

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};

const server = express();
const app = await NestFactory.create(
  AppModule,
  new ExpressAdapter(server),
);
await app.init();

const httpServer = http.createServer(server).listen(3000);
const httpsServer = https.createServer(httpsOptions, server).listen(443);
```

Parce que nous avons appelé `http.createServer` / `https.createServer` nous-mêmes, NestJS ne les ferme pas lors de l'appel à `app.close` / sur le signal de fin. Nous devons le faire nous-mêmes :

```typescript
@Injectable()
export class ShutdownObserver implements OnApplicationShutdown {
  private httpServers: http.Server[] = [];

  public addHttpServer(server: http.Server): void {
    this.httpServers.push(server);
  }

  public async onApplicationShutdown(): Promise<void> {
    await Promise.all(
      this.httpServers.map((server) =>
        new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve(null);
            }
          });
        })
      ),
    );
  }
}

const shutdownObserver = app.get(ShutdownObserver);
shutdownObserver.addHttpServer(httpServer);
shutdownObserver.addHttpServer(httpsServer);
```

> info **Astuce** L'adaptateur `ExpressAdapter` est importé depuis le paquet `@nestjs/platform-express`. Les paquets `http` et `https` sont des paquets natifs de Node.js.

> **Attention** Cette recette ne fonctionne pas avec les [Subscriptions GraphQL](/graphql/subscriptions).
