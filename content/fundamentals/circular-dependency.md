### Dépendance circulaire

Une dépendance circulaire se produit lorsque deux classes dépendent l'une de l'autre. Par exemple, la classe A a besoin de la classe B, et la classe B a également besoin de la classe A. Les dépendances circulaires peuvent apparaître dans Nest entre les modules et entre les fournisseurs.

Les dépendances circulaires doivent être évitées dans la mesure du possible, mais ce n'est pas toujours possible. Dans ce cas, Nest permet de résoudre les dépendances circulaires entre les fournisseurs de deux manières. Dans ce chapitre, nous décrivons l'utilisation de **références avancées** comme une technique, et l'utilisation de la classe **ModuleRef** pour récupérer une instance de fournisseur dans le conteneur DI comme une autre technique.

Nous décrivons également la résolution des dépendances circulaires entre les modules.

> warning **Attention** Une dépendance circulaire peut également être causée par l'utilisation de "barrel files"/index.ts pour regrouper les importations. Les "barrel files" doivent être omis lorsqu'il s'agit de classes de modules/fournisseurs. Par exemple, les barrel files ne devraient pas être utilisés lors de l'importation de fichiers dans le même répertoire que le barrel file, c'est-à-dire que `cats/cats.controller` ne devrait pas importer `cats` pour importer le fichier `cats/cats.service`. Pour plus de détails, veuillez également consulter [ce problème github](https://github.com/nestjs/nest/issues/1181#issuecomment-430197191).

#### Référence avancée

Une **référence avancée** permet à Nest de référencer des classes qui ne sont pas encore définies en utilisant la fonction utilitaire `forwardRef()`. Par exemple, si `CatsService` et `CommonService` dépendent l'un de l'autre, les deux parties de la relation peuvent utiliser `@Inject()` et l'utilitaire `forwardRef()` pour résoudre la dépendance circulaire. Sinon Nest ne les instanciera pas car toutes les métadonnées essentielles ne seront pas disponibles. Voici un exemple :

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => CommonService))
    private commonService: CommonService,
  ) {}
}
@@switch
@Injectable()
@Dependencies(forwardRef(() => CommonService))
export class CatsService {
  constructor(commonService) {
    this.commonService = commonService;
  }
}
```

> info **Astuce** La fonction `forwardRef()` est importée du paquet `@nestjs/common`.

Cela couvre un côté de la relation. Faisons maintenant la même chose avec `CommonService` :

```typescript
@@filename(common.service)
@Injectable()
export class CommonService {
  constructor(
    @Inject(forwardRef(() => CatsService))
    private catsService: CatsService,
  ) {}
}
@@switch
@Injectable()
@Dependencies(forwardRef(() => CatsService))
export class CommonService {
  constructor(catsService) {
    this.catsService = catsService;
  }
}
```

> warning **Attention** L'ordre d'instanciation est indéterminé. Assurez-vous que votre code ne dépend pas du constructeur appelé en premier. Avoir des dépendances circulaires qui dépendent de providers avec `Scope.REQUEST` peut conduire à des dépendances non définies. Plus d'informations disponibles [ici](https://github.com/nestjs/nest/issues/5778)

#### Alternative de la classe ModuleRef

Une alternative à l'utilisation de `forwardRef()` est de remanier votre code et d'utiliser la classe `ModuleRef` pour récupérer un fournisseur d'un côté de la relation (autrement) circulaire. Pour en savoir plus sur la classe utilitaire `ModuleRef`, cliquez [ici](/fundamentals/module-ref).

#### Référence avancée de module

Afin de résoudre les dépendances circulaires entre les modules, utilisez la même fonction utilitaire `forwardRef()` des deux côtés de l'association des modules. Par exemple :

```typescript
@@filename(common.module)
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class CommonModule {}
```

Cela couvre un aspect de la relation. Faisons maintenant la même chose avec `CatsModule` :

```typescript
@@filename(cats.module)
@Module({
  imports: [forwardRef(() => CommonModule)],
})
export class CatsModule {}
```
