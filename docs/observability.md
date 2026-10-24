# Observability

## Matching a user report to a log line

Every API response carries an `X-Request-Id` header (8 hex characters), and every backend log line
written while that request runs is prefixed with it: `WARN [4ca8a8ee] ...`.

When something fails with HTTP 500, the response body also contains the id, and the message the
user sees ends with it:

```json
{"success":false,"message":"An unexpected error occurred. Please try again. (ref: 4ca8a8ee)","data":null,"requestId":"4ca8a8ee"}
```

To investigate, search the Render logs for that id. The `ERROR` line looks like:

```
ERROR [4ca8a8ee] ... GlobalExceptionHandler : Unhandled server error requestId=4ca8a8ee type=org.springframework.transaction.CannotCreateTransactionException method=GET path=/api/v1/dates
```

followed by the stack trace. The line names the exception type and the route (ids in the path are
replaced, e.g. `/api/v1/dates/{id}`), never the exception message, the query string, headers or
bodies.

## Slow requests

Any request slower than `app.observability.slow-request-ms` (default 500) logs one WARN line:

```
WARN [92583154] ... RequestTimingFilter : slow request method=GET path=/api/v1/home/summary status=200 durationMs=734
```

Never logged: query strings, the Authorization header or any token, request/response bodies,
UUIDs or numeric ids in the path.

Note that the first request after Render wakes the service is slow by nature (cold start), so a
burst of these right after a wake-up is expected.

## Frontend

- A global error boundary shows a "Something went wrong" screen with a reload button instead of a
  blank page. It also catches a lazily loaded page failing to download (typical right after a new
  deploy replaces the old file names).
- In development only (`npm run dev`), LCP, INP and CLS are logged to the browser console as
  `[web-vitals] ...`. Nothing is added to the production bundle.
