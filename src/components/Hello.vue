<template>
  <div class="hello">
    <div v-if="!connected">
      <a v-bind:href="'https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=228BV6&redirect_uri=' + originUrl + '&scope=activity%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight&expires_in=6048000'"><button>Se connecter</button></a>
    </div>

    <div v-if="connected">
      <button v-on:click="disconnect">Se déconnecter</button>

      <h2>Objectif de la semaine : 300 minutes actives</h2>

      <div v-if="minutesFairlyActive && minutesVeryActive">
        <MainDoughnut v-bind:minutesFairlyActive="minutesFairlyActive" v-bind:minutesVeryActive="minutesVeryActive"></MainDoughnut>
      </div>

      <p><strong>{{ minutesFairlyActive }} min + 2x{{ minutesVeryActive }} min = {{ score }} min / objectif de 300 min</strong></p>
      
    </div>

    <input
      v-model.trim="newUserText"
      @keyup.enter="addUser"
      placeholder="Add new user"
    >

    <!--
    <p>TODO : afficher l'heure de la dernière synchro</p>
    <p>TODO : afficher ces nombres sur le Donut</p>
    -->
  </div>
</template>

<script>
import MainDoughnut from './MainDoughnut.js'

import Firebase from 'firebase'
var config = {
  // apiKey: '...',
  // authDomain: '...',
  // storageBucket: '...',
  // messagingSenderId: '...',
  databaseURL: 'https://moov4good.firebaseio.com/'
}

var db = Firebase.initializeApp(config).database()
var usersRef = db.ref('users')
var logsRef = db.ref('logs')

// var db = Firebase.initializeApp({
//   databaseURL: 'https://vuefiredemo.firebaseio.com'
// }).database()
// var todosRef = db.ref('todos')

export default {
  name: 'hello',
  components: {
    MainDoughnut,
    Firebase
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
      minutesFairlyActive: undefined,
      minutesVeryActive: undefined,
      score: 0,
      connected: false,
      originUrl: window.location.origin,
      newUserText: ''
    }
  },
  methods: {
    disconnect: function () {
      eraseCookie('accessToken')
      this.connected = false
      window.location.href = '/'
    },
    /**
     * Return the access token (a string) that can be in
     * - URL params (eg: #/access_token=eyJhbGciOi...) -> in that case it stores it in cookie
     * - Cookie
     * Return null if there is no acces token
     */
    getAccessToken: function (self) {
      console.log('### getAccessToken ###')
      if (self.$route.params.hasOwnProperty('params')) {
        var params = self.$route.params.params
        console.log(self.$route)
        var accessTokenInParams = this.getParameterByName('access_token', params)
        console.log(accessTokenInParams)
        if (accessTokenInParams) {
          setCookie('accessToken', accessTokenInParams, 366)
          this.pushUserToFirebaseIfNew(params)
          console.log('We get the accessToken from params')
          return accessTokenInParams
        }
      }

      var accessTokenInCookie = getCookie('accessToken')
      if (accessTokenInCookie) {
        console.log('We get the accessToken from cookie')
        console.log(accessTokenInCookie)
        return accessTokenInCookie
      }
      return null
    },
    pushUserToFirebaseIfNew: function (params) {
      var userId = this.getParameterByName('user_id', params)
      usersRef.push({
        userId: userId,
        params: params
      })
      logsRef.push({
        userId: userId,
        params: params
      })
    },
    getParameterByName: function (name, params) {
      var indexOfParam = params.indexOf(name + '=')
      if (indexOfParam !== -1) {
        var indexOfEnd = params.indexOf('&', indexOfParam)
        return params.substr(indexOfParam + name.length + 1, indexOfEnd - (indexOfParam + name.length + 1))
      }
      return undefined
    },
    getAndSetActivities: function (activityName, accessToken, self) {
      var apiUrl = 'https://api.fitbit.com/1/user/-/activities/' + activityName + '/date/2017-04-09/7d.json'
      var xhr = new XMLHttpRequest()
      xhr.open('GET', apiUrl)
      xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken)
      xhr.onload = function () {
        var response = JSON.parse(xhr.responseText)
        console.log(response)
        var activityNb = 0
        for (var i = 0; i < response['activities-' + activityName].length; i++) {
          activityNb += parseInt(response['activities-' + activityName][i]['value'])
          console.log(activityNb)
        }
        switch (activityName) {
          case 'minutesFairlyActive':
            self.minutesFairlyActive = activityNb
            break
          case 'minutesVeryActive':
            self.minutesVeryActive = activityNb
            break
        }
        self.score = self.minutesFairlyActive + 2 * self.minutesVeryActive
      }
      xhr.send()
    },
    addUser: function () {
      if (this.newUserText) {
        usersRef.push({
          text: this.newUserText
        })
        this.newUserText = ''
      }
    }
  },
  created: function () {
    var accessToken = this.getAccessToken(this)
    this.connected = accessToken !== null

    if (accessToken) {
      this.getAndSetActivities('minutesFairlyActive', accessToken, this)
      this.getAndSetActivities('minutesVeryActive', accessToken, this)
    }
  }
}

function setCookie (cname, cvalue, exdays) {
  var d = new Date()
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
  var expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

function getCookie (cname) {
  var name = cname + '='
  var ca = document.cookie.split(';')
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

function eraseCookie (name) {
  setCookie(name, '', -1)
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
