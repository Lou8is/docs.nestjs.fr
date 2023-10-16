### Module Router

> info **Astuce** Ce chapitre ne concerne que les applications basées sur le protocole HTTP.

Dans une application HTTP (par exemple, une API REST), le chemin d'accès à un handler est déterminé en concaténant le préfixe (optionnel) déclaré pour le contrôleur (dans le décorateur `@Controller`), et tout chemin spécifié dans le décorateur de la méthode (par exemple, `@Get('users')`). Vous pouvez en apprendre plus à ce sujet dans [cette section](/controllers#routage). De plus, vous pouvez définir un [préfixe global](/faq/global-prefix) pour toutes les routes enregistrées dans votre application, ou activer le [versioning](/techniques/versioning).

Par ailleurs, il existe des cas où la définition d'un préfixe au niveau d'un module (et donc pour tous les contrôleurs enregistrés dans ce module) peut s'avérer utile. Par exemple, imaginez une application REST qui expose plusieurs points d'accès différents utilisés par une partie spécifique de votre application appelée "Dashboard".
Dans un tel cas, au lieu de répéter le préfixe `/dashboard` dans chaque contrôleur, vous pourriez utiliser un module utilitaire `RouterModule`, comme suit :

```typescript
@Module({
  imports: [
    DashboardModule,
    RouterModule.register([
      {
        path: 'dashboard',
        module: DashboardModule,
      },
    ]),
  ],
})
export class AppModule {}
```

> info **Astuce** La classe `RouterModule` est exportée du package `@nestjs/core`.

En outre, vous pouvez définir des structures hiérarchiques. Cela signifie que chaque module peut avoir des modules "enfants".
Les modules enfants hériteront du préfixe de leur parent. Dans l'exemple suivant, nous allons enregistrer le module `AdminModule` en tant que module parent des modules `DashboardModule` et `MetricsModule`.

```typescript
@Module({
  imports: [
    AdminModule,
    DashboardModule,
    MetricsModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          {
            path: 'dashboard',
            module: DashboardModule,
          },
          {
            path: 'metrics',
            module: MetricsModule,
          },
        ],
      },
    ])
  ],
});
```

> info **Astuce** Cette fonctionnalité doit être utilisée avec précaution, car une utilisation excessive peut rendre le code difficile à maintenir dans le temps.

Dans l'exemple ci-dessus, tout contrôleur enregistré dans le `DashboardModule` aura un préfixe supplémentaire `/admin/dashboard` (car le module concatène les chemins de haut en bas - récursivement - du parent aux enfants).
De même, chaque contrôleur défini à l'intérieur du `MetricsModule` aura un préfixe supplémentaire au niveau du module `/admin/metrics`.
