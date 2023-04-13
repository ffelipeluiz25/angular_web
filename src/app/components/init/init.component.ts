import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.css']
})
export class InitComponent implements OnInit {

  constructor(private router: Router, private api: ApiService) { }

  ngOnInit() {
    this.redirectToRoute();
  }

  redirectToRoute(){
    this.api.get('/router',null,false,true).subscribe(result =>{

    });
  }

}
