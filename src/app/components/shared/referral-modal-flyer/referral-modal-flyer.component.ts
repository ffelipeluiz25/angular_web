import { Component, OnInit, ViewChild, ElementRef, NgZone, ViewContainerRef, Input } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UtilityService } from '../../../services/utility.service';
import { ApiService } from '../../../services/api.service';
import { AuthenticationService } from '../../../services/authentication.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-referral-modal-flyer',
  templateUrl: './referral-modal-flyer.component.html',
  styleUrls: ['./referral-modal-flyer.component.css']
})
export class ReferralModalFlyerComponent implements OnInit {
  @ViewChild('referralModalFlyer') referralModalFlyer: ElementRef;
  @Input() page: string;
  public content_b64: string;
  public data_b64: string;
  public modalRef: NgbModalRef;
  public isMobile: boolean;
  public urlStorage: string;

  constructor(
    private utils: UtilityService,
    private modalService: NgbModal,
    private auth: AuthenticationService,
    private _ngZone: NgZone,
    private api: ApiService
  ) { }

  ngOnInit() {
    this.content_b64 = null;
    this.isMobile = this.utils.IsMobile();
  }

  async getReferralFlyer() {
    this.openModal();
    await this.api.get('/customer-referral-flyer', null, true, false).subscribe(result => {
      if (result.success) {
        var data = JSON.parse(result.data);
        this.data_b64 = data.data.base64;
        this.content_b64 = "data:image/png;base64," + this.data_b64;
        this.urlStorage = data.data.url;
        this.toShare();
      }
      else {
        Swal.fire('', 'Referral not found', 'warning');
      }
    });
  }

  openModal() {
    this.modalRef = this.modalService.open(this.referralModalFlyer, { size: 'lg', backdrop: 'static', windowClass: 'modal-xl' });
    this.modalRef.result.then((result) => {
    }, (reason) => {
      this.closeModal();
    });
    this._ngZone.run(() => { });
  }

  download() {
    this.createDownload();
  }

  toShare() {
    if (this.urlStorage) {
      const shareData = {
        title: 'Referral Flyer',
        text: 'Referral Flyer',
        url: this.urlStorage
      }

      const btn = document.getElementById('btnShare');
      const resultPara = document.querySelector('.result');
      if (btn != null) {
        btn.addEventListener('click', async () => {
          await navigator.share(shareData)
        });
      }
    }
  }

  createDownload() {
    var a = document.createElement("a"); //Create <a>
    a.href = "data:image/png;base64," + this.data_b64; //Image Base64 Goes here
    a.download = "referral_flyer.jpg";
    a.click();
  }

  async openModalFlyer() {
    await this.getReferralFlyer();
    return false;
  }

  closeModal() {
    this.content_b64 = null;
    this.api.LogReferralPipe(this.page, 'close_share_modal_flyer', 'dashboard', 'referral_lff_v1');
  }
}