import { Component, OnInit, Input, ViewChild, ElementRef, NgZone, ViewContainerRef, Output, EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UtilityService } from '../../../../services/utility.service';
import { ReferralModalComponent } from '../../../shared/referral-modal/referral-modal.component';
import { ApiService } from '../../../../services/api.service';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ImportContactsModalComponent } from '../../../shared/import-contacts-modal/import-contacts-modal.component';
import { ReferralModalFlyerComponent } from '../../../shared/referral-modal-flyer/referral-modal-flyer.component';
import { ReferralModalFlyerCommissionComponent } from '../../../shared/referral-modal-flyer-commission/referral-modal-flyer-commission.component';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';

@Component({
  selector: 'app-referral-widget',
  templateUrl: './referral-widget.component.html',
  styleUrls: ['./referral-widget.component.css']
})
export class ReferralWidgetComponent implements OnInit {
  @ViewChild('referralModal') referralModal: ReferralModalComponent;
  @ViewChild('referralModalFlyer') referralModalFlyer: ReferralModalFlyerComponent;
  @ViewChild('referralFlyerCommissionModal') referralFlyerCommissionModal: ReferralModalFlyerCommissionComponent
  @ViewChild('importContactsModal') importContactsModal: ImportContactsModalComponent;
  @ViewChild('referralLink6') input_element: ElementRef;
  @Output() onCallbackPainels = new EventEmitter<string>();
  @Input() page: string;

  public modalRef: NgbModalRef;
  public referral: any = {};
  public referralLinkCopy = '';
  public referral_value = '';
  public referral_base64 = '';
  public featureFlyerBonusReferralEnabled = false;
  public featureReferralFlyer = false;

  constructor(
    private utils: UtilityService,
    private api: ApiService,
    private router: Router,
    private featureToggle: FeatureToggleClientService
  ) {

  }

  ngOnInit() {
    this.api.LogReferralPipe(this.page, 'referral-widget', 'dashboard', 'referral_lff_v1');
    this.featureFlyerBonusReferralEnabled = this.featureToggle.IsEnabled('flyer_bonus_referral');
    this.featureReferralFlyer = this.featureToggle.IsEnabled('referral_flyer');
  }

  openFlyerCommissionModal() {
    if (this.featureFlyerBonusReferralEnabled) {
      var flyer = localStorage.getItem(this.referral.referral_link);
      if (!flyer) {
        this.referralFlyerCommissionModal.openModal();
        localStorage.setItem(this.referral.referral_link, 't');
        this.onCallbackPainels.emit('false');
      }
      else {
        var active = document.getElementById('modal_flyer_commission');
        if (!active)
          this.onCallbackPainels.emit('true');
      }
    }
    else {
      this.onCallbackPainels.emit('true');
    }

  }

  update(referral: any) {
    this.referral = referral;
    this.referral_value = this.referral.referral_value;
    this.referralLinkCopy = `${this.referral.referral_link}-${this.utils.getReferralCodePrefix()}-1`;
    this.referral_base64 = this.referral.referral_flyer_commission;
    this.referral.referModal = false;
    this.referralModal.update(referral);
    this.openFlyerCommissionModal();
  }

  openModal() {
    this.referralModal.openModal();
    return false;
  }

  openModalFlyer() {
    this.referralModalFlyer.openModalFlyer();
    return false;
  }

  openImportContactsModal() {
    this.router.navigate(['/dashboard/my-referral-contacts']);
    return;
  }

  copy() {
    this.api.LogReferralPipe(this.page, 'copy_link', 'dashboard', 'referral_lff_v1');

    this.input_element.nativeElement.select();

    let result = '';
    try {
      const ok = document.execCommand('copy');
      if (ok) { result = 'Copied!'; } else { result = 'Unable to copy!'; }
    } catch (err) {
      result = 'Unsupported Browser!';
    }
    swal.fire('', result, 'info');
  }

  isMobile() {
    return this.utils.IsMobile();
  }

  onCallbackWidget(teste) {
    this.onCallbackPainels.emit('true');
  }
}
