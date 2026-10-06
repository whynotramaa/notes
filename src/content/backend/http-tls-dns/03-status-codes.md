@part III | HTTP status codes | We learn the status codes a backend actually returns and the one question each code answers. Clients, proxies, caches and retry logic all branch on these numbers, so a wrong code causes wrong behaviour far from your server. We will go class by class, from success through redirects to client and server errors. | where:3

## 9. 2xx success codes

The first digit of a status code gives its class. 1xx is informational, 2xx success, 3xx redirection, 4xx a client error and 5xx a server error. A client that does not recognise a specific code treats it like the x00 code of its class, so an unknown 299 behaves like 200. That fallback is why choosing the right class matters more than choosing the perfect code.

Within 2xx, each code tells the client something different. **200 OK** is general success with a body, as for `GET /orders/123`. **201 Created** says a new resource now exists, and it should come with a `Location: /orders/124` header so the client knows where to find it. **202 Accepted** says the server queued the work and has not done it yet. **204 No Content** says the action succeeded and there is nothing to send back, which suits a DELETE, or a PUT whose client already knows the result. **206 Partial Content** answers a `Range` request. A client resuming a 10,000,000-byte download sends `Range: bytes=0-999999` and receives exactly 1,000,000 bytes, with `Content-Range: bytes 0-999999/10000000` telling it where those bytes sit in the whole file.

@fig be_http_2xx | Five success codes. 202 is the honest answer when work continues after the response.

202 pairs with a pattern worth knowing by name, the **asynchronous request-reply** pattern. Wren's monthly sales report takes about a minute to build. Holding an HTTP request open that long ties up a connection, runs into proxy timeouts, and fails completely if the phone switches networks. Instead the server enqueues a job and returns 202 with `Location: /jobs/9`. The client polls that URL, perhaps every few seconds with a `Retry-After` hint from the server. While the job runs, `GET /jobs/9` returns 200 with `{"state":"running"}`. When it finishes, the job resource answers `303 See Other` pointing at `/reports/9`.

@fig be_http_202 | The asynchronous request pattern. The client holds a job URL instead of an open connection.

The common mistake is returning 200 from an endpoint that only queued the work. The client then shows "done" to the user, and the report never arrives if the worker fails.

## 10. 3xx redirects and 304

A redirect tells the client to look somewhere else, with the new URL in the `Location` header. The codes differ on two questions. Is the move permanent? May the client change the method when it follows?

**301 Moved Permanently** and **302 Found** are the original pair. Early browsers turned a redirected POST into a GET for both of them, dropping the body, and the specification eventually accepted that behaviour. **303 See Other** makes the change explicit. It means "fetch this other URL with GET", and it is the right answer after a form POST, because it stops a browser refresh from resubmitting the form. **307 Temporary Redirect** and **308 Permanent Redirect** were added later to forbid the method change. A POST redirected with 307 or 308 is resent as a POST with the same body.

@fig be_http_redirects | Permanent or temporary, and whether the method survives. For APIs, prefer 307 and 308.

Permanence has consequences. Browsers cache 301 and 308 responses, sometimes for as long as the browser profile lives. A wrong 301 can keep sending users to a dead URL long after you fix the server, and you cannot clear their caches. Test a move with 302 or 307 first and switch to the permanent code once you are sure. Search engines also treat permanent redirects as a signal to update their index.

**304 Not Modified** sits in this class but is not a move. It answers a conditional GET and means "the copy you already have is still current". It carries no body. Part IV explains how a client asks for it.

:::warn Watch out
Never redirect an API POST with 301 or 302. Many HTTP client libraries copy the old browser behaviour and resend it as a GET without the body. `POST /v1/orders` then turns into a `GET /v2/orders` that lists orders instead of creating one, and nothing errors. Use 308 for a moved endpoint.
:::

## 11. 4xx client errors

A 4xx says the client must change something before trying again. The skill is choosing the code that tells it what to change. **400 Bad Request** means the server could not parse or understand the message, for example malformed JSON. **401 Unauthorized** means the request lacks valid credentials, despite the name. It must carry a `WWW-Authenticate` header naming the scheme the client should use. **403 Forbidden** means the server knows who you are and you may not do this. **404 Not Found** means there is no such resource. **410 Gone** means it existed and was removed on purpose, which tells caches and crawlers to stop asking.

@fig be_http_401_403 | 401 asks for identity, and 403 has identity and refuses. Retrying a 403 with the same token never helps.

The rest each answer one narrow question. **405** means the route exists but not with this method. **409 Conflict** means the request is well formed but clashes with current state, such as paying for an order that is already paid. **412 Precondition Failed** means an `If-Match` or `If-Unmodified-Since` condition did not hold. **413 Content Too Large** means the body is over the size limit. **415 Unsupported Media Type** means the server does not accept this Content-Type. **422 Unprocessable Content** means the JSON parsed but its values are wrong, for example a quantity of minus 5. **429 Too Many Requests** means a rate limit was hit, ideally with `Retry-After` saying when to come back.

@fig be_http_4xx_tree | One question per code, roughly in the order a server checks them.

Some APIs deliberately return 404 instead of 403 when user 42 asks for user 43's order. A 403 would confirm that order 43 exists, and that leaks information. GitHub does this for private repositories. Pick one policy and apply it everywhere, because inconsistency is itself a leak.

:::interview Interview lens
**"Why might an API return 409 instead of 400?"** A 400 says the request is broken in itself and would fail against any state. A 409 says the request is fine and would succeed against a different state, such as creating a user whose email is taken or paying an order that is already paid. Clients react differently. After a 400 the developer fixes their code. After a 409 the client re-reads the resource, shows the user the conflict, or picks another value.
:::

## 12. 5xx server errors

A 5xx says the server failed. The client did nothing wrong, and the same request may work later. **500 Internal Server Error** means the application itself broke, usually through an unhandled exception. **503 Service Unavailable** means the server is deliberately refusing work for now, during overload or maintenance, and it should include `Retry-After`. Load balancers often treat a 503 from one backend as a signal to try another.

The other two come from proxies, and the difference between them is a favourite interview question. **502 Bad Gateway** means the proxy reached the backend and got an invalid answer. The backend reset the connection, crashed halfway through the response, or sent bytes that are not HTTP. **504 Gateway Timeout** means the proxy waited longer than its timeout and gave up. A 502 usually points at a backend that is crashing, restarting or misconfigured, for example listening on the wrong port. A 504 points at a backend that is slow or stuck, such as one waiting on a locked database row.

@fig be_http_502_504 | The proxy reports what it saw. 502 means a bad answer, 504 means no answer in time.

Neither code says whether the backend finished the work. A 504 on `POST /payments` can hide a successful charge, because the backend kept running after the proxy gave up. This is the lost-response problem from Section 8 again, and the idempotency key is the answer again.

Retry behaviour should follow the code. 503 with Retry-After invites a retry after the delay. 502 and 504 invite a retry only for idempotent requests or requests with an idempotency key. 500 rarely improves on retry, because the same input usually hits the same bug.

:::note 500 is a bug report
Return 500 only for failures in your own code. Map known dependency failures to 502, 503 or 504, and validation failures to 4xx. Then a dashboard of 500s is a list of bugs to fix instead of a mix of bugs, timeouts and bad input.
:::

:::key In one breath
2xx is success: 200 with a body, 201 with Location, 202 for queued work, 204 with no body, and 206 for a byte range. Redirects split on permanence and on whether the method survives, so use 303 after a form POST and 307 or 308 for APIs, while 304 means the cached copy is current. 401 lacks identity, 403 has it and refuses, 409 clashes with state, 412 fails a precondition, 422 fails validation and 429 is a rate limit. 500 is your bug, 503 a deliberate refusal, 502 a bad answer through a proxy and 504 no answer in time.
:::
