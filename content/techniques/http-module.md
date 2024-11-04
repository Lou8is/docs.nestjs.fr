### Module HTTP

[Axios](https://github.com/axios/axios) est un package de client HTTP riche en fonctionnalités et largement utilisé. Nest encapsule Axios et l'expose via le `HttpModule` intégré. Le `HttpModule` exporte la classe `HttpService`, qui expose les méthodes basées sur Axios pour effectuer des requêtes HTTP. La bibliothèque transforme également les réponses HTTP résultantes en `Observables`.

> info **Astuce** Vous pouvez également utiliser directement n'importe quelle bibliothèque client HTTP Node.js, y compris [got](https://github.com/sindresorhus/got) ou [undici](https://github.com/nodejs/undici).

#### Installation

Pour commencer à l'utiliser, nous devons d'abord installer les dépendances nécessaires.

```bash
$ npm i --save @nestjs/axios axios
```

#### Pour commencer

Une fois le processus d'installation terminé, pour utiliser le `HttpService`, il faut d'abord importer le `HttpModule`.

```typescript
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}
```

Ensuite, injecter `HttpService` en utilisant l'injection normale de constructeur.

> info **Astuce** Les modules `HttpModule` et `HttpService` sont importés du package `@nestjs/axios`.

```typescript
@@filename()
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Observable<AxiosResponse<Cat[]>> {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
@@switch
@Injectable()
@Dependencies(HttpService)
export class CatsService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  findAll() {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
```

> info **Astuce** `AxiosResponse` est une interface exportée depuis le package `axios` (`$ npm i axios`).

Toutes les méthodes `HttpService` retournent un objet `AxiosResponse` enveloppé dans un objet `Observable`.

#### Configuration

[Axios](https://github.com/axios/axios) peut être configuré avec une variété d'options pour personnaliser le comportement du `HttpService`. Lisez-en plus à leur sujet [ici](https://github.com/axios/axios#request-config). Pour configurer l'instance Axios sous-jacente, passez un objet facultatif d'options à la méthode `register()` de `HttpModule` lors de son importation. Cet objet options sera passé directement au constructeur d'Axios sous-jacent.

```typescript
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [CatsService],
})
export class CatsModule {}
```

#### Configuration asynchrone

Lorsque vous avez besoin de passer des options de module de manière asynchrone plutôt que statique, utilisez la méthode `registerAsync()`. Comme pour la plupart des modules dynamiques, Nest fournit plusieurs techniques pour gérer la configuration asynchrone.

Une technique consiste à utiliser une fonction factory :

```typescript
HttpModule.registerAsync({
  useFactory: () => ({
    timeout: 5000,
    maxRedirects: 5,
  }),
});
```

Comme les autres fournisseurs d'usine, notre fonction d'usine peut être [async](/fundamentals/custom-providers#fournisseurs-de-factory--usefactory) et peut injecter des dépendances via `inject`.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    timeout: configService.get('HTTP_TIMEOUT'),
    maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
  }),
  inject: [ConfigService],
});
```

Alternativement, vous pouvez configurer le `HttpModule` en utilisant une classe au lieu d'une fabrique, comme montré ci-dessous.

```typescript
HttpModule.registerAsync({
  useClass: HttpConfigService,
});
```

La construction ci-dessus instancie `HttpConfigService` dans `HttpModule`, en l'utilisant pour créer un objet options. Notez que dans cet exemple, le `HttpConfigService` doit implémenter l'interface `HttpModuleOptionsFactory` comme montré ci-dessous. Le `HttpModule` appellera la méthode `createHttpOptions()` sur l'objet instancié de la classe fournie.

```typescript
@Injectable()
class HttpConfigService implements HttpModuleOptionsFactory {
  createHttpOptions(): HttpModuleOptions {
    return {
      timeout: 5000,
      maxRedirects: 5,
    };
  }
}
```

Si vous voulez réutiliser un fournisseur d'options existant au lieu de créer une copie privée dans le `HttpModule`, utilisez la syntaxe `useExisting`.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useExisting: HttpConfigService,
});
```

Vous pouvez également passer ce que l'on appelle des `extraProviders` à la méthode `registerAsync()`. Ces fournisseurs seront fusionnés avec les fournisseurs du module.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

C'est utile lorsque vous souhaitez fournir des dépendances supplémentaires à la fonction d'usine ou au constructeur de la classe.

#### Utilisation directe d'Axios

Si vous pensez que les options de `HttpModule.register` ne sont pas suffisantes pour vous, ou si vous voulez juste accéder à l'instance Axios sous-jacente créée par `@nestjs/axios`, vous pouvez y accéder via `HttpService#axiosRef` comme suit :

```typescript
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Promise<AxiosResponse<Cat[]>> {
    return this.httpService.axiosRef.get('http://localhost:3000/cats');
    //                      ^ AxiosInstance interface
  }
}
```

#### Exemple complet

Puisque la valeur de retour des méthodes `HttpService` est un Observable, nous pouvons utiliser `rxjs` - `firstValueFrom` ou `lastValueFrom` pour récupérer les données de la requête sous la forme d'une promesse.

```typescript
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);
  constructor(private readonly httpService: HttpService) {}

  async findAll(): Promise<Cat[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<Cat[]>('http://localhost:3000/cats').pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }
}
```

> info **Astuce** Consultez la documentation de RxJS sur [`firstValueFrom`](https://rxjs.dev/api/index/function/firstValueFrom) et [`lastValueFrom`](https://rxjs.dev/api/index/function/lastValueFrom) pour connaître les différences entre les deux.
