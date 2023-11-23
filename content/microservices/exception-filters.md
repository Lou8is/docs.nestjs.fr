### Filtres d'exception

La seule différence entre la couche HTTP [exception filter](/exception-filters) et la couche microservices correspondante est qu'au lieu de lancer `HttpException`, vous devez utiliser `RpcException`.

```typescript
throw new RpcException('Invalid credentials.');
```

> info **Astuce** La classe `RpcException` est importée du package `@nestjs/microservices`.

Avec l'exemple ci-dessus, Nest va gérer l'exception lancée et retourner l'objet `error` avec la structure suivante :

```json
{
  "status": "error",
  "message": "Invalid credentials."
}
```

#### Filtres

Les filtres d'exception des microservices se comportent de manière similaire aux filtres d'exception HTTP, avec une petite différence. La méthode `catch()` doit retourner un `Observable`.

```typescript
@@filename(rpc-exception.filter)
import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return throwError(() => exception.getError());
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class ExceptionFilter {
  catch(exception, host) {
    return throwError(() => exception.getError());
  }
}
```

> warning **Attention** Les filtres d'exception globaux des microservices ne sont pas activés par défaut lors de l'utilisation d'une [application hybride](/faq/hybrid-application).

L'exemple suivant utilise un filtre à portée de méthode instancié manuellement. Tout comme pour les applications basées sur HTTP, vous pouvez également utiliser des filtres à l'échelle du contrôleur (c'est-à-dire préfixer la classe du contrôleur avec un décorateur `@UseFilters()`).

```typescript
@@filename()
@UseFilters(new ExceptionFilter())
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@UseFilters(new ExceptionFilter())
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```

#### Héritage

En règle générale, vous créerez des filtres d'exception entièrement personnalisés, conçus pour répondre aux exigences de votre application. Cependant, il peut y avoir des cas d'utilisation où vous souhaiteriez simplement étendre le **filtre d'exception de base**, et modifier son comportement en fonction de certains facteurs.

Pour déléguer le traitement des exceptions au filtre de base, vous devez étendre `BaseExceptionFilter` et appeler la méthode `catch()` héritée.

```typescript
@@filename()
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter extends BaseRpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    return super.catch(exception, host);
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter extends BaseRpcExceptionFilter {
  catch(exception, host) {
    return super.catch(exception, host);
  }
}
```

L'implémentation ci-dessus n'est qu'une coquille démontrant l'approche. Votre implémentation du filtre d'exception étendu inclurait votre **logique métier** personnalisée (par exemple, le traitement de diverses conditions).
