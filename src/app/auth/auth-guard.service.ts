import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { UserService } from '../user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(public userService:UserService,
              public router: Router
             ) { }


  async canActivate() {
    let answer: boolean;
    await this.userService.getUserPromise.then(name=>{
                  answer= name==='niezalogowany'?false:true;
                  if (name==='niezalogowany') 
                    this.router.navigate(['account/login']);
          }).catch(err=>{console.log(err); answer=false;});
    return answer;
  }


}
