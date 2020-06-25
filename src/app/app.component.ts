import { Component, OnInit, HostListener, ChangeDetectorRef}
  from '@angular/core';
import {trigger, state, style, transition, animate} 
  from '@angular/animations';
import {JokesService} from './jokes.service';
import {UserService} from './user.service';
import {ChatService} from './chat.service';
import {Router} from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('displayAnim', [
      state('displayed', style({opacity: 1})),
      transition(':enter', [style({opacity: 0}), animate(1000)])
    ])
  ]
})

export class AppComponent implements OnInit{

  addJokeForm: HTMLFormElement;
  addJokeBG: HTMLDivElement;
  title:string;
  content:string;
  user: string = 'niezalogowany';

  orderBy: string;
  direction: string;
  amount:number;
  initialValue: number|string;
  property: string;
  searchValue: string;

  delay:any;
  urlPrefix: string;
  inputDateMax: string;
  
  topAverages: {[key:string]:any}[]; 
  topRatings: {[key:string]:any}[]; 
  topBestMarks:  {[key:string]:any}[]; 
  topAveToggle: boolean = false;
  topRatToggle: boolean = false;
  topBestToggle: boolean = false;
  
  chatFiltMode: number;
  resizeTimeout: number;

  inputFeedback:{'input':string, 'feedback': string} = {input:'', feedback: ''};

  unreadMessOrInv: boolean = false;

 constructor(private jokesService:JokesService,
             private userService:UserService,
             private chatService:ChatService,
             private router:Router,
             private cdRef: ChangeDetectorRef){  }
  

 ngOnInit(){

  this.jokesService.paramsOut$.subscribe(
          paramsMessage => {
            this.orderBy = paramsMessage[0];
            this.direction = paramsMessage[1];
            this.amount = paramsMessage[2];
            this.initialValue=paramsMessage[3];
            this.property=paramsMessage[4];
            this.searchValue=paramsMessage[5];
            this.cdRef.detectChanges();
            //console.log('APP COMPONENT paramsOut$. ', this.orderBy, this.direction, 
            //  this.amount,this.initialValue,this.property,this.searchValue);
          }
  );

  this.userService.urlOut$.subscribe(
    url => {this.urlPrefix = url;
            this.cdRef.detectChanges()}
  );
  
  let userr1 = window.localStorage.getItem('userr1');
  let pass1 = window.localStorage.getItem('pass1');
  if(userr1&&pass1){
    this.userService.logIn(userr1,pass1);
  }else{
    this.userService.user = this.user;
    this.chatService.user = this.user;
    this.userService.passUser('niezalogowany'); // dla authGuard
  }

  
  this.userService.getUser$.subscribe(
    user => {this.user = user;
    //console.log('APP COMPONENT subscribe : ', this.user)
    }
  )

  
  this.jokesService.top$.subscribe(
    topObj => {
      if(topObj.averages) 
        this.topAverages = topObj.averages.map(
          el => {el = Object.assign({}, el);
                  el.average = el.average.toFixed(2);
                  return el;
        });
      if(topObj.ratings) this.topRatings = topObj.ratings.map(
          el => { el = Object.assign({}, el);
                  el.rating = el.rating.toFixed(0);
                  return el;
      });
      if(topObj.bestMarks) this.topBestMarks = topObj.bestMarks.map(
          el =>{el = Object.assign({}, el);
                el.bestMark = el.bestMark.toFixed(2);
                return el;
      });
})
  
  window.document.getElementById('date')
    .setAttribute('max',this.inputDateMax = this.createInpDate());
  
  this.chooseLayout();

  window.onbeforeunload = 
    () => {
      if(this.user!=='niezalogowany'){
        this.chatService.setOnlineStatus(false);
        this.chatService.clearConversers();
    }};

 }




 logOut():void {
   this.userService.logOut();
   this.unreadMessOrInv = false;
 }

 openAdding():void {  // wiem, że *ngIf było by dużo lepszym rozwiązaniem
  if(!this.addJokeForm){
    this.addJokeBG = window.document.createElement('div');
    this.addJokeForm = window.document.createElement('form');
    const spanX: HTMLSpanElement = window.document.createElement('span');
    const h2: HTMLHeadingElement = window.document.createElement('h2');
    const titleLab: HTMLLabelElement = window.document.createElement('label');
    const contentLab: HTMLLabelElement = window.document.createElement('label');
    const titleInput: HTMLInputElement = window.document.createElement('input');
    const contentArea: HTMLTextAreaElement = 
       window.document.createElement('textarea');
    const resetInput: HTMLInputElement = window.document.createElement('input');
    const sendInput: HTMLInputElement = window.document.createElement('input');
    spanX.appendChild(window.document.createTextNode(''));
    h2.appendChild(window.document.createTextNode('Dodaj dowcip'));
    titleLab.appendChild(window.document.createTextNode('Tytuł: '));
    contentLab.appendChild(window.document.createTextNode('Treść: '));
    spanX.innerHTML = '&times;'
    titleLab.htmlFor = 'addTitle';
    contentLab.htmlFor = 'addContent';
    titleInput.id = 'addTitle'
    contentArea.id = 'addContent';
    titleInput.placeholder = 'Tytuł..';
    contentArea.placeholder = 'Treść dowcipu..';
    contentArea.rows = 14;
    titleInput.minLength = 1;
    titleInput.maxLength = 50;
    titleInput.autocomplete = 'off';
    contentArea.minLength = 1;
    contentArea.maxLength = 2000;
    resetInput.type = 'reset';
    resetInput.value = 'Wyczyść'
    sendInput.type = 'button';
    sendInput.value = 'Publikuj';
    this.addJokeForm.append(spanX,h2,titleLab,titleInput,contentLab,
      contentArea,resetInput,sendInput);
    this.addJokeForm.id = 'addJokeForm';
    this.addJokeBG.id = 'addJokeBG';
    resetInput.addEventListener('click', 
      ()=>this.resetValAnim(titleInput, contentArea));
    sendInput.addEventListener('click', 
      ()=>{this.addJoke(titleInput, contentArea);});
    spanX.onclick = ()=>{this.addJokeForm.style.display = 'none';
                         this.addJokeBG.style.display = 'none';
                         this.resetValAnim(titleInput, contentArea)
                        };
    this.addJokeForm.onclick = function(ev:MouseEvent){ev.stopPropagation()};
    this.addJokeBG.addEventListener('click', ()=>{
       this.addJokeForm.style.display = 'none';
       this.addJokeBG.style.display = 'none';
       this.resetValAnim(titleInput, contentArea);
      });
    window.document.body.appendChild(this.addJokeForm);
    window.document.body.appendChild(this.addJokeBG);
    titleInput.focus();
  }else{
    this.addJokeForm.style.display = 'block';
    this.addJokeBG.style.display = 'block';
  }
 }
 
  private resetValAnim (titleInput: HTMLInputElement, 
                        contentArea: HTMLTextAreaElement):void {
    if(titleInput.style.animation) titleInput.style.animation = ''; 
    titleInput.oninput = null;
    if(contentArea.style.animation) contentArea.style.animation = ''; 
    contentArea.oninput = null;
  }

 addJoke(titleElem:HTMLInputElement, contentElem:HTMLTextAreaElement):void {
   let titleLen = titleElem.value.trim().length;
   let contentLen = contentElem.value.trim().length;
   if(!titleLen||titleLen>50){
      titleElem.style.animation = 'missingContent 1s infinite alternate';
      titleElem.onfocus = 
        ()=>{titleElem.style.animation = ''; titleElem.onfocus = null;};
   }
   if(!contentLen||contentLen>2000){
      contentElem.style.animation = 'missingContent 1s infinite alternate';
      contentElem.onfocus = 
        ()=>{contentElem.style.animation = ''; contentElem.onfocus = null;};
   }
   if(!titleLen||!contentLen||titleLen>50||contentLen>2000) return;
   this.jokesService.addJoke(titleElem.value, contentElem.value, this.user);
   this.addJokeBG.style.display = 'none';
   this.addJokeForm.style.display = 'none';
   this.addJokeForm.reset();
 }



 filter(ifDelay:boolean, orderBy:string, direction:string, amount:number,
  initialValue:number|string, property:string, searchValue:string):void {
  if(orderBy&&direction&&amount) {
  if(initialValue){
    if(orderBy==='rating'&&(initialValue>5||initialValue<1)){
      this.inputFeedback = {input: 'rating', 
                            feedback: 'Ocena musi być w przedziale od 1 do 5.'};
      return;
    }
    if(orderBy==='date'&&
        (initialValue>new Date(this.inputDateMax+'T23:59:59').getTime())){
      this.inputFeedback = {input: 'date', 
                            feedback: 'Data nie może być z przyszłości.'};
      return;
    } 
  }
  if(property==='user'&&(searchValue.length===1||searchValue.length>15)){
    this.inputFeedback = {input: 'search', 
                          feedback: 'Nick musi mieć od 2 do 15 znaków.'};
    return;
  }
  if(property==='user'&&(searchValue.indexOf(' ')+1)){
    this.inputFeedback = {input: 'search', 
                          feedback: 'Nick nie może zawierać spacji.'};
    return;
  }

  if(property==='title'&&(searchValue.length>50)){
    this.inputFeedback = {
        input: 'search', 
        feedback: 'Słowo lub cały tytuł musi mieć maksymalnie 50 znaków.'
    };
    return;
  }
  this.inputFeedback = {input: '', feedback: ''};

  let URL:string = this.urlPrefix+orderBy+'/'+direction+'/'+amount;
  if(initialValue){URL += '/'+initialValue};
  if(property&&searchValue){
    URL = (initialValue)? URL+'/'+property+'/'+searchValue : 
                          URL+'/def/'+property+'/'+searchValue;
  };
   
  if(ifDelay){
    clearTimeout(this.delay);
    this.delay = setTimeout(()=>{
    this.router.navigate([URL])},
    1000);
  }else{
    this.router.navigate([URL]);
  }
 }
 }

 searchFieldChange(searchValue:string): void {
  if(this.property){
    this.filter(false,this.orderBy,this.direction,this.amount,
                 this.initialValue,this.property,searchValue);
  }
 }

 dateFieldChange(inpDate: string){
  if(this.initialValue&&this.orderBy==='date'){
    let time: number = this.parseInpDate(inpDate, this.direction);
    this.filter(true,this.orderBy,this.direction,this.amount, 
                time ,this.property,this.searchValue);
  }
 }

 ratingFieldChange(inpRating: number){
  if(this.initialValue&&this.orderBy==='rating'){
    this.filter(true,this.orderBy,this.direction,this.amount,
                 inpRating,this.property,this.searchValue);
  }
 }

 parseInpDate(inpDate:string, direction?: string){
    let date: Date = new Date(inpDate+'T00:00:00');
  if(direction==='desc'){
    // console.log('parseInpDate : date.value : ', date.getHours(), 
    // date.getMinutes(), ' dzień :', date.getDate(), date.getMonth()+1);
    return date.getTime()+86399000;
  }else{
    //console.log('parseInpDate : date.value : ', date.getHours(), 
    //date.getMinutes(), ' dzień :', date.getDate(), date.getMonth()+1);
    return date.getTime();
  }
 }

 createInpDate(time?:number|string){
  let date:Date = (time)? new Date(time) : new Date();
  let month:string = (date.getMonth()+1).toString();
  if(month.length===1){month= '0'+month};
  let day: string = date.getDate().toString();
  if(day.length===1){day='0'+day};
  return date.getFullYear()+'-'+month+'-'+day;
 }

 ifCreateNewInpDateVal(){
  if(this.initialValue&&this.orderBy==='date'
  &&this.initialValue<new Date().getTime()){
    return this.createInpDate(this.initialValue);
  }else{
    return this.inputDateMax;
  }
 }
 
 ifCreateNewInpRatingValue(){
  if(this.initialValue&&this.orderBy==='rating'
  &&this.initialValue<=5&&this.initialValue>=1){
    return this.initialValue;
  }else{
    return 3;
  }
 }

 buttonEffect (btnStyle:CSSStyleDeclaration):void {
   btnStyle.transform = btnStyle.transform? '' : 'rotateX(180deg)';
 }

 switchHiding(el: HTMLElement, btn: HTMLButtonElement, direction: string):void {
   let butDir: string = direction==='right'?'left':'right';
   el.style[direction] = 
     el.style[direction]==='0px'? `-${el.offsetWidth}px` : '0px';
   // console.log('el.style.dir: '+el.style[direction])
   btn.style[butDir] = btn.style[butDir]==='0px'? '-50px' : '0px';
   btn.style.transform = btn.style.transform? 
     '' : direction==='left'?'rotate(-180deg)':'rotate(180deg)';
 }

 @HostListener ('window:resize', ['$event'])
 chooseLayout(event?):void {
   
   window.clearTimeout(this.resizeTimeout)
   window.setTimeout(_=>{
    let width: number = window.innerWidth;
    if(width<600&&this.chatFiltMode!==1) 
      this.changeLayout('245px', '235px', 1);
    if(width>=600&&width<750&&this.chatFiltMode!==2) 
      this.changeLayout('235px', '215px', 2);
    if(width>=750&&width<950&&this.chatFiltMode!==3) 
      this.changeLayout('215px', '190px', 3);
    if(width>=950&&this.chatFiltMode!==4)
      this.changeLayout('190px', '170px', 4) ;
   },500)
 }
 private changeLayout(newChatWidth: string, newFilterWidth: string, 
                      mode: number):void {
  const chatStyle: CSSStyleDeclaration = 
    window.document.getElementById('chat').style;
  const filterStyle: CSSStyleDeclaration = 
    window.document.getElementById('filter').style;
  this.applyLayout(chatStyle, newChatWidth, mode, 'left', 'chatBtn');
  this.applyLayout(filterStyle, newFilterWidth, mode, 'right', 'filterBtn');
  
  this.chatFiltMode = mode;
  //console.log('newChatWidth ===  '+newChatWidth, ' newFilterWidth === '+
  //newFilterWidth);
 }
 private applyLayout(elemStyle: CSSStyleDeclaration, newElemWidth: string, 
                     mode: number, side: string, btnId: string):void {
  elemStyle.width = newElemWidth;
  if(elemStyle[side]!=='0px') 
    elemStyle[side] = mode===4? '0px' : '-'+newElemWidth;
  else if(this.chatFiltMode===4){
    elemStyle[side] = '-'+newElemWidth; 
    let btn:HTMLElement = window.document.getElementById(btnId);
    btn.style[side==='right'?'left':'right'] = '-50px'; 
    btn.style.transform = '';
  }
  if(!elemStyle.transition) window.setTimeout(
                  () => elemStyle.transition = `${side} 0.8s`, 0
  );
 }
  

}
