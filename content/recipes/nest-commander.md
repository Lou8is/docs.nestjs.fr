### Nest Commander

En complément de la documentation sur les [applications autonomes](/standalone-applications), il existe également le package [nest-commander](https://jmcdo29.github.io/nest-commander) qui permet d'écrire des applications en ligne de commande dans une structure similaire à celle d'une application Nest classique.

> info **Info** `nest-commander` est un package tiers et n'est pas géré par l'ensemble de l'équipe NestJS. Veuillez rapporter tout problème trouvé avec la bibliothèque dans le [dépôt approprié](https://github.com/jmcdo29/nest-commander/issues/new/choose).

#### Installation

Comme tout autre package, vous devez l'installer avant de pouvoir l'utiliser.

```bash
$ npm i nest-commander
```

#### Un fichier de commande

`nest-commander` facilite l'écriture de nouvelles applications de ligne de commande avec [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) via le décorateur `@Command()` pour les classes et le décorateur `@Option()` pour les méthodes de cette classe. Chaque fichier de commande doit implémenter la classe abstraite `CommandRunner` et doit être décoré avec un décorateur `@Command()`.

Chaque commande est vue comme un `@Injectable()` par Nest, donc votre injection de dépendance normale fonctionne toujours comme vous vous y attendez. La seule chose à noter est la classe abstraite `CommandRunner`, qui doit être implémentée par chaque commande. La classe abstraite `CommandRunner` assure que toutes les commandes ont une méthode `run` qui retourne une `Promesse<void>` et prend les paramètres `string[], Record<string, any>`. La commande `run` est l'endroit où vous pouvez lancer toute votre logique, elle prendra tous les paramètres qui ne correspondent pas aux drapeaux d'options et les passera sous forme de tableau, juste au cas où vous voudriez vraiment travailler avec des paramètres multiples. Quant aux options, les `Record<string, any>`, les noms de ces propriétés correspondent à la propriété `name` donnée aux décorateurs `@Option()`, tandis que leur valeur correspond au retour du gestionnaire d'option. Si vous souhaitez une meilleure sécurité de type, vous pouvez également créer une interface pour vos options.

#### Exécution de la commande

De la même manière que dans une application NestJS nous pouvons utiliser `NestFactory` pour créer un serveur pour nous, et le lancer en utilisant `listen`, le package `nest-commander` expose une API simple à utiliser pour lancer votre serveur. Importez la `CommandFactory` et utilisez la méthode `static` `run` et passez le module racine de votre application. Cela ressemblerait probablement à ce qui suit :

```ts
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
```

Par défaut, le logger de Nest est désactivé lors de l'utilisation de `CommandFactory`. Il est cependant possible de le fournir en tant que second argument de la fonction `run`. Vous pouvez soit fournir un logger NestJS personnalisé, soit un tableau de niveaux de logs que vous souhaitez conserver - il peut être utile de fournir au moins `['error']` ici, si vous ne voulez imprimer que les logs d'erreur de Nest.

```ts
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { LogService } './log.service';

async function bootstrap() {
  await CommandFactory.run(AppModule, new LogService());

  // ou, si vous ne voulez imprimer que les avertissements et les erreurs de Nest
  await CommandFactory.run(AppModule, ['warn', 'error']);
}

bootstrap();
```

Et c'est tout. Sous le capot, `CommandFactory` s'occupera d'appeler `NestFactory` pour vous et d'appeler `app.close()` quand c'est nécessaire, donc vous ne devriez pas avoir à vous soucier des fuites de mémoire ici. Si vous avez besoin d'ajouter une gestion d'erreur, il y a toujours `try/catch` qui enveloppe la commande `run`, ou vous pouvez enchaîner une méthode `.catch()` à l'appel `bootstrap()`.

#### Tests

Alors à quoi bon écrire un super script en ligne de commande si vous ne pouvez pas le tester super facilement, n'est-ce pas ? Heureusement, `nest-commander` a quelques utilitaires que vous pouvez utiliser et qui s'intègrent parfaitement à l'écosystème NestJS, il se sentira comme chez lui pour tous les Nestlings qui sont là. Au lieu d'utiliser `CommandFactory` pour construire la commande en mode test, vous pouvez utiliser `CommandTestFactory` et passer vos métadonnées, de manière très similaire à la façon dont `Test.createTestingModule` de `@nestjs/testing` fonctionne. En fait, il utilise ce package sous le capot. Vous pouvez toujours chaîner les méthodes `overrideProvider` avant d'appeler `compile()` afin de pouvoir changer les éléments DI directement dans le test.

#### Tout mettre en place

La classe suivante équivaudrait à avoir une commande CLI qui peut prendre la sous-commande `basic` ou être appelée directement, avec `-n`, `-s`, et `-b` (ainsi que leurs verions longues) tous supportés et avec des analyseurs personnalisés pour chaque option. L'option `--help' est également supportée, comme il est d'usage avec commander.

```ts
import { Command, CommandRunner, Option } from 'nest-commander';
import { LogService } from './log.service';

interface BasicCommandOptions {
  string?: string;
  boolean?: boolean;
  number?: number;
}

@Command({ name: 'basic', description: 'A parameter parse' })
export class BasicCommand extends CommandRunner {
  constructor(private readonly logService: LogService) {
    super()
  }

  async run(
    passedParam: string[],
    options?: BasicCommandOptions,
  ): Promise<void> {
    if (options?.boolean !== undefined && options?.boolean !== null) {
      this.runWithBoolean(passedParam, options.boolean);
    } else if (options?.number) {
      this.runWithNumber(passedParam, options.number);
    } else if (options?.string) {
      this.runWithString(passedParam, options.string);
    } else {
      this.runWithNone(passedParam);
    }
  }

  @Option({
    flags: '-n, --number [number]',
    description: 'A basic number parser',
  })
  parseNumber(val: string): number {
    return Number(val);
  }

  @Option({
    flags: '-s, --string [string]',
    description: 'A string return',
  })
  parseString(val: string): string {
    return val;
  }

  @Option({
    flags: '-b, --boolean [boolean]',
    description: 'A boolean parser',
  })
  parseBoolean(val: string): boolean {
    return JSON.parse(val);
  }

  runWithString(param: string[], option: string): void {
    this.logService.log({ param, string: option });
  }

  runWithNumber(param: string[], option: number): void {
    this.logService.log({ param, number: option });
  }

  runWithBoolean(param: string[], option: boolean): void {
    this.logService.log({ param, boolean: option });
  }

  runWithNone(param: string[]): void {
    this.logService.log({ param });
  }
}
```

Assurez-vous que la classe de commande est ajoutée à un module

```ts
@Module({
  providers: [LogService, BasicCommand],
})
export class AppModule {}
```

Et maintenant, pour pouvoir exécuter la CLI dans votre main.ts, vous pouvez faire ce qui suit

```ts
async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
```

Et ainsi, vous avez une application en ligne de commande.

#### Plus d'informations

Visitez le site de la [documentation nest-commander](https://jmcdo29.github.io/nest-commander) pour plus d'informations, d'exemples et de documentation sur l'API.
