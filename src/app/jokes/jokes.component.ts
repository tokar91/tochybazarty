import { Component, OnInit, AfterViewInit, OnDestroy,
   Input, ViewChild, ViewChildren, ElementRef, QueryList} from '@angular/core';
import {IJoke} from '../i-joke';
import {JokesService} from '../jokes.service';
import {UserService} from '../user.service';
import {Observable, Subscription} from 'rxjs';

import {ActivatedRoute} from '@angular/router';


@Component({
  selector: 'app-jokes',
  templateUrl: './jokes.component.html',
  styleUrls: ['./jokes.component.css']
})


export class JokesComponent implements OnInit,AfterViewInit,OnDestroy {

 user: string;
 
 @Input() mode: string;
 @Input() urlPrefix:string  = 'jokes/';
 @ViewChild('nojokes', {static: true}) nojokesElem: ElementRef;
 @ViewChild('container', {static: false}) containerRef: ElementRef;
 @ViewChildren('jokeElem') jokesQuery: QueryList<any>;
 orderBy:string;
 direction:any;
 amount:number;
 initialValue:number|string;
 property:string;
 searchValue:string;
 
 subscription:Subscription;

 jokes:Observable<{id:string, data:IJoke}[]>|null;

 marks:number[] = [1,2,3,4,5];
 markTimeout:any;

 timeout: number;
 colsHeight: number[] = [0];

constructor(private jokesService:JokesService,
            private userService:UserService,
            private activatedRoute: ActivatedRoute) { }


ngOnInit() {

  this.user = this.userService.user;
  //console.log('JOKES COMPONENT userService.user : ',
  // this.user, ' , USER MODE : ', this.mode)
  this.userService.getUser$.subscribe(
    user => {this.user = user;
  //  console.log('JOKES COMPONENT subscribe ', this.user)
  });

  this.jokesService.nojokesElem = this.nojokesElem.nativeElement;

  this.subscription =
  this.activatedRoute.paramMap.subscribe(
    params => { 
      this.orderBy = params.get('orderBy');
      this.direction = params.get('direction');
      this.amount = +params.get('amount');
      this.initialValue = params.get('initialValue');
      this.property = params.get('property');
      this.searchValue = params.get('searchValue');
      if(this.mode==='fav'){
        this.jokes = this.jokesService.getJokes(this.orderBy, this.direction, 
         this.amount, this.initialValue,this.property,this.searchValue, this.user);
      }else{
        this.jokes = this.jokesService.getJokes(this.orderBy, this.direction, 
          this.amount, this.initialValue,this.property,this.searchValue);                
      }
    }
  );

  this.userService.changeUrl(this.urlPrefix);

}

ngAfterViewInit() {
  const container: HTMLElement = this.containerRef.nativeElement;

  this.jokesQuery.changes.subscribe(
    val=>{
      if(val.length){
          this.orderJokes(container, true);
          //console.log('jokesQuery amount: '+val.length+' . Tytul pierwszego : '+
          // container.getElementsByClassName('joke')[0]
          // .getElementsByClassName('title')[0].innerHTML);

      }}
  )

  window.onresize = ()=>{
    window.clearTimeout(this.timeout);
    this.timeout = window.setTimeout(()=>this.orderJokes(container), 800);
  }

}


ngOnDestroy() {
   this.subscription.unsubscribe();
}


next() {
  let x:any = this.jokesService.getNextJokes();
  if(x){this.jokes=x};
}

previous() {
  let x:any = this.jokesService.getPreviousJokes();
  if(x){this.jokes=x};
}

delJoke(id:string, author:string) {
  if(window.confirm('Dowcip zostanie usunięty.')) 
    this.jokesService.deleteJoke(id, author);
}

addToFavourite(jokeId: string):void {
  this.jokesService.addToFavourite(jokeId, this.user);
}

removeFromFavourite(jokeId):void {
  this.jokesService.removeFromFavourite(jokeId, this.user);
}


markJoke(jokeId:string, mark:number, rating:number, container:HTMLElement, 
         author:string){
  
  if(this.user!=='niezalogowany'){
    if(author===this.user){
      window.alert('Własnych dowcipów się nie ocenia :-)');
      return;
    };
    clearTimeout(this.markTimeout);
    let starCol:HTMLCollection = container.getElementsByClassName('star');
    for(let i = 0; i < mark; i++){
      starCol[i].setAttribute('style', 
      'background-image: linear-gradient(orangered 0%, orangered 100%)');
    }
    this.markTimeout = setTimeout( ()=>{
        this.restoreDrawRating(rating, container);
        this.jokesService.markJoke(jokeId, mark, this.user, author);
      }, 1000
    );
  }else{
      window.alert('Zaloguj się aby oceniać żarty.');
  } 
}


drawRating(rating:number, mark:number){
  let lastStar: number = Math.floor(rating);
  let rest: number = (rating - lastStar)*100;
  if(mark <= rating){
    return 'linear-gradient(orange 0%, orange 100%)';
  }else if(mark - rating >= 1){
    return 'linear-gradient(gray 0%, gray 100%)'
  }else{
    return 'linear-gradient(to right, orange '+rest+'%, gray '+rest+'%)';
  }
}

restoreDrawRating(rating:number, container:HTMLElement){
  let lastStarIndex:number = Math.floor(rating);
  let rest:number = (rating - lastStarIndex)*100;
  let starCol: HTMLCollection = container.getElementsByClassName('star')
  for(let i = 0; i < 5; i++){
    if(i<lastStarIndex){
      starCol[i].setAttribute('style', 
      'background-image: linear-gradient(orange 0%, orange 100%)');
    }else if (i===lastStarIndex){
      starCol[i].setAttribute('style', 
      'background-image: linear-gradient(to right, orange '+rest+'%, gray '+
      rest+'%)');
    }else{
      starCol[i].setAttribute('style', 
      'background-image: linear-gradient(gray 0%, gray 100%)');
    }
  } 
}

orderJokes(container: HTMLElement, isRefreshed=false){
  let width = container.offsetWidth;
  let newColsLen = width<600?1:width<900?2:3;
  if(this.colsHeight.length===newColsLen&&!isRefreshed) return;
  if(this.colsHeight.length===1&&newColsLen===1) return;
  let jokes: HTMLCollection = container.getElementsByClassName('joke');
  let jokesLen: number = jokes.length;
  switch(newColsLen){
    case 1: this.colsHeight = [0];
            container.style.gridTemplateColumns = '';
            for(let joke of jokes[Symbol.iterator]()){   
               (<HTMLElement>joke).style.gridArea = '';   
            }
            return;
    case 2: if(this.colsHeight.length!==2) 
              container.style.gridTemplateColumns = 'auto auto'; 
            this.colsHeight = [0,0]; 
            break;
    case 3: if(this.colsHeight.length!==3) 
              container.style.gridTemplateColumns = 'auto auto auto'; 
            this.colsHeight = [0,0,0]; 
            break;
    default: return;
  }
  for(let i=0; i<jokesLen; i++){
    let jokeRowSpan = Math.ceil((<HTMLElement>jokes[i]).offsetHeight/10);
    let minColVal = Infinity;
    let minColIndex;
    for(let [i,colH] of this.colsHeight.entries()){
      if(colH<minColVal){
        minColVal = colH;
        minColIndex = i;
      }
    }
    let gridArea = 
      `${minColVal+1}/${minColIndex+1}/span ${jokeRowSpan}/${minColIndex+2}`;
    this.colsHeight[minColIndex] += jokeRowSpan;
    (<HTMLElement>jokes[i]).style.gridArea = gridArea;
  } 
}


}
