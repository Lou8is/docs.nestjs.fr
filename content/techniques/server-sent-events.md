### Événements envoyés par le serveur

Server-Sent Events (SSE) est une technologie de push serveur permettant à un client de recevoir des mises à jour automatiques d'un serveur via une connexion HTTP. Chaque notification est envoyée sous la forme d'un bloc de texte terminé par une paire de nouvelles lignes (pour en savoir plus [ici](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)).

#### Utilisation

Pour activer les événements envoyés par le serveur sur une route (route enregistrée dans une classe **controller**), annoter le gestionnaire de méthode avec le décorateur `@Sse()`.

```typescript
@Sse('sse')
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(map((_) => ({ data: { hello: 'world' } })));
}
```

> info **Astuce** Le décorateur `@Sse()` et l'interface `MessageEvent` sont importés du package `@nestjs/common`, tandis que `Observable`, `interval`, et `map` sont importés du package `rxjs`.

> warning **Attention** Les routes d'événements envoyés par le serveur doivent renvoyer un flux `Observable`.

Dans l'exemple ci-dessus, nous avons défini une route nommée `sse` qui nous permettra de propager des mises à jour en temps réel. Ces événements peuvent être écoutés à l'aide de l'API [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

La méthode `sse` retourne un `Observable` qui émet plusieurs `MessageEvent` (dans cet exemple, il émet un nouveau `MessageEvent` toutes les secondes). L'objet `MessageEvent` doit respecter l'interface suivante pour correspondre à la spécification :

```typescript
export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
```

Avec ceci en place, nous pouvons maintenant créer une instance de la classe `EventSource` dans notre application côté client, en passant la route `/sse` (qui correspond au point de terminaison que nous avons passé dans le décorateur `@Sse()` ci-dessus) comme argument du constructeur.

L'instance `EventSource` ouvre une connexion persistante à un serveur HTTP, qui envoie des événements au format `text/event-stream`. La connexion reste ouverte jusqu'à ce qu'elle soit fermée en appelant `EventSource.close()`.

Une fois la connexion ouverte, les messages entrants du serveur sont transmis à votre code sous la forme d'événements. Si le message entrant contient un champ d'événement, l'événement déclenché est le même que la valeur du champ d'événement. Si aucun champ d'événement n'est présent, un événement générique `message` est déclenché ([source](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)).

```javascript
const eventSource = new EventSource('/sse');
eventSource.onmessage = ({ data }) => {
  console.log('Nouveau message', JSON.parse(data));
};
```

#### Exemple

Un exemple concret est disponible [ici](https://github.com/nestjs/nest/tree/master/sample/28-sse).
