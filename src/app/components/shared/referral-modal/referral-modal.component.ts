import { Component, OnInit, ViewChild, ElementRef, NgZone, ViewContainerRef, Input } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UtilityService } from '../../../services/utility.service';
import { ApiService } from '../../../services/api.service';
import * as printJS from 'print-js';
import swal from 'sweetalert2';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { Observable } from 'rxjs';

declare var FB: any;
@Component({
  selector: 'app-referral-modal',
  templateUrl: './referral-modal.component.html',
  styleUrls: ['./referral-modal.component.css']
})
export class ReferralModalComponent implements OnInit {

  public referralLink: string;
  public referralLinkCopy: string;
  public referralValue: string;
  public whatsappMessage: SafeUrl;
  public smsMessage: SafeUrl;
  public mailtoMessage: SafeUrl;
  public modalRef: NgbModalRef;
  public isMobile: boolean;
  public bodyText: string;
  public referralShareMessage = '';
  public referModal: boolean = false;

  @ViewChild('referralModal') referralModal: ElementRef;
  @Input() page: string;


  constructor(
    private utils: UtilityService,
    private modalService: NgbModal,
    private _ngZone: NgZone,
    vcr: ViewContainerRef,
    private api: ApiService,
    private featureToggle: FeatureToggleClientService,
    private mixPanelHelperService: MixpanelHelperService,
    private authService: AuthenticationService
  ) {

  }

  ngOnInit() {
    this.isMobile = this.utils.IsMobile();
  }

  getText(type: string) {
    let text = 'Check out LoansForFeds, loans start at $2,000 with affordable interest rates and payment plans.' +
      ' Also, no credit score required. Check them out!.';

    text += ` ${this.referralLink}-${type}-1`;

    return text;
  }

  update(referral: any) {
    this.referralLink = referral.referral_link;
    this.referralValue = referral.referral_value;
    this.referralLinkCopy = `${this.referralLink}-${this.utils.getReferralCodePrefix()}-1`;
    this.referModal = referral.referModal;
    this.whatsappMessage = this.utils.Sanitize(`whatsapp://send?text=${this.getText('wp')}`);
    this.smsMessage = this.utils.Sanitize(`sms: ?&body=${this.getText('sms')}`);
    this.mailtoMessage = this.utils.Sanitize(`mailto:?subject=Check out LoansForFeds&body=${this.getText('em')}`);

    this.bodyText = 'Check out LoansForAll, loans start at $2,000 where bad credit is not a problem. ' +
      'Best of all you can earn some money too - $' + this.referralValue + ' per referral. Check them out!';

    this.referralShareMessage = 'Share your referral code ';
    if (referral.sub_program == '5') {
      this.referralShareMessage = 'Refer a coworker or a federal/military retiree';
    }
  }

  openModal() {
    this.api.LogReferralPipe(this.page, 'open_share_modal', 'dashboard', 'referral_lff_v1');

    this.modalRef = this.modalService.open(this.referralModal);
    this.modalRef.result.then((result) => {
    }, (reason) => {
      this.closeModal();
    });

    this._ngZone.run(() => { });
    return false;
  }

  closeModal() {
    this.api.LogReferralPipe(this.page, 'close_share_modal', 'dashboard', 'referral_lff_v1');
  }

  copy(id: string) {
    this.api.LogReferralPipe(`${this.page}_share_modal`, 'copy_link', 'dashboard', 'referral_lff_v1');

    var input: any = document.getElementById(id);
    input.select();

    var result = '';
    try {
      var ok = document.execCommand('copy');
      if (ok) result = 'Copied!';
      else result = 'Unable to copy!';
    } catch (err) {
      result = 'Unsupported Browser!';
    }

    if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
      this.trackOnMixpanel('Link').subscribe();
    }

    swal.fire('', result, 'info');
  }

  shareFB() {
    this.clickButton('facebook');

    FB.ui(
      {
        method: 'share',
        quote: this.getText('fb'),
        href: this.referralLink
      }, function (response) { });

    if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
      this.trackOnMixpanel('Facebook').subscribe();
    }
    return false;
  }

  twitterShare() {
    this.clickButton('twitter');

    const width = 575,
      height = 400,
      left = (window.screen.width - width) / 2,
      top = (window.screen.height - height) / 2,
      url = `https://twitter.com/intent/tweet?text=${this.getText('tw')}`,
      opts = `status=1,width=${width},height=${height},top=${top},left=${left}`;
    window.open(url, 'twitter', opts);

    if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
      this.trackOnMixpanel('Twitter').subscribe();
    }
    return false;
  }

  openReferralPrintFlyerModal() {

    this.api.postResponeType('/dashboard', null, true, false).subscribe(result => {
      const blob = new Blob([result], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      printJS(url);
    });
    return false;
  }

  clickButton(source: string) {
    this.api.LogReferralPipe(`${this.page}_share_modal`, `${source}_button_click`, 'dashboard', 'referral_lff_v1');

    if (this.featureToggle.IsEnabled('mixpanel_tracking') && (source == 'email' || source == 'whatsapp')) {
      this.trackOnMixpanel(this.titleCase(source)).subscribe();
    }
  }

  trackOnMixpanel(shareMethod: string): Observable<any> {
    const customer = this.authService.getUserInfo();

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('ReferralShared', { share_method: shareMethod });
  }

  titleCase(str) {
    return str.toLowerCase().replace(/\b(\w)/g, s => s.toUpperCase());
  }
}
