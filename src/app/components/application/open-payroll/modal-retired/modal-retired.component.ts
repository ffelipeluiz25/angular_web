import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
@Component({
  selector: 'app-modal-retired',
  templateUrl: './modal-retired.component.html',
  styleUrls: ['./modal-retired.component.css']
})
export class ModalRetiredComponent implements OnInit {

  @ViewChild('modalRetired') modalRetired: ElementRef;
  @Input('retiredData') retiredData: any;

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
  }

  open() {
    this.modalService.open(this.modalRetired, { size: 'lg' });
    return false;
  }

}