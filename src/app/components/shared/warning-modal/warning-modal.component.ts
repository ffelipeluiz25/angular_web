import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-warning-modal',
  templateUrl: './warning-modal.component.html',
  styleUrls: ['./warning-modal.component.css']
})
export class WarningModalComponent implements OnInit {

  @ViewChild('warningModal') eConsentModal: ElementRef;

  public title: string;
  public message: string;
  public type: string;

  constructor(private modalService: NgbModal) { }

  ngOnInit() {

  }

  open(title: string, message: string, type: string) {
    this.title = title;
    this.message = message;
    this.type = type;
    this.modalService.open(this.eConsentModal, { size: 'lg' });
    return false;
  }

}
