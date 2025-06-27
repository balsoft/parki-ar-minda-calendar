function data_req(url, callback, responseType) {
  req = new XMLHttpRequest()
  if (responseType) req.responseType = responseType
  req.addEventListener('load', callback)
  req.open('GET', url)
  req.send()
}

function hash_code(string) {
  h = 0
  for (i = 0; i < string.length; i++) {
    h = string.charCodeAt(i) + ((h << 8) - h);
  }
  return h
}

function hash_color(string) {
  return 'hsl(' + hash_code(string) % 360 + ', 100%, 60%)'
}

function isLight(color) {
  // Counting the perceptive luminance - human eye favors green color...
  luminance = (0.299 * color.red() + 0.587 * color.green() + 0.114 * color.blue()) / 255;
  return luminance >= 0.65
}

async function makeSource(source) {
  let url = `${pamConfig.icsDirectory}/${source}`
  let sourceInfo = await fetch(url)

  jcal = ICAL.parse(await sourceInfo.text())
  color = (new ICAL.Component(jcal)).getFirstPropertyValue("color") || hash_color(source)
  textColor = isLight(jQuery.Color(color)) ? "black" : "white";
  return { id: source.replace(".ics", ""), url, format: "ics", color, textColor }
}

async function fetchSources() {
  if (pamConfig.icsType == "webdav") {
    const client = WebDAV.createClient(pamConfig.icsDirectory)
    const contents = await client.getDirectoryContents("/")
    names = contents.map((entry) => { return entry.filename.replace(/^\//, "") })
  } else if (pamConfig.icsType = "autoindex") {
    const response = await fetch(pamConfig.icsDirectory)
    const json = await response.json()
    names = json.map(function(entry) { return entry.name })
  } else {
    window.alert("Incorrect source type specified, ignoring")
  }
  return Promise.all(names.map(makeSource))

}

async function toggleVis(id) {
  var event = document.calendar.getEventSourceById(id)
  $("#calendar-feed-" + id).toggleClass("disabled")
  if (event)
    event.remove()
  else {
    document.calendar.addEventSource(await makeSource(id + ".ics"))
    if (document.location.hash != `#${id}`)
      history.pushState(null, null, ' ')
  }
}

function hashchange() {
  for (source of document.sources) {
    var checkbox = $(`#calendar-feed-${source.id} input`)
    const checked = checkbox.is(':checked')
    if (document.location.hash != "") {
      if (document.location.hash == `#${source.id}`) {
        if (!checked) checkbox.click()
      } else {
        if (checked) checkbox.click()
      }
    } else {
      if (!checked) checkbox.click()
    }
  }
}

const sourcesPromise = fetchSources()

document.addEventListener("DOMContentLoaded", async function() {
  document.sources = await sourcesPromise

  for (source of document.sources) {
    var link = source.url.match("https://") ? source.url : `${document.location}/${source.url}`

    $("#legend-feeds").append(`
            <div class="calendar-feed" id="calendar-feed-${source.id}">
                <input type=checkbox checked onclick="toggleVis('${source.id}')" style="accent-color: ${source.color}"/>
                <span><a href="${source.url}" style="color: black" class="source-id">${source.id}</a></span>
                <span title="Copy ics URL to clipboard" style="cursor: default" onclick="navigator.clipboard.writeText('${link}')">🔗</span>
                <a href="#${source.id}" style="color: black; text-decoration: none" title="Only show ${source.id}">👁</a>
            </div>
        `)

  }


  document.calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
    plugins: [FullCalendar.ICalendar.default],

    headerToolbar: {
      start: "prev,next today",
      center: (window.innerWidth > 700) ? "title" : "",
      end: (window.innerWidth > 700) ? "dayGridMonth,timeGridWeek,timeGridDay,listYear" : "timeGridThreeDay,timeGridDay,listYear",
    },

    initialView: (window.innerWidth > 700) ? "timeGridWeek" : "timeGridThreeDay",

    views: {
      timeGridThreeDay: {
        type: 'timeGrid',
        duration: { days: 3 },
        buttonText: '3 days'
      }
    },

    firstDay: 1,


    themeSystem: "bootstrap5",
    height: "auto",
    nowIndicator: true,

    locale: "en-gb",

    eventSources: document.sources,

    eventTimeFormat: { // like '14:30'
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false,
    },

    // Runs when the event is added to DOM
    eventDidMount: function(info) {
      // To prevent clutter
      info.event.setProp("title", info.event.title.replace("parki ar minda — ", ""))

      // Add a popover (window that opens when you click it) with event description
      $(info.el).attr("title", info.event.extendedProps.description)

      function pad0(length, what) {
        return what.toString().padStart(length, "0")
      }

      // How does this even work...
      var date = document.calendar.formatDate(info.event.start, { year: "numeric", month: "short", day: "numeric", weekday: "long" })

      function renderTime(time) { return `${pad0(2, time.getHours())}:${pad0(2, time.getMinutes())}` }

      var content = `<b>📅</b> ${date}<br><b>⏰</b> ${renderTime(info.event.start)} - ${renderTime(info.event.end)}`

      if (info.event.extendedProps.location) {
        var location = info.event.extendedProps.location.replace(/https:\/\/[^ ]*/, "").replace("\n", "<br>")
        var locationUrl = (info.event.extendedProps.location.match(/https:\/\/[^ ]*/) || [])[0]
        content += `<hr><b>📍</b>`
        if (locationUrl)
          content += `<a href="${locationUrl}">`

        content += location

        if (locationUrl)
          content += `</a>`
      }
      if (info.event.url) {
        content += `<hr><a href=${info.event.url}><b>🔗</b> More details...</a>`
      }

      $(info.el).popover({
        placement: "top",
        content: content,
        html: true,
        container: "body"
      })

      // Change cursor
      $(info.el).css("cursor", "pointer")
    },
    // Prevent just following the event URL, open a popover instead
    eventClick: function(info) {
      info.jsEvent.preventDefault()
    }
  })

  document.calendar.render()

  hashchange()
  $(window).on('hashchange', hashchange)
})


