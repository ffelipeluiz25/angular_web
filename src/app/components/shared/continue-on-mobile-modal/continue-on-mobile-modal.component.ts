import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-continue-on-mobile-modal',
  templateUrl: './continue-on-mobile-modal.component.html',
  styleUrls: ['./continue-on-mobile-modal.component.css']
})
export class ContinueOnMobileComponent implements OnInit {

  @ViewChild('continueOnMobileModal') continueModal: ElementRef;
  public qrCodeValue = 'https://bmgmoney.com';
  public type = 'pending_documents';
  public url = 'url';

  constructor(private modalService: NgbModal,
    private api: ApiService) { }

  ngOnInit() {
  }

  open() {
    this.modalService.open(this.continueModal);
    return false;
  }

  resendHash(resend: number, type: any) {
    this.type = type;
    this.api.get(`/pending-documents/short-link?resend=` + resend + `&type=` + type, null, false, true).subscribe(result => {
      this.qrCodeValue = result.url;
      swal.fire('Success!', 'SMS successfully sent.', 'success');
    });
  }
}
