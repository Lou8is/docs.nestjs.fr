### Planification des tâches

La planification des tâches vous permet de programmer l'exécution d'un code arbitraire (méthodes/fonctions) à une date/heure fixe, à des intervalles récurrents ou une fois après un intervalle spécifié. Dans le monde Linux, cela est souvent géré par des packages comme [cron](https://en.wikipedia.org/wiki/Cron) au niveau du système d'exploitation. Pour les applications Node.js, il existe plusieurs packages qui émulent les fonctionnalités de type cron. Nest fournit le package `@nestjs/schedule`, qui s'intègre au populaire package Node.js [cron](https://github.com/kelektiv/node-cron). Nous aborderons ce package dans le présent chapitre.

#### Installation

Pour commencer à l'utiliser, nous devons d'abord installer les dépendances nécessaires.

```bash
$ npm install --save @nestjs/schedule
```

Pour activer la planification des tâches, importez le module `ScheduleModule` dans le module racine `AppModule` et exécutez la méthode statique `forRoot()` comme indiqué ci-dessous :

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
})
export class AppModule {}
```

L'appel à `.forRoot()` initialise l'ordonnanceur et enregistre tous les <a href="techniques/task-scheduling#tâches-cron-déclaratives">tâches cron</a>, <a href="techniques/task-scheduling#délais-déclaratifs">délais</a> et <a href="techniques/task-scheduling#intervalles-déclaratifs">intervalles</a> déclaratifs qui existent dans votre application. L'enregistrement a lieu lorsque le hook du cycle de vie `onApplicationBootstrap` se produit, ce qui permet de s'assurer que tous les modules ont été chargés et qu'ils ont déclaré tous les travaux programmés. 

#### Tâches cron déclaratives

Un cron job planifie l'exécution automatique d'une fonction arbitraire (appel de méthode). Les tâches cron peuvent s'exécuter :

- Une fois, à une date/heure donnée.
- Sur une base récurrente ; les tâches récurrentes peuvent être exécutées à un moment précis dans un intervalle donné (par exemple, une fois par heure, une fois par semaine, une fois toutes les 5 minutes).

Déclarez un cron job avec le décorateur `@Cron()` précédant la définition de la méthode contenant le code à exécuter, comme suit :

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('45 * * * * *')
  handleCron() {
    this.logger.debug('Appelé lorsque la seconde courante est à 45');
  }
}
```

Dans cet exemple, la méthode `handleCron()` sera appelée chaque fois que la seconde courante est `45`. En d'autres termes, la méthode sera exécutée une fois par minute, au bout de 45 secondes.

Le décorateur `@Cron()` supporte tous les [motifs cron](http://crontab.org/) standards :

- Astérisque (par exemple `*`)
- Plages (par exemple `1-3,5`)
- Pas (par exemple `*/2`)

Dans l'exemple ci-dessus, nous avons passé `45 * * * * *` au décorateur. La clé suivante montre comment chaque position dans la chaîne de caractères du motif cron est interprétée :

<pre class="language-javascript"><code class="language-javascript">
* * * * * *
| | | | | |
| | | | | jour de la semaine
| | | | mois
| | jour du mois
| heures
| minutes
secondes (facultatif)
</code></pre>

Voici quelques exemples de modèles de cron :

<table>
  <tbody>
    <tr>
      <td><code>* * * * * *</code></td>
      <td>chaque seconde</td>
    </tr>
    <tr>
      <td><code>45 * * * * *</code></td>
      <td>toutes les minutes, à la 45e seconde</td>
    </tr>
    <tr>
      <td><code>0 10 * * * *</code></td>
      <td>toutes les heures, au début de la 10e minute</td>
    </tr>
    <tr>
      <td><code>0 */30 9-17 * * *</code></td>
      <td>toutes les 30 minutes entre 9h et 17h</td>
    </tr>
   <tr>
      <td><code>0 30 11 * * 1-5</code></td>
      <td>Du lundi au vendredi à 11h30</td>
    </tr>
  </tbody>
</table>

Le package `@nestjs/schedule` fournit un enum pratique avec des modèles de cron couramment utilisés. Vous pouvez utiliser cette liste comme suit :

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron() {
    this.logger.debug('Appelé toutes les 30 secondes');
  }
}
```

Dans cet exemple, la méthode `handleCron()` sera appelée toutes les `30` secondes.

Vous pouvez également fournir un objet JavaScript `Date` au décorateur `@Cron()`. Dans ce cas, la tâche sera exécutée une seule fois, à la date spécifiée.

> info **Astuce** Utilisez l'arithmétique de date JavaScript pour planifier des tâches par rapport à la date actuelle. Par exemple, `@Cron(new Date(Date.now() + 10 * 1000))` pour programmer une tâche à exécuter 10 secondes après le démarrage de l'application.

Vous pouvez également fournir des options supplémentaires en tant que second paramètre du décorateur `@Cron()`.

<table>
  <tbody>
    <tr>
      <td><code>name</code></td>
      <td>
        Utile pour accéder à une tâche cron et la contrôler après qu'elle a été déclarée.
      </td>
    </tr>
    <tr>
      <td><code>timeZone</code></td>
      <td>
        Spécifiez le fuseau horaire pour l'exécution. Ceci modifiera l'heure actuelle par rapport à votre fuseau horaire. Si la zone horaire n'est pas valide, une erreur est générée. Vous pouvez consulter tous les fuseaux horaires disponibles sur le site <a href="http://momentjs.com/timezone/">Moment Timezone</a>.
      </td>
    </tr>
    <tr>
      <td><code>utcOffset</code></td>
      <td>
        Cela vous permet de spécifier le décalage de votre fuseau horaire plutôt que d'utiliser le paramètre <code>timeZone</code>.
      </td>
    </tr>
    <tr>
      <td><code>disabled</code></td>
      <td>
       Ceci indique si la tâche sera exécutée ou non.
      </td>
    </tr>
  </tbody>
</table>

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  @Cron('* * 0 * * *', {
    name: 'notifications',
    timeZone: 'Europe/Paris',
  })
  triggerNotifications() {}
}
```

Vous pouvez accéder et contrôler une tâche cron après qu'elle ait été déclarée, ou créer dynamiquement une tâche cron (où son modèle cron est défini à l'exécution) avec l'<a href="/techniques/task-scheduling#dynamic-schedule-module-api">Dynamic API</a>. Pour accéder à une tâche cron déclarative via l'API, vous devez associer la tâche à un nom en passant la propriété `name` dans un objet optionnel d'options en tant que deuxième argument du décorateur.

#### Intervalles déclaratifs

Pour déclarer qu'une méthode doit s'exécuter à un intervalle spécifié (récurrent), préfixez la définition de la méthode avec le décorateur `@Interval()`. Passez la valeur de l'intervalle, sous la forme d'un nombre en millisecondes, au décorateur comme indiqué ci-dessous :

```typescript
@Interval(10000)
handleInterval() {
  this.logger.debug('Appelé toutes les 10 secondes');
}
```

> info **Astuce** Ce mécanisme utilise la fonction JavaScript `setInterval()` sous le capot. Vous pouvez également utiliser une tâche cron pour programmer des tâches récurrentes.

Si vous souhaitez contrôler votre intervalle déclaratif depuis l'extérieur de la classe déclarante via l'<a href="/techniques/task-scheduling#dynamic-schedule-module-api">API dynamique</a>, associez un nom à l'intervalle à l'aide de la construction suivante :

```typescript
@Interval('notifications', 2500)
handleInterval() {}
```

L'<a href="/techniques/task-scheduling#dynamic-schedule-module-api">API dynamique</a> permet également de **créer** des intervalles dynamiques, dont les propriétés sont définies au moment de l'exécution, et de **lister et supprimer** ces intervalles.

<app-banner-enterprise></app-banner-enterprise>

#### Délais déclaratifs

Pour déclarer qu'une méthode doit s'exécuter (une fois) à un délai spécifié, préfixez la définition de la méthode avec le décorateur `@Timeout()`. Passez le décalage temporel relatif (en millisecondes), à partir du démarrage de l'application, au décorateur comme indiqué ci-dessous :

```typescript
@Timeout(5000)
handleTimeout() {
  this.logger.debug('Appelé une fois après 5 secondes');
}
```

> info **Astuce** Ce mécanisme utilise la fonction JavaScript `setTimeout()` sous le capot.

Si vous souhaitez contrôler votre délai déclaratif depuis l'extérieur de la classe déclarante via l'<a href="/techniques/task-scheduling#dynamic-schedule-module-api">API dynamique</a>, associez le délai à un nom à l'aide de la construction suivante :

```typescript
@Timeout('notifications', 2500)
handleTimeout() {}
```

L'<a href="/techniques/task-scheduling#dynamic-schedule-module-api">API dynamique</a> permet également de **créer** des délais dynamiques, dont les propriétés sont définies au moment de l'exécution, et de **lister et supprimer** ces délais.

#### API du module de programmation dynamique

Le module `@nestjs/schedule` fournit une API dynamique qui permet d'administrer les <a href="techniques/task-scheduling#tâches-cron-déclaratives">tâches cron</a>, <a href="techniques/task-scheduling#délais-déclaratifs">délais</a> et <a href="techniques/task-scheduling#intervalles-déclaratifs">intervalles</a> déclaratifs. L'API permet également de créer et de gérer des tâches cron **dynamiques**, des délais et des intervalles, dont les propriétés sont définies au moment de l'exécution.

#### Tâches cron dynamiques

Obtenir une référence à une instance de `CronJob` par son nom depuis n'importe quel endroit de votre code en utilisant l'API `SchedulerRegistry`. Tout d'abord, injectez `SchedulerRegistry` en utilisant l'injection de constructeur standard :

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

> info **Astuce** Importez le `SchedulerRegistry` depuis le package `@nestjs/schedule`.

Utilisez-le ensuite dans une classe comme suit. Supposons qu'une tâche cron ait été créée avec la déclaration suivante :

```typescript
@Cron('* * 8 * * *', {
  name: 'notifications',
})
triggerNotifications() {}
```

Accédez à ce poste en utilisant les moyens suivants :

```typescript
const job = this.schedulerRegistry.getCronJob('notifications');

job.stop();
console.log(job.lastDate());
```

La méthode `getCronJob()` retourne la tâche cron nommée. L'objet `CronJob` retourné possède les méthodes suivantes :

- `stop()` - arrête une tâche dont l'exécution est programmée.
- `start()` - redémarre une tâche qui a été arrêtée.
- `setTime(time: CronTime)` - arrête une tâche, fixe une nouvelle heure pour celle-ci, puis la démarre
- `lastDate()` - renvoie une chaîne de caractères de la dernière date d'exécution d'un job
- `nextDates(count: number)` - renvoie un tableau (taille `count`) d'objets `moment` représentant les dates d'exécution des travaux à venir.

> info **Astuce** Utilisez `toDate()` sur les objets `moment` pour les rendre lisibles par l'homme.

**Créez** un nouveau job cron dynamiquement en utilisant la méthode `SchedulerRegistry#addCronJob`, comme suit :

```typescript
addCronJob(name: string, seconds: string) {
  const job = new CronJob(`${seconds} * * * * *`, () => {
    this.logger.warn(`il est temps (${seconds}) pour la tâche ${name} d'être exécutée !`);
  });

  this.schedulerRegistry.addCronJob(name, job);
  job.start();

  this.logger.warn(
    `tâche ${name} ajoutée pour chaque minute à ${seconds} secondes !`,
  );
}
```

Dans ce code, nous utilisons l'objet `CronJob` du package `cron` pour créer la tâche cron. Le constructeur `CronJob` prend un motif cron (tout comme le  <a href="techniques/task-scheduling#tâches-cron-déclaratives">décorateur</a> `@Cron()`) comme premier argument, et un callback à exécuter lorsque le timer cron se déclenche comme second argument. La méthode `SchedulerRegistry#addCronJob` prend deux arguments : un nom pour le `CronJob`, et l'objet `CronJob` lui-même.

> warning **Attention** N'oubliez pas d'injecter le `SchedulerRegistry` avant d'y accéder. Importez `CronJob` depuis le package `cron`.

**Supprimez** une tâche cron nommée en utilisant la méthode `SchedulerRegistry#deleteCronJob`, comme suit :

```typescript
deleteCron(name: string) {
  this.schedulerRegistry.deleteCronJob(name);
  this.logger.warn(`tâche ${name} supprimée !`);
}
```

**Listez** tous les jobs cron en utilisant la méthode `SchedulerRegistry#getCronJobs` comme suit :

```typescript
getCrons() {
  const jobs = this.schedulerRegistry.getCronJobs();
  jobs.forEach((value, key, map) => {
    let next;
    try {
      next = value.nextDates().toDate();
    } catch (e) {
      next = 'erreur : la date de la prochaine exécution est dépassée !';
    }
    this.logger.log(`tâche : ${key} -> prochaine : ${next}`);
  });
}
```

La méthode `getCronJobs()` retourne une `map`. Dans ce code, nous itérons sur la carte et essayons d'accéder à la méthode `nextDates()` de chaque `CronJob`. Dans l'API `CronJob`, si un job a déjà été exécuté et n'a pas de date d'exécution future, une exception est levée.

#### Intervalles dynamiques

Obtenez une référence à un intervalle avec la méthode `SchedulerRegistry#getInterval`. Comme ci-dessus, injectez `SchedulerRegistry` en utilisant l'injection de constructeur standard :

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

Et utilisez-la comme suit :

```typescript
const interval = this.schedulerRegistry.getInterval('notifications');
clearInterval(interval);
```

**Créez** un nouvel intervalle dynamiquement en utilisant la méthode `SchedulerRegistry#addInterval`, comme suit :

```typescript
addInterval(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Intervalle ${name} exécuté à (${milliseconds}) !`);
  };

  const interval = setInterval(callback, milliseconds);
  this.schedulerRegistry.addInterval(name, interval);
}
```

Dans ce code, nous créons un intervalle JavaScript standard, puis nous le passons à la méthode `SchedulerRegistry#addInterval`.
Cette méthode prend deux arguments : un nom pour l'intervalle et l'intervalle lui-même.

**Supprimez** un intervalle nommé en utilisant la méthode `SchedulerRegistry#deleteInterval`, comme suit :

```typescript
deleteInterval(name: string) {
  this.schedulerRegistry.deleteInterval(name);
  this.logger.warn(`Intervalle ${name} supprimé !`);
}
```

**Listez** tous les intervalles en utilisant la méthode `SchedulerRegistry#getIntervals` comme suit :

```typescript
getIntervals() {
  const intervals = this.schedulerRegistry.getIntervals();
  intervals.forEach(key => this.logger.log(`Intervalle : ${key}`));
}
```

#### Délais dynamiques

Obtenir une référence à un délai avec la méthode `SchedulerRegistry#getTimeout`. Comme ci-dessus, injectez `SchedulerRegistry` en utilisant l'injection de constructeur standard :

```typescript
constructor(private readonly schedulerRegistry: SchedulerRegistry) {}
```

Et utilisez-le comme suit :

```typescript
const timeout = this.schedulerRegistry.getTimeout('notifications');
clearTimeout(timeout);
```

**Créez** un nouveau timeout dynamiquement en utilisant la méthode `SchedulerRegistry#addTimeout`, comme suit :

```typescript
addTimeout(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Délai ${name} exécuté après (${milliseconds}) !`);
  };

  const timeout = setTimeout(callback, milliseconds);
  this.schedulerRegistry.addTimeout(name, timeout);
}
```

Dans ce code, nous créons un timeout JavaScript standard, puis nous le passons à la méthode `ScheduleRegistry#addTimeout`.
Cette méthode prend deux arguments : un nom pour le délai d'attente et le délai d'attente lui-même.

**Supprimez** un timeout nommé en utilisant la méthode `SchedulerRegistry#deleteTimeout`, comme suit :

```typescript
deleteTimeout(name: string) {
  this.schedulerRegistry.deleteTimeout(name);
  this.logger.warn(`Timeout ${name} deleted!`);
}
```

**Listez** tous les timeouts en utilisant la méthode `SchedulerRegistry#getTimeouts` de la manière suivante :

```typescript
getTimeouts() {
  const timeouts = this.schedulerRegistry.getTimeouts();
  timeouts.forEach(key => this.logger.log(`Timeout: ${key}`));
}
```

#### Exemple

Un exemple pratique est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/27-scheduling).
