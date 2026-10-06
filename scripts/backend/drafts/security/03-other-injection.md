@part III | Command, template, LDAP and XML injection | We follow the injection pattern into every other interpreter a backend talks to. Shells, template engines, directory servers and XML parsers each have their own syntax and their own way of letting data become instructions. We will cover command and argument injection, server-side template injection, LDAP injection and XML external entities, and path traversal with archive extraction. | where:3

## 8. Command and argument injection

Wren lets restaurants upload a menu as a PDF, and a worker turns each page into an image. The first version shells out to a command-line tool: `os.system("pdftoppm -png " + path + " /tmp/out")`. The path comes from Wren's own storage key, which looks safe. But the `system` call does not run `pdftoppm` directly. It passes the whole string to `/bin/sh`, which interprets spaces, quotes, `;`, `&&`, `|`, backticks and `$( )`. If any part of that string can be influenced by a user, the user can append a second command, and that command runs with the worker's permissions. This is **command injection**, and it usually means full control of the machine.

The fix follows the same principle as parameterized queries. Do not use a shell, and pass the program and its arguments as a list: `subprocess.run(["pdftoppm", "-png", path, "/tmp/out"], shell=False)` in Python, `execFile` rather than `exec` in Node.js, `ProcessBuilder` with separate arguments in Java. The operating system's `execve` call receives an array of strings, and each element arrives in the program as one argument, whatever characters it contains. No shell ever parses it, so there is no syntax to break out of.

@fig be_sec_cmd | A command string goes through a shell that parses metacharacters. An argument list goes straight to execve.

Argument lists close the shell, but not a quieter cousin, **argument injection**. If a user controls a whole argument and it starts with `-`, the program may read it as an option. A file named `--output=/etc/cron.d/x` passed to a tool that accepts `--output` changes what the tool does. Git, tar, curl, ssh and many converters have options that write files or run commands. The defences are to put `--` before user-supplied arguments, which most Unix tools treat as "no more options", to prefix relative paths with `./`, and to validate that arguments match an expected pattern, such as Wren's generated storage keys.

The deeper fix is to avoid external processes where a library will do. Wren now renders PDFs with a library call inside a sandboxed worker, the same pattern as image decoding in Unit XII. Where a tool is unavoidable, the worker runs it in a container with no network, a read-only filesystem except one scratch directory, and a CPU and memory limit. That matters because converters themselves have had injection bugs. In 2016, "ImageTragick", CVE-2016-3714, let crafted image files make ImageMagick run shell commands through its delegate feature, with no shell call in the application at all. In 2014, Shellshock let environment variables passed to bash run code, reaching CGI scripts that never called a shell on purpose.

## 9. Server-side template injection

Wren lets each restaurant group customise the receipt email its customers get, with placeholders such as `{{ customer.name }}` and `{{ order.total }}`. The first implementation stores the restaurant's text and renders it with the same Jinja2 engine that renders Wren's own pages: `env.from_string(group.receipt_template).render(order=order)`. That line treats the restaurant's text as a program. Template languages are programming languages, with expressions, attribute access, loops and filters. An expression that walks from an ordinary object to Python's internals can reach functions that read files or run commands. This is **server-side template injection**, SSTI, and in most engines it leads to remote code execution.

The standard detection probe is harmless. A template containing `{{7*7}}` that renders as `49` proves the input is being evaluated rather than displayed. Scanners send it, alongside variants for other engines such as `${7*7}` for FreeMarker and `<%= 7*7 %>` for ERB, and a security review should look for any code path where user text reaches a template engine's compile or "from string" function.

@fig be_sec_ssti | Data passed into a template is displayed. A template built from user text is executed.

The key distinction is between data in a template and a template made of data. Rendering Wren's own template with a review's text as a variable is safe, because the engine treats variables as values and, with autoescaping, encodes them for HTML. The danger is only when the user writes the template source. When a feature truly needs user-written templates, as Wren's receipts do, there are three defences in order of strength. The first is a **logic-less template language** such as Mustache, whose syntax has placeholders, sections and nothing else, no expressions, no attribute walking and no function calls. Wren chose this, so a restaurant can write `{{customer_name}}` and nothing more powerful. The second is a sandbox, such as Jinja2's `SandboxedEnvironment`, which blocks access to private attributes and unsafe calls. Sandboxes are better than nothing but have a long history of escapes. The third is rendering in an isolated process with no secrets and no network, so that an escape gains little.

Wren also passes the template only the data it needs, a flat dictionary with the customer's first name, the items and the total, rather than the whole order object with its relations, so even a template bug can reach nothing else. Receipt templates are validated on save by rendering them against sample data, and a template that fails to parse or references unknown placeholders is rejected with a clear error to the restaurant.

## 10. LDAP injection and XML external entities

Some of Wren's enterprise customers, companies that order lunch for their staff, sign in through their own directory. Older integrations look users up in **LDAP**, the Lightweight Directory Access Protocol, with a search filter such as `(&(uid=` + username + `)(objectClass=person))`. LDAP filters have their own syntax with `*` as a wildcard and parentheses for grouping, and most LDAP client libraries offer no parameter channel. A username of `*` matches every user. A username containing `)(` closes the intended condition and adds another, which in a badly written login check can bypass the password test. This is **LDAP injection**. The defence is the escaping that RFC 4515 defines for filter values, `*` as `\2a`, `(` as `\28`, `)` as `\29`, `\` as `\5c` and the null byte as `\00`, applied by a library function, plus input validation that rejects characters a username never contains. Here escaping is the right tool because no parameter channel exists.

XML brings a stranger problem. The XML standard lets a document declare **entities**, named pieces of text, in a document type definition, and an entity can be **external**, loaded from a URL or file. A parser that resolves external entities will, given a document declaring `<!ENTITY x SYSTEM "file:///etc/passwd">` and using `&x;`, read the server's file into the document. With an `http://` URL it makes a request from the server, an SSRF, Part V. This is **XML external entity injection**, XXE. Wren parses XML in two places, SAML assertions from enterprise single sign-on and XML invoices from a large supplier.

@fig be_sec_xxe | An external entity pulls a local file into the parsed document. Disabling DTDs removes the feature entirely.

Entities can also nest. The "billion laughs" document defines `lol1` as ten copies of `lol`, `lol2` as ten copies of `lol1`, and so on to `lol9`. Expanding `lol9` produces 10⁹ copies of the three-byte string, 3,000,000,000 bytes, about 3 GB, from a document under 1 KB. That is a denial of service against any parser that expands entities without limits.

The defence is to turn the feature off. Wren's XML parsing goes through hardened settings: DTD processing disabled, external entities and external DTDs disabled, and entity expansion limited. In Python that means the `defusedxml` package. In Java it means setting the `disallow-doctype-decl` feature on the parser factory, since Java's defaults have historically allowed external entities. Where possible, Wren uses JSON instead, which has no entities at all, and the SAML library it uses is a maintained one that configures its parser safely.

## 11. Path traversal and archive extraction

Unit XII covered path traversal in upload filenames, where `../../etc/passwd` climbs out of an upload directory. The same bug appears wherever code builds a filesystem path from input. Wren's old help centre served articles with `open(os.path.join("/srv/help", request.args["page"]))`. A request for `page=../../etc/passwd` reads outside the directory. In Python, `os.path.join` has a second trap: if any argument is an absolute path, it discards everything before it, so `page=/etc/passwd` needs no dots at all.

The robust check resolves the final path and confirms it is inside the base directory. Wren computes `base = Path("/srv/help").resolve()` and `target = (base / page).resolve()`, then rejects the request unless `target.is_relative_to(base)`. Resolving collapses `..`, follows symbolic links and produces the real absolute path, so encoded forms, doubled slashes and symlinks pointing outside are all caught at the one place that matters, the final path. Decoding happens exactly once, by the framework, before this check. Code that decodes again afterwards reopens the hole for doubly encoded input such as `%252e%252e%252f`.

@fig be_sec_traversal | Resolve, then check the prefix. String checks for ".." miss encodings, absolute paths and symlinks.

Archives have their own version, nicknamed **Zip Slip** after a 2018 disclosure that found it in thousands of projects. A zip or tar file stores a path for each entry, and an entry named `../../app/config.py` is legal. Code that extracts with `open(os.path.join(dest, entry.name), "wb")` writes wherever the entry says. Wren accepts zip files of menu photos from restaurants, and its extractor applies the same resolve-and-check test to every entry, rejects absolute paths and symlink entries, and limits the number of entries and total extracted size, which also guards against the zip bombs of Part VII. Python's `tarfile` added extraction filters in version 3.12 for this reason, and the `data` filter becomes the default in 3.14.

The best defence remains architectural. When files live in object storage under generated keys, there is no directory to escape. Wren serves help articles from a database table keyed by slug and stores restaurant files in object storage, so the remaining filesystem paths in its code are few, fixed and reviewed.

:::story Picture this
A post room that forwards letters by reading the address line aloud to a courier. Most letters say "Room 4". One says "Room 4, then go to the safe and bring whatever is inside". A courier who only accepts a room number from a fixed list, and never reads the rest of the line, cannot be redirected, however the letter is written.
:::

:::note One pattern, many interpreters
SQL, shells, template engines, LDAP filters, XML parsers, file paths, regular expressions and HTTP headers are all interpreters with their own syntax. For each one, ask whether a separate channel for data exists. If it does, use it: parameters, argument lists, template variables. If it does not, use the interpreter's own escaping function from a library, never a hand-written one, and validate against an allowlist.
:::

:::warn Watch out
Tools with options that write files or run commands, such as `tar --to-command`, `git` hooks and `curl -o`, turn argument injection into code execution even without a shell. Put `--` before user-controlled arguments and validate them against a strict pattern.
:::

:::interview Interview lens
**"A feature needs to run an external command with a user-supplied filename. How do you make it safe?"** Avoid the shell entirely and pass an argument list to execve, so metacharacters are just characters. Put `--` before the filename and validate it against a strict pattern, or better, use a generated name. Run the tool in a sandbox with no network, a read-only filesystem and resource limits, since converters have their own bugs. If a library can do the job in-process, prefer it.
:::

:::key In one breath
Command injection comes from passing strings to a shell, so call programs with argument lists and `--` before user input, ideally inside a sandbox. Template injection happens when users write template source, detected by `{{7*7}}` rendering as 49, and is avoided with logic-less templates such as Mustache. LDAP filters need RFC 4515 escaping, and XML parsers need DTDs and external entities disabled to stop file reads, SSRF and the billion laughs, which expands under 1 KB into about 3 GB. Paths built from input must be resolved and checked against the base directory, including every entry in an extracted archive.
:::
