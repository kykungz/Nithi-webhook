const firebase = require('firebase')

const config = {
  apiKey: "AIzaSyANpRPym9opPpLf76fAN0pntLB9M3fOTtQ",
  authDomain: "hackathon-ca2a6.firebaseapp.com",
  databaseURL: "https://hackathon-ca2a6.firebaseio.com",
  projectId: "hackathon-ca2a6",
  storageBucket: "",
  messagingSenderId: "818453846503"
}

firebase.initializeApp(config)

module.exports = firebase
