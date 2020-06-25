import { Injectable, OnDestroy} from '@angular/core';

import {AngularFirestore, AngularFirestoreCollection} from 'angularfire2/firestore';
import{firebase} from '@firebase/app';
import '@firebase/firestore';

import {Observable, Subscription} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {IJoke} from './i-joke';
import { DocumentReference, DocumentSnapshot } from '@firebase/firestore-types';


@Injectable({
  providedIn: 'root'
})

export class JokesService implements OnDestroy{

jokesCol:AngularFirestoreCollection<IJoke>;
usersCol: AngularFirestoreCollection<any>;
topAverages: {[key:string]:any}[];
topRatings: {[key:string]:any}[];
topBestMarks: {[key:string]:any}[];
topAveRatSubscription: Subscription; 
topBestSubscription: Subscription;
jokes:Observable<{id:string, data:IJoke}[]>;
valueOfLast:any;
valueOfFirst:any;
restart:boolean = false;
lastPage:boolean = true;
firstPage:boolean = true;
firstLastPageIn: Subject<[boolean, boolean]> = new Subject();
firstLastPage$: Observable<[boolean,boolean]> = 
  this.firstLastPageIn.asObservable();
orderBy:string;
direction:any;
reversedDir:any
amount:number;
amountParam:number;
initialValue: string|number;
sign:any;
reversedSign:any;
signInit:any;
property: string;
searchValue: string;
equalOrArrContains: any;
lover: string;
nojokesElem:HTMLElement;
nojokesElemActive: boolean = false;



paramsIn: Subject<any> = new Subject<any>();
paramsOut$: Observable<any[]> = this.paramsIn.asObservable();
paramsMessage:any[];

topIn: Subject<any> = new Subject<any>();
top$: Observable<any> = this.topIn.asObservable();


constructor(private afs:AngularFirestore) {
  this.jokesCol = this.afs.collection('jokes');   
  this.usersCol = this.afs.collection('users');
  this.topAveRatSubscription = 
  this.afs.collection('various').doc('topAveragesAndRatings')
  .valueChanges().subscribe(
    topAveRatDoc => { 
      if(topAveRatDoc){
        this.topAverages = topAveRatDoc['averages'];
        this.topRatings = topAveRatDoc['ratings'];
        this.topIn.next({'averages': this.topAverages, 'ratings': this.topRatings}); 
      }
  });
  this.topBestSubscription = 
  this.afs.collection('various').doc('topBestMarks').valueChanges().subscribe(
    topBestDoc => { if(topBestDoc){
                      this.topBestMarks = topBestDoc['bestMarks'];
                      this.topIn.next({'bestMarks': this.topBestMarks});
                  } 
  })         
    
}

ngOnDestroy(){
  this.topAveRatSubscription.unsubscribe();
  this.topBestSubscription.unsubscribe();
}

emitParams(paramsMessage:any[]){
  this.paramsIn.next(paramsMessage);
}

getJokes(orderBy?:string, 
 direction?:firebase.firestore.OrderByDirection,
 amount?:number,initialValue?:string|number,
 property?:string, searchValue?:string,lover?:string)
 :Observable<{id:string,data:IJoke}[]>|null {
  
 if(!(orderBy||direction||amount||initialValue||property
  ||searchValue||lover)||((orderBy==='date'||orderBy==='rating')&&
 (direction==='asc'||direction==='desc')&&
 (amount<=30)&&(property==='title'||property==='user'
 ||property==undefined))){


  if(orderBy){this.orderBy=orderBy};
  if(direction){
    this.direction=direction;
    this.reversedDir = direction === 'asc'? 'desc' : 'asc';
    this.sign = direction === 'desc'? '<' : '>';
    this.reversedSign = this.sign === '<'? '>' : '<';
    this.signInit = direction === 'desc'? '<=' : '>=';
  };
  if(amount){this.amount=+amount+1;
             this.amountParam = +amount};
  if(initialValue&&initialValue!='def'){
    this.initialValue = isNaN(+initialValue)?initialValue:+initialValue;
  }else if(orderBy&&direction&&amount){
     this.initialValue=undefined;
  };  
  if(property&&searchValue){   
    this.searchValue = searchValue.trim();
    if(property==='title'&&searchValue.split(' ').length===1&&!lover){
     this.property='titleArr';
     this.searchValue = 
      this.replacePolishSigns(this.searchValue.toLowerCase()).replace(/[^\w]/g,'');
    }else if(property==='title'){
     this.property = 'titleLC';
     this.searchValue =  
      this.replacePolishSigns(this.searchValue.toLowerCase())
      .replace(/[^\w]/g,' ').replace(/ +/g, ' ').trim();
    }else{
     this.property=property;
    };
    this.equalOrArrContains = 
    this.property === 'titleArr'? 'array-contains' : '==';
  }else if(orderBy&&direction&&amount){
    this.property=undefined; 
    this.searchValue=undefined;
  };
  if(lover){this.lover = lover}
  else if(orderBy&&direction&&amount){this.lover = undefined};
 
  this.paramsMessage = [this.orderBy, this.direction, this.amountParam, 
    this.initialValue, property, this.searchValue];
  this.emitParams(this.paramsMessage);

 //console.log('GET JOKES (). orderBy: ', this.orderBy,' ; direction: ',
 // this.direction, ' ; amount: ', this.amountParam, ' ; sign: ', this.sign,
 //  ' ; initialValue: ', this.initialValue, ' ; property :', 
 //  this.property, ' ; searchValue :', this.searchValue, ' ; lover : ', this.lover);
   
 this.firstPage = true;

 return this.afs.collection('jokes',
  ref=>{
    if(this.lover){
      if(this.property&&this.searchValue){
        if(this.initialValue){
          return ref.where('lovers', 'array-contains', this.lover)
          .where(this.property,this.equalOrArrContains,this.searchValue)
          .where(this.orderBy, this.signInit, this.initialValue)
          .orderBy(this.orderBy, this.direction)
          .limit(this.amount)
        }else{
          return ref.where('lovers', 'array-contains', this.lover)
          .where(this.property,this.equalOrArrContains,this.searchValue)
          .orderBy(this.orderBy, this.direction)
          .limit(this.amount)
        }
      }else{
        if(this.initialValue){
          return ref.where('lovers', 'array-contains', this.lover)
          .where(this.orderBy, this.signInit, this.initialValue)
          .orderBy(this.orderBy, this.direction)
          .limit(this.amount)
        }else{
          return ref.where('lovers', 'array-contains', this.lover)
          .orderBy(this.orderBy, this.direction)
          .limit(this.amount)
        }
      }
    }else{
      if(this.property&&this.searchValue){
        if(this.initialValue){
          return ref.where(this.property,this.equalOrArrContains,this.searchValue)
          .where(this.orderBy, this.signInit, this.initialValue)
          .orderBy(this.orderBy, this.direction)
          .limit(this.amount)
        }else{
          return ref.where(this.property,this.equalOrArrContains,this.searchValue)
          .orderBy(this.orderBy, this.direction)
          .limit(this.amount)
        }
      }else{
        if(this.initialValue){
          return ref.where(this.orderBy, this.signInit, this.initialValue)
          .orderBy(this.orderBy, this.direction)
          .limit(this.amount)
        }else{
          return ref.orderBy(this.orderBy, this.direction)
          .limit(this.amount)
        }
      }
    }
  })
  .snapshotChanges().pipe(
    tap(myColl => {let colLen = myColl.length; 
                   if(colLen===this.amount){
                     this.valueOfLast = myColl[colLen-2].payload.doc;
                     this.lastPage = false;
                     this.nojokesNote('');
                     //console.log('będzie następna strona');
                   }else{
                     this.lastPage = true;
                     this.nojokesNote('');
                     if(colLen===0){
                      this.nojokesNote(
                        'Tu nie ma żartów. Nie znaleziono takich dowcipów.');
                     }
                     //console.log('NIE będzie następnej strony');
                   };
                   this.firstLastPageIn.next(
                     [this.firstPage, this.lastPage]);
                  }
       ),
    map(this.mapJokesSnapshot),
    map(myColl => {
            if(myColl.length===this.amount){myColl.pop()};
            return myColl;
       })
  );
  }else{
    window.alert("Ups, wprowadzony adres jest błędny.");
    return null;
  }
}

getNextJokes():(Observable<{id:string,data:IJoke}[]>|false|null) {
  if(this.restart===true){
    
    this.restart = false;
    return this.getJokes();
  }

  if(!this.lastPage) {
  
   this.firstPage = false;
   
   return this.afs.collection('jokes',
   ref=>{
    if(this.lover){
      if(this.property&&this.searchValue){
        return ref.where('lovers', 'array-contains', this.lover)
        .where(this.property,this.equalOrArrContains,this.searchValue)
        .orderBy(this.orderBy, this.direction)
        .startAfter(this.valueOfLast)
        .limit(this.amount);
      }else{
        return ref.where('lovers', 'array-contains', this.lover)
        .orderBy(this.orderBy, this.direction)
        .startAfter(this.valueOfLast)
        .limit(this.amount)
      };
    }else{
      if(this.property&&this.searchValue){
        return ref.where(this.property,this.equalOrArrContains,this.searchValue)
        .orderBy(this.orderBy, this.direction)
        .startAfter(this.valueOfLast)
        .limit(this.amount);
      }else{
        return ref.orderBy(this.orderBy, this.direction)
        .startAfter(this.valueOfLast)
        .limit(this.amount)
      };
    }
   })
   .snapshotChanges().pipe(
     tap(myColl => {
            let colLen = myColl.length;
            if(colLen===this.amount){
              this.valueOfLast = myColl[colLen-2].payload.doc;
              this.valueOfFirst = myColl[0].payload.doc;
              this.lastPage = false;
              this.nojokesNote('');
              //console.log('będzie następna strona');
            }else if(colLen&&colLen<this.amount){
              this.valueOfFirst = myColl[0].payload.doc;
              this.lastPage = true;
              this.nojokesNote('');
              //console.log('NIE będzie następnej strony');
            }else{
         // SZACOWANIE valueoffirst, gdyby zarty zostaly usuniete lub przeniesione
              this.valueOfFirst = 
                this.direction==='asc'? Number.MAX_SAFE_INTEGER : -1; 
              this.lastPage = true;
              this.nojokesNote('Żarty się skończyły.');
              console.log('żarty zmieniły pozycję lub zostały usunięte');
            }
            this.firstLastPageIn.next(
              [this.firstPage, this.lastPage]);
          }
     ),
     map(this.mapJokesSnapshot),
     map(myColl => {if(myColl.length===this.amount){myColl.pop()};
                    return myColl})
    ); 
  }else{
    return false;
  }

}

getPreviousJokes():(Observable<{id:string,data:IJoke}[]>|false|null) {
  
  if(!this.firstPage){
    this.lastPage = false;

  return  this.afs.collection('jokes',
  ref=>{
   if(this.lover){
     if(this.property&&this.searchValue){
       return ref.where('lovers', 'array-contains', this.lover)
       .where(this.property,this.equalOrArrContains,this.searchValue)
       .orderBy(this.orderBy, this.reversedDir)
       .startAfter(this.valueOfFirst)
       .limit(this.amount);
     }else{
       return ref.where('lovers', 'array-contains', this.lover)
       .orderBy(this.orderBy, this.reversedDir)
       .startAfter(this.valueOfFirst)
       .limit(this.amount);
     }
   }else{
     if(this.property&&this.searchValue){
       return ref.where(this.property,this.equalOrArrContains,this.searchValue)
       .orderBy(this.orderBy, this.reversedDir)
       .startAfter(this.valueOfFirst)
       .limit(this.amount);
     }else{
       return ref.orderBy(this.orderBy, this.reversedDir)
       .startAfter(this.valueOfFirst)
       .limit(this.amount);
     }
   }
  })
  .snapshotChanges().pipe(
    tap(myColl => {
          let colLen = myColl.length;
          if(colLen===this.amount){
            this.valueOfLast = myColl[0].payload.doc;
            this.valueOfFirst = myColl[colLen-2].payload.doc;
            this.firstPage = false;
            this.restart = false;
            this.nojokesNote('');
            //console.log('będzie wcześniejsza strona');
          }else if(colLen<this.amount && colLen){
            this.valueOfLast = myColl[0].payload.doc;
            this.firstPage = true;
            this.nojokesNote('');
            if(colLen<this.amount-1) this.restart = true;
            //console.log('NIE będzie wcześniejszej strony');
          }else{                                            
        // TUTAJ SZACOWANIE VALUE OF LAST, gdyby po cofnęciu 
        // z jakiś powodów dowcipy zniknęły                      
            this.valueOfLast = 
              this.direction==='asc'? -1 : Number.MAX_SAFE_INTEGER;
            this.firstPage = true;
            this.restart = true;
            this.nojokesNote('Żarty się skończyły.');
            console.log('żarty zmieniły pozycję lub zostały usunięte');
          }
          this.firstLastPageIn.next(
            [this.firstPage, this.lastPage]);
          }
        ),
    map(this.mapJokesSnapshot),
    tap(myColl => {
      if(this.initialValue&&myColl.length===this.amount){
        if(this.orderBy==='date'&&this.direction==='asc'){
          this.firstPage = this.initialValue>myColl[myColl.length-1].data.date; 
          //console.log('osiągnięto initialValue date, nie bedzie wczesn strony')
        };
        if(this.orderBy==='date'&&this.direction==='desc'){
          this.firstPage = this.initialValue<myColl[myColl.length-1].data.date; 
          //console.log('osiągnięto initialValue date, nie bedzie wczesn strony')
        };
        if(this.orderBy==='rating'&&this.direction==='asc'){
          this.firstPage = this.initialValue>myColl[myColl.length-1].data.rating; 
          //console.log('osiągnięto initialValue rating, nie bedzie wczesn strony')
        };
        if(this.orderBy==='rating'&&this.direction==='desc'){
          this.firstPage = this.initialValue<myColl[myColl.length-1].data.rating; 
          //console.log('osiągnięto initialValue rating, nie bedzie wczesn strony')
        };
      }
    }),
    map(myColl => {if(myColl.length===this.amount){myColl.pop()};
                   return myColl.reverse()})
   
  );
  } else if(this.restart) {
    
    this.restart = false;
    return this.getJokes();

  }else{
    return false;
  }
}

nojokesNote (message:string):void{
  if(message){
    this.nojokesElem.innerHTML = message;
    this.nojokesElem.style.display = 'block';
    this.nojokesElem.style.animation = null;
    void this.nojokesElem.offsetWidth;
    this.nojokesElem.style.animation = 'showNoJokes 1s ease-in';
    this.nojokesElemActive = true;
  }else if(this.nojokesElemActive){
    this.nojokesElem.style.display = 'none';
    this.nojokesElemActive = false;
  } 
}

mapJokesSnapshot (myColl:any) {
    return myColl.map(joke => {
      const id:number = joke.payload.doc.id;
      const data = joke.payload.doc.data() as IJoke;
      return {id, data};
      });   
}

addJoke(title:string, content:string, user:string) {
   let titleForSearch: string = this.replacePolishSigns(title.toLowerCase())
     .replace(/[^\w]/g,' ').trim();
   let titleArr: string[] = titleForSearch.split(/ +/);
   let titleLC: string = titleForSearch.replace(/ +/g, ' ');
   let time: Date = new Date();
   let day:string = time.getDate().toString();
   day = day.length === 1? '0'+day : day;
   let month: string = (time.getMonth()+1).toString();
   month = month.length === 1? '0'+month : month;
   
   this.jokesCol.add({'title': title, 'titleArr': titleArr, 'titleLC': titleLC, 
   'content': content, 'user': user, 'date': time.getTime(), 
   'dateStr': `${day}/${month}/${time.getFullYear()}`,
   'rating': 0, 'votesNumber': 0, 'lovers': [], 'markers': {}});

   if(user!=='niezalogowany') this.afs.collection('users').doc(user)
    .update({'numberOfJokes': firebase.firestore.FieldValue.increment(1)});

}

// KOD DODAJĄCY NOWE POLA (PRZY WPROWADZANIU ZMIAN) DO DOWCIPOW WYSWIETLANYCH NA STRONIE
// poniższy dodaje pola user, przypisuje im wartosc pola nick i usuwa pola nick.
  /*
   this.jokesCol.snapshotChanges().pipe(
     take(1), 
     map(coll=>coll.map(
     joke => {
       const id = joke.payload.doc.id;
       const title = joke.payload.doc.data().title;
       return {id,title};}))
   )
   .subscribe(
       idTitleArr => idTitleArr.forEach(
         idTitle=>{this.jokesCol.doc(idTitle.id)
         .update({'markers': {} });
        //  this.jokesCol.doc(idNick.id)
        //.update({'nick': firebase.firestore.FieldValue.delete()});  
        })
       );
            
  //  import{firebase} from '@firebase/app';   import '@firebase/firestore';
            
}      */  
       

deleteJoke(id:string, author:string) {
  this.afs.firestore.runTransaction(
    transaction => {
      return transaction.get(this.jokesCol.doc(id).ref).then(
        jokeDocSnap => {
            if(!jokeDocSnap.exists) throw 'Joke was just DELETED';
            transaction.delete(this.jokesCol.doc(id).ref);
        }
      )
    }
  ).then(  ()=>{
   if(author!=='niezalogowany'){

    this.usersCol.doc(author).update(
      {'numberOfJokes': firebase.firestore.FieldValue.increment(-1)}
    ).catch(err=>console.log(err));
    
    this.afs.firestore.runTransaction( async transaction => {
      const marksDocRef =
       this.usersCol.doc(author).collection('jokesInfo').doc('marks').ref;
      const statsDocRef =
       this.usersCol.doc(author).collection('jokesInfo').doc('statistics').ref;
      const statsDocSnap = await statsDocRef.get();

      return transaction.get(marksDocRef).then(
        marksSnap => {

          if (!statsDocSnap.exists) 
            throw 'Deleting joke - Didn\'t get statsDocSnap';
          let marks = marksSnap.data();
          let rating: number|undefined = marks[id];
          if(typeof rating !== 'number') 
            throw 'Joke didn\'t have RATING or joke just DELETED';
          let average: number = statsDocSnap.data().average;
          let bestMark: number = statsDocSnap.data().bestMark;
          let counter: number = statsDocSnap.data().counter;
          let userRating: number;
          let sumOfMarks: number = statsDocSnap.data().sumOfMarks;
          
          counter--;
          if (rating===bestMark){
            delete marks[id];
            var max = 0;
            for (let id in marks){
              if(marks[id]>max) max = marks[id];
            }
            bestMark = max;
          }
          sumOfMarks -= rating;
          average = counter? sumOfMarks/counter : 0;
          let multiplier: number = 1;
          if(average >= 4.25) multiplier = 25;
          else if(average >= 4) multiplier = 18;
          else if(average >= 3.75) multiplier = 12;
          else if(average >= 3.5) multiplier = 8;
          else if(average >= 3.25) multiplier = 5;
          else if(average < 2.75) multiplier = 0;
          userRating = sumOfMarks*multiplier;

          transaction.update(marksDocRef, 
            {[id]: firebase.firestore.FieldValue.delete()});
          transaction.update(statsDocRef, {
            'average': average,
            'bestMark': bestMark,
            'counter': counter,
            'rating': userRating,
            'sumOfMarks': sumOfMarks
          })
          
          const batch = this.afs.firestore.batch();
          const batchCount = {
            numb:0, 
            isReady(){this.numb++;if(this.numb===3) return true; return false;}
           };
          this.updateRanking(this.topAverages, author, 'average', average, 
            transaction, batch, batchCount);
          this.updateRanking(this.topRatings, author, 'rating', userRating, 
            transaction, batch, batchCount);
          this.updateRanking(this.topBestMarks, author, 'bestMark', bestMark, 
            transaction, batch, batchCount);
        }
      )
      }
      
    ).catch(err=>console.log(err));

  }}).catch(err=>console.log(err));
 
}

markJoke(jokeId:string, mark:number, user:string, author: string):void {
    
  this.afs.firestore.runTransaction(async transaction => {
  
    let jokeDocRef:DocumentReference = 
      this.afs.firestore.collection('jokes').doc(jokeId);
    if(author!=='niezalogowany'){
      var marksDocRef: DocumentReference = 
        this.afs.collection('users').doc(author)
        .collection('jokesInfo').doc('marks').ref;
      var statisticsDocRef: DocumentReference = 
        this.afs.collection('users').doc(author)
        .collection('jokesInfo').doc('statistics').ref;
      const snapshots = 
        await Promise.all([marksDocRef.get(),statisticsDocRef.get()]);  
                                                                                        
      var marksDocSnap: DocumentSnapshot = snapshots[0];
      var statisticsDocSnap: DocumentSnapshot = snapshots[1];
    }
    return transaction.get(jokeDocRef).then( 
      jokeDocSnap => {

        let prevMark: number = 
        +jokeDocSnap.data().markers[user]? +jokeDocSnap.data().markers[user] : 0;             
        let votesNumber:number = 
          prevMark? +jokeDocSnap.data().votesNumber : 
                    +jokeDocSnap.data().votesNumber + 1;
        let prevRating: number = +jokeDocSnap.data().rating;
        let newRating: number;
        
        if(prevMark){
          newRating = (votesNumber*prevRating-prevMark+mark)/votesNumber;
        }else{
          newRating = ((votesNumber-1)*prevRating+mark)/votesNumber;
        };
        transaction.update(jokeDocRef, 
          {['markers.'+user]: mark, 'rating': newRating, 
            'votesNumber': votesNumber});

        if(author!=='niezalogowany'){
          if(!marksDocSnap.exists)
            {console.log('WARNING: Didn\'t get marksDocSnap'); return;}
          if(!statisticsDocSnap.exists) 
            {console.log('WARNING: Didn\'t get statisticsDocSnap'); return;};
          if(!(this.topAverages&&this.topRatings&&this.topBestMarks)) 
            throw 'Didn\'t get TOPs';

          let stats: any = statisticsDocSnap.data();
          let delta: number = newRating - prevRating;
          let newSumOfMarks: number = +stats.sumOfMarks+delta; 
          let counter: number = prevRating? +stats.counter : +stats.counter+1;
          let average: number = newSumOfMarks/counter;
          let bestMark: number = +stats.bestMark;
          let userRating: number;

          transaction.update(marksDocRef, {[jokeId]: newRating}); 
        
          if(newRating > stats.bestMark) bestMark = newRating 
          else if(newRating < stats.bestMark&&prevRating==stats.bestMark){
            let max: number = newRating;
            const ratings = marksDocSnap.data();
            delete ratings[jokeId];
            for (let id in ratings){
              if(ratings[id]>max) max = +ratings[id];
            };
            bestMark = max;
          };

          let multiplier: number = 1;
          if(average >= 4.25) multiplier = 25;
          else if(average >= 4) multiplier = 18;
          else if(average >= 3.75) multiplier = 12;
          else if(average >= 3.5) multiplier = 8;
          else if(average >= 3.25) multiplier = 5;
          else if(average < 2.75) multiplier = 0;
          userRating = newSumOfMarks*multiplier;
          transaction.update(statisticsDocRef, {
            'average': average, 'bestMark': bestMark, 'counter': counter, 
            'rating': userRating, 'sumOfMarks': newSumOfMarks
          });

          const batch = this.afs.firestore.batch();
          const batchCount = {
            numb:0, 
            isReady(){this.numb++;if(this.numb===3) return true; return false;}
          };  
          this.updateRanking(this.topAverages, author, 'average', average, 
            transaction, batch, batchCount);
          this.updateRanking(this.topRatings, author, 'rating', userRating, 
            transaction, batch, batchCount);
          this.updateRanking(this.topBestMarks, author, 'bestMark', bestMark, 
            transaction, batch, batchCount);
        
        }
      }
    )
  }).then(_=> console.log('Transaction SUCCESSFULLY COMMITTED'))
  .catch(error => console.log('Transaction ERROR: ', error))
}

private async updateRanking(topArr: any[], user:string, fieldName: string, 
        userStatValue: number, transaction: any, batch:any, batchCount:any) {

    let notUpdated: boolean = true;
    topArr = topArr.slice();
    let oldIndex: number = topArr.findIndex(el => el.user === user);
    let newIndex: number = topArr.findIndex(el => el[fieldName] <= userStatValue);

    if(newIndex !== oldIndex){  
        if(newIndex+1){
          if(oldIndex+1){
            if(newIndex < oldIndex){
              topArr.splice(oldIndex, 1);
              topArr.splice(newIndex, 0, {user, [fieldName]: userStatValue});
            }else{
              topArr.splice(newIndex, 0, {user, [fieldName]: userStatValue});
              topArr.splice(oldIndex, 1);
            }  
          }else{
            topArr.splice(newIndex, 0, {user, [fieldName]: userStatValue});
            if(topArr.length > 10) topArr.pop();
          }
        }else{ // oldIndex musi być 0+, bo newIndex  wynosi -1
          if(topArr.length === 10){
  
            await this.removeFromRanking(topArr, oldIndex, fieldName, 
              user, batch, batchCount, userStatValue); 

            notUpdated = false;
          }else{
            topArr.splice(oldIndex, 1);
            topArr.push({user, [fieldName]: userStatValue});
          }
        }
    }else{
      if(oldIndex+1) topArr[oldIndex][fieldName] = userStatValue;
      if(topArr.length<10&&oldIndex===-1) 
        topArr.push({user, [fieldName]: userStatValue});
    }
    if(notUpdated) {
      transaction.update(this.afs.collection('various').doc(
        fieldName==='bestMark'?'topBestMarks':'topAveragesAndRatings').ref,
        {[fieldName+'s']: topArr});
      if(batchCount.isReady()) batch.commit();
    };

    //console.log('updateRanking() zaktualizowało ranking dla: ' + fieldName);

}



async removeFromRanking(topArrCopy: any[], oldIndex: number, fieldName: string,
        user: string, batch:any, batchCount:any, userStatValue: number = 0, 
        removingAccount: boolean = false) {
  
  topArrCopy.splice(oldIndex, 1);

  if(topArrCopy.length===9){ 
    let lastValueDocSnap = 
      await this.afs.firestore.collection('users').doc(topArrCopy[8].user)
              .collection('jokesInfo').doc('statistics').get();
    let statDocs = await this.afs.firestore.collectionGroup('jokesInfo')
      .orderBy(fieldName,'desc').startAfter(lastValueDocSnap).limit(1).get();  
    if(statDocs.docs[0]){
      let newLastUser: string = statDocs.docs[0].ref.parent.parent.id;
      let newLastValue: number = +statDocs.docs[0].get(fieldName);
      if(!removingAccount&&userStatValue>=newLastValue){
        topArrCopy.push({user, [fieldName]: userStatValue});
        //console.log('updateRating() miało usunąć obecnego użytkownika: '+
        // user +' z TOP: '+fieldName+
        //   ' , ale dodało go na koniec, bo nie znalazło lepszych wartości.');
      }else{
        topArrCopy.push({'user': newLastUser, [fieldName]: newLastValue});
        //console.log('updateRanking() usunęło obecnego użytkownika: '+user+ 
        //' z TOP: '+fieldName+', a dodało użytkownika: '+newLastUser);
      }
    }else{
      if(!removingAccount){
        topArrCopy.push({user, [fieldName]: userStatValue}); 
        //console.log('updateRanking() miało usunąć obecnego użytkownika: '+ 
        //user +' z TOP: '+fieldName+
        //   ' , ale dodało go na koniec, bo nie znalazło ŻADNYCH innych wartości.');
      }
      //console.log('statsDocs.docs[0] : ', statDocs.docs[0]);
      
    };
  }
  batch.update(this.afs.collection('various').doc(
   fieldName==='bestMark'?'topBestMarks':'topAveragesAndRatings').ref,
     {[fieldName+'s']: topArrCopy});
  if(batchCount.isReady()) batch.commit();

}

addToFavourite(jokeId:string, user:string):void {
  this.jokesCol.doc(jokeId).update(
    {'lovers': firebase.firestore.FieldValue.arrayUnion(user)}
  );
}

removeFromFavourite(jokeId:string, user:string):void {
  this.jokesCol.doc(jokeId).update(
    {'lovers': firebase.firestore.FieldValue.arrayRemove(user)}
  );
}

private replacePolishSigns(valueInLC:string){
  return valueInLC.replace(/ą/g,'a').replace(/ć/g,'c')
  .replace(/ę/g,'e').replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
  .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z');
}

}
