function Learn() {
	this.testButton = document.getElementById("test-button");
	this.trainButton = document.getElementById("train-button");
	this.testCardRow = document.getElementById("test-cards-row");
	this.trainCardRow = document.getElementById("train-cards-row");
	this.trainJpCard = document.getElementById("train-jp-card");
	this.trainRomCardCol = document.getElementById("train-rom-cards");
	this.testTime = document.getElementById("test-time");
	this.testResult = document.getElementById("test-result");
	this.testStartTime = null;
	this.testTimeInverval = null;
}
Learn.prototype.test = function() {
	this.testCardRow.classList.remove("is-hidden");
	this.trainCardRow.classList.add("is-hidden");
	this.testTime.classList.remove("is-hidden");
	this.testStartTime = Date.now();
	this.testTimeInverval = setInterval(() => this.testTimeTick());

	let characters = this.getLearnSet("test");
	this.populateTestDom(characters);
};
Learn.prototype.testTimeTick = function() {
	let diff = Date.now() - this.testStartTime;
	let millis = diff % 1000;
	diff /= 1000;
	let minutes = Math.floor(diff / 60);
	let seconds = Math.floor(diff % 60);

	this.testTime.innerText = (minutes ? minutes + ":" : "") + seconds + "." + millis;
};
Learn.prototype.train = function() {
	this.trainCardRow.classList.remove("is-hidden");
	this.testCardRow.classList.add("is-hidden");

	let picked = this.pick(4);
	let correct = Math.floor(Math.random() * picked.length);
	this.populateTrainDom(picked, correct);
};
Learn.prototype.pick = function(amount) {
	let characters = this.getLearnSet("train");
	let result = [];
	let picked = {};
	while(result.length !== amount) {
		let idx = Math.floor(Math.random() * characters.length);
		if(!picked[idx]) {
			picked[idx] = true;
			result.push(characters[idx]);
		}
	}
	return result;
};
Learn.prototype.populateTrainDom = function(characters, correct) {
	this.trainJpCard.innerText = characters[correct].jp;

	this.clearChildren(this.trainRomCardCol);
	for(let i = 0; i < characters.length; i++) {
		let div = document.createElement("div");
		div.className = "card rom selectable";
		div.className += i === correct ? " train-correct" : "";
		div.innerText = characters[i].rom;
		div.onclick = (e) => this.onTrainCardClick(e);
		this.trainRomCardCol.appendChild(div);
	}
};
Learn.prototype.onTrainCardClick = function(e) {
	if(e.target.classList.contains("train-correct")) {
		if(e.target.classList.contains("correct")) {
			this.train();
		} else {
			e.target.classList.add("correct");
		}
	} else {
		e.target.classList.add("incorrect");
		e.target.classList.remove("selectable");
	}
};
Learn.prototype.populateTestDom = function(characters) {
	this.clearChildren(this.testCardRow);

	let domElems = [];
	for(let i = 0; i < characters.length; i++) {
		let colRom = document.createElement("div");
		colRom.className = "col-1";
		let cardRom = document.createElement("div");
		cardRom.className = "card selectable";
		cardRom.innerText = characters[i].rom;
		cardRom.dataset.idx = i;
		cardRom.dataset.lang = "rom";
		cardRom.onclick = (e) => this.onTestCardClick(e);
		colRom.appendChild(cardRom);

		let colJp = document.createElement("div");
		colJp.className = "col-1";
		let cardJp = document.createElement("div");
		cardJp.className = "card selectable";
		cardJp.innerText = characters[i].jp;
		cardJp.dataset.idx = i;
		cardJp.dataset.lang = "jp";
		cardJp.onclick = (e) => this.onTestCardClick(e);
		colJp.appendChild(cardJp);

		domElems.push(colRom);
		domElems.push(colJp);
	}

	domElems = this.shuffle(domElems);
	
	let jpOnly = [];
	let romOnly = [];
	for(let i = 0; i < domElems.length; i++) {
		let card = domElems[i].getElementsByClassName("card")[0];
		if(card.dataset.lang === "jp") {
			jpOnly.push(domElems[i]);
		} else {
			romOnly.push(domElems[i]);
		}
	}
	romOnly.sort((a,b) => {
		a = a.innerText.trim();
		b = b.innerText.trim();
		return a.localeCompare(b);
	});
	let output = [];
	while(output.length !== domElems.length) {
		output = output.concat(jpOnly.splice(0, 6));
		output = output.concat(romOnly.splice(0, 6));
	}
	domElems = output;

	for(let i = 0; i < domElems.length; i++) {
		this.testCardRow.appendChild(domElems[i]);
	}
};
Learn.prototype.shuffle = function(array) {
	let output = [];
	while(array.length > 0) {
		let idx = Math.floor(Math.random() * array.length);
		output.push(array.splice(idx, 1)[0]);
	}
	return output;
};
Learn.prototype.onTestCardClick = function(e) {
	//Find opposing card
	let idx = e.target.dataset.idx;
	let currentlySelected = this.testCardRow.querySelectorAll("div.selected")[0];
	if(currentlySelected === e.target) {
		//deselect
		currentlySelected.classList.remove("selected");
	} else if(currentlySelected) {
		let currentlySelectedIdx = currentlySelected.dataset.idx;
		if(idx === currentlySelectedIdx) {
			currentlySelected.classList.remove("selected");
			currentlySelected.classList.add("flip");
			e.target.classList.add("flip");
			//Check if all done
			let flipped = this.testCardRow.querySelectorAll("div.flip").length;
			let total = this.testCardRow.querySelectorAll("div.selectable").length;

			if(flipped === total) {
				this.testTime.classList.add("is-hidden");
				this.testResult.classList.remove("is-hidden");
				this.testResult.innerText = this.testTime.innerText;
				this.testCardRow.classList.add("is-hidden");
			}
		}
	} else {
		e.target.classList.add("selected");
	}
};
Learn.prototype.getLearnSet = function(type) {
	let alphabet = window.settings.alphabet === "hiragana" ? window.HIRAGANA : window.KATAKANA;
	let characters = [];
	if(window.settings[type].monographs) {
		characters = characters.concat(alphabet.monographs);
	}
	if(window.settings[type].diacritics) {
		characters = characters.concat(alphabet.diacritics);
	}
	if(window.settings[type].digraphs) {
		characters = characters.concat(alphabet.digraphs);
	}
	if(window.settings[type].digraphsDiacritics) {
		characters = characters.concat(alphabet.digraphsDiacritics);
	}
	return characters;
}
Learn.prototype.clearChildren = function(elem) {
	while(elem.firstChild) {
		elem.removeChild(elem.firstChild);
	}
};