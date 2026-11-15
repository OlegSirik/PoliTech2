import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { ProductSearchPageComponent } from './pages/products/product-search-page.component';
import { InsCompaniesPageComponent } from './pages/ins-companies/ins-companies-page.component';
import { InsCompanyEditPageComponent } from './pages/ins-companies/ins-company-edit-page.component';
import { AddonsPageComponent } from './pages/addons/addons-page.component';

import { AddonProviderEditPageComponent } from './pages/addons/addon-provider-edit-page.component';
import { AddonPricelistEditPageComponent } from './pages/addons/addon-pricelist-edit-page.component';

import { ProductVersionPageComponent } from './pages/products/product-version-page.component';
import { BusinessLinesPageComponent } from './pages/business-lines/business-lines-page.component';
import { BusinessLineEditPageComponent } from './pages/business-lines/business-line-edit-page.component';
import { CalculatorsPageComponent } from './pages/calculators/calculators-page.component';
import { CalculatorPageComponent } from './pages/calculators/calculator-page.component';
import { DemoPageComponent } from './pages/demo/demo-page.component';
import { RulesPageComponent } from './pages/rules/rules-page.component';
import { RuleEditPageComponent } from './pages/rules/rule-edit-page.component';
import { RefDictsPageComponent } from './pages/refdicts/refdicts-page.component';
import { QuotesPageComponent } from './pages/quotes/quotes-page.component';
import { PolicyViewPageComponent } from './pages/quotes/policy-view-page.component';


import { PartnersPageComponent } from './pages/partners/partners-page.component';

import { PartnerEditPageComponent } from './pages/partners/partner-edit-page.component';
import { PartnerCommissionPageComponent } from './pages/partners/partner-commission-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent, title: 'Вход · PoliTech2' },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent, title: 'Обзор · PoliTech2' },
      { path: 'products', component: ProductSearchPageComponent, title: 'Продукты · PoliTech2' },
      { path: 'ins-companies', component: InsCompaniesPageComponent, title: 'Страховые компании · PoliTech2' },
      { path: 'ins-companies/new', component: InsCompanyEditPageComponent, title: 'Новая страховая компания · PoliTech2' },
      { path: 'ins-companies/:id', component: InsCompanyEditPageComponent, title: 'Страховая компания · PoliTech2' },
      { path: 'addons', component: AddonsPageComponent, title: 'Доп.продукты · PoliTech2' },
      { path: 'addons/providers/new', component: AddonProviderEditPageComponent, title: 'Новый поставщик · PoliTech2' },
      { path: 'addons/providers/:id', component: AddonProviderEditPageComponent, title: 'Поставщик · PoliTech2' },
      { path: 'addons/pricelists/new', component: AddonPricelistEditPageComponent, title: 'Новая услуга · PoliTech2' },
      { path: 'addons/pricelists/:id', component: AddonPricelistEditPageComponent, title: 'Услуга · PoliTech2' },
      { path: 'products/:id/versions/:versionNo/packages/:packageNo/calculator', component: CalculatorPageComponent, title: 'Калькулятор · PoliTech2' },
      { path: 'products/:id/versions/:versionNo', component: ProductVersionPageComponent, title: 'Карточка продукта · PoliTech2' },
      { path: 'business-lines', component: BusinessLinesPageComponent, title: 'Линии бизнеса · PoliTech2' },
      { path: 'business-lines/new', component: BusinessLineEditPageComponent, title: 'Новая линия · PoliTech2' },
      { path: 'business-lines/:id', component: BusinessLineEditPageComponent, title: 'Линия бизнеса · PoliTech2' },
      { path: 'calculators', component: CalculatorsPageComponent, title: 'Калькуляторы · PoliTech2' },
      { path: 'demo', component: DemoPageComponent, title: 'Демо компонентов · PoliTech2' },
      { path: 'quotes', component: QuotesPageComponent, title: 'Котировки · PoliTech2' },
      { path: 'quotes/:policyNr', component: PolicyViewPageComponent, title: 'Договор · PoliTech2' },
      { path: 'partners', component: PartnersPageComponent, title: 'Партнеры · PoliTech2' },
      { path: 'partners/new', component: PartnerEditPageComponent, title: 'Новый партнер · PoliTech2' },
      { path: 'partners/:id/commissions/new', component: PartnerCommissionPageComponent, title: 'Агентский договор · PoliTech2' },
      { path: 'partners/:id/commissions/:commissionId', component: PartnerCommissionPageComponent, title: 'Агентский договор · PoliTech2' },
      { path: 'partners/:id', component: PartnerEditPageComponent, title: 'Партнер · PoliTech2' },
      { path: 'rules', component: RulesPageComponent, title: 'Правила · PoliTech2' },
      { path: 'rules/new', component: RuleEditPageComponent, title: 'Новое правило · PoliTech2' },
      { path: 'rules/:id', component: RuleEditPageComponent, title: 'Правило · PoliTech2' },
      { path: 'refdicts', component: RefDictsPageComponent, data: { mode: 'edit' }, title: 'Справочники · PoliTech2' },
      { path: 'refdicts/select', component: RefDictsPageComponent, data: { mode: 'select' }, title: 'Выбор справочника · PoliTech2' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
