import { Component, OnInit, ViewChild, ElementRef, NgZone, ViewContainerRef, Input } from '@angular/core';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import { MessageService } from '../../../services/message-service';
import { Subscription } from 'rxjs';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { NgForm } from '@angular/forms';
import { FormValidationService } from '../../../services/form-validation.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';

@Component({
  selector: 'app-referral-manage-contact-modal',
  templateUrl: './referral-manage-contact-modal.component.html',
  styleUrls: ['./referral-manage-contact-modal.component.css']
})
export class ReferralManageContactModalComponent implements OnInit {
  @ViewChild('referralManageContactModal') referralManageContactModal: ElementRef;
  @ViewChild('editForm', { static: true }) editForm: NgForm;

  public isEdit: boolean;
  private modalRef: NgbModalRef;
  public subscription: Subscription;
  public model: any;
  public submitted = false;
  public initialized = false;
  public firstReferralManualInsertion = null;

  constructor(
    private api: ApiService,
    private modalService: NgbModal,
    private messageService: MessageService,
    private formValidation: FormValidationService,
    private authService: AuthenticationService,
    private featureToggle: FeatureToggleClientService,
    private mixPanelHelperService: MixpanelHelperService,
  ) { }

  ngOnInit() {
    this.api.LogReferralPipe('referral-manage-contact-modal', 'open', 'dashboard', 'referral_lff_v1');
    this.init();
  }

  onSubmit(form) {
    this.api.LogReferralPipe('referral-manage-contact-modal', 'submit', 'dashboard', 'referral_lff_v1');
    this.submitted = true;

    if (this.validate()) {
      if (this.isEdit) {
        this.updateContacts(this.model);
      } else {
        this.insertContacts(this.model);
      }
    }

    return false;
  }

  validate() {
    if (this.model.name === '' || this.model.email === '') {
      return false;
    }
    return true;
  }

  open(lead, isEdit) {
    this.init();
    this.isEdit = isEdit;
    if (this.isEdit && lead != null) {
      this.model = lead;
    }
    this.modalRef = this.modalService.open(this.referralManageContactModal);
    this.initialized = true;
    return false;
  }

  init() {
    this.initialized = false;
    this.model = {
      name: '',
      email: '',
      phone: '',
      source: '',
      status: '',
      active: '',
      id: ''
    };
  }


  close() {
    this.api.LogReferralPipe('referral-manage-contact-modal', 'close', 'dashboard', 'referral_lff_v1');
    this.modalRef.close();
  }

  getReadonlyEmail() {
    return this.model.status !== '' && this.model.status !== 'new';
  }

  insertContacts(data) {
    this.api.LogReferralPipe('referral-manage-contact-modal', 'insert', 'dashboard', 'referral_lff_v1');
    this.api.post(`/customer-leads/save`, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      source: 'manual-insert'
    }, true, false).subscribe(result => {
      this.close();
      swal.fire({ title: 'Created!', text: '', icon: 'success', timer: 1000, showConfirmButton: false } as SweetAlertOptions);
      this.messageService.sendMessage('my-referrals-list', {});
      this.submitted = false;

      if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
        const customer = this.authService.getUserInfo();
        const eventData = { last_referral_manual_insertion: new Date().toISOString(), first_referral_manual_insertion: this.firstReferralManualInsertion ?? new Date().toISOString() };

        this.mixPanelHelperService.trackOnMixpanelCustomEvent('ReferralManualInsertion', eventData).subscribe();
      }
    }, error => {
      console.log(error);
    });
  }

  updateContacts(data) {
    this.api.LogReferralPipe('referral-manage-contact-modal', 'update', 'dashboard', 'referral_lff_v1');
    this.api.put(`/customer-leads`, {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      source: data.source,
      status: data.status,
      active: data.active
    }, true, false).subscribe(result => {
      this.close();
      swal.fire({ title: 'Changed!', text: '', icon: 'success', timer: 1000, showConfirmButton: false } as SweetAlertOptions);
      this.messageService.sendMessage('my-referrals-list', {});
      // this.editForm.reset();
      this.submitted = false;
    }, error => {
      console.log(error);
    });
  }
}
