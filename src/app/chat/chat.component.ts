import { Component, OnInit,  Input, ViewChild, 
  ElementRef, Output, EventEmitter} from '@angular/core';
import {map, take} from 'rxjs/operators';
import { ChatService} from '../chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit {

  @Input() user:string;
  @ViewChild('invAndIgnContainer', {static:false}) invAndIgnContainer:ElementRef;
  conversers: string[];
  currentConverser: string;
  users: string[] = [];
  searchInputVal: string|undefined;
  conversersStatus: {[key:string]:any} = {};
  dialogs: {[key:string]:any}[] = [];
  unreads:{[key:string]:any} = {};
  convRead: {[key:string]:any} = {};
  tempConvRead: {[key:string]:any};
  skipConvRead: boolean = false;
  sendByEnter: boolean = false;
  tempMessages: {[key:string]:any} = {};
  showRead:{[key:string]:any} = {};
  invitations: string[] = [];
  rotateInvArrow: boolean = false;
  responses: {[key:string]:any};
  responsesDesc: {[key:string]:string} = {
    accepted: 'Użytkownik zaakceptował zaproszenie i ma Ciebie już '+
               'na liście kontaktów.',
    waiting : 'Użytkownik jeszcze nie zareagował na zaproszenie.',
    rejected: 'Użytkownik nie zaakceptował zaproszenia i nie dodał Ciebie '+
               'do listy kontaktów.',
    deleted : 'Użytkownik usunął Ciebie z listy kontaktów.',
    ignored : 'Użytkownik zignorował Ciebie.'
  };
  responsesIcon: {[key:string]:string} = {
    accepted : 'fas fa-user-check',
    waiting  : 'fas fa-clock',
    rejected : 'fas fa-unlink',
    deleted  : 'fas fa-user-alt-slash',
    ignored  : 'fas fa-ban'
  }
  ignored: string[] = [];
  switchIgn: boolean = false;
  pleaseWait: boolean = true;
  invAndIgnStyle: CSSStyleDeclaration;
  invAndIgnMaxHeight: number = 250;
  
  unreadMess: boolean = false;
  unreadInv: boolean = false;
  @Output() unreadMessOrInv: EventEmitter<boolean> = new EventEmitter();
  
  @ViewChild ('dialogsContainer',{static:false}) dialogsElem:ElementRef;

  noResults: boolean = false;
  inputNameElem: HTMLInputElement;

  constructor(private chatService: ChatService) { }

  ngOnInit() {
  
    this.chatService.conversers$.subscribe(
      conversers => { 
        if(!conversers||!conversers.length){ 
          this.conversers=conversers; 
          return;
        }   
        if(!this.conversers||!this.conversers.length){
          this.conversers=conversers; 
          for(let i in conversers){
            this.getConverserStatus(conversers[i])
          }
          // console.log('Dodano hurtem wszystkich nowych conversers\
          // do pustego array i utworzono observable na statusy')
          return;
        };
        for(let i in conversers){
          if(this.conversers.some(name => name===conversers[i])){
              continue;
          }
          this.conversers.push(conversers[i]);
          this.getConverserStatus(conversers[i]);
          //console.log('Dodano conversera do conversers\
          // i utworzono observable w conversersStatus', conversers)
        }
        if(conversers.length===this.conversers.length){return};
        for(let i in this.conversers){
          if(conversers.some(name => name===this.conversers[i])){
            continue;
          }
          delete this.conversersStatus[this.conversers[i]];
          delete this.conversers[i]; 
          //console.log('Usunięto observable conversera i conversera z conversers')   
        }
      } 
    )
 
    this.chatService.unread$.subscribe(
      unreadObj => {
        this.unreads = unreadObj;
        if(this.conversers) this.setUnreadMess(this.conversers);
        else this.chatService.conversers$.pipe(take(1))
          .subscribe(conversers=>this.setUnreadMess(conversers));
      }
    )

    this.chatService.dialog$.subscribe(
      dialog$ => {
        if(dialog$===undefined){
            for (let i in this.dialogs){
              this.dialogs[i].dialogSub.unsubscribe();
            }
            this.dialogs = []; 
            return;
        }
        let dialogObj:{[key:string]:any} = {};
        dialogObj['converser'] = this.currentConverser;
        dialogObj['dialogSub'] = dialog$.pipe(map(doc=>doc?doc['messages']:[]))
        .subscribe(
           messages => {
            dialogObj['messages'] = messages.reverse();
            if(messages.length&&messages[0].user===dialogObj.converser){
            this.showRead[dialogObj.converser] = false;
            }else{
            if(messages.length) this.showRead[dialogObj.converser] = true;
            }
            if(dialogObj.firstElem){
              dialogObj.firstElem.scrollIntoView(false);
              //console.log(' PRZESCROLLOWANO w dół.')
            }else if(!dialogObj.firstElem&&this.dialogsElem){
              dialogObj['firstElem'] = 
              this.dialogsElem.nativeElement.getElementsByClassName(
                dialogObj.converser)[0];
              if(dialogObj.firstElem){
                dialogObj.firstElem.scrollIntoView(false);
                //console.log('Przypisano firstElem i przescrollowano.')
              }
            }
            let lastConvMsgIndex: number = 
              dialogObj.messages.findIndex((msg:any) => msg.user !== this.user);
            if(lastConvMsgIndex === -1) 
              lastConvMsgIndex = dialogObj.messages.length;
            const lastOwnMsgs: any[] = 
              dialogObj.messages.slice(0,lastConvMsgIndex);
            if(lastOwnMsgs.length){
              let lastPrevReadIndex: number = 
                lastOwnMsgs.findIndex((msg:any) => Boolean(msg.prevRead));
              dialogObj['lastPrevReadIndex'] = lastPrevReadIndex;
            }else{
              dialogObj['lastPrevReadIndex'] = -1;
            }
          });
        this.dialogs.push(dialogObj);
      }
    )

    this.chatService.convRead$.subscribe(
      convReadObj => { 
        if(convReadObj.conv){
          this.convRead[convReadObj.conv] = convReadObj.time;
          this.tempConvRead = convReadObj;
          this.skipConvRead = true;
          //console.log('Zadziałał inner update');
          return;
        }
        if(this.skipConvRead&&
           convReadObj[this.tempConvRead.conv]===this.tempConvRead.time){
          this.skipConvRead = false;
          return;
        }
        for (let x in convReadObj){
          if(convReadObj[x]!==this.convRead[x]){
            this.convRead[x] = convReadObj[x];
            let dialObj:any = this.dialogs.find(obj => obj.converser === x);
            if(dialObj&&dialObj.firstElem){
            dialObj.firstElem.scrollIntoView(false);
            //console.log('convRead - PRZEWINIĘTO ze względu na update');
            }
          }
        }
        for (let x in this.convRead){
          if(!convReadObj[x]){
            delete this.convRead[x];
            // console.log('Usunięto odczytane z : '+ x+ 
            // ' ze względu na update. Powinno wystepować niezwykle RZADKO,\
            // kiedy rozmowca w ostatniej chwili zmieni swojego rozmówcę.');
          }
        }
      }
    )

    this.chatService.users$.subscribe(
      users => {this.users = users;
                if(!users.length) {
                  this.noResults = true;
                  this.inputNameElem.oninput = ()=>{
                    this.noResults = false;
                    this.inputNameElem.oninput = null;
                  } 
                }
               }
    )
    
    this.chatService.invitations$.subscribe(
      invitations => {
        this.invitations=invitations; 
        if(this.invAndIgnStyle&&this.invAndIgnStyle.display==='block') 
          this.updateInvitationsOverflow();
        //console.log('oto invitations: ', this.invitations);
    });
  
    this.chatService.responses$.subscribe(
      responses => {this.responses = responses;});

    this.chatService.unreadInv$.subscribe(
      unreadInv => {this.unreadInv = unreadInv;
                    this.unreadMessOrInv.emit(this.unreadInv||this.unreadMess);
                    // console.log('UNREAD INV w chat Component: '+this.unreadInv);
    });

    this.sendByEnter = 
      window.localStorage.getItem('sendByEnter')==='true'? true:false;

  
  }
  

  
  getConverserStatus(converser:string):void {
  
    if(!this.conversersStatus[converser]){
      let convStatus$ = this.chatService.getConverserStatus(converser);
      this.conversersStatus[converser] = convStatus$;
      //console.log('getConverserStatus utworzylo Observable dla: ' + converser);
    }
  }

  private setUnreadMess(conversers:string[]):void {
    this.unreadMess = false;
    for(let unread in this.unreads){  
      if(conversers.some(conv=>conv===unread)){
        this.unreadMess = true;
        break;
      }
    }
    this.unreadMessOrInv.emit(this.unreadInv||this.unreadMess);
}

  openDialog(converser:string, probablyNew: boolean):void {
    if(this.user!==converser){
      if(this.currentConverser===converser){
        this.closeDialog(this.dialogs
          .find(dialogObj=>dialogObj.converser===converser));
        if(!probablyNew) return;
      };
      this.updateCurrentConverser(converser);
      if(!this.dialogs.some(
        dialObj=>{if(dialObj){return dialObj.converser===converser};
                  return false;})){
        if(probablyNew){
          this.chatService.createOrGetDialog(converser);
        }else{
          this.chatService.getDialog(converser);
        }
        if(window.innerWidth<600) 
          window.document.getElementById('chatBtn').click();
      };
    }
  }
  

  updateCurrentConverser(converser:string):void {
    if(this.currentConverser!==converser){
      this.currentConverser=converser;
      this.chatService.updateCurrentConverser(converser, this.unreads[converser]);
    }
  }

  closeDialog(dialogObj:any):void {
    if(this.currentConverser!==''){
      this.chatService.updateCurrentConverser('', false);
      this.currentConverser= '';
    }
    let index: number = this.dialogs.indexOf(dialogObj);
    this.dialogs[index].dialogSub.unsubscribe();
    this.dialogs.splice(index,1);
  }

  deleteDialog(converser:string, ignore: boolean = false):void {
    if(ignore&&!this.confirmIgnore(converser)) return;
    if(this.dialogs.length){
      let dialogObj: any = this.dialogs
        .find(dialogObj=>dialogObj.converser===converser);
      if(dialogObj){
        let index: number = this.dialogs.indexOf(dialogObj);
        this.dialogs[index].dialogSub.unsubscribe();
        this.dialogs.splice(index,1);
      };
    }
    if(this.currentConverser===converser){
      this.chatService.updateCurrentConverser('',false);
      this.currentConverser='';
    };
    this.chatService.deleteDialog(converser, ignore);
    if(ignore) this.ignored.push(converser);
  }

  sendMessage(messageElem: HTMLTextAreaElement, converser:string, 
    lastMessUser:string, messagesToDel:any[], event?: UIEvent):void {
    
    let message: string = messageElem.value;

    if(message&&message.trim()&&message.length<=300){
      if(event) event.preventDefault();
      let convRead:string;
      if(lastMessUser===this.user){
        convRead = this.convRead[converser];
      }else{
        convRead = undefined;
      }
      this.chatService.sendMessage(message, converser, convRead, messagesToDel);
      messageElem.value = '';
    
      this.showRead[converser] = true;
    };
    this.tempMessages[converser] = '';
  }

  saveSetting(){
    window.localStorage.setItem('sendByEnter', this.sendByEnter?'true':'false');
  }

  findUsers(inputNameElem: HTMLInputElement):false|void {
    let inputVal: string = inputNameElem.value.toLowerCase();
    if(!inputVal.length||inputVal.length>15) return;
    if(this.searchInputVal !== inputVal){
     this.chatService.findUsers(inputVal);
     this.searchInputVal = inputVal;
     this.inputNameElem = inputNameElem;
    }
    return false;
  }

  acceptInv(user:string):void {
    
    this.chatService.acceptInv(user);
  }

  deleteInv(user:string):void {
    this.chatService.deleteInv(user);
  }
  
  ignoreInv(user:string):void {
    if(this.confirmIgnore(user)){
      this.chatService.ignoreInv(user);
      this.ignored.push(user);
    }
  }
  private confirmIgnore(user:string): boolean {
    return window.confirm('Jesteś pewien, że chcesz ignorować użytkownika '+
                           user+'?');
  }
  turnOffUnreadInv():void {
    this.chatService.turnOffUnreadInv();
  }

  removeFromIgnored(user:string):void {
    this.chatService.removeFromIgnored(user);
    this.ignored.splice(this.ignored.indexOf(user),1);
    this.updateInvitationsOverflow();
  }

  toggleInvWindow():void {
    if(!this.invAndIgnStyle) 
      this.invAndIgnStyle = this.invAndIgnContainer.nativeElement.style;
    let oldDisplay:string = this.invAndIgnStyle.display;
    this.invAndIgnStyle.display = 
        oldDisplay==='none'?'block':'none';
     //console.log('toggleInvWindow(), invContainer: ',this.invAndIgnContainer);
    if(this.unreadInv){
      this.unreadInv = false;
      this.chatService.turnOffUnreadInv();
    }
    if(oldDisplay==='none'){
      this.updateInvitationsOverflow();
      this.rotateInvArrow = true;
    }else{
      this.rotateInvArrow = false;
    }
    this.switchIgn = false;
    this.pleaseWait = true;
  }

  getIgnored():void {
    if(!this.switchIgn){
    this.switchIgn = true;
    this.chatService.getIgnored().then(
      ignored => {this.ignored = ignored.data().ignored;
                  this.pleaseWait = false;
                  this.updateInvitationsOverflow();
                 }
    )}else{
      this.switchIgn = false;
      this.pleaseWait = true;
      this.updateInvitationsOverflow();
    }
  }

  updateInvitationsOverflow():void{
    if(this.invAndIgnContainer)
      window.setTimeout( () => {
        let currentOverflow: string = this.invAndIgnStyle.overflowY;
        let height: number = currentOverflow === 'auto'? 
          this.invAndIgnContainer.nativeElement.scrollHeight : 
          this.invAndIgnContainer.nativeElement.clientHeight;
        let paddingBottom: number = 
          +this.invAndIgnStyle.paddingBottom.slice(0,-2);
        let contentHeight = height - paddingBottom;
        //console.log('updateInv...(): currentOverflow: ',
        //  currentOverflow,' , paddingBottom: ',paddingBottom,
        //   ' ,contentHeight: ',contentHeight);
        if(contentHeight>=this.invAndIgnMaxHeight&&currentOverflow==='visible'){
          this.invAndIgnStyle.maxHeight = this.invAndIgnMaxHeight+'px';
          this.invAndIgnStyle.paddingBottom = '65px';
          this.invAndIgnStyle.overflowY = 'auto';
          //console.log('updateInvitationsOverflow(): contentHeight\
          // >= invAndIgnMaxHeight');
        }else if(contentHeight<this.invAndIgnMaxHeight&&currentOverflow==='auto'){
          this.invAndIgnStyle.maxHeight = '';
          this.invAndIgnStyle.paddingBottom = '0px';
          this.invAndIgnStyle.overflowY = 'visible';
          //console.log('updateInvitationsOverflow(): contentHeight\
          // < invAndIgnMaxHeight');
        }
        }, 0)
  }


}
