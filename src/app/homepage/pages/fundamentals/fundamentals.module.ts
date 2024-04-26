import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AsyncComponentsComponent } from './async-components/async-components.component';
import { CircularDependencyComponent } from './circular-dependency/circular-dependency.component';
import { DependencyInjectionComponent } from './dependency-injection/dependency-injection.component';
import { DynamicModulesComponent } from './dynamic-modules/dynamic-modules.component';
import { LifecycleEventsComponent } from './lifecycle-events/lifecycle-events.component';
import { ModuleRefComponent } from './module-reference/module-reference.component';
import { ExecutionContextComponent } from './execution-context/execution-context.component';
import { PlatformAgnosticismComponent } from './platform-agnosticism/platform-agnosticism.component';
import { ProviderScopesComponent } from './provider-scopes/provider-scopes.component';
import { UnitTestingComponent } from './unit-testing/unit-testing.component';
import { LazyLoadingModulesComponent } from './lazy-loading-modules/lazy-loading-modules.component';

const routes: Routes = [
  {
    path: 'dynamic-modules',
    component: DynamicModulesComponent,
    data: { title: 'Modules dynamiques' },
  },
  {
    path: 'dependency-injection',
    redirectTo: 'custom-providers',
  },
  {
    path: 'custom-providers',
    component: DependencyInjectionComponent,
    data: { title: 'Fournisseurs personnalisés' },
  },
  {
    path: 'platform-agnosticism',
    component: PlatformAgnosticismComponent,
    data: { title: 'Agnosticisme de plateforme' },
  },
  {
    path: 'async-components',
    redirectTo: 'async-providers',
  },
  {
    path: 'async-providers',
    component: AsyncComponentsComponent,
    data: { title: 'Fournisseurs asynchrones' },
  },
  {
    path: 'module-ref',
    component: ModuleRefComponent,
    data: { title: 'Référence de module' },
  },
  {
    path: 'lazy-loading-modules',
    component: LazyLoadingModulesComponent,
    data: { title: 'Lazy loading de modules' },
  },
  {
    path: 'unit-testing',
    redirectTo: 'testing',
  },
  {
    path: 'e2e-testing',
    redirectTo: 'testing',
  },
  {
    path: 'testing',
    component: UnitTestingComponent,
    data: { title: 'Tests' },
  },
  {
    path: 'injection-scopes',
    component: ProviderScopesComponent,
    data: { title: 'Portées d\'injection' },
  },
  {
    path: 'execution-context',
    component: ExecutionContextComponent,
    data: { title: 'Contexte d\'exécution' },
  },
  {
    path: 'lifecycle-events',
    component: LifecycleEventsComponent,
    data: { title: 'Événements du cycle de vie' },
  },
  {
    path: 'circular-dependency',
    component: CircularDependencyComponent,
    data: { title: 'Dépendance circulaire' },
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    AsyncComponentsComponent,
    PlatformAgnosticismComponent,
    DependencyInjectionComponent,
    DynamicModulesComponent,
    UnitTestingComponent,
    CircularDependencyComponent,
    ExecutionContextComponent,
    ProviderScopesComponent,
    LifecycleEventsComponent,
    ModuleRefComponent,
    LazyLoadingModulesComponent,
  ],
})
export class FundamentalsModule {}
