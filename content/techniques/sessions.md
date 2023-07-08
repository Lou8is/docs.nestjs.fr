### Session

Les **sessions HTTP** permettent de stocker des informations sur l'utilisateur à travers plusieurs requêtes, ce qui est particulièrement utile pour les applications [MVC](/techniques/mvc).

#### Utilisation avec Express (par défaut)

Commencez par installer le [package requis](https://github.com/expressjs/session) (et ses types pour les utilisateurs de TypeScript) :

```shell
$ npm i express-session
$ npm i -D @types/express-session
```

Une fois l'installation terminée, appliquez le middleware `express-session` comme middleware global (par exemple, dans votre fichier `main.ts`).

```typescript
import * as session from 'express-session';
// quelque part dans votre fichier d'initialisation
app.use(
  session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
  }),
);
```

> warning **Remarque** Le stockage de session côté serveur par défaut n'est volontairement pas conçu pour un environnement de production. Il provoque des fuites de mémoire dans la plupart des cas, n'est pas extensible au-delà d'un seul processus et est destiné au débogage et au développement. Pour en savoir plus, consultez le [dépôt officiel](https://github.com/expressjs/session).

Le `secret` est utilisé pour signer le cookie d'identification de session. Il peut s'agir d'une chaîne de caractères pour un seul secret, ou d'un tableau de plusieurs secrets. Si un tableau de secrets est fourni, seul le premier élément sera utilisé pour signer le cookie d'identification de session, tandis que tous les éléments seront pris en compte lors de la vérification de la signature dans les requêtes. Le secret lui-même ne doit pas être facilement analysé par un être humain et doit de préférence être un ensemble aléatoire de caractères.

Activer l'option `resave` force la session à être sauvegardée dans le magasin de session, même si la session n'a jamais été modifiée durant la requête. La valeur par défaut est `true`, mais l'utilisation de la valeur par défaut a été dépréciée, car la valeur par défaut changera dans le futur.

De même, l'activation de l'option `saveUninitialized` force une session "non initialisée" à être sauvegardée dans le stockage. Une session est non initialisée lorsqu'elle est nouvelle mais non modifiée. Choisir `false` est utile pour mettre en place des sessions de connexion, réduire l'utilisation du stockage du serveur, ou se conformer aux lois qui requièrent une permission avant de mettre en place un cookie. Choisir `false` aidera aussi à résoudre les conditions de concurrence lorsqu'un client fait plusieurs requêtes parallèles sans session ([source](https://github.com/expressjs/session#saveuninitialized)).

Vous pouvez passer plusieurs autres options au middleware `session`, pour en savoir plus, consultez la [documentation API](https://github.com/expressjs/session#options).

> info **Astuce** Veuillez noter que `secure : true` est une option recommandée. Cependant, elle nécessite un site web compatible avec le protocole HTTPS, c'est-à-dire que le protocole HTTPS est nécessaire pour sécuriser les cookies. Si l'option secure est activée, et que vous accédez à votre site par HTTP, le cookie ne sera pas activé. Si vous avez votre node.js derrière un proxy et que vous utilisez `secure : true`, vous devez définir `"trust proxy"` dans express.

Ainsi, vous pouvez désormais définir et lire les valeurs de session à partir des gestionnaires d'itinéraires, comme suit :

```typescript
@Get()
findAll(@Req() request: Request) {
  request.session.visits = request.session.visits ? request.session.visits + 1 : 1;
}
```

> info **Astuce** Le décorateur `@Req()` est importé du package `@nestjs/common`, tandis que `Request` est importé du package `express`.

Vous pouvez également utiliser le décorateur `@Session()` pour extraire un objet de session de la requête, comme suit :

```typescript
@Get()
findAll(@Session() session: Record<string, any>) {
  session.visits = session.visits ? session.visits + 1 : 1;
}
```

> info **Astuce** Le décorateur `@Session()` est importé du package `@nestjs/common`.

#### Utilisation avec Fastify

Installez d'abord le package requis :

```shell
$ npm i @fastify/secure-session
```

Une fois l'installation terminée, enregistrez le plugin `fastify-secure-session` :

```typescript
import secureSession from '@fastify/secure-session';

// quelque part dans votre fichier d'initialisation
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
await app.register(secureSession, {
  secret: 'unetreslonguephraseplusgrandequetrentedeuxcaracteres',
  salt: 'mq9hDxBVDbspDR6n',
});
```

> info **Astuce** Vous pouvez également prégénérer une clé ([voir instructions](https://github.com/fastify/fastify-secure-session)) ou utiliser la [rotation des clés](https://github.com/fastify/fastify-secure-session#using-keys-with-key-rotation).

Pour en savoir plus sur les options disponibles, consultez le [dépôt officiel](https://github.com/fastify/fastify-secure-session).

Ainsi, vous pouvez désormais définir et lire les valeurs de session à partir des gestionnaires de routes, comme suit :

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  const visits = request.session.get('visits');
  request.session.set('visits', visits ? visits + 1 : 1);
}
```

Vous pouvez également utiliser le décorateur `@Session()` pour extraire un objet de session de la requête, comme suit :

```typescript
@Get()
findAll(@Session() session: secureSession.Session) {
  const visits = session.get('visits');
  session.set('visits', visits ? visits + 1 : 1);
}
```

> info **Astuce** Le décorateur `@Session()` est importé depuis `@nestjs/common`, tandis que `secureSession.Session` est importé depuis le package `@fastify/secure-session` (déclaration d'importation : `import * as secureSession from '@fastify/secure-session'`).
