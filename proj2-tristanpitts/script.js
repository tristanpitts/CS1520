// USERNAME:
// FULL NAME:

// this makes the browser catch a LOT more runtime errors. leave it here!
"use strict";

// arr.removeItem(obj) finds and removes obj from arr.
Array.prototype.removeItem = function(item) {
	let i = this.indexOf(item);

	if(i > -1) {
		this.splice(i, 1);
		return true;
	}

	return false;
}

// gets a random int in the range [min, max) (lower bound inclusive, upper bound exclusive)
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

// ------------------------------------------------------------------------------------
// Add your code below!
// ------------------------------------------------------------------------------------

// constants for you.
const IMG_W = 120;    // width of the mosquito image
const IMG_H = 88;     // height of the mosquito image
const SCREEN_W = 640; // width of the playfield area
const SCREEN_H = 480; // height of the playfield area

// global variables. add more here as you need them.
let gameMessage
let misses = 0
let round = 1
let score = 0
let speed = 1
let left = 10
let roundOver = false //a flag for if the mosquitos should continue spawning or not
let mosquitoes = []
let records = []

// have to start it off somehow.
function startGame() {
    // add text for round, score, misses etc.
		mosquitoDisplay.innerHTML=left;
		missesDisplay.innerHTML=misses;
		scoreDisplay.innerHTML=score;
		roundDisplay.innerHTML=round
		gameMessage.innerHTML=""
		gameMessage.onclick=""
		startSpawning()
    requestAnimationFrame(gameLoop)
}

function gameLoop() {
    // 1. update the position of the mosquitoes
    // 2. update the score/misses/etc. displays
		//misses and score handling are handled in the moveMosquito function and the mosquitos onmousedown function
		moveMosquito()

    // 3. check if the user won or lost

    // this is sort of the "loop condition."
    // we call requestAnimationFrame again with gameLoop.
    // this isn't recursive; the browser will call us again
    // at some future point in time.

		//if the game should continue
    if(misses < 5 && left > 0) {
        requestAnimationFrame(gameLoop)
    }
		//if they won, set up the next round
		else if(left===0)
			nextRound();
		//if they lost show the game over screen
		else if(misses===5)
			gameOver();
}


window.onload = function() {
	// here is where you put setup code.
	// this way, we can write gameMessage.innerHTML or whatever in your code.

	//read in scores from localStorage and write them to the high score list
	for(var i = 1; i<=window.localStorage.length; i++)
	{
		records.push(parseInt(window.localStorage.getItem(i)))
		document.getElementById("highScores").innerHTML+="<li>"+records[i-1]+"</li>"
	}
	//ensure array containing scores is of size 5
	while(records.length<5)
		records.push(null)

	gameMessage = document.getElementById('gameMessage')
	document.getElementById('gameMessage').onclick=function(){startGame();}
}

// given a side (0, 1, 2, 3 = T, R, B, L), returns a 2-item array containing the x and y
// coordinates of a point off the edge of the screen on that side.
function randomPointOnSide(side) {
	switch(side) {
		/* top    */ case 0: return [getRandomInt(0, SCREEN_W - IMG_W), -IMG_H];
		/* right  */ case 1: return [SCREEN_W, getRandomInt(0, SCREEN_H - IMG_H)];
		/* bottom */ case 2: return [getRandomInt(0, SCREEN_W - IMG_W), SCREEN_H];
		/* left   */ case 3: return [-IMG_W, getRandomInt(0, SCREEN_H - IMG_H)];
	}
}

// returns a 4-item array containing the x, y, x direction, and y direction of a mosquito.
// use it like:
// let [x, y, vx, vy] = pickPointAndVector()
// then you can multiply vx and vy by some number to change the speed.
function pickPointAndVector() {
	let side = getRandomInt(0, 4);                    // pick a side...
	let [x, y] = randomPointOnSide(side);             // pick where to place it...
	let [tx, ty] = randomPointOnSide((side + 2) % 4); // pick a point on the opposite side...
	let [dx, dy] = [tx - x, ty - y];                  // find the vector to that other point...
	let mag = Math.hypot(dx, dy);                     // and normalize it.
	let [vx, vy] = [(dx / mag), (dy / mag)];
	return [x, y, vx, vy];
}

function startSpawning() {
    // 1000 ms (1 second) from now, spawnMosquito() will be called.
    window.setTimeout(spawnMosquito, 1000)
}

function spawnMosquito() {
    // this is a "destructuring assignment."
    // it makes 4 local variables by extracting elements of the array that was returned.
    let [x, y, vx, vy] = pickPointAndVector()
    //console.log("spawning a mosquito at " + x + ", " + y + " (remove this log statement)")
    // now to actually make an object/DOM element
		var mosquito = new Mosquito(x, y, vx, vy);

		mosquitoes.push(mosquito)

    if(roundOver===false) {
        // spawn another one a second from now
        window.setTimeout(spawnMosquito, 1000)
    }

}

function Mosquito(x, y, vx, vy) {
	this.x=x;
	this.y=y;
	this.vx=vx;
	this.vy=vy;

	//add members to mosquito object
	var temp = document.createElement('img')
	temp.src='mosquito.png'
	temp.style.position = 'absolute'
	temp.style.left = this.x + 'px'
	temp.style.top = this.y + 'px'
	this.img=temp
	this.removable=false //this is a flag so mosquitos cant be deleted when they spawn since they spawn out of bounds
	temp.parent=this
	document.getElementById('playfield').appendChild(temp)

	this.img.onmousedown= function(event)
	{
		//remove mosquito from DOM and from array when it is clicked
		this.parentNode.removeChild(this);
		mosquitoes.removeItem(this.parent);
		left--;
		mosquitoDisplay.innerHTML=left;
		score+=100
		scoreDisplay.innerHTML=score;
		event.stopPropagation()
	}

	return this;
}

function moveMosquito() {
		for (var m of mosquitoes)
		{
		 m.x+=(m.vx * speed);
		 m.y+=(m.vy * speed);
		 m.img.style.left=m.x + 'px'
		 m.img.style.top=m.y + 'px'

		 //checks to see if the mosquito is far enough in bounds
		 //before it is able to be removed
		 if(m.x > 0 && m.y > 0 && m.x < SCREEN_W && m.y < SCREEN_H)
		 	m.removable=true

			//if the mosquito has gone off the screen, remove it and
			//increment misses
		 if(((m.x > SCREEN_W || m.x < 0) || (m.y > SCREEN_H || m.y < 0)) && m.removable)
		 {
			m.img.parentNode.removeChild(m.img);
	 		mosquitoes.removeItem(m);
	 		misses++;
	 		missesDisplay.innerHTML=misses;
		 }

		}

}

function nextRound() {
	roundOver=true
	score+=(1000-(250*misses))
	scoreDisplay.innerHTML=score; //add bonus to score
	var temp=1000-(250*misses)
	round++;
	left=10;
	misses=0;
	speed*=1.5 //up difficulty
	//clear array of existing mosquitos and also remove them from the DOM
	for(var m of mosquitoes)
		m.img.parentNode.removeChild(m.img)
		mosquitoes.removeItem(m)
	mosquitoes=[]
	gameMessage.innerHTML="Round Over! <br> Bonus: " + temp + "<br>Click to start round " + round + "!"
	gameMessage.onclick=function(){roundOver=false; startGame();}

}

function gameOver() {
	roundOver=true
	gameMessage.innerHTML="Game Over! Click to try again"
	for(var m of mosquitoes)
		m.img.parentNode.removeChild(m.img)
		mosquitoes.removeItem(m)
	mosquitoes=[]
	gameMessage.onclick=function(){score=0; round=1; misses=0; left=10; roundOver=false; speed=3; startGame()}
	highScores()
}

function highScores(){
	gameMessage.innerHTML+="<br>New High Score!"
	//if the current score is either greater than an existing high score
	//or the high score table is not full, add the score to its
	//appropriate spot in localStorage and on the high score table
	for(var i = 0; i<records.length||records.length<5;i++)
	{
		if(score >= records[i] || records[i]==null)
		{
			records.splice(i,0,score)
			records.length=5
			document.getElementById("highScores").innerHTML=""
			for(var j = 0; j<records.length;j++ in records)
				if(records[j]!=null)
				{
					document.getElementById("highScores").innerHTML+="<li>"+records[j]+"</li>"
					window.localStorage.setItem(""+(j+1), ""+records[j])
				}
			break
		}
	}

}
