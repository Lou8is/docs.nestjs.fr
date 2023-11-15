### Documentation

**Compodoc** est un outil de documentation pour les applications Angular. Comme Nest et Angular partagent des structures de projet et de code similaires, **Compodoc** fonctionne également avec les applications Nest.

#### Mise en place

L'installation de Compodoc dans un projet Nest existant est très simple. Commencez par ajouter la dépendance dev avec la commande suivante dans le terminal de votre système d'exploitation :

```bash
$ npm i -D @compodoc/compodoc
```

#### Génération

Générer la documentation du projet en utilisant la commande suivante (npm 6 est nécessaire pour le support `npx`). Voir [la documentation officielle](https://compodoc.app/guides/usage.html) pour plus d'options.

```bash
$ npx @compodoc/compodoc -p tsconfig.json -s
```

Ouvrez votre navigateur et accédez à [http://localhost:8080](http://localhost:8080). Vous devriez voir un premier projet Nest CLI :

<figure><img src="/assets/documentation-compodoc-1.jpg" /></figure>
<figure><img src="/assets/documentation-compodoc-2.jpg" /></figure>

#### Contribuer

Vous pouvez participer et contribuer au projet Compodoc [ici](https://github.com/compodoc/compodoc).
