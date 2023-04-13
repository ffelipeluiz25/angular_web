import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-terms-modal',
  templateUrl: './terms-modal.component.html',
  styleUrls: ['./terms-modal.component.css']
})
export class TermsModalComponent implements OnInit {

  @ViewChild('termsModal') termsModal: ElementRef;
  
  constructor(private modalService: NgbModal) { }

  ngOnInit() {
  }

  open(){
    this.modalService.open(this.termsModal, { size: 'lg' });
    return false;
  }
}
