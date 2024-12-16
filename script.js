//кнопки
const gameBtn = document.getElementById("gameBtn");
let points = 1000;
let USERNAME;
let game_id;
//Слушатели собтий

gameBtn.addEventListener("click", startOrStopGame);
document
  .querySelector("#loginWrapper form")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    auth();
  });

[...document.getElementsByClassName("point")].forEach((elem) => {
  elem.addEventListener("click", addPoint);
});

function addPoint(event) {
  let target = event.target;
  point = +target.innerHTML;
  const activeBtn = document.querySelector(".point.active");
  activeBtn.classList.remove("active");

  target.classList.add("active");
}

function startOrStopGame() {
  if (gameBtn.innerHTML == "ИГРАТЬ") {
    //начать игру
    gameBtn.innerHTML = "ЗАВЕРШИТЬ ИГРУ";
    gameBtn.style.backgroundColor = "red";
    startGame();
  } else {
    //ЗАВЕРШИТЬ ИГРУ
    gameBtn.innerHTML = "ИГРАТЬ";
    gameBtn.style.backgroundColor = "#66a663";
    stopGame();
  }
}

async function startGame() {
  console.log(points);
  let response = await sendRequest("new_game", "POST", {
    username: USERNAME,
    points,
  });
  if (response.error) {
    //есть ошибка
    gameBtn.innerHTML = "ИГРАТЬ";
    alert(response.message);
  } else {
    game_id = response.game_id;
    updateUSerBalance();
    activeArea();
  }
}

async function stopGame() {
  let response = await sendRequest("stop_game", "POST", {
    username: USERNAME,
    game_id,
  });
  if (response.error) {
    //есть ошибка
    gameBtn.innerHTML = "ЗАВЕРШИТЬ ИГРУ";
    alert(response.message);
  } else {
    updateUSerBalance();
    activeArea();
  }
}

function activeArea() {
  const field = document.getElementsByClassName("field");
  for (let i = 0; i < field.length; i++) {
    field[i].addEventListener("contextmenu", setFlag);
    setTimeout(() => {
      field[i].classList.add("active");
    }, 20 * i);
    let row = Math.trunc(i / 10);
    let column = i - row * 10;
    field[i].setAttribute("data-row", row);
    field[i].setAttribute("data-column", column);
    field[i].addEventListener("click",makeStep)
  }
}

async function makeStep(event) {
  let target = event.target;
  let row = +target.getAttribute("data-row");
  let column = +target.getAttribute("data-column");

  try {
    let response = await sendRequest("game_step", "POST", {
      game_id,
      row,
      column,
    });
    console.log(response);
    updateArea(response.table);
    if (response.error) {
      alert(response.message);
    } else {
      if (response.status == "Ok") {

      } else if (response.status == "Failed") {
        alert("вы проиграли")
        gameBtn.innerHTML= "ИГРАТЬ"
        gameBtn.style.backgroundColor = "#66a663"
        setTimeout(()=>resetField(),2000)
      } else if (response.status == "Won") {
        alert("Вы выйграли")
        updateUSerBalance()
      }
    }
  } catch (error) {
    console.error(`неправилний данные ${error}`);
  }
}

function updateArea(table){
  let fields = document.querySelectorAll(".field")
  let a = 0  
  for(let i = 0; i<table.length; i++ ){
    let row = table[i]
    for(let j = 0; j < row.length; j ++){
      let cell = row[j]
      let value = fields[a]
      if(cell==""){

      }
      else if(cell ==0){
         value.classList.remove("active")
      }
      else if (cell == "BOMB"){
        value.classList.remove("active")
        value.classList.add("bomb")
      }
      else if (cell>0){
         value.classList.remove("active")
         value.innerHTML = cell
      }
      a++
    }
  }
}

function setFlag(event) {
  event.preventDefault();
  let target = event.target;
  target.classList.toggle("flag");
}

function resetField() {
  const gameField = document.querySelector(".gameField");
  gameField.innerHTML = "";
  for (let i = 0; i < 80; i++) {
    let cell = document.createElement("div");
    cell.classList.add("field");
    gameField.appendChild(cell);
  }
}
resetField();

async function auth() {
  const loginWrapper = document.getElementById("loginWrapper");
  const login = document.getElementById("login").value;
  let response = await sendRequest("user", "GET", {
    username: login,
  });
  if (response.error) {
    //ползаватель не зарегистривовался
    let registration = await sendRequest("user", "POST", { username: login });
    if (registration.error) {
      alert(registration.message);
    } else {
      USERNAME = login;
      loginWrapper.style.display = "none";
      updateUSerBalance();
    }
    loginWrapper.style.display = "none";
    console.log(registration);
  } else {
    USERNAME = login;
    loginWrapper.style.display = "none";
    updateUSerBalance();
  }
}

async function updateUSerBalance() {
  let response = await sendRequest("user", "GET", {
    username: USERNAME,
  });

  if (response.error) {
    //если есть ошибка
    alert(response.message);
  } else {
    const user = document.querySelector("header span");
    user.innerHTML = `пользователь ${response.username} c балансом ${response.balance}`;
  }
  console.log(response);
}


async function sendRequest(url, method, data) {
  url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;

  if (method == "POST") {
    let response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    response = await response.json();
    return response;
  } else if (method == "GET") {
    url = url + "?" + new URLSearchParams(data);
    let response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    response = await response.json();
    return response;
  }
}
