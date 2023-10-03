import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ErrorsComponent } from './errors/errors.component';
import { GlobalPrefixComponent } from './global-prefix/global-prefix.component';
import { HttpAdapterComponent } from './http-adapter/http-adapter.component';
import { HybridApplicationComponent } from './hybrid-application/hybrid-application.component';
import { KeepAliveConnectionsComponent } from './keep-alive-connections/keep-alive-connections.component';
import { MultipleServersComponent } from './multiple-servers/multiple-servers.component';
import { RawBodyComponent } from './raw-body/raw-body.component';
import { RequestLifecycleComponent } from './request-lifecycle/request-lifecycle.component';
import { ServerlessComponent } from './serverless/serverless.component';

const routes: Routes = [
  {
    path: 'global-prefix',
    component: GlobalPrefixComponent,
    data: { title: 'Préfixe de chemin global - FAQ' },
  },
  {
    path: 'hybrid-application',
    component: HybridApplicationComponent,
    data: { title: 'Application hybride - FAQ' },
  },
  {
    path: 'multiple-servers',
    component: MultipleServersComponent,
    data: { title: 'HTTPS et serveurs multiples - FAQ' },
  },
  {
    path: 'http-adapter',
    component: HttpAdapterComponent,
    data: { title: 'Adaptateur HTTP - FAQ' },
  },
  {
    path: 'keep-alive-connections',
    component: KeepAliveConnectionsComponent,
    data: { title: 'Connexions Keep-Alive - FAQ' },
  },
  {
    path: 'raw-body',
    component: RawBodyComponent,
    data: { title: 'Corps brut' },
  },
  {
    path: 'request-lifecycle',
    component: RequestLifecycleComponent,
    data: { title: 'Cycle de vie de la requête - FAQ' },
  },
  {
    path: 'common-errors',
    component: ErrorsComponent,
    data: { title: 'Erreurs fréquentes - FAQ' },
  },
  {
    path: 'serverless',
    component: ServerlessComponent,
    data: { title: 'Serverless - FAQ' },
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    GlobalPrefixComponent,
    HybridApplicationComponent,
    MultipleServersComponent,
    HttpAdapterComponent,
    KeepAliveConnectionsComponent,
    RequestLifecycleComponent,
    ErrorsComponent,
    ServerlessComponent,
  ],
})
export class FaqModule {}
