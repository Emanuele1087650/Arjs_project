import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where, updateDoc, arrayUnion, setDoc} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

/*const firebaseConfig = {
  apiKey: "AIzaSyBTn8yaWiFggoX7mvNoYjUy6aG0HQIodzc",
  authDomain: "prova-laravel-cddd4.firebaseapp.com",
  databaseURL: "https://prova-laravel-cddd4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "prova-laravel-cddd4",
  storageBucket: "prova-laravel-cddd4.appspot.com",
  messagingSenderId: "10342820008",
  appId: "1:10342820008:web:5973196662f4910bbf7a9d"
};*/

const firebaseConfig = {
  apiKey: "AIzaSyAdRCwgQEkShwLFWx8lkJ0AffDlchwgN1I",
  authDomain: "ammoniti-di-strada.firebaseapp.com",
  projectId: "ammoniti-di-strada",
  storageBucket: "ammoniti-di-strada.appspot.com",
  messagingSenderId: "163593434920",
  appId: "1:163593434920:web:d58241746bea65c310c21d",
  measurementId: "G-CLYR7V8DLH"
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
signInWithEmailAndPassword(auth, "biccheriemanuele@gmail.com", "biccheri")
  .then(async (userCredential) => {
    const user = userCredential.user;
    const userRef = await getDoc(doc(db, "webApp", user.uid));
    if(!userRef.exists()){
      try {
        const docRef = await setDoc(doc(db, "webApp", user.uid), {
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

async function createElement(ammonite){
  //const entity = document.createElement("a-box");
  //entity.setAttribute("material", "color:red");
  const entity = document.createElement("a-entity");
  entity.setAttribute('id', ammonite.id);
  entity.setAttribute('gltf-model', 'url(gltf/ammonite2/scene.gltf)');
  //AGGIUNTA PER ZONE
  const zonaRef = await getDoc(doc(db, "zone", ammonite.data().zona));
  entity.setAttribute('gps-projected-entity-place', {
    latitude: zonaRef.data().lat,
    longitude: zonaRef.data().long
  });
  //FINE
  /*entity.setAttribute('gps-projected-entity-place', {
    latitude: ammonite.data().lat,
    longitude: ammonite.data().long
  });*/
  entity.setAttribute('scale', {
    x: 3,
    y: 3,
    z: 3
  });
  //entity.setAttribute('look-at', '[gps-new-camera]');
  entity.onclick = function(){clickedAmm(ammonite.id)};
  if(document.getElementById("alert-popup") !== null){entity.setAttribute("visible", false)};
  document.querySelector("a-scene").appendChild(entity);
}

document.getElementById("info-box").addEventListener("click", function(){document.getElementById("info-box").style.display="none"});
document.getElementById("listButton").addEventListener("click", function(){createList(); document.getElementById("lista_raccolta").style.display="block";});
document.getElementById("closeList").addEventListener("click", function(){removeList(); document.getElementById("lista_raccolta").style.display="none";});

document.addEventListener("DOMNodeInserted", function(e){
  if(e.target.id == "alert-popup"){
    const entities = document.querySelectorAll("a-entity");
    entities.forEach(element=>{
      element.setAttribute("visible", false);
    });
  };
});

document.addEventListener("DOMNodeRemoved", function(e){
  if(e.target.id == "alert-popup"){
    const entities = document.querySelectorAll("a-entity");
    entities.forEach(element=>{
      element.setAttribute("visible", true);
    });
  };
});

async function createList(){
  const listRef = doc(db, "webApp", auth.currentUser.uid);
  const listSnap = await getDoc(listRef);
  const list = listSnap.data().ammoniti;
  list.forEach(element => {
    const entity = document.createElement("li");
    entity.innerHTML=element;
    document.querySelector("ul").appendChild(entity);
  });  
}

function removeList(){
  document.querySelector("ul").innerHTML="";
}

function clickedAmm(id){ 
  const distance = checkDistance(id).toFixed(2);
  if(distance && distance < 5){
    checkList(id);
    showInfoBox(id); 
  }else  
    showMessage("L'oggetto è distante " + distance + "m, avvicinati di più", 5000);
}

function checkDistance(id){
  const ammoniteEntity = document.getElementById(id);
  const camera = document.querySelector('a-camera');
  let cameraPositon = camera.object3D.position;
  let ammonitePosition = ammoniteEntity.object3D.position;
  let distanceToCamera = cameraPositon.distanceTo(ammonitePosition);
  return distanceToCamera;
}

async function checkList(id){
  const listRef = doc(db, "webApp", auth.currentUser.uid);
  const listSnap = await getDoc(listRef);
  const list = listSnap.data().ammoniti;
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