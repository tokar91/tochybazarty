import { NgModule } from '@angular/core';
import {RouterModule, Routes, CanActivate } from "@angular/router";
import {JokesComponent} from './jokes/jokes.component';
import {AccountComponent} from './account/account.component';

import { AuthGuardService as AuthGuard } from './auth/auth-guard.service';

const amount:string = '6';

const routes:Routes = [
  {path:'jokes/:orderBy/:direction/:amount', component:JokesComponent},
  {path:'jokes/:orderBy/:direction/:amount/:initialValue', component:JokesComponent},
  {path:'jokes/:orderBy/:direction/:amount/:initialValue/:property/:searchValue', component:JokesComponent},
  {path:'', redirectTo:'jokes/date/desc/'+amount, pathMatch:'full'},
  {path:'jokes', redirectTo:'jokes/date/desc/'+amount, pathMatch:'full'},
  {path:'jokes/date', redirectTo:'jokes/date/desc/'+amount, pathMatch:'full'},
  {path:'jokes/date/desc', redirectTo:'jokes/date/desc/'+amount, pathMatch:'full'},
  {path:'jokes/date/asc', redirectTo:'jokes/date/asc/'+amount, pathMatch:'full'},
  {path:'jokes/rating', redirectTo:'jokes/rating/desc/'+amount, pathMatch:'full'},
  {path:'jokes/rating/desc', redirectTo:'jokes/rating/desc/'+amount, pathMatch:'full'},
  {path:'jokes/rating/asc', redirectTo:'jokes/rating/asc/'+amount, pathMatch:'full'},
  
 
 
  {path:'account/:mode/:orderBy/:direction/:amount', component: AccountComponent, canActivate: [AuthGuard]},  
  {path:'account/:mode/:orderBy/:direction/:amount/:initialValue', component: AccountComponent, canActivate: [AuthGuard]},  
  {path:'account/:mode/:orderBy/:direction/:amount/:initialValue/:property/:searchValue', component: AccountComponent, canActivate: [AuthGuard]},
  {path:'account/login', component:AccountComponent},
  {path:'account/fav', redirectTo:'account/fav/date/desc/'+amount, pathMatch:'full'},
  {path:'account/:mode', component:AccountComponent, canActivate: [AuthGuard]},
  {path:'account', redirectTo:'account/fav/date/desc/'+amount, pathMatch:'full'},
  {path:'account/fav/date', redirectTo:'account/fav/date/desc/'+amount, pathMatch:'full'},
  {path:'account/fav/date/desc', redirectTo:'account/fav/date/desc/'+amount, pathMatch:'full'},
  {path:'account/fav/date/asc', redirectTo:'account/fav/date/desc/'+amount, pathMatch:'full'},
  {path:'account/fav/rating', redirectTo:'account/fav/rating/desc/'+amount, pathMatch:'full'},
  {path:'account/fav/rating/desc', redirectTo:'account/fav/rating/desc/'+amount, pathMatch:'full'},
  {path:'account/fav/rating/asc', redirectTo:'account/fav/rating/desc/'+amount, pathMatch:'full'},
  
  {path:'**', redirectTo:'jokes/date/desc/'+amount, pathMatch:'full'}
];

@NgModule({
  declarations: [],
  imports: [
   RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class AppRoutingModule { }
