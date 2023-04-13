import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-debit-card-adapter",
  templateUrl: "./debit-card-adapter.component.html",
  styleUrls: ["./debit-card-adapter.component.css"],
})
export class DebitCardAdapterComponent implements OnInit {
  @Output() success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() unlockSubmitButton: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() dataModel: any;

  constructor() {}

  ngOnInit() {}

  paynearmeEmbeddedIsSuccess(callbackSuccess: boolean){
    if(callbackSuccess){
      this.success.emit(true);
    }
  }
  paynearmeEnableSubmitButton(enableButtonSubmit: boolean){
    if(enableButtonSubmit){
      this.unlockSubmitButton.emit(true);
    }
  }

  repayEmbeddedIsSuccess(callbackSuccess: boolean){
    if(callbackSuccess){
      this.success.emit(true);
    }
  }
  repayEnableSubmitButton(enableButtonSubmit: boolean){
    if(enableButtonSubmit){
      this.unlockSubmitButton.emit(true);
    }
  }
}
