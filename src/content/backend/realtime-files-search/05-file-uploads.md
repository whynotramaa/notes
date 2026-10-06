@part V | File uploads | We accept files from users without letting them crash the server, fool it about what they uploaded, or write outside where they should. Every byte of an upload is attacker-controlled, including its name and its claimed type. We will cover multipart bodies, streaming and limits, validating content, and filename attacks with path traversal. | where:5

## 15. Multipart bodies, streaming and limits

When a browser form or app uploads a photo along with a caption, it usually sends a **multipart/form-data** body, defined in RFC 7578. The `Content-Type` header names a **boundary**, a random string such as `----wren7MA4YWxk`. The body consists of parts separated by lines containing that boundary. Each part has its own headers, a `Content-Disposition` naming the form field and, for files, a `filename`, and optionally a `Content-Type`, followed by a blank line and the part's raw bytes. The body ends with the boundary followed by two dashes.

@fig be_up_multipart | A caption part and a photo part, separated by the boundary. The filename and type are the client's claims.

Parsing multipart is fiddly and has a history of security bugs, so Wren uses its framework's parser rather than writing one, and configures it carefully. The most important setting is whether the parser **buffers** or **streams**. A buffering parser reads the whole body into memory or a temporary file before the handler sees it. That is simple, and dangerous for large files. Fifty concurrent uploads of 100 MB each, buffered in memory, need 5 GB of RAM, and an attacker can send that on purpose.

@fig be_up_stream | Buffering holds every upload in memory at once. Streaming passes chunks through at constant memory.

A **streaming** parser hands the handler each file part as a stream of chunks, and the handler passes chunks on, to a temporary file or straight to object storage, as they arrive. Memory stays at a few chunks per upload whatever the file size, and limits can be enforced as the bytes arrive rather than after they have all been received.

**Limits** come at several layers. The reverse proxy rejects bodies over a maximum size, Nginx's `client_max_body_size`, returning **413 Content Too Large**, before the application sees a byte. The application enforces a per-file limit by type, 10 MB for photos, and a limit on the number of parts and the size of each non-file field, since a body with a million tiny fields is its own attack. Timeouts bound how long a client may take to send the body, so a slowly dripping upload cannot hold a connection forever, Unit XI. And per-user upload rates are limited, Unit X, since storage costs money.

Even with streaming and limits, files flowing through the application server have a deeper cost, Part VI explains why large uploads should not pass through the application at all.

## 16. Validating what was uploaded

The client says the file is `IMG_2041.jpg` with `Content-Type: image/jpeg`. Neither claim proves anything. A user, or a script, can send any bytes with any name and type. If Wren trusted them, an attacker could upload an HTML file named `photo.jpg` with a script inside, and if it were later served from Wren's domain with the claimed type ignored or sniffed by a browser, it could run as Wren, a stored cross-site scripting attack. Or they could upload a PHP or JSP file to a server that executes files in its upload directory.

Validation starts from the bytes. Most file formats begin with a fixed signature, the **magic bytes**. PNG files start with `89 50 4E 47 0D 0A 1A 0A`. JPEG files start with `FF D8 FF`. PDF files start with `%PDF-`, `25 50 44 46 2D`. A library such as libmagic, behind the Unix `file` command, recognises hundreds of signatures. Wren reads the first bytes of each upload, checks them against an allowlist of types for that endpoint, and rejects anything else, including a "photo.jpg" whose first bytes are `<?php`.

@fig be_up_magic | Real PNG, JPEG and PDF signatures, and a "photo" that is really a PHP script.

Magic bytes prove only how a file starts. **Polyglot** files are valid in two formats at once, such as a GIF that is also valid JavaScript, and image files can carry hidden data in metadata or after their end markers. The strongest defence for images is to **decode and re-encode** them, loading the image with an image library and writing a fresh JPEG or WebP from the decoded pixels. Anything that is not pixels, hidden scripts, extra data, EXIF metadata including GPS coordinates of the user's home, is discarded. Image libraries themselves have had serious vulnerabilities, so decoding runs in an isolated worker with limits on image dimensions, which also stops "decompression bombs", small files that decode to gigantic images.

Documents and arbitrary files need **malware scanning**, with ClamAV or a cloud scanning service, before anyone else can download them. Wren's pipeline puts every upload in a quarantine location first, runs size, type, decoding and scanning steps in a background worker, Unit VIII, and only then moves the result to the public location and marks it available. Nothing is served from quarantine.

@fig be_up_pipeline | Size, signature, re-encode, scan, and only then publish. Failures never leave quarantine.

When files are served, the response sets the true content type, `X-Content-Type-Options: nosniff` so browsers do not guess, and for downloads `Content-Disposition: attachment`. Best of all, user content is served from a separate domain, such as `wrenusercontent.example`, so even a file that slipped through cannot run with access to Wren's cookies, Unit II.

## 17. Filenames and path traversal

The `filename` in a multipart part is another attacker-controlled string. Code that saves uploads with `open(os.path.join(UPLOAD_DIR, filename), "wb")` trusts it completely. A filename of `../../../etc/passwd`, or on Windows `..\..\web.config`, climbs out of the upload directory and overwrites whatever file the path reaches, an attack called **path traversal**. If the server runs with enough permissions, an attacker can replace configuration, scripts or SSH keys.

@fig be_up_traversal | "../../../etc/passwd" walks up from the uploads directory to the system's password file.

Filenames have other traps. They may contain null bytes, which some older APIs treat as the end of the string, so `photo.php\0.jpg` passes a check for `.jpg` and is saved as `photo.php`. They may use Unicode tricks, such as right-to-left override characters that make `gpj.exe` display as `exe.jpg`, or look-alike characters. They may be reserved names on Windows, such as `CON` or `NUL`. They may be 10,000 characters long. And two users may upload `photo.jpg` at the same moment and overwrite each other.

The robust fix is to never use the client's filename as a storage path at all. Wren stores every upload under a key it generates, such as `u/42/8f3a2c91.jpg`, built from the user's id, a random identifier and an extension derived from the validated type, not from the client's name. The original filename, if worth keeping, is stored as metadata in the database after sanitizing it for display, and only ever used in a `Content-Disposition` header when downloading, with proper encoding.

Where code must build file paths from input, for example to serve files from a directory, it should resolve the full path, `realpath` or `Path.resolve`, and check that the result is still inside the intended directory before opening anything. Checking the string for `..` is not enough, because encodings such as `%2e%2e%2f`, doubled encodings and symbolic links bypass naive checks. Unit XIII covers path traversal as one of the injection family.

The simplest protection of all is architectural. If uploads go to object storage under generated keys, Part VI, there is no filesystem path to traverse.

:::story Picture this
A cloakroom that lets guests write their own ticket numbers. Most write sensible ones. One writes "the manager's office", and the attendant, following instructions, hangs the coat there. A cloakroom that hands out its own numbered tickets never has this problem, and keeps the guest's name on a separate card if anyone needs it.
:::

:::note Resumable uploads from mobile
Phones lose connections mid-upload. The tus protocol and object storage multipart uploads, Part VI, let clients upload in chunks and resume from the last confirmed byte, so a 50 MB video does not restart from zero after a tunnel. Wren's app uploads large files in 5 MB chunks with resumption.
:::

:::warn Watch out
Validating the file extension or the client's Content-Type and then serving the file from your main domain is how upload features become stored XSS. Validate the bytes, re-encode images, store under generated names, set nosniff, and serve user content from a separate domain.
:::

:::interview Interview lens
**"How do you handle file uploads safely?"** Limit body size at the proxy and per file in the app, stream rather than buffer, and time out slow uploads. Treat the filename and Content-Type as untrusted: check magic bytes against an allowlist, decode and re-encode images in an isolated worker with dimension limits, and scan other files for malware, keeping everything in quarantine until it passes. Store under generated keys, never the client's filename, to prevent path traversal and collisions. Serve with the true type, nosniff and Content-Disposition, from a separate domain, and ideally have large files go directly to object storage with presigned URLs.
:::

:::key In one breath
Multipart bodies separate parts with a boundary, and parsers should stream chunks rather than buffer, since 50 buffered 100 MB uploads need 5 GB, with limits enforced at the proxy (413), per file, per field count and by time. Names and types from the client prove nothing, so validate magic bytes such as PNG's 89 50 4E 47, re-encode images to strip hidden data and metadata, scan other files, and keep uploads in quarantine until they pass. Never build paths from client filenames, since `../../../etc/passwd` traverses out of the directory, and store under generated keys like `u/42/8f3a2c91.jpg`, served with nosniff from a separate domain.
:::
