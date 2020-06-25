import { Injectable} from '@angular/core';
import {Subject, Observable} from 'rxjs';
import {AngularFirestore, AngularFirestoreCollection} from 'angularfire2/firestore';
import {firebase} from '@firebase/app';
import '@firebase/firestore';
import {Router} from '@angular/router';
import {ChatService} from './chat.service';
import {JokesService} from './jokes.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

user: string = 'niezalogowany';

usersCol: AngularFirestoreCollection;
chatCol: AngularFirestoreCollection;

urlIn:Subject<string> = new Subject();
urlOut$: Observable<string> = this.urlIn.asObservable();

userIn:Subject<string> = new Subject();
getUser$: Observable<string> = this.userIn.asObservable();
getUserPromise: Promise<string> = this.createUserPromise();

formResp: Subject<{[key:string]:any}> = new Subject();
formResp$: Observable<{[key:string]:any}> = this.formResp.asObservable();

constructor(private afs: AngularFirestore,
            private router:Router,
            private chatService: ChatService,
            private jokesService: JokesService) {
   this.usersCol = this.afs.collection('users');
   this.chatCol = this.afs.collection('chat');
   
}


changeUrl(url:string):void {
  this.urlIn.next(url);
}

createUserPromise():Promise<string> {
  return new Promise((resolve,reject)=>{
    this.getUser$.subscribe(name=>{resolve(name);reject('niezalogowany')})});
}

passUser(user:string):void {
  this.user = user;
  this.chatService.user = user;
  this.userIn.next(user);
}


createAccount(name:string,pass1:string,pass2:string){
  if(pass1===pass2){
    this.afs.firestore.runTransaction(
      transaction => {
        return transaction.get(this.usersCol.doc(name).ref).then(
          userDocSnap => {
            let ifExists: boolean = userDocSnap.exists;
            //console.log('createAccount() userDoc.exists: ', ifExists);
            if(ifExists){
              this.formResp.next({
                form:'registerForm',
                message:'Niestety, podana nazwa użytkownika jest już zajęta.'
              });
              return;
            };
            if (!ifExists) transaction.set(this.usersCol.doc(name).ref, {
                'password': pass1,
                'date': new Date().getTime(),
                'numberOfJokes': 0
            })
          })
    }).then( _ => {
      const chatInfoSub = this.usersCol.doc(name).collection('chatInfo');
      const jokesInfoSub = this.usersCol.doc(name).collection('jokesInfo');
      const batch = this.afs.firestore.batch();
      batch.set(chatInfoSub.doc('currentTalk').ref, {'currentTalk': ''});
      batch.set(chatInfoSub.doc('conversers').ref, {'conversers':[]});
      batch.set(chatInfoSub.doc('isOnline').ref, {'isOnline':false});
      batch.set(chatInfoSub.doc('unread').ref, {'unread':[]});
      batch.set(chatInfoSub.doc('convRead').ref, {});
      batch.set(chatInfoSub.doc('responses').ref, {});
      batch.set(chatInfoSub.doc('invitations').ref, {'invitations':[]});
      batch.set(chatInfoSub.doc('unreadInv').ref, {'unreadInv': false});
      batch.set(chatInfoSub.doc('ignored').ref, {'ignored': []});
      batch.set(jokesInfoSub.doc('marks').ref, {});
      batch.set(jokesInfoSub.doc('statistics').ref, 
       {'average': 0, 'bestMark': 0, 'counter': 0, 'rating': 0, 'sumOfMarks': 0});
      batch.update(this.afs.collection('various').doc('allUsers').ref, 
       {'allUsers': firebase.firestore.FieldValue.arrayUnion(name)});
      batch.commit().then(_=> {
        if(window.confirm('Konto zostało utworzone. Zalogować automatycznie?')){
            this.logIn(name,pass1, true);
        }
      })
    })

  }else{
    window.alert('Wprowadzone hasła muszą być identyczne.')
  }
}

removeAccount(user:string):void {
  let conversersAndIds = this.chatService.conversersAndIds;
  this.logOut();
  let batch = this.afs.firestore.batch();
  const chatInfoSub = this.usersCol.doc(user).collection('chatInfo');
  const jokesInfoSub = this.usersCol.doc(user).collection('jokesInfo');
  batch.delete(chatInfoSub.doc('currentTalk').ref);
  batch.delete(chatInfoSub.doc('conversers').ref);
  batch.delete(chatInfoSub.doc('isOnline').ref);
  batch.delete(chatInfoSub.doc('responses').ref);
  batch.delete(chatInfoSub.doc('unread').ref);
  batch.delete(chatInfoSub.doc('convRead').ref);
  batch.delete(chatInfoSub.doc('invitations').ref);
  batch.delete(chatInfoSub.doc('unreadInv').ref);
  batch.delete(chatInfoSub.doc('ignored').ref);
  batch.delete(jokesInfoSub.doc('marks').ref);
  batch.delete(jokesInfoSub.doc('statistics').ref);
  batch.commit().then( _ => {
    this.usersCol.doc(user).delete();
    this.afs.collection('various').doc('allUsers').update(
      {'allUsers': firebase.firestore.FieldValue.arrayRemove(user)}
    );
    const batch = this.afs.firestore.batch();
    const batchCount = {
      numb:0, 
      isReady(){this.numb++;if(this.numb===3) return true; return false;}
    };
    let averageIndex: number = 
      this.jokesService.topAverages.findIndex(elem=>elem.user===user);
    let ratingIndex: number = 
      this.jokesService.topRatings.findIndex(elem=>elem.user===user);
    let bestMarkIndex: number = 
      this.jokesService.topBestMarks.findIndex(elem=>elem.user===user);
    if(averageIndex+1||ratingIndex+1||bestMarkIndex+1){
      if(averageIndex+1){
        this.jokesService.removeFromRanking(this.jokesService.topAverages.slice(),
            averageIndex, 'average', user, batch, batchCount, 0, true);
      }else{batchCount.isReady()};
      if(ratingIndex+1){
        this.jokesService.removeFromRanking(this.jokesService.topRatings.slice(), 
            ratingIndex, 'rating', user, batch, batchCount, 0, true);
      }else{batchCount.isReady()};
      if(bestMarkIndex+1){
        this.jokesService.removeFromRanking(this.jokesService.topBestMarks.slice(), 
            bestMarkIndex, 'bestMark', user, batch, batchCount, 0, true);
      }else if(batchCount.isReady()){batch.commit()};
    }  
  }).then(_ => {

      for(let convObj of conversersAndIds){
        this.chatService.deleteDialog(convObj.name, false);
      }

  }).then(()=>window.alert('Konto zostało usunięte.'));
}


logIn(name:string, password:string, redirect: boolean = false):void { 
  this.getUserPromise = this.createUserPromise();          
  this.usersCol.doc(name).ref.get().then(     
    userDoc => {if(userDoc.exists&&
                   userDoc.data().password === password){
                  this.passUser(name);
                  this.chatService.setOnlineStatus(true);
                  window.localStorage.setItem('userr1', name);
                  window.localStorage.setItem('pass1', password);
                  if(redirect) this.router.navigate(['jokes/date/desc/6']);
                  this.chatService.getConversersAndUnread();
                }else{
                  this.formResp.next({
                    form: 'logInForm',
                    message: 'Niepoprawna nazwa użytkownika lub hasło.'
                  });
                  this.passUser('niezalogowany');
                }
               }
  ).catch(_=>window.alert('Nie udało się połączyć z serwerem w celu zalogowania.'))
}

logOut(){
  this.getUserPromise = this.createUserPromise();
  this.chatService.setOnlineStatus(false);
  this.chatService.clearConversers();
  this.router.navigate(['jokes/date/desc/6']);
  window.localStorage.removeItem('userr1');
  window.localStorage.removeItem('pass1'); 
  this.passUser('niezalogowany');
  
}

getStatistics(): Promise<[firebase.firestore.DocumentSnapshot,
                          firebase.firestore.DocumentSnapshot]> {
  return Promise.all([
    this.usersCol.doc(this.user).collection('jokesInfo').doc('statistics').ref.get(), 
    this.usersCol.doc(this.user).ref.get()
  ]);
}

}


