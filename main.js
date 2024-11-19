const BTN_UPDATE_MS = 1500;
const REM_CANVAS_FONT = 1;

let tableReports = [];
let addedFiles = [];

function rempx(vrem) {
	return Math.ceil(vrem*parseInt(window.getComputedStyle(document.body).getPropertyValue('font-size')));
}

function findMinMax(arr, name) {
	const MIN = 0;
	const MAX = 1;
	let out = [arr[0][name], arr[0][name]];
	for (let i = 1; i < arr.length; i++) {
		let value = arr[i][name];
		if (value < out[MIN]) {
			out[MIN] = value;
		} else if (value > out[MAX]) {
			out[MAX] = value;
		}
	}
	return out;
}

function findModeStat(obj) {
	let modeCount = 0;
	let mode = null;
	for (let [k, v] of Object.entries(obj)) {
		let n = parseFloat(k);
		if (mode === null) {
			modeCount = v;
			mode = k;
		} else if (v > modeCount) {
			modeCount = v;
			mode = k;
		}
	}
	return mode;
}

function insertTableReports(line) {
	let args = line.split(';');
	for (let i = 0; i < args.length; i++) {
		args[i] = args[i].replace('\"', '');
	}
	let entry = {};

	// 00. DATA: 01/01/1970 (DD/MM/AAAA)
	// 01. HORA: 1200 (12h00)
	// CONVERTER PARA TIMESTAMP
	let [day, month, year] = args[0].split('/');
	let timestamp = (new Date(parseInt(year), parseInt(month)-1, parseInt(day))).getTime();
	timestamp = Math.floor(timestamp/1000) + Math.floor(parseInt(args[1])*36);
	entry.date = timestamp;
	
	// 02. TEMPERATURA INSTANTE (°C)
	// 03. TEMPERATURA MÁXIMA (°C)
	// 04. TEMPERATURA MÍNIMA (°C)
	entry.temperatureInstant = parseFloat(args[2]);
	entry.temperatureMaximum = parseFloat(args[3]);
	entry.temperatureMinimum = parseFloat(args[4]);
	
	// 05. UMIDADE INSTANTE (%)
	// 06. UMIDADE MÁXIMA (%)
	// 07. UMIDADE MÍNIMA (%)
	entry.humidityInstant = parseFloat(args[5]);
	entry.humidityMaximum = parseFloat(args[6]);
	entry.humidityMinimum = parseFloat(args[7]);
	
	// 08. PONTO DE ORVALHO INSTANTE (°C)
	// 09. PONTO DE ORVALHO MÁXIMO (°C)
	// 10. PONTO DE ORVALHO MÍNIMO (°C)
	entry.dewPointInstant = parseFloat(args[8]);
	entry.dewPointMaximum = parseFloat(args[9]);
	entry.dewPointMinimum = parseFloat(args[10]);
	
	// 11. PRESSÃO INSTANTE (hPa)
	// 12. PRESSÃO MÁXIMA (hPa)
	// 13. PRESSÃO MÍNIMA (hPA)
	entry.pressureInstant = parseFloat(args[11]);
	entry.pressureMaximum = parseFloat(args[12]);
	entry.pressureMinimum = parseFloat(args[13]);
	
	// 14. VELOCIDADE VENTO (m/s)
	// 15. DIREÇÃO VENTO (°)
	// 16. RAJADA VENTO (m/s)
	entry.windSpeed = parseFloat(args[14]);
	entry.windDirection = parseFloat(args[15]);
	entry.windGust = parseFloat(args[16]);

	// 17. RADIAÇÃO (kJ/m²)
	// 18. CHUVA (mm)
	entry.radiation = parseFloat(args[17]);
	entry.rain = parseFloat(args[18]);

	tableReports.push(entry);
}

function sortTableReportsDate(a, b) {
	return a.date - b.date;
}

function onLoadInsertTableReports(ev) {
	csvSubmit.innerHTML = 'PROCESSANDO INSERÇÃO';
	let lines = ev.target.result.split('\n');
	for (let i = 1; i < lines.length; i++) {
		insertTableReports(lines[i]);
	}
	tableReports.sort(sortTableReportsDate);
	csvSubmit.innerHTML = 'SUCESSO AO INSERIR';
	setTimeout(() => { csvSubmit.innerHTML = 'INSERIR'; }, BTN_UPDATE_MS);
}

function onErrorInsertTableReports(ev) {
	csvSubmit.innerHTML = 'FALHA AO INSERIR';
	setTimeout(() => { csvSubmit.innerHTML = 'INSERIR'; }, BTN_UPDATE_MS);
}

function binarySearchTableReportsDates(value) {
	let start = 0;
	let end = tableReports.length-1;
	while (start <= end) {
		let mid = Math.floor((start+end)/2);
		if (tableReports[mid].date === value) {
			return mid;
		} else if (tableReports[mid].date < value) {
			start = mid+1;
		} else {
			end = mid-1;
		}
	}
	return null;
}

function selectTableReportsBetweenDates(dtBegin, dtEnd) {
	let result = [];
	if (dtBegin > dtEnd) {
		//console.log('dtBegin > dtEnd');
		return result;
	}
	let idxLast = tableReports.length - 1;
	//console.log('idxLast', idxLast);
	if (dtBegin > tableReports[idxLast].date) {
		//console.log('dtBegin > tableReports[idxLast].date');
		//console.log(new Date(dtBegin*1000), new Date(tableReports[idxLast].date*1000));
		return result;
	}
	let idxBegin = binarySearchTableReportsDates(dtBegin);
	if (tableReports[idxBegin] < dtBegin && dtBegin < idxLast) { idxBegin++; }
	let idxEnd = null;
	if (dtEnd > tableReports[idxLast].date) {
		idxEnd = idxLast;
	} else {
		idxEnd = binarySearchTableReportsDates(dtEnd);
	}
	for (let i = idxBegin; i <= idxEnd; i++) {
		result.push(tableReports[i]);
	}
	return result;
}

function clearCanvas(cvs, width, height) {
	if (width !== undefined) { cvs.width = width; }
	if (height !== undefined) { cvs.height = height; }
	let ctx = cvs.getContext('2d');
	ctx.font = `${rempx(REM_CANVAS_FONT)}px monospace`
	ctx.fillStyle = '#FFF';
	ctx.fillRect(0, 0, cvs.width, cvs.height);
	ctx.fillStyle = '#000';
}

let csvFile = document.querySelector('#csv-file');
let csvSubmit = document.querySelector('#csv-submit');

let canvasLinearFields = document.querySelector('#fields-canvas-linear');
let canvasHourFields = document.querySelector('#fields-canvas-hour');
let canvasMonthFields = document.querySelector('#fields-canvas-month');

let fieldsBegin = document.querySelector('#fields-begin');
let fieldsEnd = document.querySelector('#fields-end');
let fieldsSelect = document.querySelector('#fields-select');
let fieldsDraw = document.querySelector('#fields-draw');

csvSubmit.onclick = function () {
	let upFile = csvFile.files[0];
	if (upFile === undefined) {
		return;
	}
	if (addedFiles.includes(upFile.name)) {
		csvSubmit.innerHTML = 'ARQUIVO JÁ INSERIDO';
		setTimeout(() => { csvSubmit.innerHTML = 'INSERIR'; }, BTN_UPDATE_MS);
		return;
	}
	addedFiles.push(upFile.name);
	let reader = new FileReader();
	reader.readAsText(upFile, 'UTF-8');
	reader.onload = onLoadInsertTableReports;
	reader.onerror = onErrorInsertTableReports;
}

fieldsDraw.onclick = function () {
	clearCanvas(canvasLinearFields);
	let [year, month, day] = fieldsBegin.value.split('-');
	let tsBegin = new Date(parseInt(year), parseInt(month)-1, parseInt(day)).getTime();
	tsBegin = Math.floor(tsBegin/1000);
	
	[year, month, day] = fieldsEnd.value.split('-');
	let tsEnd = new Date(parseInt(year), parseInt(month)-1, parseInt(day)).getTime();
	tsEnd = Math.floor(tsEnd/1000);

	let results = selectTableReportsBetweenDates(tsBegin, tsEnd);
	if (results.length === 0) {
		return;
	}
	let fieldName = fieldsSelect.options[fieldsSelect.selectedIndex].value;

	let [min, max] = findMinMax(results, fieldName);
	const adjustedMax = max - min;
	const heightConstant = canvasLinearFields.height/adjustedMax;
	
	let fieldsPerPixel = Math.floor(results.length/canvasLinearFields.width);
	fieldsPerPixel = Math.max(1, fieldsPerPixel);
	let fieldSum = 0;
	
	let ctx = canvasLinearFields.getContext('2d');
	ctx.fillStyle = '#55F';
	let mean = 0;
	let meanCount = 0;
	let modeStat = {};
	let modeValue = null;
	for (let i = 0; i < results.length; i++) {
		let value = results[i][fieldName];
		if (isNaN(value) || isNaN(fieldSum)) {
			fieldSum = value;
		} else {
			value -= min;
			fieldSum += value/fieldsPerPixel;
			mean += value;
			meanCount++;
			if (modeStat[String(value)] === undefined) {
				modeStat[String(value)] = 1;
			} else {
				modeStat[String(value)] = modeStat[String(value)] + 1;
			}
		}
		if (i % fieldsPerPixel === 0) {
			let col = Math.floor(i/fieldsPerPixel);
			if (isNaN(fieldSum)) {
				ctx.fillStyle = '#FBB';
				ctx.fillRect(col, 0, 1, canvasLinearFields.height);
				ctx.fillStyle = '#55F';
			} else {
				fieldSum = Math.floor(fieldSum);
				let height = canvasLinearFields.height-Math.floor(fieldSum*heightConstant);
				ctx.fillRect(col, height, 1, canvasLinearFields.height);
			}
			fieldSum = 0;
		}
	}
	ctx.fillStyle = '#000';
	ctx.fillText(
		`MAX: ${max} COUNT: ${results.length} MIN: ${min}`,
		0,
		canvasLinearFields.height-rempx(REM_CANVAS_FONT)
	);
	modeValue = findModeStat(modeStat);
	ctx.fillText(
		`MEAN: ${mean/Math.max(1, meanCount)}`,
		0,
		canvasLinearFields.height-4*rempx(REM_CANVAS_FONT)
	);
	ctx.fillText(
		`MEDIAN: ${results[Math.floor(results.length/2)][fieldName]}`,
		0, 
		canvasLinearFields.height-3*rempx(REM_CANVAS_FONT)
	);
	ctx.fillText(
		`MODE: ${modeValue} (${modeStat[modeValue]})`,
		0, canvasLinearFields.height-2*rempx(REM_CANVAS_FONT)
	);

	mean = 0;
	meanCount = 0;
	modeStat = {};
	modeValue = null;
	clearCanvas(canvasHourFields);
	ctx = canvasHourFields.getContext('2d');
	let hourStack = [];
	for (let i = 0; i < 24; i++) { hourStack.push({'count':0,'sum':0}); }
	for (let i = 0; i < results.length; i++) {
		let ct = Math.floor((results[i].date%86400)/3600);
		let value = results[i][fieldName];
		if (!isNaN(value)) {
			hourStack[ct].sum = hourStack[ct].sum + value;
			hourStack[ct].count = hourStack[ct].count + 1;
			mean += value;
			meanCount++;
			if (modeStat[String(value)] === undefined) {
				modeStat[String(value)] = 1;
			} else {
				modeStat[String(value)] = modeStat[String(value)] + 1;
			}
		}
	}
	for (let i = 0; i < 24; i++) {
		if (i % 2 === 0) {
			ctx.fillStyle = '#0A0';
		} else {
			ctx.fillStyle = '#5F5';
		}
		let h = hourStack[i].sum / hourStack[i].count;
		h = canvasHourFields.height - Math.floor((h-min)*heightConstant);
		let x = i*2*rempx(REM_CANVAS_FONT);
		ctx.fillRect(x, h, 2*rempx(REM_CANVAS_FONT)-1, canvasHourFields.height);
		ctx.fillStyle = '#000';
		ctx.fillText(i, x, canvasHourFields.height-1);
	}
	ctx.fillStyle = '#000';
	ctx.fillText(
		`MAX: ${max} COUNT: ${results.length} MIN: ${min}`,
		0,
		canvasHourFields.height-rempx(REM_CANVAS_FONT)
	);
	modeValue = findModeStat(modeStat);
	ctx.fillText(
		`MEAN: ${mean/Math.max(1, meanCount)}`,
		0,
		canvasLinearFields.height-4*rempx(REM_CANVAS_FONT)
	);
	ctx.fillText(
		`MEDIAN: ${results[Math.floor(results.length/2)][fieldName]}`,
		0, 
		canvasLinearFields.height-3*rempx(REM_CANVAS_FONT)
	);
	ctx.fillText(
		`MODE: ${modeValue} (${modeStat[modeValue]})`,
		0, canvasLinearFields.height-2*rempx(REM_CANVAS_FONT)
	)

	mean = 0;
	meanCount = 0;
	modeStat = {};
	modeValue = null;
	clearCanvas(canvasMonthFields);
	ctx = canvasMonthFields.getContext('2d');
	let monthStack = [];
	for (let i = 0; i < 12; i++) { hourStack.push({'count':0,'sum':0}); }
	for (let i = 0; i < results.length; i++) {
		let ct = new Date(results[i].date*1000).getMonth();
		let value = results[i][fieldName];
		if (!isNaN(value)) {
			hourStack[ct].sum = hourStack[ct].sum + value;
			hourStack[ct].count = hourStack[ct].count + 1;
			mean += value;
			meanCount++;
			if (modeStat[String(value)] === undefined) {
				modeStat[String(value)] = 1;
			} else {
				modeStat[String(value)] = modeStat[String(value)] + 1;
			}
		}
	}
	for (let i = 0; i < 12; i++) {
		if (i % 2 === 0) {
			ctx.fillStyle = '#A0A';
		} else {
			ctx.fillStyle = '#F5F';
		}
		let h = hourStack[i].sum / hourStack[i].count;
		h = canvasMonthFields.height - Math.floor((h-min)*heightConstant);
		let x = i*2*rempx(REM_CANVAS_FONT);
		ctx.fillRect(x, h, 2*rempx(REM_CANVAS_FONT)-1, canvasMonthFields.height);
		ctx.fillStyle = '#000';
		ctx.fillText(i+1, x, canvasMonthFields.height-1);
	}
	ctx.fillStyle = '#000';
	ctx.fillText(
		`MAX: ${max} COUNT: ${results.length} MIN: ${min}`,
		0,
		canvasHourFields.height-rempx(REM_CANVAS_FONT)
	);
	modeValue = findModeStat(modeStat);
	ctx.fillText(
		`MEAN: ${mean/Math.max(1, meanCount)}`,
		0,
		canvasLinearFields.height-4*rempx(REM_CANVAS_FONT)
	);
	ctx.fillText(
		`MEDIAN: ${results[Math.floor(results.length/2)][fieldName]}`,
		0, 
		canvasLinearFields.height-3*rempx(REM_CANVAS_FONT)
	);
	ctx.fillText(
		`MODE: ${modeValue} (${modeStat[modeValue]})`,
		0, canvasLinearFields.height-2*rempx(REM_CANVAS_FONT)
	)
}

clearCanvas(canvasLinearFields, rempx(REM_CANVAS_FONT)*48, 512);
clearCanvas(canvasHourFields, rempx(REM_CANVAS_FONT)*48, 512);
clearCanvas(canvasMonthFields, rempx(REM_CANVAS_FONT)*24, 512);