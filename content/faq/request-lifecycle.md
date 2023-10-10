### Cycle de vie de la requête

Les applications Nest traitent les requêtes et produisent des réponses dans une séquence que nous appelons le **cycle de vie de la requête**. Avec l'utilisation de middleware, de pipes, de guards et d'intercepteurs, il peut être difficile de déterminer où un morceau de code particulier s'exécute pendant le cycle de vie de la requête, en particulier lorsque des composants globaux, au niveau du contrôleur et au niveau de la route entrent en jeu. En général, une demande passe par un middleware, des guards, des intercepteurs, des pipes et enfin des intercepteurs sur le chemin du retour (lorsque la réponse est générée).

#### Middleware

Les middlewares sont exécutés dans un ordre particulier. Tout d'abord, Nest exécute les middlewares liés globalement (tels que les middlewares liés à `app.use`) et ensuite il exécute les [middlewares liés aux modules](/middleware), qui sont déterminés par des routes. Les middlewares sont exécutés séquentiellement dans l'ordre où ils sont liés, de la même manière que les middlewares dans Express. Dans le cas d'un middleware lié à différents modules, le middleware lié au module racine s'exécutera en premier, puis le middleware s'exécutera dans l'ordre dans lequel les modules sont ajoutés au tableau des imports.

#### Gardes

L'exécution des gardes commence par les gardes globales, puis passe aux gardes des contrôleurs et enfin aux gardes des routes. Comme pour les intergiciels, les gardes s'exécutent dans l'ordre dans lequel elles sont liées. Par exemple :

```typescript
@UseGuards(Guard1, Guard2)
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @UseGuards(Guard3)
  @Get()
  getCats(): Cats[] {
    return this.catsService.getCats();
  }
}
```

`Guard1` s'exécutera avant `Guard2` et les deux s'exécuteront avant `Guard3`.

> info **Astuce** Lorsque l'on parle de lié globalement par opposition à lié au contrôleur ou à la route, la différence est l'endroit où la garde (ou un autre composant est lié). Si vous utilisez `app.useGlobalGuard()` ou si vous fournissez le composant via un module, il est lié globalement. Sinon, il est lié à un contrôleur si le décorateur précède une classe de contrôleur, ou à une route si le décorateur précède une déclaration de route.

#### Intercepteurs

Les intercepteurs, pour la plupart, suivent le même modèle que les gardes, avec une différence : comme les intercepteurs renvoient des [Observables RxJS](https://github.com/ReactiveX/rxjs), les observables seront résolus de la manière suivante : premier arrivé, dernier sorti. Ainsi, les requêtes entrantes passeront par la résolution standard au niveau global, puis contrôleur, puis route, mais le côté réponse de la requête (c'est-à-dire après le retour du gestionnaire de méthode du contrôleur) sera résolu de la route au contrôleur et au niveau global. De plus, toutes les erreurs lancées par les pipes, les contrôleurs ou les services peuvent être lues dans l'opérateur `catchError` d'un intercepteur.

#### Pipes

Les pipes suivent la séquence standard global/contrôleur/route, avec le même principe "premier entré, premier sorti" en ce qui concerne les paramètres `@UsePipes()`. Cependant, au niveau des paramètres de la route, si vous avez plusieurs pipes en cours d'exécution, elles s'exécuteront dans l'ordre du dernier paramètre avec une pipe vers le premier. Ceci s'applique également aux pipes au niveau de la route et du contrôleur. Par exemple, si nous avons le contrôleur suivant :

```typescript
@UsePipes(GeneralValidationPipe)
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @UsePipes(RouteSpecificPipe)
  @Patch(':id')
  updateCat(
    @Body() body: UpdateCatDTO,
    @Param() params: UpdateCatParams,
    @Query() query: UpdateCatQuery,
  ) {
    return this.catsService.updateCat(body, params, query);
  }
}
```

alors le `GeneralValidationPipe` s'exécutera pour les objets `query`, puis les `params`, et enfin les objets `body` avant de passer au `RouteSpecificPipe`, qui suit le même ordre. Si des pipes spécifiques aux paramètres étaient en place, ils s'exécuteraient (encore une fois, du dernier au premier paramètre) après les pipes au niveau du contrôleur et de la route.

#### Filtres

Les filtres sont les seuls composants qui ne sont pas résolus globalement en premier. Au lieu de cela, les filtres sont résolus au niveau le plus bas possible, ce qui signifie que l'exécution commence par les filtres liés à la route, puis passe au niveau du contrôleur et enfin aux filtres globaux. Notez que les exceptions ne peuvent pas être transmises d'un filtre à l'autre ; si un filtre au niveau de la route attrape l'exception, un contrôleur ou un filtre au niveau global ne peut pas attraper la même exception. La seule façon d'obtenir un tel effet est d'utiliser l'héritage entre les filtres.

> info **Astuce** Les filtres ne sont exécutés que si une exception non capturée se produit au cours du processus de demande. Les exceptions capturées, telles que celles qui sont capturées avec un `try/catch`, ne déclenchent pas l'exécution des filtres d'exception. Dès qu'une exception est rencontrée, le reste du cycle de vie est ignoré et la demande passe directement au filtre.

#### Résumé

En général, le cycle de vie d'une requête se présente comme suit :

1. Requête entrante
2. Middleware
   - 2.1. Middleware lié globalement
   - 2.2. Middleware lié au module
3. Gardes
   - 3.1 Gardes globales
   - 3.2 Gardes du contrôleur
   - 3.3 Gardes de la route
4. Intercepteurs (pré-contrôleur)
   - 4.1 Intercepteurs globaux
   - 4.2 Intercepteurs du contrôleur
   - 4.3 Intercepteurs de la route
5. Pipes
   - 5.1 Pipes globales
   - 5.2 Pipes du contrôleur
   - 5.3 Pipes de la route
   - 5.4 Pipes des paramètres de route
6. Contrôleur (gestionnaire de méthode)
7. Service (s'il existe)
8. Intercepteurs (post-requête)
   - 8.1 Intercepteurs de la route
   - 8.2 Intercepteurs du contrôleur
   - 8.3 Intercepteurs globaux
9. Filtres d'exceptions
   - 9.1 Route
   - 9.2 Contrôleur
   - 9.3 Global
10. Réponse du serveur
