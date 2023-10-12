### Filtres d'exception

La seule différence entre la couche HTTP de [filtre d'exception](/exception-filters) et la couche web sockets correspondante est qu'au lieu de lancer `HttpException`, vous devez utiliser `WsException`.

```typescript
throw new WsException('Invalid credentials.');
```

> info **Astuce** La classe `WsException` est importée du package `@nestjs/websockets`.

Avec l'exemple ci-dessus, Nest va gérer l'exception lancée et émettre le message `exception` avec la structure suivante :

```typescript
{
  status: 'error',
  message: 'Invalid credentials.'
}
```

#### Filtres

Les filtres d'exception des sockets web se comportent de manière équivalente aux filtres d'exception HTTP. L'exemple suivant utilise un filtre à portée de méthode instancié manuellement. Tout comme pour les applications basées sur HTTP, vous pouvez également utiliser des filtres à l'échelle de la gateway (c'est-à-dire préfixer la classe de la gateway avec un décorateur `@UseFilters()`).

```typescript
@UseFilters(new WsExceptionFilter())
@SubscribeMessage('events')
onEvent(client, data: any): WsResponse<any> {
  const event = 'events';
  return { event, data };
}
```

#### Héritage

Généralement, vous créez des filtres d'exception entièrement personnalisés, conçus pour répondre aux exigences de votre application. Cependant, il peut y avoir des cas d'utilisation où vous souhaiteriez simplement étendre le **filtre d'exception de base**, et modifier son comportement en fonction de certains facteurs.

Pour déléguer le traitement des exceptions au filtre de base, vous devez étendre `BaseWsExceptionFilter` et appeler la méthode `catch()` héritée.

```typescript
@@filename()
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception, host) {
    super.catch(exception, host);
  }
}
```

L'implémentation ci-dessus n'est qu'une coquille démontrant l'approche. Votre implémentation du filtre d'exception étendu inclurait votre **logique métier** personnalisée (par exemple, le traitement de diverses conditions).
