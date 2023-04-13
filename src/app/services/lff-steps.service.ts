import { Injectable } from '@angular/core';

@Injectable()
export class LoansForFedsSteps {

  public Login = '0';
  public PersonalInformation = '1';
  public ArgyleIntegration = '02.1';
  public AtomicIntegration = '02.2';
  public BankSelection = '02';
  public VerifyPhoneNumber = '03';
  public BankInformation = '04';
  public DebitCard = '04.1';
  public LoanTerms = '3';
  public Processing = '4';
  public PendingDocuments = '5';
  public Done = '6';
  public Signature = '7';
  public Survey = '8';
  public Dashboard = '9';
  public Denied = '10';
  public Miranda = '12';

  getUrlToRedirect(step: string) {
    switch (step) {
      case this.Login: return '/login';
      case this.PersonalInformation: return '/application/personal-information';
      case this.VerifyPhoneNumber: return '/application/verify-phone-number';
      case this.ArgyleIntegration: return '/application/open-payroll-integration';
      case this.AtomicIntegration: return '/application/open-payroll-integration';
      case this.BankSelection: return '/application/bank-selection';
      case this.BankInformation: return '/application/bank-information';
      case this.DebitCard: return '/application/debit-card';
      case this.LoanTerms: return '/application/loan-terms';
      case this.Processing: return '/application/processing';
      case this.PendingDocuments: return '/application/pending-documents';
      case this.Done: return '/application/done';
      case this.Signature: return '/application/signature';
      case this.Survey: return '/dashboard';
      case this.Dashboard: return '/dashboard';
      case this.Denied: return '/application/denied';
      case this.Miranda: return '/application/miranda';
    }
  }
}
