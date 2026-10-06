@part I | HTTP messages | We take apart one HTTP request and one response, line by line. Every later topic in backend work, from caching to authentication, is a rule about some line in these messages. We will read the start line, the headers that frame the body, and the headers that describe the client. | where:1

## 1. The request/response lifecycle

You open the Wren app and tap your last order. A moment later the screen says "Paid, arriving in 12 minutes". In between, the phone sent about 200 bytes of text to a server and got about 2,000 bytes back. That exchange is HTTP, and almost everything a backend engineer builds sits on top of it.

**HTTP** (Hypertext Transfer Protocol) is a request/response protocol. The client sends one **request** that names an action and a resource. The server sends back exactly one **response** with a status and usually a body. The server never speaks first, and it never answers a question nobody asked. Each exchange also stands alone. The server keeps no memory of the previous request on the same connection, so anything that must carry over, such as "this is user 42", travels inside every request as a cookie or a token. People call this property **statelessness**, and it is the reason a load balancer can send your next request to a different machine without anything breaking.

The lifecycle has five steps. First the client gets a connection, either a new one or an idle one from its pool. It writes the request onto that connection. The server reads and parses the bytes, routes the request to a handler, and runs it. For Wren's `GET /orders/123` the handler authenticates the caller, loads order 123 from PostgreSQL, checks that it belongs to user 42 and renders JSON. The server writes the response. Finally the client reads it, and the connection either closes or waits for the next request.

Put numbers on it. The handler takes 30 ms. On a cold start the whole exchange takes 175 ms, and Part IX accounts for every one of the other 145 ms. When a request feels slow, the handler is often not where the time went.

@fig be_http_lifecycle | One exchange on a long-lived connection. The orange box is the only part the application code controls.

:::story Picture this
A restaurant with a strict waiter. You hand over an order slip, the kitchen cooks, and the waiter brings back one plate with a receipt stapled to it. The waiter never brings food you did not order, and the kitchen forgets you between slips unless you show your loyalty card each time. The card is the cookie or the token.
:::

## 2. Request line, status line and headers

In HTTP/1.1 a request is plain text, and you can type one by hand with `telnet` or `nc`. The first line is the **request line**. It has three fields separated by single spaces: the method (`GET`), the request target (`/orders/123`) and the protocol version (`HTTP/1.1`). After it come **headers**, one `Name: value` pair per line. An empty line ends the headers, and an optional body follows. Every line ends with a carriage return and a line feed, two bytes written `\r\n`.

A response has the same shape. Its first line is the **status line**, which holds the version, a three-digit status code and a reason phrase, as in `HTTP/1.1 201 Created`. Then come headers, the empty line and the body.

@fig be_http_wire | The full text of Wren's request and response. The empty line is how a parser knows the headers have ended.

The status code is for programs and the reason phrase is for people. Client code must branch on `201`, never on the word `Created`, and HTTP/2 dropped the phrase entirely. Header names are case-insensitive, so `content-type` and `Content-Type` mean the same header, and HTTP/2 sends them all in lowercase. A header may appear more than once. `Set-Cookie` usually does, once per cookie, and a parser has to keep every copy.

The request target is usually a path plus an optional query string, `/orders?status=paid&page=2`. Proxies may receive the absolute form, `http://api.wren.example/orders`, and CONNECT uses the authority form, `api.wren.example:443`. Your framework hides these details, but they explain why a router sometimes sees a target it did not expect.

HTTP/2 and HTTP/3 send exactly these fields in binary frames instead of text lines, with the method and path moved into pseudo-headers named `:method` and `:path`. The meaning does not change, which is why a handler in your framework never needs to know which version carried its request.

@fig be_http_anatomy | The request line names an action, and the status line names an outcome.

:::warn Watch out
Do not parse HTTP yourself with string splitting. Real parsers deal with repeated headers, odd whitespace, conflicting lengths and oversized lines. When two parsers disagree about where a message ends, an attacker can hide a second request inside the first. That attack is request smuggling, and Unit XIII covers it.
:::

## 3. Bodies and the headers that frame them

A server reading a body has to know where it stops. Bytes keep arriving on the same connection, and the next request may follow immediately, so "read until the connection closes" does not work. HTTP/1.1 offers two ways to mark the end. **Content-Length** gives the exact byte count. Wren's order response sets `Content-Length: 2000`, so the reader takes exactly 2,000 bytes and knows the message is complete.

Sometimes the size is unknown when sending starts, for example a sales report generated row by row from a database cursor. Buffering the whole report to measure it would waste memory and delay the first byte. **Transfer-Encoding: chunked** solves this. The body goes out as a series of chunks. Each chunk starts with its size in hexadecimal, so a 2,000-byte chunk begins with `7d0` and a 1,024-byte chunk with `400`. A chunk of size zero marks the end. HTTP/2 and HTTP/3 have their own framing and do not use chunked encoding at all.

@fig be_http_framing | Two ways to frame the body. Chunked encoding lets a server start sending before it knows the total size.

Two more headers describe the bytes themselves. **Content-Type** says what they mean, for example `application/json` or `text/html; charset=utf-8`. **Content-Encoding** says how they were compressed, usually `gzip` or `br` for Brotli. The client says what it can handle with `Accept` and `Accept-Encoding`. The server picks one option, sends it and labels it. This exchange is called **content negotiation**. If nothing on offer works, the server returns `406 Not Acceptable` or, more often, ignores the preference and sends its default.

Compression matters at Wren's scale. JSON is repetitive text, and a 2,000-byte order typically compresses to a few hundred bytes. At 2,000 responses per second that is the difference between 4,000,000 and well under 1,000,000 bytes per second leaving the data centre. The cost is CPU time on both ends, which is why servers skip compression for small bodies and for formats that are already compressed, such as JPEG images.

@fig be_http_encoding | The client offers, the server chooses and labels. `Vary` warns caches that the answer depends on the offer.

:::note Never send both
A message with both `Content-Length` and `Transfer-Encoding: chunked` is ambiguous. The specification says chunked wins and the length must be ignored. A proxy and a backend that follow different rules will split the byte stream in different places. Reject such requests at the edge.
:::

## 4. Headers that describe the client

Some headers describe the sender rather than the body. **Host** names the site the client wants to reach. It became mandatory in HTTP/1.1 because one IP address often serves many domains, and the server uses Host to pick the right application. That arrangement is called virtual hosting, and it is how one Nginx process can serve `api.wren.example`, `www.wren.example` and `admin.wren.example` from a single address. HTTP/2 carries the same value in the `:authority` pseudo-header. A request without Host in HTTP/1.1 is invalid, and servers answer it with 400.

@fig be_http_client_headers | One address, three applications. Host decides which one gets the request.

`User-Agent` names the client software, for example `WrenApp/5.2 (iOS 18)`. It helps with analytics and with spotting a buggy app version, and anyone can fake it. `Referer` carries the URL of the page that led to the request. The misspelling dates from the original 1996 specification, and nobody ever fixed it. `Origin` carries only the scheme, host and port of the page that started the request. Unit II builds CORS and CSRF defences on it. `Authorization` carries credentials, usually `Bearer <token>`, and Unit III covers what goes inside.

Every one of these headers is input the client chose. A server may log User-Agent and use Referer for analytics, but it must never grant access because of either. A rule like "allow admin features when User-Agent contains WrenAdmin" lasts until the first person reads the app's traffic with a proxy.

:::interview Interview lens
**"What is the Host header for, and what goes wrong if you trust it?"** Host tells a server which site the client wants, so one IP address can serve many domains. It is still client input. If the application builds absolute URLs from it, for example the link in a password-reset email, an attacker can send `Host: evil.example` and get a genuine reset email whose link points at their own server. Configure the canonical host name in settings and reject unknown Host values at the proxy.
:::

:::key In one breath
HTTP is one request and one response, client first, with no memory between exchanges. A message is a start line, headers, an empty line and an optional body, and the body ends where Content-Length says or where a zero-size chunk appears. Content-Type says what the bytes mean, Content-Encoding says how they were compressed, and Accept headers let the client offer choices. Host picks the virtual site, and User-Agent, Referer, Origin and Authorization describe the client but are all untrusted input.
:::
