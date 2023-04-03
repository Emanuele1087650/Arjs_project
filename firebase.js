import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where, updateDoc, arrayUnion, setDoc} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTn8yaWiFggoX7mvNoYjUy6aG0HQIodzc",
  authDomain: "prova-laravel-cddd4.firebaseapp.com",
  databaseURL: "https://prova-laravel-cddd4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "prova-laravel-cddd4",
  storageBucket: "prova-laravel-cddd4.appspot.com",
  messagingSenderId: "10342820008",
  appId: "1:10342820008:web:5973196662f4910bbf7a9d"
};

//INIZIALIZZAZIONE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const storage = getStorage();

/*signOut(auth).then(() => {
  // Sign-out successful.
  console.log(auth);
}).catch((error) => {
  // An error happened.
  console.log(error);
});*/


//LOGIN
signInWithEmailAndPassword(auth, "manubicche99@gmail.com", "ciaociao")
  .then(async (userCredential) => {
    const user = userCredential.user;
    const userRef = getDoc(doc(db, "utente", user.uid));
    if(userRef.exists == false){
      try {
        const docRef = await setDoc(doc(db, "utente", user.uid), {
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorCode);
    console.log(errorMessage);
  });


//ESTRAZIONE AMMONITI E CREAZIONE ENTITA'
var ammonitiMap = new Map();

const ammoniti = await getDocs(collection(db, "dettaglio"));

ammoniti.forEach((ammonite) => {
  ammonitiMap.set(ammonite.id, ammonite.data());
  createElement(ammonite);
});


function createElement(ammonite){
  const entity = document.createElement("a-box");
  //const entity = document.createElement("a-entity");
  entity.setAttribute('id', ammonite.id);
  //entity.setAttribute('gltf-model', 'url(gltf/prova5/scene.gltf)');
  //entity.setAttribute('gltf-model', 'url(glb/douvilleiceras_qh666.glb)');
  entity.setAttribute('material', "color:red")
  entity.setAttribute('gps-projected-place', {
    latitude: ammonite.data().lat,
    longitude: ammonite.data().long
  });
  entity.setAttribute('scale', {
    x: 1,
    y: 1,
    z: 1
  });
  //entity.setAttribute('look-at', '[gps-new-camera]');
  entity.onclick = function(){clickedAmm(ammonite.id)};
  document.querySelector("a-scene").appendChild(entity);
}

document.getElementById("info-box").addEventListener("click", function(){document.getElementById("info-box").style.display="none"});
//document.querySelector('#alert-popup').hinnerHTML = "Il segnale GPS non è molto accurato. Prova a metterti in un punto in cui prende meglio."

function clickedAmm(id){ 
  const distance = checkDistance(id).toFixed(2);
  if(distance && distance < 5){
    checkList(id);
    showInfoBox(id);
    
  }else  
    showMessage("L'oggetto è distante " + distance + "m, avvicinati di più", 5000);
}

/*async function getList(){
  const listRef = doc(db, "utente", auth.currentUser.uid);
  const listSnap = await getDoc(listRef);
  const list = listSnap.data().ammoniti;
  return list;
}*/

function checkDistance(id){
  const ammoniteEntity = document.getElementById(id);
  const camera = document.querySelector('a-camera');
  let cameraPositon = camera.object3D.position;
  let ammonitePosition = ammoniteEntity.object3D.position;
  let distanceToCamera = cameraPositon.distanceTo(ammonitePosition);
  return distanceToCamera;
}

async function checkList(id){
  const listRef = doc(db, "utente", auth.currentUser.uid);
  const listSnap = await getDoc(listRef);
  const list = listSnap.data().ammoniti;
  //const list = getList();
  if (list && list.includes(id)) 
    showMessage("Fa già parte della tua collezione", 5000);
  else{ 
    updateDoc(listRef, {ammoniti: arrayUnion(id)});
    showMessage("Aggiunto alla tua collezione!", 5000);
  }
}

function showMessage(text, time){
  const messagebox = document.getElementById("message");
  messagebox.innerHTML = text;
  messagebox.style.display = "block";
  setTimeout(function(){
    messagebox.style.display = "none";
  },time);
}

function showInfoBox(id){
  document.getElementById("info-box").style.display = "flex";
  getDownloadURL(ref(storage, ammonitiMap.get(id).fotofossile)).then(function(url) {
    document.querySelector('#img').src = url;})
  document.querySelector('#title-info').innerHTML = id;
  document.querySelector('#description-info').innerHTML = ammonitiMap.get(id).descrfossile;
}  