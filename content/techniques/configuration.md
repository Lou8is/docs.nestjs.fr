### Configuration

Les applications fonctionnent souvent dans différents **environnements**. Selon l'environnement, différents paramètres de configuration doivent être utilisés. Par exemple, l'environnement local s'appuie généralement sur des identifiants de base de données spécifiques, valables uniquement pour l'instance locale de la base de données. L'environnement de production utilise un ensemble distinct d'identifiants de base de données. Étant donné que les variables de configuration changent, la meilleure pratique consiste à [stocker les variables de configuration](https://12factor.net/config) dans l'environnement.

Les variables d'environnement définies à l'extérieur sont visibles à l'intérieur de Node.js à travers la variable globale `process.env`. Nous pourrions essayer de résoudre le problème des environnements multiples en définissant les variables d'environnement séparément dans chaque environnement. Cela peut rapidement devenir compliqué, en particulier dans les environnements de développement et de test où ces valeurs doivent être facilement simulées et/ou modifiées.

Dans les applications Node.js, il est courant d'utiliser des fichiers `.env`, contenant des paires clé-valeur où chaque clé représente une valeur particulière, pour représenter chaque environnement. L'exécution d'une application dans différents environnements n'est alors qu'une question de permutation du bon fichier `.env`.

Une bonne approche pour utiliser cette technique dans Nest est de créer un `ConfigModule` qui expose un `ConfigService` qui charge le fichier `.env` approprié. Bien que vous puissiez choisir d'écrire un tel module vous-même, Nest fournit le package `@nestjs/config` prêt à l'emploi. Nous couvrirons ce package dans le chapitre actuel.

#### Installation

Pour commencer à l'utiliser, nous devons d'abord installer les dépendances nécessaires.

```bash
$ npm i --save @nestjs/config
```

> info **Astuce** Le package `@nestjs/config` utilise en interne [dotenv](https://github.com/motdotla/dotenv).

> warning **Remarque** `@nestjs/config` nécessite TypeScript 4.1 ou plus récent.

#### Pour commencer

Une fois le processus d'installation terminé, nous pouvons importer le `ConfigModule`. Typiquement, nous l'importerons dans le module racine `AppModule` et contrôlerons son comportement en utilisant la méthode statique `.forRoot()`. Au cours de cette étape, les paires clé/valeur des variables d'environnement sont analysées et résolues. Plus tard, nous verrons plusieurs options pour accéder à la classe `ConfigService` du `ConfigModule` dans nos autres modules de fonctionnalités.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

Le code ci-dessus va charger et analyser un fichier `.env` depuis l'emplacement par défaut (le répertoire racine du projet), fusionner les paires clé/valeur du fichier `.env` avec les variables d'environnement assignées à `process.env`, et stocker le résultat dans une structure privée à laquelle vous pouvez accéder à travers le `ConfigService`. La méthode `forRoot()` enregistre le fournisseur `ConfigService`, qui fournit une méthode `get()` pour lire ces variables de configuration analysées/fusionnées. Comme `@nestjs/config` repose sur [dotenv](https://github.com/motdotla/dotenv), il utilise les règles de ce package pour résoudre les conflits de noms de variables d'environnement. Lorsqu'une clé existe à la fois dans l'environnement d'exécution en tant que variable d'environnement (par exemple, via des exports shell OS comme `export DATABASE_USER=test`) et dans un fichier `.env`, la variable d'environnement d'exécution a la priorité.

Un exemple de fichier `.env` ressemble à ceci :

```json
DATABASE_USER=test
DATABASE_PASSWORD=test
```

#### Chemin d'accès personnalisé au fichier env

Par défaut, le package recherche un fichier `.env` dans le répertoire racine de l'application. Pour spécifier un autre chemin pour le fichier `.env`, définissez la propriété `envFilePath` d'un objet d'options (optionnel) que vous passez à `forRoot()`, comme suit :

```typescript
ConfigModule.forRoot({
  envFilePath: '.development.env',
});
```

Vous pouvez également spécifier plusieurs chemins pour les fichiers `.env` comme ceci :

```typescript
ConfigModule.forRoot({
  envFilePath: ['.env.development.local', '.env.development'],
});
```

Si une variable se trouve dans plusieurs fichiers, le premier est prioritaire.

#### Désactiver le chargement des variables d'environnement

Si vous ne voulez pas charger le fichier `.env`, mais plutôt accéder aux variables d'environnement depuis l'environnement d'exécution (comme avec les exportations du shell OS comme `export DATABASE_USER=test`), mettez la propriété `ignoreEnvFile` de l'objet options à `true`, comme suit :

```typescript
ConfigModule.forRoot({
  ignoreEnvFile: true,
});
```

#### Utilisation globale du module

Lorsque vous voudrez utiliser `ConfigModule` dans d'autres modules, vous devrez l'importer (comme c'est le cas pour tout module Nest). Alternativement, vous pouvez le déclarer comme [module global](/modules#modules-globaux) en mettant la propriété `isGlobal` de l'objet options à `true`, comme montré ci-dessous. Dans ce cas, vous n'aurez pas besoin d'importer `ConfigModule` dans d'autres modules une fois qu'il aura été chargé dans le module racine (par exemple, `AppModule`).

```typescript
ConfigModule.forRoot({
  isGlobal: true,
});
```

#### Fichiers de configuration personnalisés

Pour les projets plus complexes, vous pouvez utiliser des fichiers de configuration personnalisés pour renvoyer des objets de configuration imbriqués. Cela vous permet de regrouper les paramètres de configuration connexes par fonction (par exemple, les paramètres liés à la base de données) et de stocker les paramètres connexes dans des fichiers individuels pour faciliter leur gestion indépendante.

Un fichier de configuration personnalisé exporte une fonction factory qui renvoie un objet de configuration. L'objet de configuration peut être n'importe quel objet JavaScript simple imbriqué arbitrairement. L'objet `process.env` contiendra les paires clé/valeur des variables d'environnement entièrement résolues (avec le fichier `.env` et les variables définies en externe résolues et fusionnées comme décrit <a href="techniques/configuration#pour-commencer">ci-dessus</a>). Puisque vous contrôlez l'objet de configuration retourné, vous pouvez ajouter toute logique nécessaire pour convertir les valeurs en un type approprié, définir des valeurs par défaut, etc. Par exemple :

```typescript
@@filename(config/configuration)
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  }
});
```

Nous chargeons ce fichier en utilisant la propriété `load` de l'objet options que nous passons à la méthode `ConfigModule.forRoot()` :

```typescript
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
```

> info **Remarque** La valeur assignée à la propriété `load` est un tableau, ce qui vous permet de charger plusieurs fichiers de configuration (par exemple `load : [databaseConfig, authConfig]`).

Avec les fichiers de configuration personnalisés, nous pouvons également gérer des fichiers personnalisés tels que les fichiers YAML. Voici un exemple de configuration au format YAML :

```yaml
http:
  host: 'localhost'
  port: 8080

db:
  postgres:
    url: 'localhost'
    port: 5432
    database: 'yaml-db'

  sqlite:
    database: 'sqlite.db'
```

Pour lire et analyser les fichiers YAML, nous pouvons utiliser le package `js-yaml`.

```bash
$ npm i js-yaml
$ npm i -D @types/js-yaml
```

Une fois le package installé, nous utilisons la fonction `yaml#load` pour charger le fichier YAML que nous venons de créer.

```typescript
@@filename(config/configuration)
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const YAML_CONFIG_FILENAME = 'config.yaml';

export default () => {
  return yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};
```

> warning **Note** Nest CLI ne déplace pas automatiquement vos "assets" (fichiers non-TS) dans le dossier `dist` pendant le processus de construction. Pour vous assurer que vos fichiers YAML sont copiés, vous devez le spécifier dans l'objet `compilerOptions#assets` du fichier `nest-cli.json`. Par exemple, si le dossier `config` est au même niveau que le dossier `src`, ajoutez `compilerOptions#assets` avec la valeur `"assets" : [{{ '{' }}"include" : "../config/*.yaml", "outDir" : "./dist/config"{{ '}' }}]`. En savoir plus [ici](/cli/monorepo#assets).

<app-banner-devtools></app-banner-devtools>

#### Utilisation de `ConfigService`

Pour accéder aux valeurs de configuration de notre `ConfigService`, nous devons d'abord injecter `ConfigService`. Comme pour tout fournisseur, nous devons importer le module qui le contient - le `ConfigModule` - dans le module qui l'utilisera (à moins que vous n'ayez mis la propriété `isGlobal` dans l'objet options passé à la méthode `ConfigModule.forRoot()` à `true`). Importez-le dans un module de fonctionnalité comme indiqué ci-dessous.

```typescript
@@filename(feature.module)
@Module({
  imports: [ConfigModule],
  // ...
})
```

Nous pouvons ensuite l'injecter à l'aide de l'injection de constructeur standard :

```typescript
constructor(private configService: ConfigService) {}
```

> info **Astuce** Le `ConfigService` est importé du package `@nestjs/config`.

Et l'utiliser dans notre classe :

```typescript
// obtenir une variable d'environnement
const dbUser = this.configService.get<string>('DATABASE_USER');

// obtenir une valeur de configuration personnalisée
const dbHost = this.configService.get<string>('database.host');
```

Comme indiqué ci-dessus, utilisez la méthode `configService.get()` pour obtenir une simple variable d'environnement en passant le nom de la variable. Vous pouvez faire une indication de type TypeScript en passant le type, comme indiqué ci-dessus (par exemple, `get<string>(...)`). La méthode `get()` peut également traverser un objet de configuration personnalisé imbriqué (créé via un <a href="techniques/configuration#fichiers-de-configuration-personnalisés">fichier de configuration personnalisé</a>), comme le montre le deuxième exemple ci-dessus.

Vous pouvez également obtenir l'ensemble de l'objet de configuration personnalisée imbriqué en utilisant une interface comme indication de type :

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
}

const dbConfig = this.configService.get<DatabaseConfig>('database');

// vous pouvez maintenant utiliser `dbConfig.port` et `dbConfig.host`.
const port = dbConfig.port;
```

La méthode `get()` prend également un deuxième argument facultatif définissant une valeur par défaut, qui sera renvoyée si la clé n'existe pas, comme indiqué ci-dessous :

```typescript
// utiliser "localhost" lorsque "database.host" n'est pas défini
const dbHost = this.configService.get<string>('database.host', 'localhost');
```

`ConfigService` a deux génériques optionnels (arguments de type). Le premier permet d'éviter d'accéder à une propriété de configuration qui n'existe pas. Utilisez-le comme indiqué ci-dessous :

```typescript
interface EnvironmentVariables {
  PORT: number;
  TIMEOUT: string;
}

// quelque part dans le code
constructor(private configService: ConfigService<EnvironmentVariables>) {
  const port = this.configService.get('PORT', { infer: true });

  // Erreur TypeScript : ceci n'est pas valide car la propriété URL n'est pas définie dans EnvironmentVariables
  const url = this.configService.get('URL', { infer: true });
}
```

Avec la propriété `infer` fixée à `true`, la méthode `ConfigService#get` va automatiquement inférer le type de propriété basé sur l'interface, donc par exemple, `typeof port === "number"` (si vous n'utilisez pas le flag `strictNullChecks` de TypeScript) puisque `PORT` a un type `number` dans l'interface `EnvironmentVariables`.

De plus, avec la fonctionnalité `infer`, vous pouvez déduire le type d'une propriété d'un objet de configuration personnalisé imbriqué, même en utilisant la notation par points, comme suit :

```typescript
constructor(private configService: ConfigService<{ database: { host: string } }>) {
  const dbHost = this.configService.get('database.host', { infer: true })!;
  // typeof dbHost === "string"                                          |
  //                                                                     +--> opérateur d'assertion non-nul
}
```

Le second générique s'appuie sur le premier, agissant comme une assertion de type pour se débarrasser de tous les types `indéfinis` que les méthodes de `ConfigService` peuvent retourner lorsque `strictNullChecks` est activé. Par exemple :

```typescript
// ...
constructor(private configService: ConfigService<{ PORT: number }, true>) {
  //                                                               ^^^^
  const port = this.configService.get('PORT', { infer: true });
  //    ^^^ Le type de port sera "number", ce qui rend inutile les assertions de type TS.
}
```

#### Espaces de noms de configuration

Le module `ConfigModule` vous permet de définir et de charger plusieurs fichiers de configuration personnalisés, comme indiqué dans <a href="techniques/configuration#fichiers-de-configuration-personnalisés">Fichiers de configuration personnalisés</a> ci-dessus. Vous pouvez gérer des hiérarchies d'objets de configuration complexes avec des objets de configuration imbriqués, comme indiqué dans cette section. Vous pouvez également renvoyer un objet de configuration "à espace de noms" avec la fonction `registerAs()` comme suit :

```typescript
@@filename(config/database.config)
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432
}));
```

Comme pour les fichiers de configuration personnalisés, dans votre fonction d'usine `registerAs()`, l'objet `process.env` contiendra les paires clé/valeur des variables d'environnement entièrement résolues (avec le fichier `.env` et les variables définies en externe résolues et fusionnées comme décrit <a href="techniques/configuration#pour-commencer">ci-dessus</a>).

> info **Astuce** La fonction `registerAs` est exportée du package `@nestjs/config`.

Chargez une configuration en espace de noms avec la propriété `load` de l'objet options de la méthode `forRoot()`, de la même manière que vous chargez un fichier de configuration personnalisé :

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
  ],
})
export class AppModule {}
```

Maintenant, pour obtenir la valeur `host` de l'espace de noms `database`, utilisez la notation par points. Utilisez `'database'` comme préfixe au nom de la propriété, correspondant au nom de l'espace de noms (passé comme premier argument à la fonction `registerAs()`) :

```typescript
const dbHost = this.configService.get<string>('database.host');
```

Une alternative raisonnable est d'injecter directement l'espace de noms `database`. Cela nous permet de bénéficier d'un typage fort :

```typescript
constructor(
  @Inject(databaseConfig.KEY)
  private dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

> info **AStuce** Le `ConfigType` est exporté depuis le package `@nestjs/config`.

#### Variables d'environnement du cache

Comme l'accès à `process.env` peut être lent, vous pouvez définir la propriété `cache` de l'objet options passé à `ConfigModule.forRoot()` pour augmenter les performances de la méthode `ConfigService#get` lorsqu'il s'agit de variables stockées dans `process.env`.

```typescript
ConfigModule.forRoot({
  cache: true,
});
```

#### Enregistrement partiel

Jusqu'à présent, nous avons traité les fichiers de configuration dans notre module racine (par exemple, `AppModule`), avec la méthode `forRoot()`. Peut-être avez-vous une structure de projet plus complexe, avec des fichiers de configuration spécifiques situés dans plusieurs répertoires différents. Plutôt que de charger tous ces fichiers dans le module racine, le package `@nestjs/config` fournit une fonctionnalité appelée **enregistrement partiel**, qui référence seulement les fichiers de configuration associés à chaque module de fonctionnalité. Utilisez la méthode statique `forFeature()` à l'intérieur d'un module de fonctionnalité pour effectuer cet enregistrement partiel, comme suit :

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
})
export class DatabaseModule {}
```

> info **Attention** Dans certaines circonstances, vous pouvez avoir besoin d'accéder aux propriétés chargées via l'enregistrement partiel en utilisant le hook `onModuleInit()`, plutôt que dans un constructeur. En effet, la méthode `forFeature()` est exécutée pendant l'initialisation du module, et l'ordre d'initialisation du module est indéterminé. Si vous accédez à des valeurs chargées de cette manière par un autre module, dans un constructeur, le module dont dépend la configuration peut ne pas avoir été initialisé. La méthode `onModuleInit()` ne s'exécute qu'après l'initialisation de tous les modules dont elle dépend, cette technique est donc sûre.

#### Validation du schéma

Il est d'usage de lever une exception au démarrage de l'application si les variables d'environnement requises n'ont pas été fournies ou si elles ne respectent pas certaines règles de validation. Le package `@nestjs/config` offre deux façons différentes de le faire :

- Le validateur intégré [Joi](https://github.com/sideway/joi). Avec Joi, vous définissez un schéma d'objet et validez les objets JavaScript en fonction de ce schéma.
- Une fonction personnalisée `validate()` qui prend des variables d'environnement en entrée.

Pour utiliser Joi, nous devons installer le package Joi :

```bash
$ npm install --save joi
```

Nous pouvons maintenant définir un schéma de validation Joi et le passer via la propriété `validationSchema` de l'objet options de la méthode `forRoot()`, comme indiqué ci-dessous :

```typescript
@@filename(app.module)
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(3000),
      }),
    }),
  ],
})
export class AppModule {}
```

Par défaut, toutes les clés de schéma sont considérées comme optionnelles. Ici, nous fixons des valeurs par défaut pour `NODE_ENV` et `PORT` qui seront utilisées si nous ne fournissons pas ces variables dans l'environnement (fichier `.env` ou environnement du processus). Alternativement, nous pouvons utiliser la méthode de validation `required()` pour exiger qu'une valeur soit définie dans l'environnement (fichier `.env` ou environnement du processus). Dans ce cas, l'étape de validation lèvera une exception si nous ne fournissons pas la variable dans l'environnement. Voir [Méthodes de validation Joi](https://joi.dev/api/?v=17.3.0#example) pour plus d'informations sur la façon de construire des schémas de validation.

Par défaut, les variables d'environnement inconnues (variables d'environnement dont les clés ne sont pas présentes dans le schéma) sont autorisées et ne déclenchent pas d'exception de validation. Par défaut, toutes les erreurs de validation sont signalées. Vous pouvez modifier ces comportements en passant un objet d'options via la clé `validationOptions` de l'objet d'options `forRoot()`. Cet objet d'options peut contenir n'importe laquelle des propriétés d'options de validation standard fournies par les [Options de validation Joi](https://joi.dev/api/?v=17.3.0#anyvalidatevalue-options). Par exemple, pour inverser les deux paramètres ci-dessus, passez des options comme ceci :

```typescript
@@filename(app.module)
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(3000),
      }),
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
  ],
})
export class AppModule {}
```

Le package `@nestjs/config` utilise les paramètres par défaut de :

- `allowUnknown` : permet d'autoriser ou non les clés inconnues dans les variables d'environnement. La valeur par défaut est `true`
- `abortEarly` : si true, arrête la validation à la première erreur ; si false, retourne toutes les erreurs. La valeur par défaut est `false`.

Notez qu'une fois que vous avez décidé de passer un objet `validationOptions`, tous les paramètres que vous ne passez pas explicitement prendront par défaut les valeurs standard de `Joi` (et non les valeurs par défaut de `@nestjs/config`). Par exemple, si vous laissez `allowUnknowns` non spécifié dans votre objet `validationOptions` personnalisé, il aura la valeur par défaut `Joi` de `false`. Il est donc probablement plus sûr de spécifier **ces deux** paramètres dans votre objet personnalisé.

#### Fonction de validation personnalisée

Alternativement, vous pouvez spécifier une fonction **synchrone** `validate` qui prend un objet contenant les variables d'environnement (du fichier env et du processus) et retourne un objet contenant les variables d'environnement validées afin que vous puissiez les convertir/muter si nécessaire. Si la fonction génère une erreur, cela empêchera l'application de démarrer.

Dans cet exemple, nous allons procéder avec les packages `class-transformer` et `class-validator`. Tout d'abord, nous devons définir :

- une classe avec des contraintes de validation,
- une fonction de validation qui utilise les fonctions `plainToInstance` et `validateSync`.

```typescript
@@filename(env.validation)
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, validateSync } from 'class-validator';

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
```

Avec ceci en place, utilisez la fonction `validate` comme option de configuration du `ConfigModule`, comme suit :

```typescript
@@filename(app.module)
import { validate } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
    }),
  ],
})
export class AppModule {}
```

#### Fonctions getter personnalisées

`ConfigService` définit une méthode générique `get()` pour récupérer une valeur de configuration par clé. Nous pouvons également ajouter des fonctions `getter` pour permettre un style de codage un peu plus naturel :

```typescript
@@filename()
@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isAuthEnabled(): boolean {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
@@switch
@Dependencies(ConfigService)
@Injectable()
export class ApiConfigService {
  constructor(configService) {
    this.configService = configService;
  }

  get isAuthEnabled() {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
```

Nous pouvons maintenant utiliser la fonction getter comme suit :

```typescript
@@filename(app.service)
@Injectable()
export class AppService {
  constructor(apiConfigService: ApiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // L'authentification est activée
    }
  }
}
@@switch
@Dependencies(ApiConfigService)
@Injectable()
export class AppService {
  constructor(apiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // L'authentification est activée
    }
  }
}
```

#### Hook des variables d'environnement chargées

Si la configuration d'un module dépend des variables d'environnement, et que ces variables sont chargées depuis le fichier `.env`, vous pouvez utiliser le hook `ConfigModule.envVariablesLoaded` pour vous assurer que le fichier a été chargé avant d'interagir avec l'objet `process.env`, voir l'exemple suivant :

```typescript
export async function getStorageModule() {
  await ConfigModule.envVariablesLoaded;
  return process.env.STORAGE === 'S3' ? S3StorageModule : DefaultStorageModule;
}
```

Cette construction garantit qu'après la résolution de la promesse `ConfigModule.envVariablesLoaded`, toutes les variables de configuration sont chargées.

#### Configuration conditionnelle du module

Il peut arriver que vous souhaitiez charger un module de manière conditionnelle et spécifier la condition dans une variable d'environnement. Heureusement, `@nestjs/config` fournit un `ConditionalModule` qui vous permet de faire exactement cela.

```typescript
@Module({
  imports: [ConfigModule.forRoot(), ConditionalModule.registerWhen(FooModule, 'USE_FOO')],
})
export class AppModule {}
```

Le module ci-dessus ne chargera le `FooModule` que si, dans le fichier `.env`, il n'y a pas de valeur `false` pour la variable d'environnement `USE_FOO`. Vous pouvez également spécifier une condition personnalisée en fournissant vous-même une fonction qui reçoit la référence `process.env` et qui doit renvoyer un booléen pour que le `ConditionalModule` le gère :

```typescript
@Module({
  imports: [ConfigModule.forRoot(), ConditionalModule.registerWhen(FooBarModule, (env: NodeJS.ProcessEnv) => !!env['foo'] && !!env['bar'])],
})
export class AppModule {}
```

Il est important de s'assurer que lorsque vous utilisez le `ConditionalModule`, vous avez également le `ConfigModule` chargé dans l'application, afin que le hook `ConfigModule.envVariablesLoaded` puisse être correctement référencé et utilisé. Si le hook n'est pas activé dans les 5 secondes, ou dans le délai en millisecondes, défini par l'utilisateur dans le troisième paramètre des méthodes `registerWhen`, alors le `ConditionalModule` lancera une erreur et Nest annulera le démarrage de l'application.

#### Variables extensibles

Le package `@nestjs/config` supporte l'expansion des variables d'environnement. Avec cette technique, vous pouvez créer des variables d'environnement imbriquées, où une variable est référencée dans la définition d'une autre. Par exemple :

```json
APP_URL=mywebsite.com
SUPPORT_EMAIL=support@${APP_URL}
```

Avec cette construction, la variable `SUPPORT_EMAIL` se résout en `'support@mywebsite.com'`. Notez l'utilisation de la syntaxe `${{ '{' }}...{{ '}' }}` pour déclencher la résolution de la valeur de la variable `APP_URL` à l'intérieur de la définition de `SUPPORT_EMAIL`.

> info **Astuce** Pour cette fonctionnalité, le package `@nestjs/config` utilise en interne [dotenv-expand](https://github.com/motdotla/dotenv-expand).

Activez l'expansion des variables d'environnement en utilisant la propriété `expandVariables` dans l'objet options passé à la méthode `forRoot()` du `ConfigModule`, comme indiqué ci-dessous :

```typescript
@@filename(app.module)
@Module({
  imports: [
    ConfigModule.forRoot({
      // ...
      expandVariables: true,
    }),
  ],
})
export class AppModule {}
```

#### Utilisation dans `main.ts`

Bien que notre configuration soit stockée dans un service, elle peut toujours être utilisée dans le fichier `main.ts`. Ainsi, vous pouvez l'utiliser pour stocker des variables telles que le port de l'application ou l'hôte CORS.

Pour y accéder, vous devez utiliser la méthode `app.get()`, suivie de la référence du service :

```typescript
const configService = app.get(ConfigService);
```

Vous pouvez alors l'utiliser comme d'habitude, en appelant la méthode `get` avec la clé de configuration :

```typescript
const port = configService.get('PORT');
```
