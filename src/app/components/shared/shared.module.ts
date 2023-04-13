import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadDocumentsGenericComponent } from './upload-documents-generic/upload-documents-generic.component';
import { PreviewModalComponent } from './upload-document/preview-modal/preview-modal.component';
import { PaymentTransferFormModalComponent } from './payment-transfer-form-modal/payment-transfer-form-modal.component';
import { DisablePastDirective } from '../../directives/disable-past.directive';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { LettersOnlyDirective } from '../../directives/letters-only.directive';
import { NumbersOnlyDirective } from '../../directives/numbers-only.directive';
import { MatchValidator } from '../../directives/validators/match.validator';
import { PoBoxValidator } from '../../directives/validators/po-box.validator';
import { SSNValidator } from '../../directives/validators/ssn.validator';
import { ZipcodeValidator } from '../../directives/validators/zipcode.validator';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ChooseButtonsComponent } from './choose-buttons/choose-buttons.component';
import { FormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';
import { OpenBankingComponent } from '../../components/shared/open-banking/open-banking.component';
import { PageStepComponent } from './page-step/page-step.component';
import { SimplePdfViewerModule } from 'simple-pdf-viewer';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { PopoverModule } from "ngx-smart-popover";
import { PinwheelPluginComponent } from './pinwheel-plugin/pinwheel-plugin.component';
import { OpenPayrollPluginComponent } from './open-payroll-plugin/open-payroll-plugin.component';
import { AtomicPluginComponent } from './atomic-plugin/atomic-plugin.component';
import { ArgylePluginComponent } from './argyle-plugin/argyle-plugin.component';
import { BankStatementComponent } from './upload-document/bank-statement/bank-statement.component';
import { BankStatement2Component } from './upload-document/bank-statement/bank-statement-2.component';
import { DocOpenBankingComponent } from './upload-document/doc-open-banking/doc-open-banking.component';
import { NewOfferCashlessComponent } from './new-offer-cashless/new-offer-cashless.component';
import { CurrentLoanSectionComponent } from './current-loan-section/current-loan-section.component';
import { CustomerSectionComponent } from './customer-section/customer-section.component';
import { LoanPortabilitySectionComponent } from './loan-portability-section/loan-portability-section.component';
import { ResultLoanTermsSectionComponent } from './new-offer-cashless/result-loan-terms-section/result-loan-terms-section.component';
import { PaymentTypeLabelComponent } from './payment-type-label/payment-type-label.component';
import { ChangeAddressNewOfferComponent } from './loan-portability-section/edit-new-offer-modal/change-address-new-offer/change-address-new-offer.component';
import { ChangeCalendarNewOfferComponent } from './loan-portability-section/edit-new-offer-modal/change-calendar-new-offer/change-calendar-new-offer.component';
import { ChangeEmployerNewOfferComponent } from './loan-portability-section/edit-new-offer-modal/change-employer-new-offer/change-employer-new-offer.component';
import { EditNewOfferModalComponent } from './loan-portability-section/edit-new-offer-modal/edit-new-offer-modal.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PhonePipeShared } from './pipes/phone.pipe';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { ChooseButtonsInstallmentsComponent } from './choose-buttons-installments/choose-buttons-installments.component';
import { MakeOneTimePaymentModalComponent } from './make-one-time-payment-modal/make-one-time-payment-modal.component';
import { PaynearmeEmbeddedComponent } from './paynearme/paynearme-embedded/paynearme-embedded.component';
import { StepsSectionComponent } from './steps-section/steps-section.component';
import { FooterMessageComponent } from './footer-message/footer-message.component';
import { PaynearmeModalComponent } from './paynearme/paynearme-modal/paynearme-modal.component';
import { BlockUIModule } from 'ng-block-ui';
import { PaymentAmountModalComponent } from './makepayment-modal/payment-amount-modal/payment-amount-modal.component';
import { RepayEmbeddedComponent } from './repay/repay-embedded/repay-embedded.component';
import { RepayModalComponent } from './repay/repay-modal/repay-modal.component';
import { DebitCardAdapterComponent } from './debit-card-adapter/debit-card-adapter.component';
import { DebitCardModalAdapterComponent } from './debit-card-modal-adapter/debit-card-modal-adapter.component';
import { PlanBACHModalsComponent } from './plan-b-ach-modals/plan-b-ach-modals.component';

@NgModule({
  declarations: [
    UploadDocumentsGenericComponent,
    PreviewModalComponent,
    PaymentTransferFormModalComponent,
    DisablePastDirective,
    AutofocusDirective,
    LettersOnlyDirective,
    NumbersOnlyDirective,
    MatchValidator,
    PoBoxValidator,
    SSNValidator,
    ZipcodeValidator,
    ChooseButtonsComponent,
    OpenBankingComponent,
    PageStepComponent,
    PdfViewerComponent,
    PinwheelPluginComponent,
    OpenPayrollPluginComponent,
    AtomicPluginComponent,
    ArgylePluginComponent,
    BankStatementComponent,
    BankStatement2Component,
    DocOpenBankingComponent,
    CurrentLoanSectionComponent,
    CustomerSectionComponent,
    LoanPortabilitySectionComponent,
    ResultLoanTermsSectionComponent,
    PaymentTypeLabelComponent,
    NewOfferCashlessComponent,
    ChangeAddressNewOfferComponent,
    ChangeCalendarNewOfferComponent,
    ChangeEmployerNewOfferComponent,
    EditNewOfferModalComponent,
    PhonePipeShared,
    ChooseButtonsInstallmentsComponent,
    MakeOneTimePaymentModalComponent,
    PaynearmeEmbeddedComponent,
    PaynearmeModalComponent,
    StepsSectionComponent,
    FooterMessageComponent,
    PaymentAmountModalComponent,
    RepayEmbeddedComponent,
    RepayModalComponent,
    DebitCardAdapterComponent,
    DebitCardModalAdapterComponent,
    PlanBACHModalsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PopoverModule,
    NgxFileDropModule,
    SimplePdfViewerModule,
    NgxPaginationModule,
    Ng2SearchPipeModule,
    NgxMaskModule.forRoot(),
    NgbModule,
    CurrencyMaskModule,
    BlockUIModule.forRoot(),
  ],
  exports: [
    CommonModule,
    FormsModule,
    NgxFileDropModule,
    UploadDocumentsGenericComponent,
    PreviewModalComponent,
    PaymentTransferFormModalComponent,
    DisablePastDirective,
    AutofocusDirective,
    LettersOnlyDirective,
    NumbersOnlyDirective,
    MatchValidator,
    PoBoxValidator,
    SSNValidator,
    ZipcodeValidator,
    ChooseButtonsComponent,
    OpenBankingComponent,
    NgxMaskModule,
    PageStepComponent,
    PdfViewerComponent,
    PinwheelPluginComponent,
    NgxMaskModule,
    NgxPaginationModule,
    Ng2SearchPipeModule,
    OpenPayrollPluginComponent,
    AtomicPluginComponent,
    ArgylePluginComponent,
    BankStatementComponent,
    BankStatement2Component,
    DocOpenBankingComponent,
    NewOfferCashlessComponent,
    ChooseButtonsInstallmentsComponent,
    EditNewOfferModalComponent,
    MakeOneTimePaymentModalComponent,
    PaynearmeEmbeddedComponent,
    PaynearmeModalComponent,
    StepsSectionComponent,
    FooterMessageComponent,
    PaymentAmountModalComponent,
    RepayEmbeddedComponent,
    RepayModalComponent,
    DebitCardAdapterComponent,
    DebitCardModalAdapterComponent,
    PlanBACHModalsComponent
  ]
})
export class SharedModule { }
