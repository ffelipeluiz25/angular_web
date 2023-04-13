import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiService } from '../../../../services/api.service';
import { RepayApiService } from '../../../../services/repay-api.service';
import swal from 'sweetalert2';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
@Component({
  selector: 'app-repay-embedded',
  templateUrl: './repay-embedded.component.html',
  styleUrls: ['./repay-embedded.component.css']
})
export class RepayEmbeddedComponent implements OnInit, OnDestroy {
  @Output() success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() unlockSubmitButton: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() dataModel: any;

  private urlToken: string;
  public safeUrl: any;
  public loadEmbedded: boolean;
  public repayActiveAccount: any;
  public customerIsTokenized: boolean = false;

  public applicationType: string;
  public applicationStatus: string;
  public cardNumberActive: string = '';

  public ft_refiLFF: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private repayApi: RepayApiService,
    private featureToggleService: FeatureToggleClientService,
    private api: ApiService,
  ) { 
    this.ft_refiLFF = this.featureToggleService.IsEnabled('refiLFF');
  }

  ngOnInit(): void {
    this.startTimer();
    this.getCurrentApplicationInfo();
  }

  ngOnDestroy() {
    if (this.customerIsTokenized) {
      clearInterval(this.repayActiveAccount);
    }
  }

  startTimer() {
    setTimeout(() => {
      this.createUrlToken();
    }, 7000);
  }

  async createUrlToken() {
    let dataCreateToken: any = { customerId: this.dataModel.customerId };
    let route = '/api/repay';
    let result = await this.repayApi.post(route, dataCreateToken);
    if (!result.success) {
      this.showErrorMessage(result, 'info');
      this.loadEmbedded = true;
    } else {
      this.validateUserAccount();
      this.loadEmbedded = true;
      this.urlToken = result.data.url;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.urlToken);
    }
  }

  async isTokenized() {
    this.api.get('/debit-card/current-info', null, false, false, true).subscribe(result => {
      this.customerIsTokenized = result.data.isTokenized;
      if(this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1"){
        this.accounts();
      } else if(this.customerIsTokenized && this.applicationType != "2"){
        clearInterval(this.repayActiveAccount);
        this.unlockSubmitButton.emit(true);
        this.success.emit(true);
      }
    });
  }

  async accounts() {
    this.api.get('/debit-card/accounts', null, false, false, true).subscribe(result => {

      const cardActive = result.data.list.filter((card) => card.active == true);

      if(this.cardNumberActive == ''){
        this.cardNumberActive = cardActive[0].cardNumber;
      } else if(this.cardNumberActive != ''){
        if(this.cardNumberActive == cardActive[0].cardNumber){
          this.success.emit(false);
        } else{
          clearInterval(this.repayActiveAccount);
          this.unlockSubmitButton.emit(true);
          this.success.emit(true);
        }
      }
    });
  }

  validateUserAccount(){
    this.repayActiveAccount = setInterval(() => {
      this.isTokenized(); 
    }, 1000);
  }

  showErrorMessage(result: any, text: string) {
    swal.fire('Oops', `Please fill the ${text}.`, 'warning');
    console.log('Error', result);
  }

  getCurrentApplicationInfo() {
    this.api.get(`/refi/current-info`, null, true, true, true).subscribe(result => {
      if (result.success) {
        this.applicationType = result.data.applicationType;
        this.applicationStatus = result.data.applicationStatus;
      } else {
        swal.fire('', result.message, 'warning');
      }
    });
  }

}
