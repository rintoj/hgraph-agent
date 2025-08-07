# Date/Time Tools

Date and time tools provide comprehensive functionality for working with dates, times, timezones, and temporal calculations. These tools are essential for scheduling, logging, data analysis, and time-sensitive operations.

## Available Tools

### `getCurrentDateTime`

Gets the current date and time in various formats with timezone support.

**Description:** Retrieves the current system date and time with flexible formatting options and timezone conversion capabilities.

**Parameters:**
- `format` (string, optional, default: 'iso'): Output format - 'iso', 'locale', 'timestamp', or 'custom'
- `timezone` (string, optional): Target timezone (e.g., "UTC", "America/New_York", "Europe/London")
- `customFormat` (string, optional): Custom format string (required when format is 'custom')

**Returns:** Formatted date/time string

**Example:**
```typescript
import { createAgent, getCurrentDateTime } from '@hgraph/agent'

const agent = createAgent({
  name: 'TimeKeeper',
  description: 'Provides date and time information',
  instruction: 'Help with date/time queries and formatting',
  model: 'gemini'
})

agent.addTool('getCurrentDateTime', getCurrentDateTime)

// Usage examples:
// "What's the current time in ISO format?"
// "Get the current time in New York timezone"
// "Show me the current timestamp"
```

**Format Examples:**
```javascript
// ISO format (default)
getCurrentDateTime({ format: 'iso' })
// Returns: "2024-01-15T14:30:45.123Z"

// Locale format
getCurrentDateTime({ format: 'locale', timezone: 'America/New_York' })
// Returns: "1/15/2024, 9:30:45 AM"

// Timestamp
getCurrentDateTime({ format: 'timestamp' })
// Returns: "1705327845123"

// Custom format
getCurrentDateTime({ 
  format: 'custom', 
  customFormat: 'YYYY-MM-DD HH:mm:ss',
  timezone: 'UTC'
})
// Returns: "2024-01-15 14:30:45"
```

---

### `formatDateTime`

Formats existing date/time strings into different formats with timezone conversion.

**Description:** Converts date/time strings between different formats and timezones with comprehensive parsing support.

**Parameters:**
- `dateTime` (string, required): Date/time string to format (ISO, timestamp, or parseable format)
- `outputFormat` (string, optional, default: 'iso'): Target format - 'iso', 'locale', 'timestamp', or 'custom'
- `timezone` (string, optional): Target timezone for conversion
- `customFormat` (string, optional): Custom format pattern (required for 'custom' format)

**Returns:** Reformatted date/time string

**Example:**
```typescript
agent.addTool('formatDateTime', formatDateTime)

// Usage examples:
// "Convert '2024-01-15T14:30:45Z' to local time"
// "Format this timestamp to YYYY-MM-DD format"
// "Convert this date to Tokyo timezone"
```

**Conversion Examples:**
```javascript
// ISO to locale
formatDateTime({
  dateTime: '2024-01-15T14:30:45Z',
  outputFormat: 'locale',
  timezone: 'Europe/London'
})

// Timestamp to custom format
formatDateTime({
  dateTime: '1705327845000',
  outputFormat: 'custom',
  customFormat: 'DD/MM/YYYY HH:mm'
})

// Timezone conversion
formatDateTime({
  dateTime: '2024-01-15 09:30:00',
  timezone: 'Asia/Tokyo'
})
```

---

### `parseDateTime`

Parses date/time strings and extracts detailed component information.

**Description:** Analyzes date/time strings and returns comprehensive information including components, timezone data, and multiple format representations.

**Parameters:**
- `dateTime` (string, required): Date/time string to parse
- `inputFormat` (string, optional): Expected input format hint (for ambiguous dates)

**Returns:** JSON object with detailed date/time information

**Example:**
```typescript
agent.addTool('parseDateTime', parseDateTime)

// Usage examples:
// "Parse '2024-01-15T14:30:45Z' and show all components"
// "Analyze this date string and extract day of week"
// "Parse timestamp and show timezone information"
```

**Sample Output:**
```json
{
  "originalInput": "2024-01-15T14:30:45Z",
  "parsedDate": {
    "iso": "2024-01-15T14:30:45.000Z",
    "timestamp": 1705327845000,
    "locale": "1/15/2024, 2:30:45 PM",
    "utc": "Mon, 15 Jan 2024 14:30:45 GMT"
  },
  "components": {
    "year": 2024,
    "month": 1,
    "day": 15,
    "hour": 14,
    "minute": 30,
    "second": 45,
    "millisecond": 0,
    "dayOfWeek": 1,
    "dayName": "Monday",
    "monthName": "January"
  },
  "timezone": {
    "offset": -300,
    "offsetString": "+05:00"
  }
}
```

---

### `calculateDateDifference`

Calculates the difference between two dates in various units.

**Description:** Computes time differences with support for multiple units and provides both positive and absolute values.

**Parameters:**
- `startDate` (string, required): Start date/time string
- `endDate` (string, required): End date/time string  
- `unit` (string, optional, default: 'days'): Unit for calculation - 'milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', or 'years'

**Returns:** JSON object with difference calculations and metadata

**Example:**
```typescript
agent.addTool('calculateDateDifference', calculateDateDifference)

// Usage examples:
// "How many days between January 1st and today?"
// "Calculate hours between these two timestamps"
// "Find the difference in months between these dates"
```

**Sample Output:**
```json
{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-15T14:30:45.000Z", 
  "difference": {
    "value": 14.6,
    "unit": "days",
    "absolute": 14.6
  },
  "raw": {
    "milliseconds": 1264245000
  }
}
```

**Calculation Examples:**
```javascript
// Days between dates
calculateDateDifference({
  startDate: '2024-01-01',
  endDate: '2024-01-15',
  unit: 'days'
})

// Hours for project timeline
calculateDateDifference({
  startDate: '2024-01-15T09:00:00Z',
  endDate: '2024-01-15T17:30:00Z',
  unit: 'hours'
})
```

---

### `addToDate`

Adds or subtracts time from a date and returns the result.

**Description:** Performs date arithmetic by adding or subtracting specified amounts of time in various units.

**Parameters:**
- `dateTime` (string, required): Base date/time string
- `amount` (number, required): Amount to add (negative values subtract)
- `unit` (string, required): Time unit - 'milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', or 'years'
- `outputFormat` (string, optional, default: 'iso'): Result format - 'iso', 'locale', or 'timestamp'

**Returns:** New date/time string after calculation

**Example:**
```typescript
agent.addTool('addToDate', addToDate)

// Usage examples:
// "Add 7 days to '2024-01-15'"
// "Subtract 3 hours from the current time"
// "Add 2 months to this project start date"
```

**Date Arithmetic Examples:**
```javascript
// Add business days
addToDate({
  dateTime: '2024-01-15T09:00:00Z',
  amount: 5,
  unit: 'days'
})
// Returns: "2024-01-20T09:00:00.000Z"

// Subtract months
addToDate({
  dateTime: '2024-06-15',
  amount: -3,
  unit: 'months',
  outputFormat: 'locale'
})
// Returns: "3/15/2024, 12:00:00 AM"

// Add hours with timestamp output
addToDate({
  dateTime: '2024-01-15T14:30:00Z',
  amount: 24,
  unit: 'hours',
  outputFormat: 'timestamp'
})
```

---

### `getTimezone`

Gets timezone information for the system or a specific timezone.

**Description:** Retrieves detailed timezone information including current time, offset, and timezone name.

**Parameters:**
- `timezone` (string, optional): Specific timezone to query (e.g., "America/New_York", "Europe/London")

**Returns:** JSON object with timezone information

**Example:**
```typescript
agent.addTool('getTimezone', getTimezone)

// Usage examples:
// "What timezone is the system using?"
// "Get timezone information for Tokyo"
// "Show me the current time in London"
```

**Sample Output (System Timezone):**
```json
{
  "systemTimezone": "America/New_York",
  "offset": "+05:00",
  "offsetMinutes": -300,
  "currentTime": "1/15/2024, 9:30:45 AM",
  "currentTimeISO": "2024-01-15T14:30:45.123Z"
}
```

**Sample Output (Specific Timezone):**
```json
{
  "timezone": "Asia/Tokyo",
  "timeZoneName": "Japan Standard Time",
  "currentTime": "1/15/2024, 11:30:45 PM",
  "currentTimeISO": "2024-01-15T14:30:45.123Z"
}
```

## Common Use Cases

### Scheduling Agent
```typescript
const schedulerAgent = createAgent({
  name: 'ScheduleManager',
  description: 'Manages schedules and appointments',
  instruction: 'Help with scheduling, time calculations, and calendar management',
  model: 'gemini-pro'
})

schedulerAgent.addTools({
  getCurrentDateTime,
  addToDate,
  calculateDateDifference,
  getTimezone
})

// Usage examples:
// "Schedule a meeting for next Tuesday at 2 PM"
// "How long until the project deadline?"
// "What time is 3 PM EST in Tokyo?"
// "Add 30 minutes to this appointment time"
```

### Log Analysis Agent
```typescript
const logAnalyzer = createAgent({
  name: 'LogAnalyzer',
  description: 'Analyzes timestamp-based logs',
  instruction: 'Parse log timestamps and calculate time-based metrics',
  model: 'gemini'
})

logAnalyzer.addTools({
  parseDateTime,
  calculateDateDifference,
  formatDateTime
})

// Usage examples:
// "Parse all timestamps in this log file"
// "Calculate average response time between requests"
// "Convert all timestamps to local timezone"
```

### Project Timeline Agent
```typescript
const timelineAgent = createAgent({
  name: 'ProjectTimeline',
  description: 'Manages project timelines and deadlines',
  instruction: 'Help track project milestones and calculate schedules',
  model: 'gemini'
})

timelineAgent.addTools({
  addToDate,
  calculateDateDifference,
  getCurrentDateTime,
  formatDateTime
})

// Usage examples:
// "If we start on Monday, when will Phase 1 complete (14 days)?"
// "How many working days until the deadline?"
// "Create milestone dates for this 6-month project"
```

### Time Tracking Agent
```typescript
const timeTracker = createAgent({
  name: 'TimeTracker',
  description: 'Tracks time and generates reports',
  instruction: 'Help track work hours and generate time reports',
  model: 'gemini'
})

timeTracker.addTools({
  getCurrentDateTime,
  calculateDateDifference,
  parseDateTime,
  formatDateTime
})

// Usage examples:
// "Calculate total hours worked this week"
// "Generate timesheet for the last month"
// "Track break duration between clock in/out times"
```

## Advanced Usage Patterns

### Recurring Events
```typescript
// Calculate next occurrence of weekly meeting
const nextMeeting = await addToDate({
  dateTime: lastMeetingDate,
  amount: 7,
  unit: 'days'
})

// Find all Mondays in the next month
const mondays = []
let current = await addToDate({
  dateTime: startOfMonth,
  amount: 0,
  unit: 'days'
})

for (let i = 0; i < 31; i++) {
  const dateInfo = await parseDateTime({ dateTime: current })
  if (dateInfo.components.dayOfWeek === 1) { // Monday
    mondays.push(current)
  }
  current = await addToDate({
    dateTime: current,
    amount: 1,
    unit: 'days'
  })
}
```

### Business Hours Calculations
```typescript
// Check if current time is during business hours
const now = await getCurrentDateTime({ timezone: 'America/New_York' })
const currentInfo = await parseDateTime({ dateTime: now })

const isBusinessHours = 
  currentInfo.components.dayOfWeek >= 1 && // Monday or later
  currentInfo.components.dayOfWeek <= 5 && // Friday or earlier
  currentInfo.components.hour >= 9 &&     // After 9 AM
  currentInfo.components.hour < 17        // Before 5 PM

// Calculate next business day
const nextBusinessDay = async (date) => {
  let nextDay = await addToDate({ dateTime: date, amount: 1, unit: 'days' })
  const dayInfo = await parseDateTime({ dateTime: nextDay })
  
  // Skip weekends
  if (dayInfo.components.dayOfWeek === 0) { // Sunday
    nextDay = await addToDate({ dateTime: nextDay, amount: 1, unit: 'days' })
  } else if (dayInfo.components.dayOfWeek === 6) { // Saturday  
    nextDay = await addToDate({ dateTime: nextDay, amount: 2, unit: 'days' })
  }
  
  return nextDay
}
```

### Age Calculations
```typescript
// Calculate exact age in years, months, days
const calculateAge = async (birthDate) => {
  const now = await getCurrentDateTime()
  const birth = await parseDateTime({ dateTime: birthDate })
  const current = await parseDateTime({ dateTime: now })
  
  let years = current.components.year - birth.components.year
  let months = current.components.month - birth.components.month
  let days = current.components.day - birth.components.day
  
  if (days < 0) {
    months--
    days += 30 // Approximate
  }
  
  if (months < 0) {
    years--
    months += 12
  }
  
  return { years, months, days }
}
```

## Timezone Handling

### Multi-Timezone Operations
```typescript
// Meeting across timezones
const scheduleMeeting = async (localTime, participants) => {
  const meetingTimes = {}
  
  for (const participant of participants) {
    const convertedTime = await formatDateTime({
      dateTime: localTime,
      outputFormat: 'locale',
      timezone: participant.timezone
    })
    
    meetingTimes[participant.name] = {
      timezone: participant.timezone,
      localTime: convertedTime
    }
  }
  
  return meetingTimes
}

// Usage
const meeting = await scheduleMeeting('2024-01-15T15:00:00Z', [
  { name: 'John', timezone: 'America/New_York' },
  { name: 'Yuki', timezone: 'Asia/Tokyo' },
  { name: 'Emma', timezone: 'Europe/London' }
])
```

### Daylight Saving Time
```typescript
// Handle DST transitions
const isDSTTransition = async (date, timezone) => {
  const before = await formatDateTime({
    dateTime: await addToDate({ dateTime: date, amount: -1, unit: 'days' }),
    timezone,
    outputFormat: 'custom',
    customFormat: 'Z'
  })
  
  const after = await formatDateTime({
    dateTime: await addToDate({ dateTime: date, amount: 1, unit: 'days' }),
    timezone,
    outputFormat: 'custom', 
    customFormat: 'Z'
  })
  
  return before !== after
}
```

## Performance Considerations

### Caching Strategies
```typescript
// Cache timezone information
const timezoneCache = new Map()

const getCachedTimezone = async (timezone) => {
  if (timezoneCache.has(timezone)) {
    return timezoneCache.get(timezone)
  }
  
  const info = await getTimezone({ timezone })
  timezoneCache.set(timezone, info)
  return info
}

// Batch date operations
const batchDateOperations = async (dates, operation) => {
  return Promise.all(dates.map(date => operation(date)))
}
```

### Efficient Date Calculations
```typescript
// Use timestamps for large calculations
const efficientDateDiff = async (start, end) => {
  const startTs = await formatDateTime({
    dateTime: start,
    outputFormat: 'timestamp'
  })
  
  const endTs = await formatDateTime({
    dateTime: end,
    outputFormat: 'timestamp'
  })
  
  return parseInt(endTs) - parseInt(startTs)
}
```

## Error Handling

### Invalid Date Handling
```typescript
const safeDateParse = async (dateString) => {
  try {
    return await parseDateTime({ dateTime: dateString })
  } catch (error) {
    return {
      error: `Invalid date: ${error.message}`,
      originalInput: dateString
    }
  }
}

// Validate date ranges
const validateDateRange = async (start, end) => {
  const diff = await calculateDateDifference({
    startDate: start,
    endDate: end,
    unit: 'milliseconds'
  })
  
  if (diff.difference.value < 0) {
    throw new Error('End date must be after start date')
  }
}
```

### Timezone Validation
```typescript
const validateTimezone = async (timezone) => {
  try {
    await getTimezone({ timezone })
    return true
  } catch (error) {
    return false
  }
}
```

## Integration Examples

### Calendar Application
```typescript
const calendarAgent = createAgent({
  name: 'CalendarManager',
  description: 'Manages calendar events and scheduling',
  instruction: 'Help with calendar management and event scheduling',
  model: 'gemini-pro'
})

calendarAgent.addTools({
  getCurrentDateTime,
  addToDate,
  calculateDateDifference,
  formatDateTime,
  getTimezone
})

// Features:
// - Schedule recurring meetings
// - Calculate event durations
// - Handle timezone conversions
// - Generate calendar reports
```

### Data Analytics Dashboard
```typescript
const analyticsAgent = createAgent({
  name: 'AnalyticsDashboard',
  description: 'Analyzes time-series data',
  instruction: 'Process temporal data and generate insights',
  model: 'gemini-pro'
})

analyticsAgent.addTools({
  parseDateTime,
  calculateDateDifference,
  formatDateTime
})

// Features:
// - Parse log timestamps
// - Calculate time-based metrics
// - Generate time-series reports
// - Identify patterns and trends
```