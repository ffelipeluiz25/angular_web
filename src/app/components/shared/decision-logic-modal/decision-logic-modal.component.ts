import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-decision-logic-modal',
  templateUrl: './decision-logic-modal.component.html',
  styleUrls: ['./decision-logic-modal.component.css']
})
export class DecisionLogicModalComponent implements OnInit {

  @ViewChild('iframeModal') iframeModal: ElementRef;

  public requestCode: string;
  public urlWidget = "https://widget.decisionlogic.com/Service.aspx?requestCode=";
  public urlIframe: SafeResourceUrl;
  private showIframe: boolean = false;
  public modalRef: NgbModalRef;

  constructor(private modalService: NgbModal,
    private api: ApiService,
    private sanitizer: DomSanitizer) { }

  ngOnInit() { }

  open() {
    //this.modalService.open(this.iframeModal, {size: 'xl'} );
    //if (!this.utils.IsMobile()) {
    this.modalRef = this.modalService.open(this.iframeModal, { size: 'xl' });
    this.modalRef.result.then((result) => {
    });
    //}
    return false;
  }

  close() {
    this.modalRef.close();
  }

  getUrl() {
    this.showIframe = false;
    this.api.get(`/decision-logic/request-code`, null, false, true).subscribe(result => {
      if (result.success) {
        this.requestCode = result.requestCode;
        let url = this.urlWidget + this.requestCode;
        this.urlIframe = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.showIframe = true;
      } else {
        swal.fire('Error linking account', 'There was an error linking your account. Please refresh your browser and try again.', 'warning');
      }
    });
  }



}
