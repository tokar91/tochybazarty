import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';

import {FormsModule} from '@angular/forms';
import {AngularFireModule} from 'angularfire2';
import {AngularFirestoreModule} from 'angularfire2/firestore';

import { AppRoutingModule } from './app-routing.module';
import { ChatComponent } from './chat/chat.component';
import { JokesComponent } from './jokes/jokes.component';
import { AccountComponent } from './account/account.component';
import { NextJokesBtnComponent } from './next-jokes-btn/next-jokes-btn.component';
import { AutofocusDirective } from './autofocus.directive';


var firebaseConfig = {
  apiKey: "AIzaSyC11KTfU6bzJyIlMM9EpQ5ZFKnUiQelRRo",
  authDomain: "tochybazarty.firebaseapp.com",
  databaseURL: "https://tochybazarty.firebaseio.com",
  projectId: "tochybazarty",
  storageBucket: "",
  messagingSenderId: "927815507729",
  appId: "1:927815507729:web:82df45ac99287d24"
}; 


@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    JokesComponent,
    AccountComponent,
    NextJokesBtnComponent,
    AutofocusDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule,
    AppRoutingModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})

export class AppModule { }
