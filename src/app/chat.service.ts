import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, 
  AngularFirestoreDocument, DocumentReference} from 'angularfire2/firestore';
import {firebase} from '@firebase/app';
import '@firebase/firestore';

import {Subject, Observable, pipe, Subscription} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import { firestore } from 'firebase';





@Injectable({
  providedIn: 'root'
})

export class ChatService {

  chatCol: AngularFirestoreCollection;
  usersCol: AngularFirestoreCollection;
  usersColRef: firestore.CollectionReference;
  user:string;
  conversersAndIds: {[key:string]:string}[];
  dialogId: string;
  convRead: {[key:string]:any} = {};
  convCurrentTalk: string;
  convNotInformed: boolean = true;
  responses: {[key:string]:any};
  conversersIn: Subject<string[]> = new Subject();
  conversers$: Observable<string[]> = this.conversersIn.asObservable();

  unreadIn: Subject<{[key:string]:any}> = new Subject();
  unread$: Observable<{[key:string]:any}> = this.unreadIn.asObservable();

  convReadIn: Subject<{[key:string]:any}> = new Subject();
  convRead$: Observable<{[key:string]:any}> = this.convReadIn.asObservable();

  dialogIn: Subject<Observable<any>|undefined> = new Subject();
  dialog$: Observable<Observable<any>|undefined> = this.dialogIn.asObservable();

  usersIn: Subject<string[]> = new Subject();
  users$: Observable<string[]> = this.usersIn.asObservable();

  invitationsIn: Subject<string[]> = new Subject();
  invitations$: Observable<string[]> = this.invitationsIn.asObservable();

  unreadInvIn: Subject<boolean> = new Subject();
  unreadInv$: Observable<boolean> = this.unreadInvIn.asObservable();

  responsesIn: Subject<{[key:string]:any}> = new Subject();
  responses$: Observable<{[key:string]:any}> = this.responsesIn.asObservable();

  fixStatusSubscription: Subscription;
  conversersSubscription: Subscription;
  unreadSubscription: Subscription;
  convReadSubscription: Subscription;
  convCurrentTalkSub: Subscription;
  invitationsSubscription: Subscription;
  unreadInvSubscription: Subscription;
  responsesSubscription: Subscription;

  constructor(private afs: AngularFirestore) { 
    this.chatCol = this.afs.collection('chat');
    this.usersCol = this.afs.collection('users');
    this.usersColRef = this.afs.firestore.collection('users');
  }




setOnlineStatus(isOnline:boolean):void {
    this.usersCol.doc(this.user).collection('chatInfo').doc('isOnline')
    .update({'isOnline': isOnline}).then(
      _ => {if(isOnline){
             this.fixStatusSubscription = 
               this.usersCol.doc(this.user).collection('chatInfo')
               .doc('isOnline').valueChanges()
               .pipe(map(doc => doc['isOnline']))
               .subscribe( isOnline => {
                   if(!isOnline){
                    this.usersCol.doc(this.user).collection('chatInfo')
                    .doc('isOnline').update({'isOnline': true});
                    //console.log('JUST FIXED onlineStatus');
                }})
      }}
    );
    if(!isOnline){this.fixStatusSubscription.unsubscribe()};
}


getConversersAndUnread():void {  
    
  this.unreadSubscription = 
  this.usersCol.doc(this.user).collection('chatInfo').doc('unread').valueChanges()
  .subscribe(unreadObj => {
        this.unreadIn.next(unreadObj); //console.log('Zaktualizowano unread');
  })    
  
  this.convReadSubscription = 
  this.usersCol.doc(this.user).collection('chatInfo').doc('convRead').valueChanges()
  .subscribe(
      convRead => {
        this.convRead = convRead;
        this.convReadIn.next(convRead);//console.log('przekazano convRead do chat COMPONENTU :', convRead)
      }
  );
 
  this.conversersSubscription = 
  this.usersCol.doc(this.user).collection('chatInfo').doc('conversers')
  .valueChanges().pipe(
    tap(convDoc => {this.conversersAndIds = convDoc['conversers']}),
    map(convDoc => {
      let conversers = convDoc['conversers'];
      if(conversers.length){
        return conversers.map(converser => converser.name)
      }else{
        return []
      }
  }))
  .subscribe(conversers => {
    //console.log('Zaktualizowano conversers, przekazano : ', conversers);
    this.conversersIn.next(conversers); 
  });

  this.responsesSubscription = this.usersCol.doc(this.user)
  .collection('chatInfo').doc('responses').valueChanges().subscribe(
    responses => {this.responsesIn.next(responses);
                  this.responses = responses;
  });
        
  this.invitationsSubscription = this.usersCol.doc(this.user)
  .collection('chatInfo').doc('invitations').valueChanges()
  .pipe(map(doc => doc['invitations']))
  .subscribe(invitations => this.invitationsIn.next(invitations));

  this.unreadInvSubscription = this.usersCol.doc(this.user)
  .collection('chatInfo').doc('unreadInv').valueChanges()
  .pipe(map(doc => doc['unreadInv']))
  .subscribe(unreadInv => {this.unreadInvIn.next(unreadInv);
  //console.log('chat SERVICE unread INv: '+unreadInv)
  });

}


getConverserStatus(converser:string):Observable<boolean> {

  return this.usersCol.doc(converser).collection('chatInfo').doc('isOnline')
    .valueChanges().pipe(
      map(doc => doc?
        doc['isOnline']:
        window.alert('Użytkownik '+converser+' prawdopodobnie usunął konto.'))
      //,tap(_=>console.log('A teraz sprawdzono status dla conversera : ', converser))
    )

}


clearConversers():void {
  this.conversersSubscription.unsubscribe();
  this.unreadSubscription.unsubscribe();
  this.unreadInvSubscription.unsubscribe();
  this.convReadSubscription.unsubscribe();
  this.responsesSubscription.unsubscribe();
  this.invitationsSubscription.unsubscribe();
  this.conversersIn.next(undefined);
  this.usersCol.doc(this.user).collection('chatInfo').doc('currentTalk')
  .update({'currentTalk': ''});
  this.dialogIn.next(undefined);
}

getDialog(converser:string):void {  
  this.dialogId = 
  this.conversersAndIds.find(conv => conv.name===converser).dialogId;
  this.dialogIn.next(this.chatCol.doc(this.dialogId).valueChanges());
}


updateCurrentConverser(converser:string, isUnread:boolean):void {
  this.convNotInformed = true;
  this.usersCol.doc(this.user).collection('chatInfo').doc('currentTalk')
  .update({'currentTalk': converser});
  if(this.convCurrentTalkSub){this.convCurrentTalkSub.unsubscribe();};
  if(!converser){ this.convCurrentTalk = '' };
  if(converser){
    this.convCurrentTalkSub = this.usersCol.doc(converser).collection('chatInfo')
    .doc('currentTalk').valueChanges().subscribe(
       convCurrentTalk => {
         this.convCurrentTalk = 
           convCurrentTalk?convCurrentTalk['currentTalk']:undefined;
        if(!convCurrentTalk) 
          window.alert('Użytkownik '+converser+' prawdopodobnie usunął konto.');
        if(this.convCurrentTalk===this.user) this.convNotInformed = true;
    },
       err=>console.log('Document not found: '+err)
    )
  };
  if(isUnread){
    let dateObj: Date = new Date();
    let date: string = dateObj.toLocaleDateString();
    let time: string = dateObj.toLocaleTimeString();
    this.usersCol.doc(this.user).collection('chatInfo').doc('unread')
    .update({[converser]: firebase.firestore.FieldValue.delete()});
    this.usersCol.doc(converser).collection('chatInfo').doc('convRead')
    .update({[this.user]: date+' '+time});
  }     
  //console.log('Just UPDATED current converser : ',converser, '.');
}


createOrGetDialog(converser:string):void {
  
 this.usersColRef.doc(this.user).collection('chatInfo').doc('conversers')
 .get().then(
  doc => {
  if(doc.data().conversers.some(conv => conv.name===converser)){
    this.getDialog(converser);
    if(this.responses[converser]!=='accepted'&&
       this.responses[converser]!=='ignored') {
    this.usersCol.doc(converser).collection('chatInfo').doc('invitations')
    .update({'invitations' : firebase.firestore.FieldValue.arrayUnion(this.user)});
    this.usersCol.doc(converser).collection('chatInfo').doc('unreadInv')
    .update({'unreadInv' : true});
    this.usersCol.doc(this.user).collection('chatInfo').doc('responses')
    .update({[converser]:'waiting'});
    }
  }else{
    this.afs.firestore.runTransaction(transaction => {
      return transaction.get(this.usersColRef.doc(converser)
      .collection('chatInfo').doc('conversers')).then(
        conversersSnapshot => {
          let convObj = 
          conversersSnapshot.data().conversers.find(conv => conv.name===this.user);
          this.dialogId = convObj? convObj.dialogId : undefined;
          if(this.dialogId){
            transaction.update(
              this.usersColRef.doc(converser).collection('chatInfo')
              .doc('conversers'),
              {'conversers' : firebase.firestore.FieldValue.arrayUnion(
                {name: this.user, dialogId: this.dialogId})}
            );   // NIEPOTRZEBNA LINIJKA, ABY TRANSACTION DZIALALO   
            transaction.update(
              this.usersColRef.doc(this.user).collection('chatInfo')
              .doc('invitations'), 
              {'invitations' : firebase.firestore.FieldValue.arrayRemove(converser)}
            );
          }else{
            this.dialogId = new Date().getTime().toString();
            transaction.update(this.usersColRef.doc(converser)
            .collection('chatInfo').doc('conversers'),
              {'conversers' : firebase.firestore.FieldValue.arrayRemove('')}
            ); // NIEPOTRZEBNE, BO RUN TANSACTION WYMAGA ..
            //console.log('Responses: '+this.responses);
            if(this.responses[converser]!=='ignored'){ 
              transaction.update(
                this.usersColRef.doc(converser).collection('chatInfo')
                .doc('invitations'), {'invitations' : 
                firebase.firestore.FieldValue.arrayUnion(this.user)}
              );
              transaction.update(
                this.usersColRef.doc(converser).collection('chatInfo')
                .doc('unreadInv'), {'unreadInv' : true}
              );
              transaction.update(
                this.usersColRef.doc(this.user).collection('chatInfo')
                .doc('responses'), {[converser]: 'waiting'}
              );
            }
            transaction.set(this.chatCol.ref.doc(this.dialogId), {'messages': []});
            //console.log('powinno dzialac..')
          }
          transaction.update(
            this.usersColRef.doc(this.user).collection('chatInfo')
            .doc('conversers'),
            {'conversers' : firebase.firestore.FieldValue
           .arrayUnion({name: converser, dialogId: this.dialogId})}
          );
          transaction.update(
            this.usersColRef.doc(converser).collection('chatInfo')
            .doc('responses'), {[this.user]: 'accepted'}
          );
        }
      )
    }).then(
      _ => {this.dialogIn.next(this.chatCol.doc(this.dialogId).valueChanges());}
    );
  }
 }
 )
}

turnOffUnreadInv():void {
  this.usersCol.doc(this.user).collection('chatInfo').doc('unreadInv')
  .update({'unreadInv':false});
}

acceptInv(user:string):void {
  this.usersColRef.doc(user).collection('chatInfo').doc('conversers').get().then(
   snapshot => {
     if(snapshot.exists){
      let convObj = snapshot.data().conversers.find(conv => conv.name===this.user);
      let dialogId = convObj? convObj.dialogId : undefined;
      let chatInfo = this.usersCol.doc(this.user).collection('chatInfo');
      if(dialogId){ 
        chatInfo.doc('conversers').update(
           {'conversers': firebase.firestore.FieldValue.arrayUnion(
             {name: user, dialogId: dialogId})}
        );
        this.usersCol.doc(user).collection('chatInfo').doc('responses')
        .update({[this.user]: 'accepted'});
      }
      chatInfo.doc('invitations').update({'invitations': 
       firebase.firestore.FieldValue.arrayRemove(user)});
    }}
  ).catch(err=>console.log(err));
}

deleteDialog(converser: string, ignore: boolean):void {
  let convObj = this.conversersAndIds.find(conv => conv.name===converser);
  let dialogId = convObj? convObj.dialogId : undefined;
  if (dialogId){
  this.usersCol.doc(this.user).collection('chatInfo').doc('conversers')
  .update({'conversers': firebase.firestore.FieldValue.arrayRemove(
                         {dialogId: dialogId, name: converser})}
  );
  this.usersColRef.doc(converser).collection('chatInfo').doc('conversers').get()
  .then(
    conversersSnapshot => {
    let convs:any[] = conversersSnapshot.data().conversers;
    if(!(convs.length&&convs.some(conv => conv.name===this.user))){
      this.chatCol.doc(dialogId).delete(); 
      this.usersCol.doc(converser).collection('chatInfo').doc('invitations')
      .update({'invitations': firebase.firestore.FieldValue.arrayRemove(this.user)})
      this.usersCol.doc(this.user).collection('chatInfo').doc('unread')
      .update({[converser]: firebase.firestore.FieldValue.delete()});
      this.usersCol.doc(converser).collection('chatInfo').doc('unread')
      .update({[this.user]: firebase.firestore.FieldValue.delete()}); 
    }
    if (!ignore)
    this.usersCol.doc(converser).collection('chatInfo').doc('responses')
    .update({[this.user]: 'deleted'});
    else 
    this.ignoreInv(converser);
    }
  )
  }
  
}

sendMessage(message:string, converser:string, convRead:string|undefined, 
            messagesToDel?:any[]):void {
    let dateObj: Date = new Date();
    let date: string = dateObj.toLocaleDateString();
    let time: string = dateObj.toLocaleTimeString();
    let previousRead:string;
    let dialogId:string = 
       this.conversersAndIds.find(conv => conv.name===converser).dialogId;
    if(this.convCurrentTalk===this.user){
      this.convReadIn.next({conv: converser, time: date+' '+time});
    }else{
      this.convReadIn.next({conv: converser, time: undefined});
    }
    previousRead= !convRead? '':convRead;
    let batch = this.afs.firestore.batch();
    let chatDocRef = this.chatCol.doc(dialogId).ref;
    if(messagesToDel.length) batch.update(chatDocRef, 
      {'messages': firebase.firestore.FieldValue.arrayRemove(...messagesToDel)});
    batch.update(chatDocRef, {'messages' : 
    firebase.firestore.FieldValue.arrayUnion(
      {'prevRead': previousRead, 'content': message, 'date': date, 
      'time': time, 'user': this.user})}
    );
    
    batch.commit().then( () => {
      if(this.convCurrentTalk!==this.user&&this.convNotInformed){
        this.usersCol.doc(converser).collection('chatInfo').doc('unread')
        .update({[this.user] : true});
        this.usersCol.doc(this.user).collection('chatInfo').doc('convRead')
        .update({[converser]: firebase.firestore.FieldValue.delete()});
        this.convNotInformed = false;
      }else if(this.convCurrentTalk===this.user){
        this.usersCol.doc(this.user).collection('chatInfo').doc('convRead')
        .update({[converser]: date+' '+time});
      }
    })

}

findUsers(input:string):void {
  this.afs.collection('various').doc('allUsers').ref.get().then(
    allUsersSnapshot => {
      let users: string[] = allUsersSnapshot.data().allUsers;
      let inputLetters:string[] = input.split('');
      let inputLetLen: number = inputLetters.length;
      users = users.filter(checkingName => {
        if(checkingName.length<inputLetLen) return false;
        let checkingNameLetters = checkingName.toLowerCase().split('');
        for (let i = 0; i < inputLetLen; i++){
        let letterIndex: number = checkingNameLetters.indexOf(inputLetters[i]);
        if(!(letterIndex+1)) return false;
        checkingNameLetters.splice(letterIndex,1);
        }
        return true;
      })
      this.usersIn.next(users);
    }
  )
}

deleteInv(user:string):void {
  this.usersCol.doc(this.user).collection('chatInfo').doc('invitations')
  .update({'invitations': firebase.firestore.FieldValue.arrayRemove(user)});
  this.usersCol.doc(user).collection('chatInfo').doc('responses')
  .update({[this.user]: 'rejected'}).catch(err=>console.log(err));
}

ignoreInv(user:string):void {
  this.usersCol.doc(this.user).collection('chatInfo').doc('ignored')
  .update({'ignored': firebase.firestore.FieldValue.arrayUnion(user)});
  this.usersCol.doc(this.user).collection('chatInfo').doc('invitations')
  .update({'invitations': firebase.firestore.FieldValue.arrayRemove(user)});
  this.usersCol.doc(user).collection('chatInfo').doc('responses')
  .update({[this.user]: 'ignored'}).catch(err=>console.log(err));
}

removeFromIgnored (user:string): void {
  this.usersCol.doc(this.user).collection('chatInfo').doc('ignored')
  .update({'ignored': firebase.firestore.FieldValue.arrayRemove(user)});
  this.usersCol.doc(user).collection('chatInfo').doc('responses')
  .update({[this.user]: 'rejected'}).catch(err=>console.log(err));
}

getIgnored():Promise<any> {
  return this.usersColRef.doc(this.user).collection('chatInfo')
  .doc('ignored').get();
}

getResponses():void {
  this.responsesIn.next(this.usersCol.doc(this.user).collection('chatInfo')
  .doc('responses').valueChanges()); 
}

}
