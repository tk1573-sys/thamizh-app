# Personal AI Companion integration

## Configured personality
- Friendly mentor/motivator, English responses
- Photo-based avatar after upload, cartoon fallback otherwise
- Voice via browser Speech Synthesis
- AI chat through the repository's existing same-origin \`POST /api/gemini\` proxy

## Integration with existing plans
The companion uses reminder templates derived from \`src/career-coach.js\`: Daily Coach tasks, PhD coursework, and unfinished certification entries. The user chooses the due date/time and recurrence. It does not assign arbitrary dates to all plans.

Reminder records use \`life-companion-reminders-v1\`; avatar and preferences use \`life-companion-settings-v1\`. Existing \`life-memory-v2\` remains unchanged. Health and Journal records are not read or included in AI prompts.

## Reminder behavior
The animated walking avatar is hidden while idle and enters the webpage when a reminder is due. Snooze moves it ten minutes later; Done advances recurring reminders or completes a one-time reminder. Desktop notifications are optional and require browser permission.

## Important limitation
This first integration runs inside the Life Command Centre/PWA. The page must remain running for the timer and animated overlay to run. A browser desktop notification can supplement it when permission is granted. A fully independent Windows companion that appears over other applications needs a native Windows shell and an intentional sync/API bridge; browser localStorage is not automatically available to an external executable.

## Validation
Open the PWA, click **Personal Companion**, upload a photo, choose a Coach/PhD/certification template, and set a due time about one minute ahead. Keep the PWA open; the character should enter with Snooze/Done controls. Test AI chat if Vercel's existing \`GEMINI_API_KEY\` is configured.
