import { Component, OnInit, ViewChild, ElementRef, NgZone, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UtilityService } from '../../../services/utility.service';
import { ApiService } from '../../../services/api.service';
import { ReferralModalComponent } from '../referral-modal/referral-modal.component';
@Component({
  selector: 'app-referral-modal-flyer-commission',
  templateUrl: './referral-modal-flyer-commission.component.html',
  styleUrls: ['./referral-modal-flyer-commission.component.css']
})
export class ReferralModalFlyerCommissionComponent implements OnInit {
  @ViewChild('referralModalFlyerCommission') referralModalFlyerCommission: ElementRef;
  @ViewChild('referralModal') referralModal: ReferralModalComponent;
  @Output() onCallbackWidget = new EventEmitter<string>();
  @Input() page: string;
  @Input() imgBase64: string;
  @Input() referral: any;
  public modalRef: NgbModalRef;

  constructor(
    private utils: UtilityService,
    private modalService: NgbModal,
    private _ngZone: NgZone,
    private api: ApiService
  ) { }

  ngOnInit() {
  }

  openModal() {
    this.modalRef = this.modalService.open(this.referralModalFlyerCommission, { size: 'lg', backdrop: 'static' });
    this.modalRef.result.then((result) => {
    }, (reason) => {
      this.closeModal();
    });
    this._ngZone.run(() => { });
  }

  closeModal() {
    this.onCallbackWidget.emit('true');
    this.api.LogReferralPipe(this.page, 'close_share_modal_flyer', 'dashboard', 'referral_lff_v1');
  }

  referNow(){
    this.referral.referModal = true;
    this.referralModal.update(this.referral);
    this.referralModal.openModal();
    return false;
  }

}