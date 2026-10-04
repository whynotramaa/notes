@part X | Socket programming and I/O | Packets become useful only when a server process reads and interprets their bytes. Without bounded admission and correct partial-I/O handling, a healthy network can still produce stuck workers or truncated messages. We will follow socket ownership, implement framing, and compare waiting threads with readiness-driven event loops. | where:10

## 47. Socket programming, buffers and partial I/O

Finch's SYN reaches a server port, but the application needs an accepted endpoint to read its request. A server creates a socket, binds a local address, listens for connections and accepts each admitted stream. The listener remains available while `accept` returns a distinct connected socket. A **file descriptor** is the process-local integer handle naming such a kernel object on systems with this interface.

The client creates a socket, connects to the destination, sends data, receives the response and closes. Socket buffers separate application calls from wire transmission. A successful send can accept fewer bytes than requested, and a receive can return only the currently available prefix. TCP's byte-stream contract requires application framing, such as a known length, delimiter or protocol parser.

@fig cn_socket | The listener admits a connection, then the accepted descriptor owns its stream. Orange marks accept, where one listening endpoint becomes a separate conversation. | narrow

A short framed reader keeps reading until the requested byte count arrives or the stream closes. The caller must validate the advertised length before allocating memory. This example reads an already validated `1,460` byte teaching payload; it does not implement HTTP or TLS parsing.

```python
def read_exact(sock, count):
    data = bytearray()
    while len(data) < count:
        chunk = sock.recv(count - len(data))
        if not chunk:
            raise EOFError("incomplete message")
        data.extend(chunk)
    return bytes(data)
```

The listening backlog limits pending admission under implementation-defined queue rules; it is not the application's active-worker count. A blocking socket waits inside a call. A non-blocking socket reports that it cannot progress now, and the application arranges another attempt after readiness. Both must handle errors, orderly EOF and deadlines.

Leaving every connection open exhausts descriptors and buffer memory even if the CPU is idle. Closing a descriptor also needs clear ownership when several tasks reference it. [Linux's socket interface](https://man7.org/linux/man-pages/man7/socket.7.html) documents the system-call boundary. For an interview, distinguish listener state, established transport state, buffered bytes and application message state before proposing a server architecture.

:::story Picture this
A receptionist owns the reception desk, then assigns each admitted visitor a separate meeting room. Accepting a visitor does not remove the reception desk. The room is an accepted socket, the queue outside is pending admission, and a partly delivered document still needs its remaining pages before the reader can interpret it.
:::

:::warn Watch out
Do not assume one `recv` returns one application message or one `send` transmits everything. Keep a parse buffer, handle partial writes, bound lengths, and distinguish EOF from a temporary non-blocking pause.
:::

## 48. Blocking, non-blocking and asynchronous I/O

Finch's response waits on storage while unrelated connections are ready to read. A single blocking server cannot make progress on those other streams until its current call returns. A thread per connection gives each stream a simple sequential owner, but many mostly idle threads consume memory and scheduling work. A thread pool bounds workers, yet blocking every worker still stops unrelated requests.

**Non-blocking I/O** lets a call report that it would wait instead of suspending its caller. A **readiness event** says an operation may now make progress. An **event loop** waits for these events and advances each connection's stored parsing and writing state. Readiness does not promise a complete application message, and the operation must still handle a short result or a changed condition.

@fig cn_io | Waiting threads keep individual call stacks, while a readiness loop stores per-connection progress. Orange marks epoll's ready subset rather than treating every open socket as active work. | narrow

`select` represents watched descriptors in bounded sets, while `poll` accepts a descriptor array. `epoll` on Linux and `kqueue` on BSD systems maintain kernel-side registrations and report relevant events through their respective interfaces. Asynchronous completion I/O instead reports a submitted operation's result; readiness and completion are different contracts.

An event loop can handle many idle sockets with relatively few threads because idle network waiting does not require a blocked thread per socket. It does not execute arbitrary CPU work in parallel on one loop. A blocking database call, long computation or unbounded callback can still delay every connection sharing it. Offload such work or use a compatible asynchronous interface.

Finch's packet still has `1,460` payload bytes irrespective of whether a thread or loop reads it. The architectural change affects scheduling and ownership, not transport message boundaries. [The epoll documentation](https://man7.org/linux/man-pages/man7/epoll.7.html) describes readiness and edge-triggered handling. Edge-triggered readers normally drain until the socket would block; otherwise an unread remainder can wait without another edge.

:::note Readiness and deadlines
A writable socket only has some sending capacity. A readable socket may yield EOF rather than data. Track application deadlines independently from both signals so a peer that trickles bytes cannot occupy a connection forever.
:::

:::interview Interview lens
**"How can an event loop serve many connections with few threads?"** It stores each connection's unfinished work as state and waits for sockets that can progress. Idle sockets do not consume a waiting thread per connection. Each callback must remain bounded and avoid blocking the loop. CPU work still needs CPU capacity, and partial reads still need framing.
:::

:::key In one breath
A listener accepts distinct connected sockets, and applications own descriptors and message state separately. TCP reads and writes can be partial, so every protocol needs framing and bounded buffers. Readiness loops reduce threads spent waiting but do not parallelize CPU work automatically. Correct servers combine admission limits, deadlines, explicit ownership and recovery from incomplete exchanges.
:::
