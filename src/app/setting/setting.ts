import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Userservice } from '../services/userservice';

@Component({
  selector: 'app-setting',
  imports: [],
  template: '<p>Logging out...</p>',
})
export class Setting implements OnInit {
  constructor(private userService: Userservice, private router: Router) { }

  ngOnInit(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
