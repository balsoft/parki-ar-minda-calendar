function data_req (url, callback, responseType) {
    req = new XMLHttpRequest()
    if (responseType) req.responseType = responseType
    req.addEventListener('load', callback)
    req.open('GET', url)
    req.send()
}

function hash_code(string) {
    h = 0
    for (i = 0; i < string.length; i++) {
        h = string.charCodeAt(i) + ((h << 5) - h);
    }
    return h
}

function hash_color(string) {
    return 'hsl('+hash_code(string)%360+', 100%, 80%)'
}


function makeSource(source) {
    return { id: source.replace(".ics", ""), url: `${pamConfig.icsDirectory}/${source}`, format: "ics", color: hash_color(source) }
}

async function fetchSources() {
    const response = await fetch(pamConfig.icsDirectory)
    const json = await response.json()
    return json.map(function(entry) { return entry.name }).map(makeSource)
}

function toggleVis(id) {
    var event = document.calendar.getEventSourceById(id)
    $("#calendar-feed-" + id).toggleClass("disabled")
    if (event)
        event.remove()
    else
        document.calendar.addEventSource(makeSource(id + ".ics"))
}

document.addEventListener("DOMContentLoaded", async function() {
    const sources = await fetchSources()

    for (source of sources) {
        var link = source.url.match("https://") ? source.url :`${window.location.href}/${source.url}`
        
        $("#legend-feeds").append(`
            <div class="calendar-feed" id="calendar-feed-${source.id}">
                <input type=checkbox checked onclick="toggleVis('${source.id}')" style="accent-color: ${source.color}"/>
                <span><a href="${source.url}" style="color: black">${source.id}</a></span>
                <span title="Copy ics URL to clipboard" style="cursor: default" onclick="navigator.clipboard.writeText('${link}')">🔗</span>
            </div>
        `)
    }
    
    document.calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
        plugins: [ FullCalendar.ICalendar.default ],
        headerToolbar: {
           start: "prev,next today",
           center: "title",
           end: "dayGridMonth,timeGridWeek,timeGridDay,listYear" 
        },
        firstDay: 1,
        height: "auto",
        initialView: "timeGridWeek",
        eventSources: sources,
        nowIndicator: true,
        eventTextColor: "black",
        // Runs when the event is added to DOM
        eventDidMount: function(info) {
            // To prevent clutter
            info.event.setProp("title", info.event.title.replace("parki ar minda — ", ""))
            
            // Add a tooltip with event description
            $(info.el).attr("title", info.event.extendedProps.description)

            // Go to the URL specified in the location when the event is clicked
            var url = info.event.extendedProps.url || (info.event.extendedProps.location || "").match(/https:\/\/[^ ]*/)[0]
            $(info.el).click(function() { window.open(url, "_blank") })

            // Change cursor
            $(info.el).css("cursor", "pointer")
        },
    })

    document.calendar.render()
})


