import { Component, OnInit, OnDestroy } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {trigger, state, style, transition, animate} from '@angular/animations';
import {IJoke} from '../i-joke';
import {Observable, Subscription} from 'rxjs';
import {JokesService} from '../jokes.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  animations: [
    trigger('emergeAnimation', [
      state('in', style({opacity:1})),
      transition(':enter', [style({opacity:0}), animate(800)])
    ])
  ]
})

export class AccountComponent implements OnInit,OnDestroy {

  user: string = 'niezalogowany';

  average: string = "";
  bestMark: string = "";
  counter: string = "";
  rating: string = "";
  numberOfJokes: string = "";
  registerDate: string  = "";

  subscription: Subscription;

  mode: string;
  orderBy:string;

  jokes: Observable<{id:string,data:IJoke}[]>|void;

  toggleNewPassInfo: boolean =  false;
  toggleNewNameInfo: boolean = false;

  formResp: {[key:string]:any} = {form: '', message: ''};

  constructor(private activatedRoute:ActivatedRoute,
              private jokesService:JokesService,
              private userService:UserService) { }

  ngOnInit() {
    this.subscription = this.activatedRoute.paramMap.subscribe(
      params => {
      this.mode = params.get('mode');
      this.orderBy = params.get('orderBy');
      // console.log('ACCOUNT COMPONENT mode : ', this.mode);                    
      if(!this.orderBy){
        this.jokesService.emitParams([undefined,undefined,
          undefined,undefined,undefined,undefined])
      };
      if(this.mode==='stats'){
        this.userService.getStatistics().then(
          statsSnaps => {
              this.average = statsSnaps[0].data().average.toFixed(2);
              this.bestMark = statsSnaps[0].data().bestMark.toFixed(2);
              this.rating =  statsSnaps[0].data().rating.toFixed(0);
              this.counter = statsSnaps[0].data().counter.toString();
              this.numberOfJokes = statsSnaps[1].data().numberOfJokes.toString();
              let date: Date = new Date(+statsSnaps[1].data().date);
              this.registerDate = 
              `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
          }).catch(error=>console.log(error));
      }});

    this.user = this.userService.user;
    this.userService.getUser$.subscribe(
             user => {this.user = user;
             //console.log('ACCOUNT COMPONENT subscribe user: ', this.user);
             });   
    
    this.userService.formResp$.subscribe(
      obj => {this.formResp = {form: obj.form, message: obj.message};}
    )  
    
  }
  
  ngOnDestroy(){
    this.subscription.unsubscribe();
  }

  logIn(name:string, password:string):void {

    if(!name){ 
      this.setFormResp('logInForm', 'Nie wpisano nazwy użytkownika');
      return;
    }
    if(!password){
       this.setFormResp('logInForm', 'Nie wpisano hasła');
       return;
    }
    this.userService.logIn(name,password,true); 
  }

  createAccount(name:string,pass1:string,pass2:string):void {

    const valResp = this.chooseValResp(pass1, pass2, false, name);
    if(valResp){
      this.setFormResp('registerForm', valResp);
      return;
    }
    this.userService.createAccount(name,pass1,pass2);
  }

  removeAccount(password: string):void {    
    this.userService.usersCol.doc(this.user).ref.get().then(
      docSnap => {
        if(docSnap.data().password === password){
          if(window.confirm('Czy jesteś pewien, że chcesz trwale usunąć '+
           'swoje konto i wszystkie jego dane?')){
            this.userService.removeAccount(this.user);
          }     
        }else{
          window.alert('Podano niepoprawne hasło.')
        }   
        }
    ) 
  }
  
  changePassword(oldPass: string, pass1: string, pass2: string, 
    valRespElem: HTMLElement, formElem: HTMLFormElement): void {

    const valResp = this.chooseValResp(pass1, pass2, oldPass);
    if(valResp){ 
      this.changePassResp(valRespElem, valResp);
      return;
    }
    this.userService.usersCol.doc(this.user).ref.get().then(
        docSnap => { 
          if(docSnap.data().password === oldPass){
            this.userService.usersCol.doc(this.user).update({'password':pass1})
            .then(_=>{window.localStorage.setItem('pass1', pass1);
                      this.changePassResp(valRespElem, 'Hasło zostało zmienione', 
                      'rgb(0,180,0)');
                      formElem.reset();
                    });
            }else{
              this.changePassResp(valRespElem, 'Niepoprawne stare hasło');
            }
          }
      )
  }


  private chooseValResp(pass1: string, pass2: string, 
    oldPass: string|false = false, name:string|false = false):string|false {
    if(name !== false){
      if(name===''||name===undefined) return 'Nie wpisano nazwy.';
      if(name.indexOf(' ')+1) return 'Nazwa nie może zawierać spacji.';
      if(name.length<2||name.length>15) 
        return 'Nazwa musi mieć od 2 do 15 znaków.';
      
    }
    if(oldPass!==false&&(oldPass===undefined||!oldPass.trim())) 
      return 'Nie wpisano hasła.';
    if(!pass1) return 'Nie wpisano nowego hasła.';
    if(!pass2) return 'Nie powtórzono hasła.';
    if(pass1.indexOf(' ')+1) return 'Hasło nie może zawierać spacji.';
    if(pass1.length<4||pass1.length>12) 
      return 'Hasło musi mieć od 4 do 12 znaków.';
    if(!/\d+/.test(pass1)||!/[A-Za-z]+/.test(pass1)) 
      return 'Hasło musi mieć minimum jedną literę i cyfrę.';
    if(pass1 !== pass2) return 'Powtórzone hasło jest inne.';
    
    return false;
  }

  private setFormResp(form: string, message: string):void {
    this.formResp = {form, message}
  }

  private changePassResp(valRespElem: HTMLElement, message:string, 
                         bgColor: string = 'rgb(220,0,0)'):void {
    valRespElem.classList.remove('valRespOn');
    valRespElem.style.backgroundColor = bgColor;
    valRespElem.innerHTML = message;
    void valRespElem.offsetWidth;
    valRespElem.classList.add('valRespOn');
    
  }


}
