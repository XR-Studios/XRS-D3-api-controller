let url = "0.0.0.0"; //d3 server address pulled and set from data 
let transports;
let port = 3000;
let StoredDataByTime = [];
let show;
const filters = {
    section: true,
    note: true,
    cue: true,
    tc: true,
    midi: true,
}

async function getTransports(){
    title = await fetchAsync("http://" + url + "/api/session/status/project");
    data = await fetchAsync("http://" + url + "/api/session/transport/activetransport");
    console.log(data);
    let transports = [];
    for(res of data.result){
        const transport = {
            type: "",
            name: "",
            data: "",
            track: {
                uid: "",
                name: ""
            },
            uid: "",
            enabled:true
        }
        transport.type = "transport";
        transport.name = res.name;
        transport.data = res;
        transport.track.uid = res.currentTrack.uid;
        transport.track.name = res.currentTrack.name;
        transport.uid = res.uid;
        console.log(transport)
        transports.push(transport)
    }
    document.querySelector('#projectName').innerHTML = title.result.projectPath.split('\\')[0]
    buildNotations(transports);
    return transports
    
}

async function startup(){
    await getIP();
    try{
        transports = await getTransports();
    }catch{
        alert("Error connecting to the d3 server. Check that the project is running and that you've set the correct IP and try again")
    }
    //show = await getShow();
}

startup();

async function fetchAsync (url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

async function fetchPost(url, body){
    fetch(url, {
        method: 'POST', 
        headers:{
            'Content-Type':'application/json',
        },
        body: JSON.stringify(body),
    }).then((response) => response.json()).then((data) => {
        console.log('Success:', data);
    }).catch((error) => {
        console.error('Error:', error)
    });
}

function buildDataByTime(data, transportUID, transportName){
    //console.log(data)
    let unorderedDataByTime = []; //new array with all notations reordered by their time on the timeline
    for(const key in data.result.annotations) {
        data.result.annotations[key].forEach(element => {
            let time = element.time; //get the time of each element
            delete element.time; //remove time from the element obj
            element.annotationType = key; //add the type of the annotation to the object
            let timeArr = {[time]:[]}; //make an object that wraps the time and an empty array eg: {0:[]}
            timeArr[time].push({transportUID, transportName}); //push the transport uid and name to the array
            timeArr[time].push(element); //push the element object to the empty array
            let exists = false; //assume element doesn't already exist
            for(let i=0; i<unorderedDataByTime.length; i++){//check new timeArr against all existing
                if(Object.keys(unorderedDataByTime[i])[0] == time){ //if the time of the timeArr is equal to the key of the timeArr object at the index i, push this element to its array
                    unorderedDataByTime[i][time].push(element);
                    exists = true;
                    }
                }
            if(!exists){
                unorderedDataByTime.push(timeArr);
            }
        });
    }
    console.log(unorderedDataByTime)
    return dataByTime = sortDataByTime(unorderedDataByTime);
}

function sortDataByTime(unsorted){//takes the unsorted data by time array and sorts by the time key of each object
    return unsorted.sort((a,b) => {
        var atime = parseFloat(Object.keys(a)[0]); var btime = parseFloat(Object.keys(b)[0]);
        return((atime<btime) ? -1 : ((atime>btime) ? 1 : 0 ));
    });
} 

async function buildNotations(transports){
    document.querySelector('.buttons .cues').innerHTML = '';
    console.log(transports)
    let topHtml = ''
    let selHtml = ''
    for(let i = 0; i<transports.length; i++){
        const transHtml = `<div class="${transports[i].enabled ? "enabled" : "disabled"}" data-transport-uid ="${transports[i].uid}" data-transport-name="${transports[i].name}">${transports[i].name}</div>`
        const transSelHtml = `<option  data-transport-uid ="${transports[i].uid}" data-transport-name="${transports[i].name}">${transports[i].name}</option>`
        topHtml += transHtml
        selHtml += transSelHtml
    }
    document.querySelector('.transports').innerHTML = topHtml
    document.querySelector('#transportsDropdown').innerHTML = selHtml + '<option data-transport-uid ="allTransports" data-transport-name ="allTransports">all</options>'
    for (transport of transports){
        const data = await fetchAsync("http://" + url + `/api/session/transport/annotations?uid=${transport.track.uid}`);
        //console.log(data)
        const dataByTime = buildDataByTime(data, transport.uid, transport.name);
        renderDataByTime(dataByTime);
        StoredDataByTime.push(...dataByTime)
    }

}
function setEnableState(state, transportUID){
    transports.forEach(transport => {
        if(transport.uid === transportUID){
            transport.enabled = state;
        }
    });
    console.log(transports)

}
function isEnabled(transportUID){
    isTrue = false;
    transports.forEach(transport => {
        if(transport.uid === transportUID){
            isTrue = transport.enabled;
        }
    });
    return isTrue
}

async function getIP(){
    const ip = await fetchAsync(`http://${window.location.hostname}:${port}/data/ip.json`);
    url = ip.url;
    document.querySelector("#url").value = url;
}

async function setIP(){
    const ip = {
        url:url
    };
    fetchPost(`http://${window.location.hostname}:${port}/ip`, ip);
}

function renderDataByTime(dataByTime){
    let html = '';
    for(let i = 0; i<dataByTime.length; i++){
        time = Object.keys(dataByTime[i])[0];
        if(isEnabled(dataByTime[i][time][0].transportUID)){
            let timeHtml = `<div class="timeBtn" data-time="${time}" data-transport-uid ="${dataByTime[i][time][0].transportUID}" data-transport-name="${dataByTime[i][time][0].transportName}">`
            let container = `<div class="cont">`;
            let topDiv = `<div class="top">`;
            let bottomDiv = `<div class="bottom">`;
            let note = `<h3 class="note">`;
            let tag = `<h4 class="tag">`;
            let section = `<h4 class="section">`;
            let tagType = "none";
            for(let a = 0; a<dataByTime[i][time].length; a++){
                if(dataByTime[i][time][a].annotationType == "notes"){
                    note += `${dataByTime[i][time][a].text}`;
                }
                if(dataByTime[i][time][a].annotationType == "tags"){
                    tag += `${dataByTime[i][time][a].type} ${dataByTime[i][time][a].value}`;
                    tagType = dataByTime[i][time][a].type;
                }
                if(dataByTime[i][time][a].annotationType == "sections"){
                    section += `Section ${dataByTime[i][time][a].index}`;
                }
            }
            note += `</h3>`;
            tag += `</h4>`;
            section += `</h4>`;
            topDiv += note + tag + `<div class="transportName">${dataByTime[i][time][0].transportName}</div>` + `</div>`;
            bottomDiv += section + `<p class="time">${time}s</p></div>`;
            container += topDiv + bottomDiv + `</div><div class="tagColor ${tagType ?? ""}"></div>`;
            timeHtml += container+`</div>`;
            html += timeHtml;
        }        
    }
    document.querySelector('.buttons .cues').innerHTML += html;
}

/*async function createXMLSeq(){
    const data = await fetchAsync("http://" + url + "/api/session/transport/annotations");
    const date = new Date();

    let xml = `<?xml version="1.0" encoding="utf-8"?>
    <?xml-stylesheet type="text/xsl" href="styles/sequ@html@default.xsl"?>
    <?xml-stylesheet type="text/xsl" href="styles/sequ@executorsheet.xsl" alternate="yes"?>
    <?xml-stylesheet type="text/xsl" href="styles/sequ@trackingsheet.xsl" alternate="yes"?>
    <MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.9.60/MA.xsd" major_vers="3" minor_vers="9" stream_vers="60">
        <Info datetime="${date.toISOString()}" showfile="d3-to-MA2" />
        <Sequ index="0" name="${data.result.name}" timecode_slot="255" forced_position_mode="0">
            <Cue xsi:nil="true" />`;
    
    const dataByTime = buildDataByTime(data);
    let cuesByTime = [];

    for(let i = 0; i< dataByTime.length; i++){
        let time = Object.keys(dataByTime[i])[0];
        let isCue = false;
        for(let a=0; a<dataByTime[i][time].length; a++){
            if(dataByTime[i][time][a].type == "CUE"){
                isCue = true;
            }
        }
        if(isCue){
            cuesByTime.push(dataByTime[i]);
        }
    }

    for(let x = 0; x<cuesByTime.length; x++){
        let time = Object.keys(cuesByTime[x])[0];
        let cueNumber, note;
        let dotCueNum = 0;

        for(let y = 0; y<cuesByTime[x][time].length; y++){
            if(cuesByTime[x][time][y].annotationType == "notes"){
                note = cuesByTime[x][time][y].text;
            }else if(cuesByTime[x][time][y].type == "CUE"){
                if(cuesByTime[x][time][y].value.includes('.')){
                    str = cuesByTime[x][time][y].value.split('.');
                    cueNumber = str[0];
                    dotCueNum = str[1];
                    for(let b = dotCueNum.length; b<3;b++){
                        dotCueNum += '0';
                    }
                }else{
                    cueNumber = cuesByTime[x][time][y].value;
                }
            }
        }
        let cueXML = `<Cue index="${x + 1}">
            <Number number="${cueNumber}" sub_number="${dotCueNum}" />
            <CueDatas></CueDatas>
            <CuePart index="0" name="${note}">
                <CuePartPresetTiming>
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                    <PresetTiming />
                </CuePartPresetTiming>
            </CuePart>
        </Cue>`;
        xml += cueXML;
    }
    let textFile = null, makeTextFile = function (text) {
        let file = new Blob([text], {type: 'text/plain'});

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.

        if (textFile !== null) {
            window.URL.revokeObjectURL(textFile);
        }

        textFile = window.URL.createObjectURL(file);

        return textFile;
    };

    const link = document.createElement('a');
    link.setAttribute('download', `d3toMA2_${Date.now()}.xml`);
    link.href = makeTextFile(xml);
    document.body.appendChild(link);

    window.requestAnimationFrame(function () {
        var event = new MouseEvent('click');
        link.dispatchEvent(event);
        document.body.removeChild(link);
    });
}*/


function searchData(term){
    if(term === ""){
        return filterData()
    }else{
        let searchDataByTime = [];
        for(let i=0; i<StoredDataByTime.length; i++){
            let time = Object.keys(StoredDataByTime[i])[0];
            hasTerm = false;
            for(let a=0; a<StoredDataByTime[i][time].length; a++){
                let keys = Object.keys(StoredDataByTime[i][time][a]) 
                for(let b=0; b<keys.length; b++){
                    string = String(StoredDataByTime[i][time][a][keys[b]]).toLowerCase();
                    typeStr = String(`${StoredDataByTime[i][time][a].type} ${StoredDataByTime[i][time][a].value}`).toLowerCase();
                    sectStr = String(`Section ${StoredDataByTime[i][time][a].index}`).toLowerCase();

                    if(string.includes(term.toLowerCase())){
                        hasTerm = true;
                    }else if(typeStr.includes(term.toLowerCase())){
                        hasTerm = true;
                    }else if(sectStr.includes(term.toLowerCase())){
                        hasTerm = true;
                    }
                }
            }
            if(String(parseInt(time)).includes(term.toLowerCase())){
                hasTerm = true;
            }
            if(hasTerm){
                searchDataByTime.push(StoredDataByTime[i]);
            }
        }
        return searchDataByTime;
    }
}

function filterData(){
    //if has any of these terms: 
    let filteredStoreByTime = []
    console.log(filters)
    StoredDataByTime.forEach(store => {
        let time = Object.keys(store);
        hasTerm = false
        store[time].forEach(element => {
            if(element.type == 'CUE' && filters.cue || element.type == "TC" && filters.tc || element.type == "MIDI" && filters.midi || element.annotationType == "notes" && filters.note || element.annotationType == "sections" && filters.section){
                hasTerm = true;
            }
        });
        if(hasTerm) filteredStoreByTime.push(store)
    });
    return filteredStoreByTime
}

document.addEventListener('change', (event) => {
	if(event.target.matches("#url")){
        url = event.target.value;
        getTransports();
        setIP();
    }

    else if(event.target.matches('#Search')){
        const term = event.target.value;
        document.querySelector('.buttons .cues').innerHTML = ''
        let sortedData = searchData(term);
        renderDataByTime(sortedData);
    }
});

document.addEventListener('keyup', (event) =>{
    if(event.target.matches('#Search')){
        const term = event.target.value;
        let sortedData = searchData(term);
        document.querySelector('.buttons .cues').innerHTML = ''
        renderDataByTime(sortedData);
    }
});

document.addEventListener('click', (event) =>{

	if(event.target.matches("#refresh")){
        startup();
    }
    /*else if(event.target.matches("#download")){
        createXMLSeq();
    }*/else if(event.target.matches('.transports div')){
        if(event.target.classList.contains('enabled')){
            setEnableState(false, event.target.dataset.transportUid)
        }else{
            setEnableState(true, event.target.dataset.transportUid)
        }
        event.target.classList.toggle('enabled')
        event.target.classList.toggle('disabled')
        document.querySelector('.buttons .cues').innerHTML = ''
        renderDataByTime(StoredDataByTime);
    }else if(event.target.matches('.filterToggle img') || event.target.matches('.filterToggle')){
        document.querySelectorAll('.filters')[0].classList.toggle('hidden')
        document.querySelectorAll('.filters')[1].classList.toggle('hidden')
    }else if(event.target.matches('.filter')){
        event.target.classList.toggle('enabled')
        event.target.classList.toggle('disabled')
        if(event.target.matches('#SectionsFilter')){
            if (event.target.matches('.enabled')) filters.section = true;
            else filters.section = false;
        }else if(event.target.matches('#NotesFilter')){
            if (event.target.matches('.enabled')) filters.note = true;
            else filters.note = false;
        }else if(event.target.matches('#CueFilter')){
            if (event.target.matches('.enabled')) filters.cue = true;
            else filters.cue = false;
        }else if(event.target.matches('#TCFilter')){
            if (event.target.matches('.enabled')) filters.tc = true;
            else filters.tc = false;
        }else if(event.target.matches('#MIDIFilter')){
            if (event.target.matches('.enabled')) filters.midi = true;
            else filters.midi = false;
        }
        console.log(filters)
        document.querySelector('.buttons .cues').innerHTML = ''
        const filteredDataByTime = filterData();
        renderDataByTime(filteredDataByTime);
        //update and rerun render date by time excluding whatever doesn't match current filter
    }else if(event.target.matches(".timeBtn")){
        const messagePre = {
            "transports": [
              {
                "transport":{
                    "uid":event.target.dataset.transportUid,
                    "name": event.target.dataset.transportName,
                },
                "time": event.target.dataset.time,
                "playmode": "NotSet"
              }
            ]
        }
        console.log(messagePre)
        fetchPost("http://" + url + "/api/session/transport/gototime", messagePre);
    }else if(event.target.parentElement.matches('.timeBtn')){
        const messagePre = {
            "transports": [
              {
                "transport":{
                    "uid":event.target.parentElement.dataset.transportUid,
                    "name": event.target.parentElement.dataset.transportName,
                },
                "time": event.target.parentElement.dataset.time,
                "playmode": "NotSet"
              }
            ]
        }
        console.log(messagePre, 'child')
        fetchPost("http://" + url + "/api/session/transport/gototime", messagePre);
    }else if(event.target.parentElement.parentElement.matches('.timeBtn')){
        const messagePre = {
            "transports": [
              {
                "transport":{
                    "uid":event.target.parentElement.parentElement.dataset.transportUid,
                    "name": event.target.parentElement.parentElement.dataset.transportName,
                },
                "time": event.target.parentElement.parentElement.dataset.time,
                "playmode": "NotSet"
              }
            ]
        }
        console.log(messagePre, 'child.child')
        fetchPost("http://" + url + "/api/session/transport/gototime", messagePre);
    }else if(event.target.parentElement.parentElement.parentElement.matches('.timeBtn')){
        const messagePre = {
            "transports": [
              {
                "transport":{
                    "uid":event.target.parentElement.parentElement.parentElement.dataset.transportUid,
                    "name": event.target.parentElement.parentElement.parentElement.dataset.transportName,
                },
                "time": event.target.parentElement.parentElement.parentElement.dataset.time,
                "playmode": "NotSet"
              }
            ]
        }
        console.log(messagePre, 'child.child.child')
        fetchPost("http://" + url + "/api/session/transport/gototime", messagePre);
    }else if(event.target.matches('.transButton#play img') || event.target.matches('.transButton#play')){
        const dropdown = document.querySelector('#transportsDropdown')
        
        const messagePre = {
            "transports": [
                {
                    "uid": dropdown.options[dropdown.selectedIndex].dataset.transportUid,
                    "name": dropdown.options[dropdown.selectedIndex].dataset.transportName
                }
            ]
        }

        fetchPost("http://" + url + "/api/session/transport/play", messagePre)
    }else if(event.target.matches('.transButton#playEOS img') || event.target.matches('.transButton#playEOS')){
        const dropdown = document.querySelector('#transportsDropdown')
        let messagePre = {}
        if(dropdown.options[dropdown.selectedIndex].dataset.transportUid == 'allTransports'){
           let transportsArr = []
            for (const transport of transports) {
                const add = {
                    "uid":transport.uid,
                    "name": transport.name
                }
                transportsArr.push(add)
            }
            messagePre = {
                "transports": transportsArr
            }
        }else{
            messagePre = {
                "transports": [
                    {
                        "uid": dropdown.options[dropdown.selectedIndex].dataset.transportUid,
                        "name": dropdown.options[dropdown.selectedIndex].dataset.transportName
                    }
                ]
            }
        }
        

        fetchPost("http://" + url + "/api/session/transport/playsection", messagePre)
    }else if(event.target.matches('.transButton#playLoop img') || event.target.matches('.transButton#playLoop')){
        const dropdown = document.querySelector('#transportsDropdown')
        let messagePre = {}
        if(dropdown.options[dropdown.selectedIndex].dataset.transportUid == 'allTransports'){
           let transportsArr = []
            for (const transport of transports) {
                const add = {
                    "uid":transport.uid,
                    "name": transport.name
                }
                transportsArr.push(add)
            }
            messagePre = {
                "transports": transportsArr
            }
        }else{
            messagePre = {
                "transports": [
                    {
                        "uid": dropdown.options[dropdown.selectedIndex].dataset.transportUid,
                        "name": dropdown.options[dropdown.selectedIndex].dataset.transportName
                    }
                ]
            }
        }

        fetchPost("http://" + url + "/api/session/transport/playloopsection", messagePre)
    }else if(event.target.matches('.transButton#stop img') || event.target.matches('.transButton#stop')){
        const dropdown = document.querySelector('#transportsDropdown')
        
        let messagePre = {}
        if(dropdown.options[dropdown.selectedIndex].dataset.transportUid == 'allTransports'){
           let transportsArr = []
            for (const transport of transports) {
                const add = {
                    "uid":transport.uid,
                    "name": transport.name
                }
                transportsArr.push(add)
            }
            messagePre = {
                "transports": transportsArr
            }
        }else{
            messagePre = {
                "transports": [
                    {
                        "uid": dropdown.options[dropdown.selectedIndex].dataset.transportUid,
                        "name": dropdown.options[dropdown.selectedIndex].dataset.transportName
                    }
                ]
            }
        }

        fetchPost("http://" + url + "/api/session/transport/stop", messagePre)
    }else if(event.target.matches('.transButton#prev img') || event.target.matches('.transButton#prev')){
        const dropdown = document.querySelector('#transportsDropdown')
        
        let messagePre = {}
        if(dropdown.options[dropdown.selectedIndex].dataset.transportUid == 'allTransports'){
           let transportsArr = []
            for (const transport of transports) {
                const add = {
                    "transport": {
                        "uid":transport.uid,
                        "name": transport.name
                    }, 
                    "playmode" : "NotSet",
                }
                transportsArr.push(add)
            }
            messagePre = {
                "transports": transportsArr
            }
        }else{
            messagePre = {
                "transports": [
                    {
                        "transport" : {
                            "uid": dropdown.options[dropdown.selectedIndex].dataset.transportUid,
                            "name": dropdown.options[dropdown.selectedIndex].dataset.transportName
                        },
                        "playmode" : "NotSet",
                    }
                ]
            }
        }

        fetchPost("http://" + url + "/api/session/transport/gotoprevsection", messagePre)
    }else if(event.target.matches('.transButton#next img') || event.target.matches('.transButton#next')){
        const dropdown = document.querySelector('#transportsDropdown')
        
        let messagePre = {}
        if(dropdown.options[dropdown.selectedIndex].dataset.transportUid == 'allTransports'){
           let transportsArr = []
            for (const transport of transports) {
                const add = {
                    "transport": {
                        "uid":transport.uid,
                        "name": transport.name
                    }, 
                    "playmode" : "NotSet",
                }
                transportsArr.push(add)
            }
            messagePre = {
                "transports": transportsArr
            }
        }else{
            messagePre = {
                "transports": [
                    {
                        "transport" : {
                            "uid": dropdown.options[dropdown.selectedIndex].dataset.transportUid,
                            "name": dropdown.options[dropdown.selectedIndex].dataset.transportName
                        },
                        "playmode" : "NotSet",
                    }
                ]
            }
        }

        fetchPost("http://" + url + "/api/session/transport/gotonextsection", messagePre)
    }else if(event.target.matches('.transButton#return img') || event.target.matches('.transButton#return')){
        const dropdown = document.querySelector('#transportsDropdown')
        
        let messagePre = {}
        if(dropdown.options[dropdown.selectedIndex].dataset.transportUid == 'allTransports'){
           let transportsArr = []
            for (const transport of transports) {
                const add = {
                    "uid":transport.uid,
                    "name": transport.name
                }
                transportsArr.push(add)
            }
            messagePre = {
                "transports": transportsArr
            }
        }else{
            messagePre = {
                "transports": [
                    {
                        "uid": dropdown.options[dropdown.selectedIndex].dataset.transportUid,
                        "name": dropdown.options[dropdown.selectedIndex].dataset.transportName
                    }
                ]
            }
        }

        fetchPost("http://" + url + "/api/session/transport/returntostart", messagePre)
    }
    else{
        console.log(event.target, "no event triggered");
    }
});


