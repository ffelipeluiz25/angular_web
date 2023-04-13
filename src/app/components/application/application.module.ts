import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MirandaComponent } from './miranda/miranda.component';
import { PersonalInformationComponent } from './personal-information/personal-information.component';
import { LoanTermsComponent } from './loan-terms/loan-terms.component';
import { ProcessingComponent } from './processing/processing.component';
import { PendingDocumentsComponent } from './pending-documents/pending-documents.component';
import { DoneComponent } from './done/done.component';
import { SignatureComponent } from './signature/signature.component';
import { FinishComponent } from '../shared/finish/finish.component';
import { DeniedComponent } from './denied/denied.component';
import { CreateNewApplicationComponent } from '../shared/create-new-application/create-new-application.component';
import { EditComponent } from './edit/edit.component';
import { RefiComponent } from './refi/refi.component';
import { MirandaCaComponent } from './miranda/miranda-ca/miranda-ca.component';
import { MirandaDeComponent } from './miranda/miranda-de/miranda-de.component';
import { MirandaScComponent } from './miranda/miranda-sc/miranda-sc.component';
import { NgxPlaidLinkModule } from 'ngx-plaid-link';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PhonePipe } from '../../pipes/phone.pipe';
import { PlaidSelectBankModalComponent } from '../shared/plaid-select-bank-modal/plaid-select-bank-modal.component';
import { UploadDocumentComponent } from '../shared/upload-document/upload-document.component';
import { PlaidPendingDocumentsModalComponent } from '../shared/plaid-pending-documents-modal/plaid-pending-documents-modal.component';
import { AuthorizationModalComponent } from './signature/authorization-modal/authorization-modal.component';
import { NgxFileDropModule } from 'ngx-file-drop';
import { SearchEmployerService } from '../../services/search-employer.service';
import { SharedModule } from '../shared/shared.module';
import { MirandaMtComponent } from './miranda/miranda-mt/miranda-mt.component';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { ContinueOnMobileComponent } from '../shared/continue-on-mobile-modal/continue-on-mobile-modal.component';
import { VerifyPhoneNumberComponent } from './verify-phone-number/verify-phone-number.component';
import { BankSelectionComponent } from './bank-selection/bank-selection.component';
import { SearchBankService } from '../../services/search-bank.service';
import { DecisionLogicModalComponent } from '../shared/decision-logic-modal/decision-logic-modal.component';
import { BankInformationComponent } from './bank-information/bank-information.component';
import { PopoverModule } from 'ngx-smart-popover';
import { OpenPayrollComponent } from './open-payroll/open-payroll-component';
import { PolicyModalComponent } from '../shared/policy-modal/policy-modal.component';
import { TermsModalComponent } from '../shared/terms-modal/terms-modal.component';
import { ModalRetiredComponent } from './open-payroll/modal-retired/modal-retired.component';
import { FaceIdPluginComponent } from '../shared/face-id-plugin/face-id-plugin.component';
import { DebitCardComponent } from './debit-card/debit-card.component';
import { PsychologicalPokaYokeModalComponent } from './signature/psychological-poka-yoke-modal/psychological-poka-yoke-modal.component';
import { RefiNewComponent } from './refi-new/refi-new.component';

@NgModule({
  declarations: [
    MirandaComponent,
    PersonalInformationComponent,
    LoanTermsComponent,
    ProcessingComponent,
    PendingDocumentsComponent,
    DoneComponent,
    SignatureComponent,
    DeniedComponent,
    BankSelectionComponent,
    CreateNewApplicationComponent,
    EditComponent,
    RefiComponent,
    MirandaComponent,
    MirandaCaComponent,
    MirandaDeComponent,
    MirandaScComponent,
    PhonePipe,
    PlaidSelectBankModalComponent,
    UploadDocumentComponent,
    PlaidPendingDocumentsModalComponent,
    AuthorizationModalComponent,
    MirandaMtComponent,
    ContinueOnMobileComponent,
    VerifyPhoneNumberComponent,
    DecisionLogicModalComponent,
    BankInformationComponent,
    OpenPayrollComponent,
    PolicyModalComponent,
    TermsModalComponent,
    ModalRetiredComponent,
    FaceIdPluginComponent,
    DebitCardComponent,
    PsychologicalPokaYokeModalComponent,
    RefiNewComponent
  ],
  imports: [
    SharedModule,
    NgxPlaidLinkModule,
    NgxFileDropModule,
    PopoverModule,
    NgbModule,
    NgxQRCodeModule,
    RouterModule.forChild([
      { path: '', redirectTo: 'personal-information', pathMatch: 'full' },
      { path: 'miranda', component: MirandaComponent },
      { path: 'personal-information', component: PersonalInformationComponent },
      { path: 'verify-phone-number', component: VerifyPhoneNumberComponent },
      { path: 'bank-information', component: BankInformationComponent },
      { path: 'debit-card', component: DebitCardComponent },
      { path: 'open-payroll-integration', component: OpenPayrollComponent },
      { path: 'loan-terms', component: LoanTermsComponent },
      { path: 'processing', component: ProcessingComponent },
      { path: 'pending-documents', component: PendingDocumentsComponent },
      { path: 'done', component: DoneComponent },
      { path: 'signature', component: SignatureComponent },
      { path: 'finish', component: FinishComponent },
      { path: 'denied', component: DeniedComponent },
      { path: 'new-application', component: CreateNewApplicationComponent },
      { path: 'edit', component: EditComponent },
      { path: 'refi', component: RefiComponent },
      { path: 'new-refi', component: RefiNewComponent },
      { path: 'bank-selection', component: BankSelectionComponent },

    ])
  ],
  providers: [
    SearchEmployerService,
    SearchBankService
  ]
})
export class ApplicationModule { }
