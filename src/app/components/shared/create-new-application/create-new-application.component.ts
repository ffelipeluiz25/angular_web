import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-new-application',
  templateUrl: './create-new-application.component.html',
  styleUrls: ['./create-new-application.component.css']
})
export class CreateNewApplicationComponent implements OnInit {

  constructor(private api:ApiService, private router:Router) { }

  ngOnInit() {
    this.createNewApplication();
  }

  createNewApplication() {
    this.api.post('/new-application',null, true).subscribe(result => {
      this.router.navigate(['/application/personal-information']);
    });
  }

}
