import { Component, OnInit, Input } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-page-step',
  templateUrl: './page-step.component.html',
  styleUrls: ['./page-step.component.css']
})
export class PageStepComponent implements OnInit {

  @Input('pipe_step') pipe_step: string;
  @Input('show_divider') show_divider: boolean;


  public step: any = {};

  constructor(private api: ApiService) { }

  ngOnInit() {
    if (this.show_divider === undefined) {
      this.show_divider = true;
    }
    this.getStep();
  }

  getStep() {
    this.api.get('/get-step-progression', { pipe_step: this.pipe_step }, false).subscribe(result => {
      this.step = result.step;
    });
  }
}
