import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

@Component({
  selector: 'app-authorization-modal',
  templateUrl: './authorization-modal.component.html',
  styleUrls: ['./authorization-modal.component.css']
})
export class AuthorizationModalComponent implements OnInit {

  @ViewChild('authorizationModal') authorizationModal: ElementRef;

  public date: string;

  constructor(private modalService: NgbModal) { }

  ngOnInit() {
    this.date = moment().format('MM/DD/YYYY');
  }

  open() {
    this.modalService.open(this.authorizationModal, { size: 'lg' });
    return false;
  }

}
