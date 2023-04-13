import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-referral-table-modal',
  templateUrl: './referral-table-modal.component.html',
  styleUrls: ['./referral-table-modal.component.css']
})
export class ReferralTableModalComponent implements OnInit {

  @ViewChild('referralTableModal') referralTableModal: ElementRef;
  public safeURL: any;

  constructor(private modalService: NgbModal, private _sanitizer: DomSanitizer) {
    this.safeURL = this._sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/JR_cyFYih7g");
  }

  ngOnInit() {
  }

  open() {
    this.modalService.open(this.referralTableModal, { size: 'lg' });
    return false;
  }

}