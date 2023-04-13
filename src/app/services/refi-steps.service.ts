import { Injectable } from '@angular/core';

@Injectable()
export class RefiStepsService {

  public LoanTerms = '1';
  public OpenPayrollIntegration = '2';
  public OpenBankingIntegration = '3';
  public DebitCard = '4';
  public Processing = '5';
  public BankingInformation = '6';

  getUrlToRedirect(step: string) {
    switch (step) {
      case this.LoanTerms: return '/application/new-refi';
      case this.OpenPayrollIntegration: return '/application/open-payroll-integration';
      case this.OpenBankingIntegration: return '/application/bank-selection';
      case this.DebitCard: return '/application/debit-card';
      case this.Processing: return '/application/processing';
      case this.BankingInformation: return '/application/bank-information';
    }
  }

}
