const BTN_UPDATE_MS = 250;
const REM_CANVAS_FONT = 1;
const CANVAS_HEIGHT = 512;
const TBL_ROWS = 10;

let csvFile = document.querySelector('#csv-file');
let csvStation = document.querySelector('#csv-station');
let csvSubmit = document.querySelector('#csv-submit');

let canvasLinearFields = document.querySelector('#fields-canvas-linear');
let canvasHourFields = document.querySelector('#fields-canvas-hour');
let canvasMonthFields = document.querySelector('#fields-canvas-month');

let fieldsBegin = document.querySelector('#fields-begin');
let fieldsEnd = document.querySelector('#fields-end');
let fieldsRange = document.querySelector('#fields-range');
let fieldsStation = document.querySelector('#fields-station');
let fieldsSelect = document.querySelector('#fields-select');
let fieldsDraw = document.querySelector('#fields-draw');

let tblRoot = document.querySelector('#tbl-root');
let tblHead = document.querySelector('#tbl-head');
let tblPage = document.querySelector('#tbl-page')
let tblUpdate = document.querySelector('#tbl-update');

let db = null;

initSqlJs({locateFile:file=>`https://sql.js.org/dist/${file}`}).then((SQL) => {
	db = new SQL.Database();
	db.run(`
		DROP TABLE IF EXISTS weather;
		CREATE TABLE weather (
			date INTEGER,
			station VARCHAR(5),
			temperatureInstant FLOAT, temperatureMaximum FLOAT, temperatureMinimum FLOAT,
			humidityInstant FLOAT, humidityMaximum FLOAT, humidityMinimum FLOAT,
			dewPointInstant FLOAT, dewPointMaximum FLOAT, dewPointMinimum FLOAT,
			pressureInstant FLOAT, pressureMaximum FLOAT, pressureMinimum FLOAT,
			windSpeed FLOAT, windDirection FLOAT, windGust FLOAT,
			radiation FLOAT,
			rain FLOAT,
			PRIMARY KEY (date, station)
		);
	`);
});

let dbWait = setInterval(() => {
	if (db !== null) {
		clearInterval(dbWait);
		document.querySelector('#db-status').innerHTML = '::: BANCO DE DADOS PRONTO'
		return;
	}
}, 100);

let tableColumns = [
	'date',
	'station',
	'temperatureInstant', 'temperatureMaximum', 'temperatureMinimum',
	'humidityInstant', 'humidityMaximum', 'humidityMinimum',
	'dewPointInstant', 'dewPointMaximum', 'dewPointMinimum',
	'pressureInstant', 'pressureMaximum', 'pressureMinimum',
	'windSpeed', 'windDirection', 'windGust',
	'radiation',
	'rain'
]

for (let i = 0; i < TBL_ROWS; i++) {
	let row = document.createElement('tr');
	for (let j = 0; j < tableColumns.length; j++) {
		let col = document.createElement('th');
		col.value = tableColumns[i];
		col.innerHTML = '.';
		row.appendChild(col);
	}
	tblRoot.appendChild(row);
}

function updatePageTable() {
	let res = db.exec(`
		SELECT * FROM weather
		ORDER BY date ASC
		LIMIT ${(tblPage.value-1)*TBL_ROWS}, ${TBL_ROWS};
	`);
	for (let i = 0; i < TBL_ROWS; i++) {
		let row = res[0].values[i];
		if (typeof row === 'undefined') {
			for (let j = 0; j < tableColumns.length; j++) {
				tblRoot.children[i+1].children[j].innerHTML = '.';
			}
			continue;
		} else {
			tblRoot.children[i+1].children[0].innerHTML = timestampToDatetime(row[0]);
		}
		for (let j = 1; j < row.length; j++) {
			if (row[j] === null) {
				tblRoot.children[i+1].children[j].innerHTML = '.';
			} else {
				tblRoot.children[i+1].children[j].innerHTML = row[j];
			}
		}
	}
}

function updatePageTableNewRows() {
	let res = db.exec(`
		SELECT COUNT(date) FROM weather
	`);
	let count = res[0].values[0][0];
	let maxPages = Math.ceil(count/TBL_ROWS);
	if (tblPage.value > maxPages) {
		tblPage.value = maxPages;
	}
	tblPage.setAttribute('max', String(maxPages));
	tblUpdate.innerHTML = `AVANÇAR (MÁX. ${maxPages})`;
	updatePageTable();
}

function rempx(rem_value) {
	return Math.ceil(rem_value*parseInt(window.getComputedStyle(document.body).getPropertyValue('font-size')));
}

function insertTableReports_csv(line) {
	let args = line.replaceAll('\"', '').split(';');
	for (let i = 0; i < args.length; i++) {
		args[i] = args[i].replace(',', '.');
	}
	let col = {};

	// 00. DATA: 01/01/1970 (DD/MM/AAAA)
	// 01. HORA: 1200 (12h00)
	// CONVERTER PARA TIMESTAMP
	let [day, month, year] = args[0].split('/');
	let timestamp = (new Date(parseInt(year), parseInt(month)-1, parseInt(day))).getTime();
	timestamp = Math.floor(timestamp/1000) + Math.floor(parseInt(args[1])*36);
	col.date = timestamp;

	for (let i = 2; i <= 18; i++) {
		args[i] = parseFloat(args[i]);
		if (isNaN(args[i])) { args[i] = null; }
	}
	
	// 02. TEMPERATURA INSTANTE (°C)
	// 03. TEMPERATURA MÁXIMA (°C)
	// 04. TEMPERATURA MÍNIMA (°C)
	col.temperatureInstant = args[2];
	col.temperatureMaximum = args[3];
	col.temperatureMinimum = args[4];
	
	// 05. UMIDADE INSTANTE (%)
	// 06. UMIDADE MÁXIMA (%)
	// 07. UMIDADE MÍNIMA (%)
	col.humidityInstant = args[5];
	col.humidityMaximum = args[6];
	col.humidityMinimum = args[7];
	
	// 08. PONTO DE ORVALHO INSTANTE (°C)
	// 09. PONTO DE ORVALHO MÁXIMO (°C)
	// 10. PONTO DE ORVALHO MÍNIMO (°C)
	col.dewPointInstant = args[8];
	col.dewPointMaximum = args[9];
	col.dewPointMinimum = args[10];
	
	// 11. PRESSÃO INSTANTE (hPa)
	// 12. PRESSÃO MÁXIMA (hPa)
	// 13. PRESSÃO MÍNIMA (hPA)
	col.pressureInstant = args[11];
	col.pressureMaximum = args[12];
	col.pressureMinimum = args[13];
	
	// 14. VELOCIDADE VENTO (m/s)
	// 15. DIREÇÃO VENTO (°)
	// 16. RAJADA VENTO (m/s)
	col.windSpeed = args[14];
	col.windDirection = args[15];
	col.windGust = args[16];

	// 17. RADIAÇÃO (kJ/m²)
	// 18. CHUVA (mm)
	col.radiation = args[17];
	col.rain = args[18];

	col.station = csvStation.options[csvStation.selectedIndex].value;

	db.exec(`INSERT INTO weather (
		date, station,
		temperatureInstant, temperatureMaximum, temperatureMinimum,
		humidityInstant, humidityMaximum, humidityMinimum,
		dewPointInstant, dewPointMaximum, dewPointMinimum,
		pressureInstant, pressureMaximum, pressureMinimum,
		windSpeed, windDirection, windGust,
		radiation,
		rain
	) VALUES (
		${col.date}, "${col.station}",
		${col.temperatureInstant}, ${col.temperatureMaximum}, ${col.temperatureMinimum},
		${col.humidityInstant}, ${col.humidityMaximum}, ${col.humidityMinimum},
		${col.dewPointInstant}, ${col.dewPointMaximum}, ${col.dewPointMinimum},
		${col.pressureInstant}, ${col.pressureMaximum}, ${col.pressureMinimum},
		${col.windSpeed}, ${col.windDirection}, ${col.windGust},
		${col.radiation},	
		${col.rain}
	);`);
}

function findMinMaxArray(arr) {
	return [Math.min(...arr), Math.max(...arr)];
}

function onLoadInsertTableReports(ev) {
	csvSubmit.innerHTML = 'PROCESSANDO INSERÇÃO';
	let lines = ev.target.result.split('\n');
	for (let i = 1; i < lines.length; i++) {
		insertTableReports_csv(lines[i]);
	}
	csvSubmit.innerHTML = 'SUCESSO AO INSERIR';
	let res = db.exec(`
		SELECT MIN(date), MAX(date) FROM weather;
	`);
	let minDate = res[0].values[0][0];
	let maxDate = res[0].values[0][1];
	setDateTimestamp(fieldsBegin, minDate);
	setDateTimestamp(fieldsEnd, maxDate);
	updatePageTableNewRows();
	setTimeout(() => { csvSubmit.innerHTML = 'INSERIR'; }, BTN_UPDATE_MS);
}

function onErrorInsertTableReports(ev) {
	csvSubmit.innerHTML = 'FALHA AO INSERIR';
	setTimeout(() => { csvSubmit.innerHTML = 'INSERIR'; }, BTN_UPDATE_MS);
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

function getDateTimestamp(field) {
	let [year, month, day] = field.value.split('-');
	let ts = new Date(parseInt(year), parseInt(month)-1, parseInt(day)).getTime();
	return Math.floor(ts/1000);
}

function setDateTimestamp(field, val) {
	let objDate = new Date(val*1000);

	// let d = String(Math.max(1, objDate.getDay()));
	// if (d.length < 2) { d = '0' + d; }

	// let m = String(Math.max(1, objDate.getMonth()+1));
	// if (m.length < 2) { m = '0' + m; }
	
	// let y = String(objDate.getFullYear());
	// for (let i = 0; i < (4-y.length); i++) { y = '0' + y; }

	let [d, m, y] = objDate.toLocaleString().slice(0,10).split('/');
	
	field.value = `${y}-${m}-${d}`;
}

function timestampToDatetime(val) {
	let objDate = new Date(val*1000);

	// let d = String(Math.max(1, objDate.getDay()));
	// if (d.length < 2) { d = '0' + d; }

	// let m = String(Math.max(1, objDate.getMonth()+1));
	// if (m.length < 2) { m = '0' + m; }
	
	// let y = String(objDate.getFullYear());
	// for (let i = 0; i < (4-y.length); i++) { y = '0' + y; }
	
	// let hr = String(objDate.getHours());
	// if (hr.length < 2) { hr = '0' + hr; }

	// let mn = String(objDate.getMinutes());
	// if (mn.length < 2) { mn = '0' + mn; }
	
	return objDate.toLocaleString('pt-BR');
}

csvSubmit.onclick = function () {
	for (let i = 0; i < csvFile.files.length; i++) {
		let upFile = csvFile.files[i];
		let reader = new FileReader();
		reader.readAsText(upFile, 'UTF-8');
		reader.onload = onLoadInsertTableReports;
		reader.onerror = onErrorInsertTableReports;
	}
}

tblUpdate.onclick = function () {
	updatePageTable();
}

function drawCanvasMonths(cvs) {
	clearCanvas(cvs);

	let tsBegin = getDateTimestamp(fieldsBegin);
	let tsEnd = getDateTimestamp(fieldsEnd);
	let tsDiff = tsEnd - tsBegin;

	let station = fieldsStation.options[fieldsStation.selectedIndex].value;
	let column = fieldsSelect.options[fieldsSelect.selectedIndex].value;
	let range = fieldsRange.options[fieldsRange.selectedIndex].value;
	
	let canvasWidth = cvs.width;
	let selector = `${range}(${column})`;

	let monthValue = [];
	for (let i = 0; i < 12; i++) {
		let m = String(i+1);
		if (m.length < 2) { m = '0' + m; }
		let res = db.exec(`
			SELECT
				${selector}
			FROM
				weather
			WHERE
				(station = "${station}")
				AND (STRFTIME("%m", (DATETIME(date, "unixepoch"))) = "${m}")
				AND (date BETWEEN ${tsBegin} AND ${tsEnd});
		`);
		monthValue[i] = res[0].values[0][0];
	}

	let [minValue, maxValue] = findMinMaxArray(monthValue);
	let median = monthValue[6];
	const adjustedMax = maxValue - minValue;
	const heightConst = CANVAS_HEIGHT / adjustedMax;

	let res = db.exec(`
		SELECT ${selector}, COUNT(${column}) FROM weather WHERE
		station = "${station}"
		AND date BETWEEN ${tsBegin} AND ${tsEnd}
		GROUP BY ${column}
		ORDER BY COUNT(${column}) DESC
		LIMIT 1;
	`);

	let columnMode = res[0].values[0][0];
	let columnModeCount = res[0].values[0][1];

	let canvasSplit = Math.floor(canvasWidth/12);

	let ctx = cvs.getContext('2d');
	for (let i = 0; i < 12; i++) {
		if (i % 2 === 0) {
			ctx.fillStyle = '#FF8080';
		} else {
			ctx.fillStyle = '#EF7070';
		}
		let v = monthValue[i] - minValue;
		let h = CANVAS_HEIGHT - Math.floor(v * heightConst);
		ctx.fillRect(i*canvasSplit, h, canvasSplit-1, CANVAS_HEIGHT);
		ctx.fillStyle = '#000';
		ctx.fillText(`${i+1}`, rempx(0.5)+i*canvasSplit, CANVAS_HEIGHT-rempx(0.5));
	}
	let x = rempx(0.5);
	ctx.fillText(`MÁX/MÍN: ${maxValue}, ${minValue}`, x, CANVAS_HEIGHT-rempx(2.5));
	ctx.fillText(`MEDIANA: ${median}`, x, CANVAS_HEIGHT-rempx(3.5));
	ctx.fillText(`MODA...: ${columnMode} (${columnModeCount})`, x, CANVAS_HEIGHT-rempx(4.5));
}

function drawCanvasHourly(cvs) {
	clearCanvas(cvs);

	let tsBegin = getDateTimestamp(fieldsBegin);
	let tsEnd = getDateTimestamp(fieldsEnd);
	let tsDiff = tsEnd - tsBegin;

	let station = fieldsStation.options[fieldsStation.selectedIndex].value;
	let column = fieldsSelect.options[fieldsSelect.selectedIndex].value;
	let range = fieldsRange.options[fieldsRange.selectedIndex].value;
	
	let canvasWidth = cvs.width;
	let selector = `${range}(${column})`;

	let hourValue = [];
	for (let i = 0; i < 24; i++) {
		let res = db.exec(`
			SELECT
				${selector}
			FROM
				weather
			WHERE
				(station = "${station}")
				AND (FLOOR((date % 86400) / 3600) = ${i})
				AND (date BETWEEN ${tsBegin} AND ${tsEnd});
		`);
		hourValue.push(res[0].values[0][0]);
	}
	let [minValue, maxValue] = findMinMaxArray(hourValue);
	let median = hourValue[12];
	const adjustedMax = maxValue - minValue;
	const heightConst = CANVAS_HEIGHT / adjustedMax;

	let res = db.exec(`
		SELECT ${selector}, COUNT(${column}) FROM weather WHERE
		station = "${station}"
		AND date BETWEEN ${tsBegin} AND ${tsEnd}
		GROUP BY ${column}
		ORDER BY COUNT(${column}) DESC
		LIMIT 1;
	`);

	let columnMode = res[0].values[0][0];
	let columnModeCount = res[0].values[0][1];

	let canvasSplit = Math.floor(canvasWidth/24);

	let ctx = cvs.getContext('2d');
	for (let i = 0; i < 24; i++) {
		if (i % 2 === 0) {
			ctx.fillStyle = '#80FF80';
		} else {
			ctx.fillStyle = '#70EF70';
		}
		let v = hourValue[i] - minValue;
		let h = CANVAS_HEIGHT - Math.floor(v * heightConst);
		ctx.fillRect(i*canvasSplit, h, canvasSplit-1, CANVAS_HEIGHT);
		ctx.fillStyle = '#000';
		ctx.fillText(`${i}`, rempx(0.5)+i*canvasSplit, CANVAS_HEIGHT-rempx(0.5));
	}
	let x = rempx(0.5);
	ctx.fillText(`MÁX/MÍN: ${maxValue}, ${minValue}`, x, CANVAS_HEIGHT-rempx(2.5));
	ctx.fillText(`MEDIANA: ${median}`, x, CANVAS_HEIGHT-rempx(3.5));
	ctx.fillText(`MODA...: ${columnMode} (${columnModeCount})`, x, CANVAS_HEIGHT-rempx(4.5));
}

function drawCanvasLinear(cvs) {
	clearCanvas(cvs);

	let tsBegin = getDateTimestamp(fieldsBegin);
	let tsEnd = getDateTimestamp(fieldsEnd);
	let tsDiff = tsEnd - tsBegin;

	let station = fieldsStation.options[fieldsStation.selectedIndex].value;
	let column = fieldsSelect.options[fieldsSelect.selectedIndex].value;
	let range = fieldsRange.options[fieldsRange.selectedIndex].value;

	let canvasWidth = cvs.width;

	let res = db.exec(`
		SELECT COUNT(${column}) FROM weather WHERE
		station = "${station}"
		AND date BETWEEN ${tsBegin} AND ${tsEnd};
	`);
	let columnCount = res[0].values[0][0];
	let dateSplitCount = Math.min(canvasWidth, columnCount);
	let selector = `${range}(${column})`;

	let results = [];

	for (let i = 0; i < dateSplitCount; i++) {
		let res = db.exec(`
			SELECT ${selector} FROM weather WHERE
			station = "${station}"
			AND date BETWEEN
				${Math.floor(tsBegin+tsDiff*(i/dateSplitCount))}
				AND ${Math.floor(tsBegin+tsDiff*((i+1)/dateSplitCount))};
		`);
		let value = res[0].values[0][0];
		results.push(value);
	}

	res = db.exec(`
		SELECT
			${column},
			COUNT(${column}) AS freq
		FROM
			weather
		WHERE
			station = "${station}"
			AND date BETWEEN ${tsBegin} AND ${tsEnd}
		GROUP BY ${column}
		ORDER BY freq DESC
		LIMIT 1;
	`);

	let columnMode = res[0].values[0][0];
	let columnModeCount = res[0].values[0][1];

	let [minValue, maxValue] = findMinMaxArray(results);
	let median = results[Math.floor(results.length/2)];
	const adjustedMax = maxValue - minValue;
	const heightConst = CANVAS_HEIGHT / adjustedMax;
	
	let ctx = cvs.getContext('2d');
	ctx.fillStyle = '#8080FF';
	for (let i = 0; i < dateSplitCount; i++) {
		let v = results[i] - minValue;
		let h = CANVAS_HEIGHT - Math.floor(v * heightConst);
		ctx.fillRect(i, h, 1, CANVAS_HEIGHT);
	}
	ctx.fillStyle = '#000';
	let x = rempx(0.5);
	ctx.fillText(`MÁX/MÍN: ${maxValue}, ${minValue}`, x, CANVAS_HEIGHT-rempx(0.5));
	ctx.fillText(`MEDIANA: ${median}`, x, CANVAS_HEIGHT-rempx(1.5));
	ctx.fillText(`MODA...: ${columnMode} (${columnModeCount})`, x, CANVAS_HEIGHT-rempx(2.5));
}

fieldsDraw.onclick = function () {
	drawCanvasLinear(canvasLinearFields);
	drawCanvasHourly(canvasHourFields);
	drawCanvasMonths(canvasMonthFields);
}

clearCanvas(canvasLinearFields, rempx(REM_CANVAS_FONT)*48, CANVAS_HEIGHT);
clearCanvas(canvasHourFields, rempx(REM_CANVAS_FONT)*48, 512);
clearCanvas(canvasMonthFields, rempx(REM_CANVAS_FONT)*24, 512);