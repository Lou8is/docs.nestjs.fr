### Read-Eval-Print-Loop (REPL)

REPL est un environnement interactif simple qui prend des entrées utilisateur uniques, les exécute et renvoie le résultat à l'utilisateur.
La fonction REPL vous permet d'inspecter votre graphe de dépendance et d'appeler des méthodes sur vos fournisseurs (et contrôleurs) directement depuis votre terminal.

#### Usage

Pour exécuter votre application NestJS en mode REPL, créez un nouveau fichier `repl.ts` (à côté du fichier `main.ts` existant) et ajoutez le code suivant à l'intérieur :

```typescript
@@filename(repl)
import { repl } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
@@switch
import { repl } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
```

Maintenant, dans votre terminal, démarrez le REPL avec la commande suivante :

```bash
$ npm run start -- --entryFile repl
```

> info **Astuce** `repl` renvoie un objet [serveur Node.js REPL](https://nodejs.org/api/repl.html).

Une fois qu'il est opérationnel, vous devriez voir le message suivant dans votre console :

```bash
LOG [NestFactory] Starting Nest application...
LOG [InstanceLoader] AppModule dependencies initialized
LOG REPL initialized
```

Et maintenant vous pouvez commencer à interagir avec votre graphe de dépendances. Par exemple, vous pouvez récupérer un `AppService` (nous utilisons le projet starter comme exemple ici) et appeler la méthode `getHello()` :

```typescript
> get(AppService).getHello()
'Hello World!'
```

Vous pouvez exécuter n'importe quel code JavaScript depuis votre terminal, par exemple, assigner une instance de `AppController` à une variable locale, et utiliser `await` pour appeler une méthode asynchrone :

```typescript
> appController = get(AppController)
AppController { appService: AppService {} }
> await appController.getHello()
'Hello World!'
```

Pour afficher toutes les méthodes publiques disponibles sur un fournisseur ou un contrôleur donné, utilisez la fonction `methods()`, comme suit :

```typescript
> methods(AppController)

Methods:
 ◻ getHello
```

Pour afficher tous les modules enregistrés sous forme de liste avec leurs contrôleurs et fournisseurs, utilisez `debug()`.

```typescript
> debug()

AppModule:
 - controllers:
  ◻ AppController
 - providers:
  ◻ AppService
```

Démo rapide :

<figure><img src="/assets/repl.gif" alt="Exemple REPL" /></figure>

Vous trouverez plus d'informations sur les méthodes natives prédéfinies existantes dans la section ci-dessous.

#### Fonctions natives

Le REPL NestJS intégré est livré avec quelques fonctions natives qui sont globalement disponibles lorsque vous démarrez le REPL. Vous pouvez appeler `help()` pour les énumérer.

Si vous ne vous souvenez pas de la signature (c'est-à-dire des paramètres attendus et du type de retour) d'une fonction, vous pouvez appeler `<nom_de_la_fonction>.help`.
Par exemple :

```text
> $.help
Retrieves an instance of either injectable or controller, otherwise, throws exception.
Interface: $(token: InjectionToken) => any
```

> info **Astuce** Ces interfaces de fonction sont écrites en [syntaxe d'expression de type de fonction TypeScript](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions).

| Fonction     | Description                                                                                                                  | Signature                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `debug`      | Affiche tous les modules enregistrés sous forme de liste, avec leurs contrôleurs et leurs fournisseurs.                      | `debug(moduleCls?: ClassRef \| string) => void`                       |
| `get` ou `$` | Récupère une instance d'injectable ou de contrôleur, sinon, lève une exception.                                              | `get(token: InjectionToken) => any`                                   |
| `methods`    | Affiche toutes les méthodes publiques disponibles pour un fournisseur ou un contrôleur donné.                                | `methods(token: ClassRef \| string) => void`                          |
| `resolve`    | Résout l'instance transitoire ou à portée de requête de l'injectable ou du contrôleur, sinon lève une exception.             | `resolve(token: InjectionToken, contextId: any) => Promise<any>`      |
| `select`     | Permet de naviguer dans l'arborescence des modules, par exemple pour extraire une instance spécifique du module sélectionné. | `select(token: DynamicModule \| ClassRef) => INestApplicationContext` |

#### Mode de surveillance

Pendant le développement, il est utile d'exécuter REPL en mode veille pour refléter automatiquement toutes les modifications du code :

```bash
$ npm run start -- --watch --entryFile repl
```

Cela a un défaut, l'historique des commandes du REPL est supprimé après chaque rechargement, ce qui peut s'avérer fastidieux.
Heureusement, il existe une solution très simple. Modifiez votre fonction `bootstrap` comme suit :

```typescript
async function bootstrap() {
  const replServer = await repl(AppModule);
  replServer.setupHistory(".nestjs_repl_history", (err) => {
    if (err) {
      console.error(err);
    }
  });
}
```

Désormais, l'historique est préservé entre les exécutions/rechargements.
