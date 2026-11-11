const SEVERITY = { uv: 1, heat: 2, rain: 3, heavy: 4, storm: 5 };

const COPY = {
  en: {
    stormTitle: (place) => `Storm near ${place}`,
    stormBody: (when) => `Thunderstorms are expected around ${when}.`,
    heavyTitle: (place) => `Heavy precipitation near ${place}`,
    heavyBody: (when) => `Heavy rain or snow is likely around ${when}.`,
    rainTitle: (place) => `Rain likely near ${place}`,
    rainBody: (when, pop) => `About ${pop}% chance of rain around ${when}.`,
    heatTitle: (place) => `High heat near ${place}`,
    heatBody: (when, temp, unit) =>
      `Temperature reaches ${Math.round(temp)}°${unit} around ${when}.`,
    uvTitle: (place) => `Strong sun near ${place}`,
    uvBody: (uv) =>
      `UV index reaches ${Math.round(uv)} today. Limit time in direct midday sun.`,
  },
  ar: {
    stormTitle: (place) => `عاصفة قرب ${place}`,
    stormBody: (when) => `متوقع عواصف رعدية حوالي ${when}.`,
    heavyTitle: (place) => `هطول كثيف قرب ${place}`,
    heavyBody: (when) => `أمطار أو ثلوج كثيفة متوقعة حوالي ${when}.`,
    rainTitle: (place) => `احتمال أمطار قرب ${place}`,
    rainBody: (when, pop) => `احتمال المطر حوالي ${pop}% في ${when}.`,
    heatTitle: (place) => `حرارة مرتفعة قرب ${place}`,
    heatBody: (when, temp, unit) =>
      `تصل الحرارة إلى ${Math.round(temp)}°${unit} حوالي ${when}.`,
    uvTitle: (place) => `شمس قوية قرب ${place}`,
    uvBody: (uv) =>
      `مؤشر الأشعة يصل إلى ${Math.round(uv)} اليوم. خفف التعرض لشمس الظهيرة.`,
  },
};

function languageCopy(language) {
  return COPY[language === "ar" ? "ar" : "en"];
}

function hourLabel(isoTime) {
  const match = String(isoTime).match(/T(\d{2}:\d{2})/);
  return match ? match[1] : String(isoTime);
}

function classifyHour(code, pop, temp, temperatureUnit) {
  if (code === 95 || code === 96 || code === 99) return "storm";
  if (code === 65 || code === 67 || code === 75 || code === 82 || code === 86)
    return "heavy";
  if (typeof pop === "number" && pop >= 70) return "rain";
  const heatLine = temperatureUnit === "fahrenheit" ? 104 : 40;
  if (typeof temp === "number" && temp >= heatLine) return "heat";
  return null;
}

function upcomingHit(hourly, { now, hours, temperatureUnit }) {
  if (!hourly?.time?.length) return null;
  const start = now.getTime() - 30 * 60 * 1000;
  const end = now.getTime() + hours * 60 * 60 * 1000;
  let best = null;

  for (let index = 0; index < hourly.time.length; index += 1) {
    const stamp = new Date(hourly.time[index]).getTime();
    if (Number.isNaN(stamp) || stamp < start || stamp > end) continue;
    const kind = classifyHour(
      hourly.weather_code?.[index],
      hourly.precipitation_probability?.[index],
      hourly.temperature_2m?.[index],
      temperatureUnit,
    );
    if (!kind) continue;
    if (!best || SEVERITY[kind] > SEVERITY[best.kind]) {
      best = {
        kind,
        time: hourly.time[index],
        pop: hourly.precipitation_probability?.[index],
        temp: hourly.temperature_2m?.[index],
      };
    }
  }

  return best;
}

export function buildWeatherAlert({
  hourly,
  daily,
  placeName = "your area",
  language = "en",
  temperatureUnit = "celsius",
  now = new Date(),
  hours = 12,
} = {}) {
  const copy = languageCopy(language);
  const place = placeName || (language === "ar" ? "منطقتك" : "your area");
  const unit = temperatureUnit === "fahrenheit" ? "F" : "C";
  const hit = upcomingHit(hourly, { now, hours, temperatureUnit });

  if (hit) {
    const when = hourLabel(hit.time);
    const body = {
      storm: copy.stormBody(when),
      heavy: copy.heavyBody(when),
      rain: copy.rainBody(when, Math.round(hit.pop ?? 70)),
      heat: copy.heatBody(when, hit.temp, unit),
    }[hit.kind];
    const title = {
      storm: copy.stormTitle(place),
      heavy: copy.heavyTitle(place),
      rain: copy.rainTitle(place),
      heat: copy.heatTitle(place),
    }[hit.kind];
    return {
      kind: hit.kind,
      id: `${hit.kind}:${place}:${hit.time}`,
      tag: `aether-${hit.kind}`,
      title,
      body,
      lang: language === "ar" ? "ar" : "en",
    };
  }

  const uv = daily?.uv_index_max?.[0];
  const day = daily?.time?.[0] || now.toISOString().slice(0, 10);
  if (typeof uv === "number" && uv >= 8) {
    return {
      kind: "uv",
      id: `uv:${place}:${day}`,
      tag: "aether-uv",
      title: copy.uvTitle(place),
      body: copy.uvBody(uv),
      lang: language === "ar" ? "ar" : "en",
    };
  }

  return null;
}
