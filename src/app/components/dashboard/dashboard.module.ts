import { environment } from '../../../environments/environment';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoanInformationComponent } from './loan-information/loan-information.component';
import { DocumentsComponent } from './documents/documents.component';
import { PaymentsComponent } from './payments/payments.component';
import { ReferralsComponent } from './referrals/referrals.component';
import { CustomerInfoComponent } from './customer-info/customer-info.component';
import { PlaidDashboardLinkComponent } from './plaid-dashboard-link/plaid-dashboard-link.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { ChangeAgencyComponent } from './change-agency/change-agency.component';
import { InactiveDashboardComponent } from './home/inactive-dashboard/inactive-dashboard.component';
import { ReferralWidgetComponent } from './referrals/referral-widget/referral-widget.component';
import { ActiveDashboardComponent } from './home/active-dashboard/active-dashboard.component';
import { RefiDashboardComponent } from './home/refi-dashboard/refi-dashboard.component';
import { LoanDetailsComponent } from './home/loan-details/loan-details.component';
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ReferralModalComponent } from '../shared/referral-modal/referral-modal.component';
import { ReferralTableModalComponent } from '../shared/referral-table-modal/referral-table-modal.component';
import { NgxPlaidLinkModule } from 'ngx-plaid-link';
import { RefiModalComponent } from './home/refi-modal/refi-modal.component';
import { NgxFileDropModule } from 'ngx-file-drop';
import { SharedModule } from '../shared/shared.module';
import { SearchEmployerService } from '../../services/search-employer.service';
import { ReferralBonusChartComponent } from '../shared/referral-bonus-chart/referral-bonus-chart.component';
import { ReferralsPastPaymentsComponent } from './referrals/referrals-past-payments/referrals-past-payments.component';
import { MyReferralsContactsComponent } from './referrals/my-referrals-contacts/my-referrals-contacts.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { Ng2SearchPipeModule, Ng2SearchPipe } from 'ng2-search-filter';
import { ImportContactsModalComponent } from '../shared/import-contacts-modal/import-contacts-modal.component';
import { MyReferralsListComponent } from './referrals/my-referrals-list/my-referrals-list.component';
import { ReferralManageContactModalComponent } from '../shared/referral-manage-contact-modal/referral-manage-contact-modal.component';
import { MsalModule } from '@azure/msal-angular';
import { ReferrralPanelsComponent } from './referrals/referrral-panels/referrral-panels.component';
import { PopoverModule } from 'ngx-smart-popover';
import { VideoTestimonialsComponent } from './video-testimonials/video-testimonials.component';
import { FinishComponent } from '../shared/finish/finish.component';
import { RefinanceComponent } from './refinance/refinance.component';
import { RefiInfoComponent } from '../shared/refi-info/refi-info.component';
import { ReferralModalFlyerComponent } from '../shared/referral-modal-flyer/referral-modal-flyer.component';
import { RecurringPaymentFormComponent } from './payment-ach/recurring-payment-form/recurring-payment-form.component';
import { MakePaymentACHComponent } from './payment-ach/make-payment-ach.component';
import { ReferralModalFlyerCommissionComponent } from '../shared/referral-modal-flyer-commission/referral-modal-flyer-commission.component';
import { CashlessRefinanceComponent } from './home/cashless-refinance/cashless-refinance.component';
import { CashlessOptionsMenuComponent } from './home/cashless-refinance/cashless-options-menu/cashless-options-menu.component';
import { RetokenizePayNearMeComponent } from './retokenize-pay-near-me/retokenize-pay-near-me.component';

@NgModule({
  declarations: [
    HomeComponent,
    LoanInformationComponent,
    DocumentsComponent,
    PaymentsComponent,
    ReferralsComponent,
    CustomerInfoComponent,
    PlaidDashboardLinkComponent,
    TransactionsComponent,
    ChangeAgencyComponent,
    InactiveDashboardComponent,
    ReferralWidgetComponent,
    ActiveDashboardComponent,
    RefiDashboardComponent,
    LoanDetailsComponent,
    ReferralModalComponent,
    ReferralModalFlyerCommissionComponent,
    ReferralModalFlyerComponent,
    ReferralTableModalComponent,
    RefiModalComponent,
    ReferralBonusChartComponent,
    ReferralsPastPaymentsComponent,
    ImportContactsModalComponent,
    MyReferralsListComponent,
    MyReferralsContactsComponent,
    ReferralManageContactModalComponent,
    ReferrralPanelsComponent,
    VideoTestimonialsComponent,
    RefinanceComponent,
    RefiInfoComponent,
    RecurringPaymentFormComponent,
    MakePaymentACHComponent,
    CashlessRefinanceComponent,
    CashlessOptionsMenuComponent,
    RetokenizePayNearMeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxPlaidLinkModule,
    NgbModule,
    PopoverModule,
    SharedModule,
    NgxFileDropModule,
    NgxPaginationModule,
    Ng2SearchPipeModule,
    MsalModule.forRoot({
      auth: {
        clientId: environment.social_login_config.microsoft_id
      }
    }),
    RouterModule.forChild([
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'loan-information', component: LoanInformationComponent },
      { path: 'documents', component: DocumentsComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'referrals', component: ReferralsComponent },
      { path: 'customer-info', component: CustomerInfoComponent },
      { path: 'bank-verification', component: PlaidDashboardLinkComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: 'change-agency', component: ChangeAgencyComponent },
      { path: 'my-referral-list', component: MyReferralsListComponent },
      { path: 'my-referral-contacts', component: MyReferralsContactsComponent },
      { path: 'referral-past-payments', component: ReferralsPastPaymentsComponent },
      { path: 'video-testimonials', component: VideoTestimonialsComponent },
      { path: 'write-your-review', component: FinishComponent },
      { path: 'refinance', component: RefinanceComponent },
      { path: 'make-ach-payment', component: MakePaymentACHComponent },
      { path: 'retokenize', component: RetokenizePayNearMeComponent }
    ])
  ],
  providers: [
    SearchEmployerService,
    Ng2SearchPipe
  ]
})
export class DashboardModule { }
