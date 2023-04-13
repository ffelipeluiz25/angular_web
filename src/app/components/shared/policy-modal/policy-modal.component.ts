import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-policy-modal',
  templateUrl: './policy-modal.component.html',
  styleUrls: ['./policy-modal.component.css']
})
export class PolicyModalComponent implements OnInit {

  @ViewChild('policyModal') policyModal: ElementRef;
  
  constructor(private modalService: NgbModal) { }

  ngOnInit() {
  }

  open(){
    this.modalService.open(this.policyModal, { size: 'lg' });
    return false;
  }
}
