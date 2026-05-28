const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface GoogleEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export async function fetchCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  let allItems: GoogleCalendar[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const url = new URL(`${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`);
    if (pageToken) url.searchParams.append('pageToken', pageToken);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendars: ${response.statusText}`);
    }

    const data = await response.json();
    allItems = [...allItems, ...(data.items || [])];
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allItems;
}

export async function createCalendar(accessToken: string, summary: string): Promise<GoogleCalendar> {
  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ summary }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create calendar: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchEvents(
  accessToken: string,
  calendarId: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleEvent[]> {
  const url = new URL(`${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`);
  if (timeMin) url.searchParams.append('timeMin', timeMin);
  if (timeMax) url.searchParams.append('timeMax', timeMax);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events for calendar ${calendarId}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

let cachedPlanaroCalendar: GoogleCalendar | null = null;
let creationPromise: Promise<GoogleCalendar> | null = null;

export async function getOrCreatePlanaroCalendar(accessToken: string): Promise<GoogleCalendar> {
  if (cachedPlanaroCalendar) return cachedPlanaroCalendar;
  if (creationPromise) return creationPromise;

  creationPromise = (async () => {
    try {
      const calendars = await fetchCalendars(accessToken);
      // Case-insensitive search to prevent duplicates like 'Planaro' and 'planaro'
      const planaroCalendar = calendars.find(
        (cal) => cal.summary.toLowerCase() === 'planaro'
      );

      if (planaroCalendar) {
        console.log('Found existing Planaro calendar:', planaroCalendar.id, '(' + planaroCalendar.summary + ')');
        cachedPlanaroCalendar = planaroCalendar;
        return planaroCalendar;
      }

      console.log(`Planaro calendar not found in list of ${calendars.length} calendars. Creating one...`);
      const newCalendar = await createCalendar(accessToken, 'Planaro');
      cachedPlanaroCalendar = newCalendar;
      return newCalendar;
    } finally {
      creationPromise = null;
    }
  })();

  return creationPromise;
}

export async function createEvent(
  accessToken: string,
  calendarId: string,
  summary: string,
  start: Date,
  end: Date,
  description?: string
): Promise<GoogleEvent> {
  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary,
      description,
      start: {
        dateTime: start.toISOString(),
      },
      end: {
        dateTime: end.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create event: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const url = `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete event: ${response.statusText}`);
  }
}

export async function moveEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  destinationId: string
): Promise<GoogleEvent> {
  const url = `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}/move?destination=${encodeURIComponent(destinationId)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to move event: ${response.statusText}`);
  }

  return response.json();
}
