### Applications indépendantes

Il existe plusieurs façons de monter une application Nest. Vous pouvez créer une application web, un microservice ou simplement une **application autonome** Nest (sans aucun écouteur réseau). L'application autonome Nest est une enveloppe autour du **conteneur IoC** Nest, qui contient toutes les classes instanciées. Nous pouvons obtenir une référence à n'importe quelle instance existante à partir de n'importe quel module importé en utilisant directement l'objet de l'application autonome. Ainsi, vous pouvez tirer parti du cadre de travail Nest partout, y compris, par exemple, dans des tâches **CRON** scriptées. Vous pouvez même construire une **CLI** par-dessus.

#### Pour commencer

Pour créer une application autonome Nest, utilisez la construction suivante :

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // votre logique d'application ici...
}
bootstrap();
```

#### Récupérer les fournisseurs à partir de modules statiques

L'objet d'application autonome vous permet d'obtenir une référence à n'importe quelle instance enregistrée dans l'application Nest. Imaginons que nous ayons un fournisseur `TasksService` dans le module `TasksModule` qui a été importé par notre module `AppModule`. Cette classe fournit un ensemble de méthodes que nous voulons appeler à partir d'un travail CRON.

```typescript
@@filename()
const tasksService = app.get(TasksService);
```

Pour accéder à l'instance de `TasksService`, nous utilisons la méthode `get()`. La méthode `get()` agit comme une **requête** qui recherche une instance dans chaque module enregistré. Vous pouvez lui passer n'importe quel jeton de fournisseur. Alternativement, pour une vérification stricte du contexte, passez un objet options avec la propriété `strict : true`. Avec cette option en vigueur, vous devez naviguer à travers des modules spécifiques pour obtenir une instance particulière du contexte sélectionné.

```typescript
@@filename()
const tasksService = app.select(TasksModule).get(TasksService, { strict: true });
```

Voici un résumé des méthodes disponibles pour récupérer les références d'instance de l'objet d'application autonome.

<table>
  <tr>
    <td>
      <code>get()</code>
    </td>
    <td>
      Récupère une instance d'un contrôleur ou d'un fournisseur (y compris les gardes, les filtres, etc.) disponible dans le contexte de l'application.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      Navigue dans le graphe du module pour extraire une instance spécifique du module sélectionné (utilisé avec le mode strict décrit ci-dessus).
    </td>
  </tr>
</table>

> info **Astuce** En mode non strict, le module racine est sélectionné par défaut. Pour sélectionner un autre module, vous devez naviguer manuellement dans le graphe des modules, étape par étape.

Gardez à l'esprit qu'une application autonome n'a pas d'auditeurs réseau, donc toutes les fonctionnalités de Nest liées à HTTP (par exemple, middleware, intercepteurs, pipes, gardes, etc.) ne sont pas disponibles dans ce contexte.

Par exemple, même si vous enregistrez un intercepteur global dans votre application et que vous récupérez une instance de contrôleur en utilisant la méthode `app.get()`, l'intercepteur ne sera pas exécuté.

#### Récupérer les fournisseurs à partir de modules dynamiques

Lorsqu'il s'agit de [modules dynamiques](/fundamentals/dynamic-modules.md), nous devons fournir à `app.select` le même objet qui représente le module dynamique enregistré dans l'application. Par exemple :

```typescript
@@filename()
export const dynamicConfigModule = ConfigModule.register({ folder: './config' });

@Module({
  imports: [dynamicConfigModule],
})
export class AppModule {}
```

Vous pouvez ensuite sélectionner ce module plus tard :

```typescript
@@filename()
const configService = app.select(dynamicConfigModule).get(ConfigService, { strict: true });
```

#### Phase de clôture

Si vous voulez que l'application node se ferme après la fin du script (par exemple, pour un script exécutant des tâches CRON), vous devez appeler la méthode `app.close()` à la fin de votre fonction `bootstrap` comme ceci :

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // votre logique d'application ici...
  await app.close();
}
bootstrap();
```

Et comme indiqué dans le chapitre [Événements du cycle de vie](/fundamentals/lifecycle-events.md), cela déclenchera des hooks de cycle de vie.

#### Exemple

Un exemple fonctionnel est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/18-context).
